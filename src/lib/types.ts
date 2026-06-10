// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "user";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: string;
  aircallUserId: number | null;
}

// ── Aircall ──────────────────────────────────────────────────────────────────

export type CallDirection = "inbound" | "outbound";
export type CallStatus = "done" | "missed" | "voicemail";
export type RecordingStatus = "none" | "pending" | "stored" | "failed";

export interface Call {
  id: string;
  aircallCallId: number;
  direction: CallDirection;
  rawDigits: string | null;
  e164: string | null;
  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  durationSec: number;
  status: CallStatus;
  recordingUrl: string | null;
  recordingStatus: RecordingStatus;
  aircallUserId: number | null;
  sdrId: string | null;
  personId: string | null;
  taskId: string | null;
  note: string | null;
  createdAt: string;
}

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type Currency = "EUR" | "USD";

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  arr: number | null;
  ownerId: string | null;
  description: string | null;
  createdAt: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string | null;
  companyId: string | null;
  ownerId: string | null;
  linkedin: string | null;
  lastContactedAt: string | null;
  lastEngagedAt: string | null;
  createdAt: string;
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  currency: Currency;
  stage: DealStage;
  companyId: string | null;
  primaryContactId: string | null;
  ownerId: string | null;
  expectedCloseDate: string | null;
  probability: number;
  sortIndex: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  dailyCap: number;
}

export const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: "lead", label: "Lead", color: "#94a3b8" },
  { id: "qualified", label: "Qualified", color: "#60a5fa" },
  { id: "proposal", label: "Proposal", color: "#a78bfa" },
  { id: "negotiation", label: "Negotiation", color: "#f59e0b" },
  { id: "won", label: "Won", color: "#10b981" },
  { id: "lost", label: "Lost", color: "#ef4444" },
];

export const STAGE_LABELS: Record<DealStage, string> = Object.fromEntries(
  STAGES.map((s) => [s.id, s.label]),
) as Record<DealStage, string>;

export const TEAM: TeamMember[] = [
  { id: "u1", name: "Tommaso Seita", email: "tommaso@wibo.app", initials: "TS", color: "#5b5fef", dailyCap: 35 },
  { id: "u2", name: "Davide Rossi", email: "davide@wibo.app", initials: "DR", color: "#10b981", dailyCap: 35 },
  { id: "u3", name: "Giulia Bianchi", email: "giulia@wibo.app", initials: "GB", color: "#f59e0b", dailyCap: 30 },
  { id: "u4", name: "Marco Verdi", email: "marco@wibo.app", initials: "MV", color: "#a78bfa", dailyCap: 25 },
];

export function teamMemberById(id: string | null | undefined) {
  if (!id) return undefined;
  return TEAM.find((m) => m.id === id);
}

// ── Cadence ──────────────────────────────────────────────────────────────────

export type TaskChannel = "call" | "email" | "linkedin";
export type TaskStatus = "pending" | "completed" | "skipped";
export type TaskOutcome =
  | "no_answer"
  | "voicemail"
  | "connected"
  | "replied"
  | "booked"
  | "disqualified"
  | "bad_number";

export const OUTCOME_LABELS: Record<TaskOutcome, string> = {
  no_answer: "No answer",
  voicemail: "Voicemail",
  connected: "Connected",
  replied: "Replied",
  booked: "Meeting booked",
  disqualified: "Disqualified",
  bad_number: "Bad number",
};

// Outcomes that should exit the contact from the sequence
export const EXIT_OUTCOMES: TaskOutcome[] = ["replied", "booked", "disqualified", "bad_number"];

export type EnrollmentStatus = "active" | "completed" | "exited" | "paused";

export interface Sequence {
  id: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  createdAt: string;
}

export interface SequenceStep {
  id: string;
  sequenceId: string;
  stepNumber: number;
  dayOffset: number;
  channel: TaskChannel;
}

export interface Enrollment {
  id: string;
  sequenceId: string;
  personId: string;
  sdrId: string;
  status: EnrollmentStatus;
  exitReason: string | null;
  enrolledAt: string;
  completedAt: string | null;
}

export interface Task {
  id: string;
  enrollmentId: string;
  personId: string;
  sdrId: string;
  stepNumber: number;
  channel: TaskChannel;
  dueDate: string;
  status: TaskStatus;
  outcome: TaskOutcome | null;
  completedAt: string | null;
  createdAt: string;
}

// ── Lead scoring ─────────────────────────────────────────────────────────────

export type Tier = "A" | "B" | "C";

export const TIER_COLORS: Record<Tier, string> = {
  A: "#10b981",
  B: "#f59e0b",
  C: "#94a3b8",
};

export interface ScoringConfig {
  industry: Record<string, number>;
  size: Record<string, number>;
  location: Record<string, number>;
  rolePatterns: { pattern: string; weight: number }[];
  intent: { recentEngagedDays: number; weight: number };
  tiers: { A: number; B: number };
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  industry: {
    Fintech: 30,
    "Artificial Intelligence": 28,
    Software: 22,
    Cloud: 20,
    Productivity: 18,
    Design: 15,
    Video: 10,
  },
  size: {
    "1000+": 25,
    "201-1000": 22,
    "51-200": 15,
    "11-50": 8,
    "1-10": 3,
  },
  location: {
    "San Francisco": 15,
    "New York": 12,
    London: 10,
    Berlin: 8,
    Paris: 8,
    Dublin: 6,
  },
  rolePatterns: [
    { pattern: "CEO|Founder|Co-founder", weight: 25 },
    { pattern: "CTO|CRO|CFO|COO|President", weight: 22 },
    { pattern: "VP|Head of|Director", weight: 15 },
    { pattern: "Manager|Lead", weight: 8 },
  ],
  intent: { recentEngagedDays: 14, weight: 15 },
  tiers: { A: 80, B: 50 },
};

export interface Score {
  score: number;
  tier: Tier;
  breakdown: {
    industry: number;
    size: number;
    location: number;
    role: number;
    intent: number;
  };
}
