export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: CompanySize;
  location: string;
  arr?: number;
  ownerId: string;
  createdAt: string;
  description?: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  companyId: string;
  ownerId: string;
  lastContactedAt?: string;
  linkedin?: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  currency: "EUR" | "USD";
  stage: DealStage;
  companyId: string;
  primaryContactId: string;
  ownerId: string;
  expectedCloseDate: string;
  probability: number;
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
