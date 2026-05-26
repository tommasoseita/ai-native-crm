import "server-only";
import { db } from "./db";
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

export function listCompanies(): Company[] {
  return (db.prepare("SELECT * FROM companies ORDER BY name").all() as CompanyRow[]).map(
    mapCompany,
  );
}

export function getCompany(id: string): Company | undefined {
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as
    | CompanyRow
    | undefined;
  return row ? mapCompany(row) : undefined;
}

// ── People ───────────────────────────────────────────────────────────────────

export function listPeople(): Person[] {
  return (
    db.prepare("SELECT * FROM people ORDER BY last_name, first_name").all() as PersonRow[]
  ).map(mapPerson);
}

export function getPerson(id: string): Person | undefined {
  const row = db.prepare("SELECT * FROM people WHERE id = ?").get(id) as
    | PersonRow
    | undefined;
  return row ? mapPerson(row) : undefined;
}

export function peopleByCompany(companyId: string): Person[] {
  return (
    db
      .prepare("SELECT * FROM people WHERE company_id = ? ORDER BY last_name")
      .all(companyId) as PersonRow[]
  ).map(mapPerson);
}

// ── Deals ────────────────────────────────────────────────────────────────────

export function listDeals(): Deal[] {
  return (
    db
      .prepare("SELECT * FROM deals ORDER BY stage, sort_index, created_at DESC")
      .all() as DealRow[]
  ).map(mapDeal);
}

export function getDeal(id: string): Deal | undefined {
  const row = db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as
    | DealRow
    | undefined;
  return row ? mapDeal(row) : undefined;
}

export function dealsByCompany(companyId: string): Deal[] {
  return (
    db
      .prepare("SELECT * FROM deals WHERE company_id = ? ORDER BY stage, value DESC")
      .all(companyId) as DealRow[]
  ).map(mapDeal);
}

export function dealsByPrimaryContact(personId: string): Deal[] {
  return (
    db
      .prepare(
        "SELECT * FROM deals WHERE primary_contact_id = ? ORDER BY stage, value DESC",
      )
      .all(personId) as DealRow[]
  ).map(mapDeal);
}

export function dealsByContact(personId: string): Deal[] {
  return (
    db
      .prepare(
        `SELECT d.* FROM deals d
         INNER JOIN deal_contacts dc ON dc.deal_id = d.id
         WHERE dc.person_id = ?
         ORDER BY d.stage, d.value DESC`,
      )
      .all(personId) as DealRow[]
  ).map(mapDeal);
}

export function contactsForDeal(dealId: string): Person[] {
  return (
    db
      .prepare(
        `SELECT p.* FROM people p
         INNER JOIN deal_contacts dc ON dc.person_id = p.id
         WHERE dc.deal_id = ?
         ORDER BY p.last_name`,
      )
      .all(dealId) as PersonRow[]
  ).map(mapPerson);
}

export function allContactsForDeal(dealId: string): Person[] {
  const deal = getDeal(dealId);
  if (!deal) return [];
  const extras = contactsForDeal(dealId);
  const all = [...extras];
  if (deal.primaryContactId && !all.some((p) => p.id === deal.primaryContactId)) {
    const primary = getPerson(deal.primaryContactId);
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

export function listSequences(): Sequence[] {
  return (
    db.prepare("SELECT * FROM sequences ORDER BY created_at DESC").all() as SequenceRow[]
  ).map(mapSequence);
}

export function getSequence(id: string): Sequence | undefined {
  const row = db.prepare("SELECT * FROM sequences WHERE id = ?").get(id) as
    | SequenceRow
    | undefined;
  return row ? mapSequence(row) : undefined;
}

export function listSequenceSteps(sequenceId: string): SequenceStep[] {
  return (
    db
      .prepare(
        "SELECT * FROM sequence_steps WHERE sequence_id = ? ORDER BY step_number ASC",
      )
      .all(sequenceId) as SequenceStepRow[]
  ).map(mapSequenceStep);
}

// ── Enrollments & Tasks ──────────────────────────────────────────────────────

export function enrollmentsForPerson(personId: string): Enrollment[] {
  return (
    db
      .prepare(
        "SELECT * FROM enrollments WHERE person_id = ? ORDER BY enrolled_at DESC",
      )
      .all(personId) as EnrollmentRow[]
  ).map(mapEnrollment);
}

export function activeEnrollmentForPerson(personId: string): Enrollment | undefined {
  const row = db
    .prepare(
      "SELECT * FROM enrollments WHERE person_id = ? AND status = 'active' LIMIT 1",
    )
    .get(personId) as EnrollmentRow | undefined;
  return row ? mapEnrollment(row) : undefined;
}

export function enrollmentsForSequence(sequenceId: string): Enrollment[] {
  return (
    db
      .prepare(
        "SELECT * FROM enrollments WHERE sequence_id = ? ORDER BY enrolled_at DESC",
      )
      .all(sequenceId) as EnrollmentRow[]
  ).map(mapEnrollment);
}

export function tasksForEnrollment(enrollmentId: string): Task[] {
  return (
    db
      .prepare(
        "SELECT * FROM tasks WHERE enrollment_id = ? ORDER BY step_number ASC",
      )
      .all(enrollmentId) as TaskRow[]
  ).map(mapTask);
}

export function getTask(id: string): Task | undefined {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
    | TaskRow
    | undefined;
  return row ? mapTask(row) : undefined;
}

// ── Scoring config ──────────────────────────────────────────────────────────

export function getScoringConfig(): ScoringConfig {
  const row = db.prepare("SELECT data FROM scoring_config WHERE id = 1").get() as
    | { data: string }
    | undefined;
  if (!row) return DEFAULT_SCORING_CONFIG;
  try {
    return JSON.parse(row.data) as ScoringConfig;
  } catch {
    return DEFAULT_SCORING_CONFIG;
  }
}
