import "server-only";
import { db } from "./db";
import type { Company, Deal, DealStage, Person } from "./types";

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

// All associated people for a deal: primary contact + extras (deduped)
export function allContactsForDeal(dealId: string): Person[] {
  const deal = getDeal(dealId);
  if (!deal) return [];
  const extras = contactsForDeal(dealId);
  const all = [...extras];
  if (deal.primaryContactId && !all.some((p) => p.id === deal.primaryContactId)) {
    const primary = getPerson(deal.primaryContactId);
    if (primary) all.unshift(primary);
  } else if (deal.primaryContactId) {
    // ensure primary is first
    const i = all.findIndex((p) => p.id === deal.primaryContactId);
    if (i > 0) {
      const [primary] = all.splice(i, 1);
      all.unshift(primary);
    }
  }
  return all;
}
