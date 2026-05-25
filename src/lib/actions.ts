"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { DealStage } from "./types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function newId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

// ── Companies ────────────────────────────────────────────────────────────────

export async function createCompany(formData: FormData) {
  const id = newId("c");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  db.prepare(
    `INSERT INTO companies (id, name, domain, industry, size, location, arr, owner_id, description, created_at)
     VALUES (@id, @name, @domain, @industry, @size, @location, @arr, @owner_id, @description, @created_at)`,
  ).run({
    id,
    name,
    domain: String(formData.get("domain") || "") || null,
    industry: String(formData.get("industry") || "") || null,
    size: String(formData.get("size") || "") || null,
    location: String(formData.get("location") || "") || null,
    arr: formData.get("arr") ? Number(formData.get("arr")) : null,
    owner_id: String(formData.get("ownerId") || "") || null,
    description: String(formData.get("description") || "") || null,
    created_at: todayISO(),
  });
  revalidatePath("/companies");
  revalidatePath("/");
  redirect(`/companies/${id}`);
}

export async function updateCompany(id: string, formData: FormData) {
  db.prepare(
    `UPDATE companies SET
       name = @name,
       domain = @domain,
       industry = @industry,
       size = @size,
       location = @location,
       arr = @arr,
       owner_id = @owner_id,
       description = @description
     WHERE id = @id`,
  ).run({
    id,
    name: String(formData.get("name") || "").trim(),
    domain: String(formData.get("domain") || "") || null,
    industry: String(formData.get("industry") || "") || null,
    size: String(formData.get("size") || "") || null,
    location: String(formData.get("location") || "") || null,
    arr: formData.get("arr") ? Number(formData.get("arr")) : null,
    owner_id: String(formData.get("ownerId") || "") || null,
    description: String(formData.get("description") || "") || null,
  });
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

export async function deleteCompany(id: string) {
  db.prepare("DELETE FROM companies WHERE id = ?").run(id);
  revalidatePath("/companies");
  revalidatePath("/");
  redirect("/companies");
}

// ── People ───────────────────────────────────────────────────────────────────

export async function createPerson(formData: FormData) {
  const id = newId("p");
  const email = String(formData.get("email") || "").trim();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  if (!email || !firstName) return;
  db.prepare(
    `INSERT INTO people (id, first_name, last_name, email, phone, role, company_id, owner_id, linkedin, last_contacted_at, created_at)
     VALUES (@id, @first_name, @last_name, @email, @phone, @role, @company_id, @owner_id, @linkedin, @last_contacted_at, @created_at)`,
  ).run({
    id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: String(formData.get("phone") || "") || null,
    role: String(formData.get("role") || "") || null,
    company_id: String(formData.get("companyId") || "") || null,
    owner_id: String(formData.get("ownerId") || "") || null,
    linkedin: String(formData.get("linkedin") || "") || null,
    last_contacted_at: null,
    created_at: todayISO(),
  });
  revalidatePath("/people");
  revalidatePath("/");
  const companyId = formData.get("companyId");
  if (companyId) revalidatePath(`/companies/${companyId}`);
  redirect(`/people/${id}`);
}

export async function updatePerson(id: string, formData: FormData) {
  db.prepare(
    `UPDATE people SET
       first_name = @first_name,
       last_name = @last_name,
       email = @email,
       phone = @phone,
       role = @role,
       company_id = @company_id,
       owner_id = @owner_id,
       linkedin = @linkedin
     WHERE id = @id`,
  ).run({
    id,
    first_name: String(formData.get("firstName") || "").trim(),
    last_name: String(formData.get("lastName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "") || null,
    role: String(formData.get("role") || "") || null,
    company_id: String(formData.get("companyId") || "") || null,
    owner_id: String(formData.get("ownerId") || "") || null,
    linkedin: String(formData.get("linkedin") || "") || null,
  });
  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  revalidatePath("/companies");
}

export async function deletePerson(id: string) {
  db.prepare("DELETE FROM people WHERE id = ?").run(id);
  revalidatePath("/people");
  revalidatePath("/");
  redirect("/people");
}

// ── Deals ────────────────────────────────────────────────────────────────────

export async function createDeal(formData: FormData) {
  const id = newId("d");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const stage = (String(formData.get("stage") || "lead") || "lead") as DealStage;
  const next = db
    .prepare("SELECT COALESCE(MAX(sort_index), -1) + 1 as n FROM deals WHERE stage = ?")
    .get(stage) as { n: number };
  db.prepare(
    `INSERT INTO deals (id, name, value, currency, stage, company_id, primary_contact_id, owner_id, expected_close_date, probability, sort_index, created_at)
     VALUES (@id, @name, @value, @currency, @stage, @company_id, @primary_contact_id, @owner_id, @expected_close_date, @probability, @sort_index, @created_at)`,
  ).run({
    id,
    name,
    value: formData.get("value") ? Number(formData.get("value")) : 0,
    currency: String(formData.get("currency") || "EUR"),
    stage,
    company_id: String(formData.get("companyId") || "") || null,
    primary_contact_id: String(formData.get("primaryContactId") || "") || null,
    owner_id: String(formData.get("ownerId") || "") || null,
    expected_close_date: String(formData.get("expectedCloseDate") || "") || null,
    probability: formData.get("probability") ? Number(formData.get("probability")) : 0,
    sort_index: next.n,
    created_at: todayISO(),
  });
  revalidatePath("/pipeline");
  revalidatePath("/");
  const companyId = formData.get("companyId");
  if (companyId) revalidatePath(`/companies/${companyId}`);
  redirect(`/deals/${id}`);
}

export async function updateDeal(id: string, formData: FormData) {
  db.prepare(
    `UPDATE deals SET
       name = @name,
       value = @value,
       currency = @currency,
       stage = @stage,
       company_id = @company_id,
       primary_contact_id = @primary_contact_id,
       owner_id = @owner_id,
       expected_close_date = @expected_close_date,
       probability = @probability
     WHERE id = @id`,
  ).run({
    id,
    name: String(formData.get("name") || "").trim(),
    value: formData.get("value") ? Number(formData.get("value")) : 0,
    currency: String(formData.get("currency") || "EUR"),
    stage: String(formData.get("stage") || "lead"),
    company_id: String(formData.get("companyId") || "") || null,
    primary_contact_id: String(formData.get("primaryContactId") || "") || null,
    owner_id: String(formData.get("ownerId") || "") || null,
    expected_close_date: String(formData.get("expectedCloseDate") || "") || null,
    probability: formData.get("probability") ? Number(formData.get("probability")) : 0,
  });
  revalidatePath("/pipeline");
  revalidatePath(`/deals/${id}`);
  revalidatePath("/companies");
  revalidatePath("/people");
}

export async function deleteDeal(id: string) {
  db.prepare("DELETE FROM deals WHERE id = ?").run(id);
  revalidatePath("/pipeline");
  revalidatePath("/");
  redirect("/pipeline");
}

// Reorder deals within a stage and/or change stage
// `orderedIds` is the full ordered list of deal ids in the destination stage after the move.
export async function moveDeal(
  dealId: string,
  targetStage: DealStage,
  orderedIds: string[],
) {
  const updateStage = db.prepare(
    "UPDATE deals SET stage = ?, sort_index = ? WHERE id = ?",
  );
  const tx = db.transaction(() => {
    orderedIds.forEach((id, i) => {
      if (id === dealId) {
        updateStage.run(targetStage, i, id);
      } else {
        db.prepare("UPDATE deals SET sort_index = ? WHERE id = ? AND stage = ?").run(
          i,
          id,
          targetStage,
        );
      }
    });
  });
  tx();
  revalidatePath("/pipeline");
  revalidatePath("/");
}

// ── Deal ↔ Person associations ───────────────────────────────────────────────

export async function addContactToDeal(dealId: string, personId: string) {
  db.prepare(
    "INSERT OR IGNORE INTO deal_contacts (deal_id, person_id) VALUES (?, ?)",
  ).run(dealId, personId);
  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/people/${personId}`);
}

export async function removeContactFromDeal(dealId: string, personId: string) {
  db.prepare("DELETE FROM deal_contacts WHERE deal_id = ? AND person_id = ?").run(
    dealId,
    personId,
  );
  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/people/${personId}`);
}
