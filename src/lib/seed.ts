import { DEFAULT_SCORING_CONFIG } from "./types";

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
  stage: string;
  company_id: string | null;
  primary_contact_id: string | null;
  owner_id: string | null;
  expected_close_date: string | null;
  probability: number;
  created_at: string;
};

export const SEED_COMPANIES: CompanyRow[] = [
  { id: "c1", name: "Linear", domain: "linear.app", industry: "Software", size: "51-200", location: "San Francisco, CA", arr: 12500000, owner_id: "u1", description: "Issue tracking tool for modern software teams.", created_at: "2026-01-12" },
  { id: "c2", name: "Notion", domain: "notion.so", industry: "Productivity", size: "201-1000", location: "San Francisco, CA", arr: 48000000, owner_id: "u2", description: "All-in-one connected workspace.", created_at: "2025-11-03" },
  { id: "c3", name: "Vercel", domain: "vercel.com", industry: "Cloud", size: "201-1000", location: "Remote", arr: 95000000, owner_id: "u1", description: null, created_at: "2025-09-21" },
  { id: "c4", name: "Stripe", domain: "stripe.com", industry: "Fintech", size: "1000+", location: "Dublin, IE", arr: 350000000, owner_id: "u3", description: null, created_at: "2025-06-14" },
  { id: "c5", name: "Figma", domain: "figma.com", industry: "Design", size: "1000+", location: "San Francisco, CA", arr: 280000000, owner_id: "u2", description: null, created_at: "2025-04-02" },
  { id: "c6", name: "Loom", domain: "loom.com", industry: "Video", size: "201-1000", location: "San Francisco, CA", arr: 70000000, owner_id: "u4", description: null, created_at: "2025-03-10" },
  { id: "c7", name: "Pitch", domain: "pitch.com", industry: "Productivity", size: "51-200", location: "Berlin, DE", arr: 9500000, owner_id: "u3", description: null, created_at: "2025-02-19" },
  { id: "c8", name: "Raycast", domain: "raycast.com", industry: "Software", size: "11-50", location: "London, UK", arr: 5200000, owner_id: "u1", description: null, created_at: "2025-01-30" },
  { id: "c9", name: "Arc Browser", domain: "arc.net", industry: "Software", size: "51-200", location: "New York, NY", arr: 0, owner_id: "u4", description: null, created_at: "2024-12-05" },
  { id: "c10", name: "Mistral AI", domain: "mistral.ai", industry: "Artificial Intelligence", size: "51-200", location: "Paris, FR", arr: 30000000, owner_id: "u2", description: null, created_at: "2024-11-22" },
];

export const SEED_PEOPLE: PersonRow[] = [
  { id: "p1", first_name: "Karri", last_name: "Saarinen", email: "karri@linear.app", phone: null, role: "CEO", company_id: "c1", owner_id: "u1", linkedin: null, last_contacted_at: "2026-05-20", last_engaged_at: "2026-05-15", created_at: "2026-01-12" },
  { id: "p2", first_name: "Tuomas", last_name: "Artman", email: "tuomas@linear.app", phone: null, role: "CTO", company_id: "c1", owner_id: "u1", linkedin: null, last_contacted_at: "2026-04-18", last_engaged_at: null, created_at: "2026-01-12" },
  { id: "p3", first_name: "Ivan", last_name: "Zhao", email: "ivan@notion.so", phone: null, role: "Co-founder & CEO", company_id: "c2", owner_id: "u2", linkedin: null, last_contacted_at: "2026-05-08", last_engaged_at: "2026-05-20", created_at: "2025-11-03" },
  { id: "p4", first_name: "Akshay", last_name: "Kothari", email: "akshay@notion.so", phone: null, role: "COO", company_id: "c2", owner_id: "u2", linkedin: null, last_contacted_at: "2026-03-29", last_engaged_at: null, created_at: "2025-11-04" },
  { id: "p5", first_name: "Guillermo", last_name: "Rauch", email: "guillermo@vercel.com", phone: null, role: "CEO", company_id: "c3", owner_id: "u1", linkedin: null, last_contacted_at: "2026-05-22", last_engaged_at: "2026-05-12", created_at: "2025-09-21" },
  { id: "p6", first_name: "Patrick", last_name: "Collison", email: "patrick@stripe.com", phone: null, role: "CEO", company_id: "c4", owner_id: "u3", linkedin: null, last_contacted_at: "2026-02-14", last_engaged_at: "2026-05-22", created_at: "2025-06-14" },
  { id: "p7", first_name: "Dylan", last_name: "Field", email: "dylan@figma.com", phone: null, role: "Co-founder & CEO", company_id: "c5", owner_id: "u2", linkedin: null, last_contacted_at: "2026-04-30", last_engaged_at: null, created_at: "2025-04-02" },
  { id: "p8", first_name: "Joe", last_name: "Thomas", email: "joe@loom.com", phone: null, role: "Co-founder", company_id: "c6", owner_id: "u4", linkedin: null, last_contacted_at: "2026-01-05", last_engaged_at: null, created_at: "2025-03-10" },
  { id: "p9", first_name: "Christian", last_name: "Reber", email: "christian@pitch.com", phone: null, role: "CEO", company_id: "c7", owner_id: "u3", linkedin: null, last_contacted_at: "2026-05-15", last_engaged_at: "2026-05-17", created_at: "2025-02-19" },
  { id: "p10", first_name: "Thomas", last_name: "Paul Mann", email: "thomas@raycast.com", phone: null, role: "Co-founder", company_id: "c8", owner_id: "u1", linkedin: null, last_contacted_at: "2026-05-21", last_engaged_at: null, created_at: "2025-01-30" },
  { id: "p11", first_name: "Josh", last_name: "Miller", email: "josh@arc.net", phone: null, role: "CEO", company_id: "c9", owner_id: "u4", linkedin: null, last_contacted_at: "2025-12-19", last_engaged_at: "2026-05-23", created_at: "2024-12-05" },
  { id: "p12", first_name: "Arthur", last_name: "Mensch", email: "arthur@mistral.ai", phone: null, role: "CEO", company_id: "c10", owner_id: "u2", linkedin: null, last_contacted_at: "2026-05-23", last_engaged_at: "2026-05-23", created_at: "2024-11-22" },
  { id: "p13", first_name: "Cam", last_name: "Adams", email: "cam@linear.app", phone: null, role: "Co-founder", company_id: "c1", owner_id: "u1", linkedin: null, last_contacted_at: "2026-04-02", last_engaged_at: null, created_at: "2026-01-12" },
  { id: "p14", first_name: "John", last_name: "Collison", email: "john@stripe.com", phone: null, role: "President", company_id: "c4", owner_id: "u3", linkedin: null, last_contacted_at: "2026-03-11", last_engaged_at: null, created_at: "2025-06-14" },
];

export const SEED_DEALS: DealRow[] = [
  { id: "d1", name: "Linear — Enterprise expansion", value: 120000, currency: "EUR", stage: "negotiation", company_id: "c1", primary_contact_id: "p1", owner_id: "u1", expected_close_date: "2026-06-12", probability: 70, created_at: "2026-03-01" },
  { id: "d4", name: "Stripe — Billing automation", value: 510000, currency: "EUR", stage: "negotiation", company_id: "c4", primary_contact_id: "p6", owner_id: "u3", expected_close_date: "2026-07-05", probability: 65, created_at: "2026-02-18" },
  { id: "d2", name: "Notion — Workspace AI add-on", value: 85000, currency: "EUR", stage: "proposal", company_id: "c2", primary_contact_id: "p3", owner_id: "u2", expected_close_date: "2026-06-30", probability: 55, created_at: "2026-04-10" },
  { id: "d8", name: "Raycast — Team plan upgrade", value: 18500, currency: "EUR", stage: "proposal", company_id: "c8", primary_contact_id: "p10", owner_id: "u1", expected_close_date: "2026-06-25", probability: 60, created_at: "2026-04-15" },
  { id: "d3", name: "Vercel — Edge compute migration", value: 240000, currency: "USD", stage: "qualified", company_id: "c3", primary_contact_id: "p5", owner_id: "u1", expected_close_date: "2026-08-01", probability: 35, created_at: "2026-04-22" },
  { id: "d7", name: "Pitch — Annual renewal", value: 32000, currency: "EUR", stage: "qualified", company_id: "c7", primary_contact_id: "p9", owner_id: "u3", expected_close_date: "2026-07-20", probability: 45, created_at: "2026-04-30" },
  { id: "d10", name: "Mistral AI — Inference platform", value: 380000, currency: "EUR", stage: "qualified", company_id: "c10", primary_contact_id: "p12", owner_id: "u2", expected_close_date: "2026-09-30", probability: 40, created_at: "2026-05-02" },
  { id: "d6", name: "Loom — Sales enablement", value: 42000, currency: "EUR", stage: "lead", company_id: "c6", primary_contact_id: "p8", owner_id: "u4", expected_close_date: "2026-09-15", probability: 15, created_at: "2026-05-12" },
  { id: "d9", name: "Arc Browser — Pilot", value: 12000, currency: "USD", stage: "lead", company_id: "c9", primary_contact_id: "p11", owner_id: "u4", expected_close_date: "2026-08-12", probability: 10, created_at: "2026-05-18" },
  { id: "d5", name: "Figma — Design ops rollout", value: 175000, currency: "EUR", stage: "won", company_id: "c5", primary_contact_id: "p7", owner_id: "u2", expected_close_date: "2026-05-10", probability: 100, created_at: "2026-01-08" },
  { id: "d11", name: "Linear — Onboarding success plan", value: 22000, currency: "EUR", stage: "lost", company_id: "c1", primary_contact_id: "p13", owner_id: "u1", expected_close_date: "2026-04-30", probability: 0, created_at: "2026-02-22" },
];

export const SEED_DEAL_CONTACTS: [string, string][] = [
  ["d1", "p2"],
  ["d1", "p13"],
  ["d2", "p4"],
  ["d4", "p14"],
];

// ── Cadence seeds ────────────────────────────────────────────────────────────

export const SEED_SEQUENCE = {
  id: "seq_cold_call_6",
  name: "Cold call cadence (6 touches)",
  description: "Six call attempts spaced over ~3 weeks. Days 0, 2, 5, 9, 14, 20.",
  owner_id: "u1",
  created_at: "2026-04-01",
};

const STEP_OFFSETS = [0, 2, 5, 9, 14, 20];

export const SEED_SEQUENCE_STEPS = STEP_OFFSETS.map((offset, i) => ({
  id: `step_${i + 1}`,
  sequence_id: SEED_SEQUENCE.id,
  step_number: i + 1,
  day_offset: offset,
  channel: "call",
}));

// Build enrollments + their tasks in one go. Today is 2026-05-25.
// daysAgo describes when the enrollment started.
// Each enrollment generates all 6 tasks; we mark earlier steps as completed
// up to currentStepIndex (0-based), the current step is pending (the "due today" task),
// the rest are pending future tasks.

type EnrollmentSpec = {
  id: string;
  personId: string;
  sdrId: string;
  daysAgo: number;
  // For tasks already completed, optionally an outcome (defaults to "no_answer").
  completedOutcomes?: string[];
};

const TODAY = "2026-05-25";

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const ENROLLMENT_SPECS: EnrollmentSpec[] = [
  // u1 — fills up Tommaso's queue with multiple stages of the cadence
  { id: "enr_1", personId: "p1", sdrId: "u1", daysAgo: 0 },
  { id: "enr_2", personId: "p2", sdrId: "u1", daysAgo: 2, completedOutcomes: ["no_answer"] },
  { id: "enr_3", personId: "p5", sdrId: "u1", daysAgo: 5, completedOutcomes: ["no_answer", "voicemail"] },
  { id: "enr_4", personId: "p10", sdrId: "u1", daysAgo: 9, completedOutcomes: ["voicemail", "no_answer", "connected"] },
  // overdue: enrolled 3 days ago, step 2 (offset 2) was due yesterday and never completed
  { id: "enr_5", personId: "p13", sdrId: "u1", daysAgo: 3, completedOutcomes: ["no_answer"] },

  // u2 Davide
  { id: "enr_6", personId: "p3", sdrId: "u2", daysAgo: 2, completedOutcomes: ["no_answer"] },
  { id: "enr_7", personId: "p7", sdrId: "u2", daysAgo: 0 },
  { id: "enr_8", personId: "p4", sdrId: "u2", daysAgo: 5, completedOutcomes: ["no_answer", "no_answer"] },

  // u3 Giulia
  { id: "enr_9", personId: "p6", sdrId: "u3", daysAgo: 5, completedOutcomes: ["voicemail", "no_answer"] },
  { id: "enr_10", personId: "p9", sdrId: "u3", daysAgo: 2, completedOutcomes: ["no_answer"] },

  // u4 Marco
  { id: "enr_11", personId: "p8", sdrId: "u4", daysAgo: 0 },
];

type EnrollmentRow = {
  id: string;
  sequence_id: string;
  person_id: string;
  sdr_id: string;
  status: string;
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
  channel: string;
  due_date: string;
  status: string;
  outcome: string | null;
  completed_at: string | null;
  created_at: string;
};

export const SEED_ENROLLMENTS: EnrollmentRow[] = [];
export const SEED_TASKS: TaskRow[] = [];

for (const spec of ENROLLMENT_SPECS) {
  const enrolledAt = addDays(TODAY, -spec.daysAgo);
  SEED_ENROLLMENTS.push({
    id: spec.id,
    sequence_id: SEED_SEQUENCE.id,
    person_id: spec.personId,
    sdr_id: spec.sdrId,
    status: "active",
    exit_reason: null,
    enrolled_at: enrolledAt,
    completed_at: null,
  });

  STEP_OFFSETS.forEach((offset, i) => {
    const stepNumber = i + 1;
    const dueDate = addDays(enrolledAt, offset);
    const completedOutcome = spec.completedOutcomes?.[i];
    const isCompleted = !!completedOutcome;
    SEED_TASKS.push({
      id: `${spec.id}_t${stepNumber}`,
      enrollment_id: spec.id,
      person_id: spec.personId,
      sdr_id: spec.sdrId,
      step_number: stepNumber,
      channel: "call",
      due_date: dueDate,
      status: isCompleted ? "completed" : "pending",
      outcome: isCompleted ? completedOutcome : null,
      completed_at: isCompleted ? dueDate : null,
      created_at: enrolledAt,
    });
  });
}

export const SEED_SCORING_CONFIG_JSON = JSON.stringify(DEFAULT_SCORING_CONFIG);
