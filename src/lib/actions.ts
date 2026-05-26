"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import {
  exitEnrollment as exitEnrollmentImpl,
  generateTasksForEnrollment,
  maybeCompleteEnrollment,
} from "./cadence";
import { getTask } from "./queries";
import { EXIT_OUTCOMES, type DealStage, type ScoringConfig, type TaskOutcome } from "./types";
import { today, todayISO } from "./utils";

const VIEW_AS_COOKIE = "crm_as";

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
       name = @name, domain = @domain, industry = @industry, size = @size,
       location = @location, arr = @arr, owner_id = @owner_id, description = @description
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
    `INSERT INTO people (id, first_name, last_name, email, phone, role, company_id, owner_id, linkedin, last_contacted_at, last_engaged_at, created_at)
     VALUES (@id, @first_name, @last_name, @email, @phone, @role, @company_id, @owner_id, @linkedin, @last_contacted_at, @last_engaged_at, @created_at)`,
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
    last_engaged_at: null,
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
       first_name = @first_name, last_name = @last_name, email = @email,
       phone = @phone, role = @role, company_id = @company_id,
       owner_id = @owner_id, linkedin = @linkedin
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
       name = @name, value = @value, currency = @currency, stage = @stage,
       company_id = @company_id, primary_contact_id = @primary_contact_id,
       owner_id = @owner_id, expected_close_date = @expected_close_date,
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

// ── Sequences ────────────────────────────────────────────────────────────────

export async function createSequence(formData: FormData) {
  const id = newId("seq");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const offsetsRaw = String(formData.get("offsets") || "0,2,5,9,14,20");
  const offsets = offsetsRaw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));

  db.prepare(
    `INSERT INTO sequences (id, name, description, owner_id, created_at)
     VALUES (@id, @name, @description, @owner_id, @created_at)`,
  ).run({
    id,
    name,
    description: String(formData.get("description") || "") || null,
    owner_id: String(formData.get("ownerId") || "u1") || null,
    created_at: todayISO(),
  });

  const insertStep = db.prepare(
    `INSERT INTO sequence_steps (id, sequence_id, step_number, day_offset, channel)
     VALUES (?, ?, ?, ?, 'call')`,
  );
  const tx = db.transaction(() => {
    offsets.forEach((offset, i) => {
      insertStep.run(newId("step"), id, i + 1, offset);
    });
  });
  tx();

  revalidatePath("/sequences");
  redirect(`/sequences/${id}`);
}

export async function updateSequence(id: string, formData: FormData) {
  db.prepare(
    "UPDATE sequences SET name = @name, description = @description WHERE id = @id",
  ).run({
    id,
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "") || null,
  });
  revalidatePath("/sequences");
  revalidatePath(`/sequences/${id}`);
}

export async function deleteSequence(id: string) {
  db.prepare("DELETE FROM sequences WHERE id = ?").run(id);
  revalidatePath("/sequences");
  redirect("/sequences");
}

// ── Enrollments ──────────────────────────────────────────────────────────────

export async function enrollPerson(formData: FormData) {
  const personId = String(formData.get("personId") || "");
  const sequenceId = String(formData.get("sequenceId") || "");
  const sdrId = String(formData.get("sdrId") || "") || (await currentSdrId());
  if (!personId || !sequenceId) return;

  // Reject double-enroll on an active sequence.
  const active = db
    .prepare(
      "SELECT id FROM enrollments WHERE person_id = ? AND status = 'active' LIMIT 1",
    )
    .get(personId);
  if (active) return;

  const id = newId("enr");
  const enrolledAt = todayISO();
  db.prepare(
    `INSERT INTO enrollments (id, sequence_id, person_id, sdr_id, status, exit_reason, enrolled_at, completed_at)
     VALUES (@id, @sequence_id, @person_id, @sdr_id, 'active', NULL, @enrolled_at, NULL)`,
  ).run({
    id,
    sequence_id: sequenceId,
    person_id: personId,
    sdr_id: sdrId,
    enrolled_at: enrolledAt,
  });

  generateTasksForEnrollment(
    {
      id,
      sequenceId,
      personId,
      sdrId,
      status: "active",
      exitReason: null,
      enrolledAt,
      completedAt: null,
    },
    () => newId("task"),
  );

  revalidatePath("/today");
  revalidatePath("/");
  revalidatePath(`/people/${personId}`);
  revalidatePath(`/sequences/${sequenceId}`);
}

export async function exitEnrollment(enrollmentId: string, reason: string) {
  exitEnrollmentImpl(enrollmentId, reason);
  revalidatePath("/today");
  revalidatePath("/");
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function completeTask(taskId: string, outcome: TaskOutcome) {
  const task = getTask(taskId);
  if (!task) return;
  const completedAt = today().toISOString();
  db.prepare(
    "UPDATE tasks SET status = 'completed', outcome = ?, completed_at = ? WHERE id = ? AND status = 'pending'",
  ).run(outcome, completedAt, taskId);

  // Update the contact's last_contacted_at to today.
  db.prepare("UPDATE people SET last_contacted_at = ? WHERE id = ?").run(
    todayISO(),
    task.personId,
  );

  // If outcome triggers an exit, skip remaining tasks and close the enrollment.
  if (EXIT_OUTCOMES.includes(outcome)) {
    exitEnrollmentImpl(task.enrollmentId, outcome);
  } else {
    maybeCompleteEnrollment(task.enrollmentId);
  }

  revalidatePath("/today");
  revalidatePath("/");
  revalidatePath(`/people/${task.personId}`);
}

export async function skipTask(taskId: string) {
  const task = getTask(taskId);
  if (!task) return;
  db.prepare(
    "UPDATE tasks SET status = 'skipped', completed_at = ? WHERE id = ? AND status = 'pending'",
  ).run(today().toISOString(), taskId);
  maybeCompleteEnrollment(task.enrollmentId);
  revalidatePath("/today");
  revalidatePath("/");
  revalidatePath(`/people/${task.personId}`);
}

export async function rescheduleTask(taskId: string, newDate: string) {
  db.prepare("UPDATE tasks SET due_date = ? WHERE id = ? AND status = 'pending'").run(
    newDate,
    taskId,
  );
  revalidatePath("/today");
}

// ── Scoring config ───────────────────────────────────────────────────────────

export async function updateScoringConfig(config: ScoringConfig) {
  db.prepare(
    "INSERT INTO scoring_config (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
  ).run(JSON.stringify(config));
  revalidatePath("/scoring");
  revalidatePath("/people");
  revalidatePath("/today");
}

// ── View-as (current SDR) ────────────────────────────────────────────────────

async function currentSdrId(): Promise<string> {
  const store = await cookies();
  return store.get(VIEW_AS_COOKIE)?.value || "u1";
}

export async function setViewAs(sdrId: string) {
  const store = await cookies();
  store.set(VIEW_AS_COOKIE, sdrId, { path: "/", httpOnly: false, sameSite: "lax" });
  revalidatePath("/today");
  revalidatePath("/");
}
