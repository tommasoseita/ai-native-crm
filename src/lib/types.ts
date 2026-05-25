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
  { id: "u1", name: "Tommaso Seita", email: "tommaso@wibo.app", initials: "TS", color: "#5b5fef" },
  { id: "u2", name: "Davide Rossi", email: "davide@wibo.app", initials: "DR", color: "#10b981" },
  { id: "u3", name: "Giulia Bianchi", email: "giulia@wibo.app", initials: "GB", color: "#f59e0b" },
  { id: "u4", name: "Marco Verdi", email: "marco@wibo.app", initials: "MV", color: "#a78bfa" },
];

export function teamMemberById(id: string | null | undefined) {
  if (!id) return undefined;
  return TEAM.find((m) => m.id === id);
}
