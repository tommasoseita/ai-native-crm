import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import {
  enrollmentsForPerson,
  getCompany,
  getDeal,
  getPerson,
  getScoringConfig,
  getSequence,
  listCompanies,
  listDeals,
  listPeople,
  listSequenceSteps,
  listSequences,
  peopleByCompany,
  dealsByCompany,
  activeEnrollmentForPerson,
  tasksForEnrollment,
} from "./queries";
import {
  enrollmentCapacity,
  getDailyQueue,
  suggestEnrollments,
} from "./cadence";
import { scoreMany, scorePerson } from "./scoring";
import {
  STAGE_LABELS,
  STAGES,
  TEAM,
  teamMemberById,
  type DealStage,
  type Person,
} from "./types";
import { todayISO } from "./utils";

// ─── Tool definitions ───────────────────────────────────────────────────────

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_context",
    description:
      "Get current workspace context: who the user is viewing as (their SDR id, name, daily cap), today's date, the team roster, and high-level record counts. Call this once at the start of a conversation so you know which SDR's perspective you're answering from.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_daily_queue",
    description:
      "Return the daily call queue for an SDR: overdue tasks, tasks due today, tasks already completed today, and capacity (cap, used, pending, free). Each task is enriched with the person and company name. Defaults to the current viewer and today's date.",
    input_schema: {
      type: "object",
      properties: {
        sdr_id: {
          type: "string",
          description: "Team member id (u1, u2, u3, u4). Defaults to current viewer.",
        },
        date: {
          type: "string",
          description: "ISO date YYYY-MM-DD. Defaults to today (2026-05-25).",
        },
      },
    },
  },
  {
    name: "get_enrollment_capacity",
    description:
      "Return how many new contacts an SDR should enroll today, given their remaining capacity. Returns freeToday (slots available today), steadyState (long-run sustainable enrollments per day = cap / step count), and recommended (the smaller of the two).",
    input_schema: {
      type: "object",
      properties: {
        sdr_id: { type: "string", description: "Defaults to current viewer." },
      },
    },
  },
  {
    name: "suggest_enrollments",
    description:
      "Pick the top-scored people who are NOT in an active enrollment, so the SDR can enroll them today. Returns enriched person + score + tier + company. Defaults to the current viewer and a count equal to the recommended enrollment capacity.",
    input_schema: {
      type: "object",
      properties: {
        sdr_id: { type: "string" },
        limit: {
          type: "integer",
          description: "Override the count. Defaults to the recommended capacity.",
        },
      },
    },
  },
  {
    name: "list_people",
    description:
      "List contacts in the workspace, sorted by lead score descending. Each entry includes id, name, role, company name, owner, tier (A/B/C), score, and whether they have an active enrollment.",
    input_schema: {
      type: "object",
      properties: {
        owner_id: {
          type: "string",
          description: "Filter to people owned by this SDR.",
        },
        tier: {
          type: "string",
          enum: ["A", "B", "C"],
          description: "Filter to a tier.",
        },
        search: {
          type: "string",
          description: "Substring match against first/last name, email, or role.",
        },
        limit: { type: "integer", description: "Default 20." },
      },
    },
  },
  {
    name: "get_person",
    description:
      "Get full detail on one contact: company, owner, lead score breakdown, active enrollment with task history, and linked deals.",
    input_schema: {
      type: "object",
      properties: { person_id: { type: "string" } },
      required: ["person_id"],
    },
  },
  {
    name: "list_companies",
    description: "List companies with counts of contacts and open deals plus ARR.",
    input_schema: {
      type: "object",
      properties: {
        industry: { type: "string", description: "Exact industry filter." },
        search: { type: "string", description: "Substring match against name or domain." },
        limit: { type: "integer", description: "Default 20." },
      },
    },
  },
  {
    name: "get_company",
    description:
      "Get full detail on one company: people, deals (with stage and value), owner, ARR.",
    input_schema: {
      type: "object",
      properties: { company_id: { type: "string" } },
      required: ["company_id"],
    },
  },
  {
    name: "list_deals",
    description:
      "List deals optionally filtered by stage / owner / company. Returns id, name, stage, value, currency, weighted value, probability, expected close, company name, primary contact name.",
    input_schema: {
      type: "object",
      properties: {
        stage: {
          type: "string",
          enum: ["lead", "qualified", "proposal", "negotiation", "won", "lost"],
        },
        owner_id: { type: "string" },
        company_id: { type: "string" },
        open_only: {
          type: "boolean",
          description: "If true, exclude won and lost. Default true.",
        },
      },
    },
  },
  {
    name: "get_pipeline_summary",
    description:
      "Summarize the pipeline: per-stage counts, totals, weighted totals. Useful for forecasting questions.",
    input_schema: {
      type: "object",
      properties: {
        owner_id: { type: "string", description: "Restrict to one SDR." },
      },
    },
  },
  {
    name: "list_sequences",
    description: "List cadence templates available in the workspace.",
    input_schema: { type: "object", properties: {} },
  },
];

// ─── Tool execution ─────────────────────────────────────────────────────────

export type ToolContext = { sdrId: string; date: string };

type AnyInput = Record<string, unknown>;

function enrichPerson(p: Person) {
  const company = p.companyId ? getCompany(p.companyId) : undefined;
  const owner = teamMemberById(p.ownerId);
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    email: p.email,
    role: p.role,
    company: company ? { id: company.id, name: company.name } : null,
    owner: owner ? { id: owner.id, name: owner.name } : null,
  };
}

export async function executeTool(
  name: string,
  input: AnyInput,
  ctx: ToolContext,
): Promise<string> {
  try {
    const result = run(name, input, ctx);
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function run(name: string, input: AnyInput, ctx: ToolContext): unknown {
  const sdrIdFor = (key = "sdr_id") => (input[key] as string) || ctx.sdrId;
  const dateFor = () => (input.date as string) || ctx.date;

  switch (name) {
    case "get_context": {
      return {
        viewing_as: teamMemberById(ctx.sdrId),
        date: ctx.date,
        team: TEAM.map((m) => ({
          id: m.id,
          name: m.name,
          dailyCap: m.dailyCap,
        })),
        counts: {
          companies: listCompanies().length,
          contacts: listPeople().length,
          deals: listDeals().length,
          sequences: listSequences().length,
        },
        stages: STAGES.map((s) => s.id),
      };
    }

    case "get_daily_queue": {
      const sdrId = sdrIdFor();
      const q = getDailyQueue(sdrId, dateFor());
      const mapTask = (t: (typeof q.dueToday)[number]) => {
        const p = getPerson(t.personId);
        const c = p?.companyId ? getCompany(p.companyId) : undefined;
        return {
          id: t.id,
          stepNumber: t.stepNumber,
          dueDate: t.dueDate,
          status: t.status,
          outcome: t.outcome,
          person: p
            ? {
                id: p.id,
                name: `${p.firstName} ${p.lastName}`,
                role: p.role,
                email: p.email,
              }
            : null,
          company: c ? { id: c.id, name: c.name } : null,
        };
      };
      return {
        sdr: teamMemberById(sdrId),
        date: q.date,
        capacity: q.capacity,
        overdue: q.overdue.map(mapTask),
        due_today: q.dueToday.map(mapTask),
        completed_today: q.completedToday.map(mapTask),
      };
    }

    case "get_enrollment_capacity": {
      const sdrId = sdrIdFor();
      const cap = enrollmentCapacity(sdrId, dateFor());
      return { sdr: teamMemberById(sdrId), ...cap };
    }

    case "suggest_enrollments": {
      const sdrId = sdrIdFor();
      const limit = input.limit as number | undefined;
      const suggestions = suggestEnrollments(sdrId, dateFor(), limit);
      return suggestions.map((s) => ({
        ...enrichPerson(s.person),
        score: s.score.score,
        tier: s.score.tier,
        breakdown: s.score.breakdown,
      }));
    }

    case "list_people": {
      const ownerId = input.owner_id as string | undefined;
      const tier = input.tier as "A" | "B" | "C" | undefined;
      const search = (input.search as string | undefined)?.toLowerCase();
      const limit = (input.limit as number | undefined) ?? 20;

      const all = listPeople();
      const config = getScoringConfig();
      const companies = new Map(listCompanies().map((c) => [c.id, c]));
      const scores = scoreMany(all, companies, config);

      const filtered = all
        .filter((p) => (ownerId ? p.ownerId === ownerId : true))
        .filter((p) => {
          if (!tier) return true;
          return scores.get(p.id)?.tier === tier;
        })
        .filter((p) => {
          if (!search) return true;
          const hay = `${p.firstName} ${p.lastName} ${p.email} ${p.role ?? ""}`.toLowerCase();
          return hay.includes(search);
        })
        .sort((a, b) => (scores.get(b.id)?.score ?? 0) - (scores.get(a.id)?.score ?? 0))
        .slice(0, limit);

      return filtered.map((p) => {
        const s = scores.get(p.id);
        const enr = activeEnrollmentForPerson(p.id);
        return {
          ...enrichPerson(p),
          tier: s?.tier,
          score: s?.score,
          in_active_sequence: !!enr,
        };
      });
    }

    case "get_person": {
      const personId = input.person_id as string;
      const p = getPerson(personId);
      if (!p) return { error: "person not found" };
      const company = p.companyId ? getCompany(p.companyId) : undefined;
      const config = getScoringConfig();
      const score = scorePerson(p, company, config);
      const enrollments = enrollmentsForPerson(personId).map((e) => ({
        id: e.id,
        sequence_id: e.sequenceId,
        status: e.status,
        enrolled_at: e.enrolledAt,
        exit_reason: e.exitReason,
        tasks: tasksForEnrollment(e.id).map((t) => ({
          step: t.stepNumber,
          due_date: t.dueDate,
          status: t.status,
          outcome: t.outcome,
        })),
      }));
      return {
        ...enrichPerson(p),
        last_contacted_at: p.lastContactedAt,
        last_engaged_at: p.lastEngagedAt,
        score,
        enrollments,
      };
    }

    case "list_companies": {
      const industry = input.industry as string | undefined;
      const search = (input.search as string | undefined)?.toLowerCase();
      const limit = (input.limit as number | undefined) ?? 20;
      return listCompanies()
        .filter((c) => (industry ? c.industry === industry : true))
        .filter((c) => {
          if (!search) return true;
          return (c.name + " " + (c.domain ?? "")).toLowerCase().includes(search);
        })
        .slice(0, limit)
        .map((c) => ({
          id: c.id,
          name: c.name,
          domain: c.domain,
          industry: c.industry,
          size: c.size,
          location: c.location,
          arr: c.arr,
          contacts_count: peopleByCompany(c.id).length,
          open_deals_count: dealsByCompany(c.id).filter(
            (d) => d.stage !== "won" && d.stage !== "lost",
          ).length,
          owner: teamMemberById(c.ownerId)?.name,
        }));
    }

    case "get_company": {
      const companyId = input.company_id as string;
      const c = getCompany(companyId);
      if (!c) return { error: "company not found" };
      return {
        ...c,
        owner: teamMemberById(c.ownerId),
        contacts: peopleByCompany(companyId).map(enrichPerson),
        deals: dealsByCompany(companyId).map((d) => ({
          id: d.id,
          name: d.name,
          stage: d.stage,
          value: d.value,
          currency: d.currency,
          probability: d.probability,
          expected_close_date: d.expectedCloseDate,
        })),
      };
    }

    case "list_deals": {
      const stage = input.stage as DealStage | undefined;
      const ownerId = input.owner_id as string | undefined;
      const companyId = input.company_id as string | undefined;
      const openOnly = (input.open_only as boolean | undefined) ?? true;

      return listDeals()
        .filter((d) => (stage ? d.stage === stage : true))
        .filter((d) => (ownerId ? d.ownerId === ownerId : true))
        .filter((d) => (companyId ? d.companyId === companyId : true))
        .filter((d) =>
          openOnly ? d.stage !== "won" && d.stage !== "lost" : true,
        )
        .map((d) => {
          const c = d.companyId ? getCompany(d.companyId) : undefined;
          const p = d.primaryContactId ? getPerson(d.primaryContactId) : undefined;
          return {
            id: d.id,
            name: d.name,
            stage: d.stage,
            stage_label: STAGE_LABELS[d.stage],
            value: d.value,
            currency: d.currency,
            probability: d.probability,
            weighted: Math.round(d.value * (d.probability / 100)),
            expected_close_date: d.expectedCloseDate,
            company: c ? { id: c.id, name: c.name } : null,
            primary_contact: p
              ? { id: p.id, name: `${p.firstName} ${p.lastName}` }
              : null,
            owner: teamMemberById(d.ownerId)?.name,
          };
        });
    }

    case "get_pipeline_summary": {
      const ownerId = input.owner_id as string | undefined;
      const deals = listDeals().filter((d) =>
        ownerId ? d.ownerId === ownerId : true,
      );
      const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
      const total = open.reduce((s, d) => s + d.value, 0);
      const weighted = open.reduce(
        (s, d) => s + d.value * (d.probability / 100),
        0,
      );

      const byStage = STAGES.map((s) => {
        const ds = deals.filter((d) => d.stage === s.id);
        const v = ds.reduce((sum, d) => sum + d.value, 0);
        const w = ds.reduce(
          (sum, d) => sum + d.value * (d.probability / 100),
          0,
        );
        return {
          stage: s.id,
          label: s.label,
          count: ds.length,
          total: v,
          weighted: Math.round(w),
        };
      });

      return {
        open_count: open.length,
        open_total: total,
        open_weighted: Math.round(weighted),
        by_stage: byStage,
      };
    }

    case "list_sequences": {
      return listSequences().map((s) => {
        const steps = listSequenceSteps(s.id);
        return {
          id: s.id,
          name: s.name,
          description: s.description,
          step_count: steps.length,
          day_offsets: steps.map((st) => st.dayOffset),
        };
      });
    }

    default:
      return { error: `unknown tool: ${name}` };
  }
}

void getSequence; // re-export kept for future tools

// ─── System prompt ──────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are Wibo, the AI assistant living inside an AI-native CRM also called Wibo. Wibo is built around how an SDR (Sales Development Representative) or AE (Account Executive) actually works: contacts, companies, deals, and a cold-call cadence engine.

The team uses a 6-touch cold-call sequence at days 0, 2, 5, 9, 14, 20. The mental model is:

- Each SDR has a daily call cap (e.g. 35 calls per day).
- Enrollments per day are derived from cap, NOT chosen freely:
  enrollToday = max(0, dailyCap - tasksDueToday) / firstStepCount
- Steady state per SDR ≈ cap / 6 touches (so ~5 new contacts/day for a 35-cap SDR).
- Lead scoring (ICP + persona + intent) tiers contacts A / B / C; top-tier first.

How to behave:

- Always call \`get_context\` first if you don't already know who you're talking to or what today is. The viewing user's SDR id is the default for tools that take \`sdr_id\`.
- Use the tools to look up data — never invent numbers, names, deal sizes, or task counts. If a tool returns empty data, say so plainly.
- Be concise and action-oriented. Use specific names and numbers. Prefer short bulleted lists over long prose.
- When the user asks "how many should I enroll today", use \`get_enrollment_capacity\` and give them the recommended number with a one-line reason.
- When they ask "who should I call first", use \`get_daily_queue\` and surface the overdue list first (since those should always be cleared before today's queue).
- For forecasting questions, use \`get_pipeline_summary\` or \`list_deals\` and compute weighted values when relevant.
- Currencies are EUR or USD on each deal; show with the symbol. Format money compactly (€12.5K, €120K).
- Names: refer to people as "First Last", companies by name.
- Don't preface with "Sure!" or "Let me check that". Just answer.
- If a user asks something the tools can't answer (e.g. "draft an email", "what's the weather"), say what's outside scope, then suggest a related CRM action you CAN do.

Output style: plain text with line breaks. You can use simple bullets ("- ") and numbered lists. Don't use markdown bold/italic/headers — they won't render.`;
