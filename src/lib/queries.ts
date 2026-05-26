import "server-only";
import { getDb } from "./db";
import {
  DEFAULT_SCORING_CONFIG,
  type Company,
  type Deal,
  type DealStage,
  type Enrollment,
  type Person,
  type ScoringConfig,
  type Sequence,
  type SequenceStep,
  type Task,
} from "./types";

type CompanyRow = {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  arr: number | null;
  owner_id: string | null;
  description: string | null;
  created_at: string;
};

type PersonRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  company_id: string | null;
  owner_id: string | null;
  linkedin: string | null;
  last_contacted_at: string | null;
  last_engaged_at: string | null;
  created_at: string;
};

type DealRow = {
  id: string;
  name: string;
  value: number;
  currency: "EUR" | "USD";
  stage: DealStage;
  company_id: string | null;
  primary_contact_id: string | null;
  owner_id: string | null;
  expected_close_date: string | null;
  probability: number;
  sort_index: number;
  created_at: string;
};

type SequenceRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  created_at: string;
};

type SequenceStepRow = {
  id: string;
  sequence_id: string;
  step_number: number;
  day_offset: number;
  channel: "call" | "email" | "linkedin";
};

type EnrollmentRow = {
  id: string;
  sequence_id: string;
  person_id: string;
  sdr_id: string;
  status: "active" | "completed" | "exited" | "paused";
  exit_reason: string | null;
  enrolled_at: string;
  completed_at: string | null;
};

type TaskRow = {
  id: string;
  enrollment_id: string;
  person_id: string;
  sdr_id: string;
  step_number: number;
  channel: "call" | "email" | "linkedin";
  due_date: string;
  status: "pending" | "completed" | "skipped";
  outcome: string | null;
  completed_at: string | null;
  created_at: string;
};

function mapCompany(r: CompanyRow): Company {
  return {
    id: r.id,
    name: r.name,
    domain: r.domain,
    industry: r.industry,
    size: r.size,
    location: r.location,
    arr: r.arr,
    ownerId: r.owner_id,
    description: r.description,
    createdAt: r.created_at,
  };
}

function mapPerson(r: PersonRow): Person {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    companyId: r.company_id,
    ownerId: r.owner_id,
    linkedin: r.linkedin,
    lastContactedAt: r.last_contacted_at,
    lastEngagedAt: r.last_engaged_at,
    createdAt: r.created_at,
  };
}

function mapDeal(r: DealRow): Deal {
  return {
    id: r.id,
    name: r.name,
    value: r.value,
    currency: r.currency,
    stage: r.stage,
    companyId: r.company_id,
    primaryContactId: r.primary_contact_id,
    ownerId: r.owner_id,
    expectedCloseDate: r.expected_close_date,
    probability: r.probability,
    sortIndex: r.sort_index,
    createdAt: r.created_at,
  };
}

function mapSequence(r: SequenceRow): Sequence {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    ownerId: r.owner_id,
    createdAt: r.created_at,
  };
}

function mapSequenceStep(r: SequenceStepRow): SequenceStep {
  return {
    id: r.id,
    sequenceId: r.sequence_id,
    stepNumber: r.step_number,
    dayOffset: r.day_offset,
    channel: r.channel,
  };
}

function mapEnrollment(r: EnrollmentRow): Enrollment {
  return {
    id: r.id,
    sequenceId: r.sequence_id,
    personId: r.person_id,
    sdrId: r.sdr_id,
    status: r.status,
    exitReason: r.exit_reason,
    enrolledAt: r.enrolled_at,
    completedAt: r.completed_at,
  };
}

function mapTask(r: TaskRow): Task {
  return {
    id: r.id,
    enrollmentId: r.enrollment_id,
    personId: r.person_id,
    sdrId: r.sdr_id,
    stepNumber: r.step_number,
    channel: r.channel,
    dueDate: r.due_date,
    status: r.status,
    outcome: (r.outcome ?? null) as Task["outcome"],
    completedAt: r.completed_at,
    createdAt: r.created_at,
  };
}

// ── Companies ────────────────────────────────────────────────────────────────

export async function listCompanies(): Promise<Company[]> {
  const db = await getDb();
  const r = await db.execute("SELECT * FROM companies ORDER BY name");
  return (r.rows as unknown as CompanyRow[]).map(mapCompany);
}

export async function getCompany(id: string): Promise<Company | undefined> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM companies WHERE id = ?",
    args: [id],
  });
  const row = r.rows[0] as unknown as CompanyRow | undefined;
  return row ? mapCompany(row) : undefined;
}

// ── People ───────────────────────────────────────────────────────────────────

export async function listPeople(): Promise<Person[]> {
  const db = await getDb();
  const r = await db.execute("SELECT * FROM people ORDER BY last_name, first_name");
  return (r.rows as unknown as PersonRow[]).map(mapPerson);
}

export async function getPerson(id: string): Promise<Person | undefined> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM people WHERE id = ?",
    args: [id],
  });
  const row = r.rows[0] as unknown as PersonRow | undefined;
  return row ? mapPerson(row) : undefined;
}

export async function peopleByCompany(companyId: string): Promise<Person[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM people WHERE company_id = ? ORDER BY last_name",
    args: [companyId],
  });
  return (r.rows as unknown as PersonRow[]).map(mapPerson);
}

// ── Deals ────────────────────────────────────────────────────────────────────

export async function listDeals(): Promise<Deal[]> {
  const db = await getDb();
  const r = await db.execute(
    "SELECT * FROM deals ORDER BY stage, sort_index, created_at DESC",
  );
  return (r.rows as unknown as DealRow[]).map(mapDeal);
}

export async function getDeal(id: string): Promise<Deal | undefined> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM deals WHERE id = ?",
    args: [id],
  });
  const row = r.rows[0] as unknown as DealRow | undefined;
  return row ? mapDeal(row) : undefined;
}

export async function dealsByCompany(companyId: string): Promise<Deal[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM deals WHERE company_id = ? ORDER BY stage, value DESC",
    args: [companyId],
  });
  return (r.rows as unknown as DealRow[]).map(mapDeal);
}

export async function dealsByPrimaryContact(personId: string): Promise<Deal[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM deals WHERE primary_contact_id = ? ORDER BY stage, value DESC",
    args: [personId],
  });
  return (r.rows as unknown as DealRow[]).map(mapDeal);
}

export async function dealsByContact(personId: string): Promise<Deal[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: `SELECT d.* FROM deals d
          INNER JOIN deal_contacts dc ON dc.deal_id = d.id
          WHERE dc.person_id = ?
          ORDER BY d.stage, d.value DESC`,
    args: [personId],
  });
  return (r.rows as unknown as DealRow[]).map(mapDeal);
}

export async function contactsForDeal(dealId: string): Promise<Person[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: `SELECT p.* FROM people p
          INNER JOIN deal_contacts dc ON dc.person_id = p.id
          WHERE dc.deal_id = ?
          ORDER BY p.last_name`,
    args: [dealId],
  });
  return (r.rows as unknown as PersonRow[]).map(mapPerson);
}

export async function allContactsForDeal(dealId: string): Promise<Person[]> {
  const deal = await getDeal(dealId);
  if (!deal) return [];
  const extras = await contactsForDeal(dealId);
  const all = [...extras];
  if (deal.primaryContactId && !all.some((p) => p.id === deal.primaryContactId)) {
    const primary = await getPerson(deal.primaryContactId);
    if (primary) all.unshift(primary);
  } else if (deal.primaryContactId) {
    const i = all.findIndex((p) => p.id === deal.primaryContactId);
    if (i > 0) {
      const [primary] = all.splice(i, 1);
      all.unshift(primary);
    }
  }
  return all;
}

// ── Sequences ────────────────────────────────────────────────────────────────

export async function listSequences(): Promise<Sequence[]> {
  const db = await getDb();
  const r = await db.execute("SELECT * FROM sequences ORDER BY created_at DESC");
  return (r.rows as unknown as SequenceRow[]).map(mapSequence);
}

export async function getSequence(id: string): Promise<Sequence | undefined> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM sequences WHERE id = ?",
    args: [id],
  });
  const row = r.rows[0] as unknown as SequenceRow | undefined;
  return row ? mapSequence(row) : undefined;
}

export async function listSequenceSteps(sequenceId: string): Promise<SequenceStep[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM sequence_steps WHERE sequence_id = ? ORDER BY step_number ASC",
    args: [sequenceId],
  });
  return (r.rows as unknown as SequenceStepRow[]).map(mapSequenceStep);
}

// ── Enrollments & Tasks ──────────────────────────────────────────────────────

export async function enrollmentsForPerson(personId: string): Promise<Enrollment[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM enrollments WHERE person_id = ? ORDER BY enrolled_at DESC",
    args: [personId],
  });
  return (r.rows as unknown as EnrollmentRow[]).map(mapEnrollment);
}

export async function activeEnrollmentForPerson(
  personId: string,
): Promise<Enrollment | undefined> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM enrollments WHERE person_id = ? AND status = 'active' LIMIT 1",
    args: [personId],
  });
  const row = r.rows[0] as unknown as EnrollmentRow | undefined;
  return row ? mapEnrollment(row) : undefined;
}

export async function enrollmentsForSequence(sequenceId: string): Promise<Enrollment[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM enrollments WHERE sequence_id = ? ORDER BY enrolled_at DESC",
    args: [sequenceId],
  });
  return (r.rows as unknown as EnrollmentRow[]).map(mapEnrollment);
}

export async function tasksForEnrollment(enrollmentId: string): Promise<Task[]> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM tasks WHERE enrollment_id = ? ORDER BY step_number ASC",
    args: [enrollmentId],
  });
  return (r.rows as unknown as TaskRow[]).map(mapTask);
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM tasks WHERE id = ?",
    args: [id],
  });
  const row = r.rows[0] as unknown as TaskRow | undefined;
  return row ? mapTask(row) : undefined;
}

// ── Scoring config ──────────────────────────────────────────────────────────

export async function getScoringConfig(): Promise<ScoringConfig> {
  const db = await getDb();
  const r = await db.execute("SELECT data FROM scoring_config WHERE id = 1");
  const row = r.rows[0] as unknown as { data: string } | undefined;
  if (!row) return DEFAULT_SCORING_CONFIG;
  try {
    return JSON.parse(row.data) as ScoringConfig;
  } catch {
    return DEFAULT_SCORING_CONFIG;
  }
}
