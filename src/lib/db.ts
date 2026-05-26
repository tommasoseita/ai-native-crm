import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import {
  SEED_COMPANIES,
  SEED_PEOPLE,
  SEED_DEALS,
  SEED_DEAL_CONTACTS,
  SEED_SEQUENCE,
  SEED_SEQUENCE_STEPS,
  SEED_ENROLLMENTS,
  SEED_TASKS,
  SEED_SCORING_CONFIG_JSON,
} from "./seed";

declare global {
  var __crmDb: Database.Database | undefined;
}

function open() {
  // On Vercel/serverless, /var/task is read-only — only /tmp is writable.
  // The DB is re-seeded on cold starts; this is acceptable for the demo.
  const isServerless = !!process.env.VERCEL;
  const dbPath = isServerless
    ? "/tmp/crm.db"
    : path.join(process.cwd(), "data", "crm.db");

  if (!isServerless) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  // WAL needs sidecar files on disk; not viable on Vercel's ephemeral /tmp
  // across concurrent invocations. MEMORY journal keeps everything in RAM.
  db.pragma(isServerless ? "journal_mode = MEMORY" : "journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  seedIfEmpty(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT,
      industry TEXT,
      size TEXT,
      location TEXT,
      arr INTEGER,
      owner_id TEXT,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      role TEXT,
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      owner_id TEXT,
      linkedin TEXT,
      last_contacted_at TEXT,
      last_engaged_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_people_company ON people(company_id);

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      stage TEXT NOT NULL DEFAULT 'lead',
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      primary_contact_id TEXT REFERENCES people(id) ON DELETE SET NULL,
      owner_id TEXT,
      expected_close_date TEXT,
      probability INTEGER NOT NULL DEFAULT 0,
      sort_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);
    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage, sort_index);

    CREATE TABLE IF NOT EXISTS deal_contacts (
      deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
      person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      PRIMARY KEY (deal_id, person_id)
    );

    CREATE TABLE IF NOT EXISTS sequences (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sequence_steps (
      id TEXT PRIMARY KEY,
      sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      day_offset INTEGER NOT NULL,
      channel TEXT NOT NULL DEFAULT 'call',
      UNIQUE (sequence_id, step_number)
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
      person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      sdr_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','completed','exited','paused')),
      exit_reason TEXT,
      enrolled_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_enrollments_person ON enrollments(person_id, status);
    CREATE INDEX IF NOT EXISTS idx_enrollments_sdr ON enrollments(sdr_id, status);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      person_id TEXT NOT NULL,
      sdr_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      channel TEXT NOT NULL DEFAULT 'call',
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','completed','skipped')),
      outcome TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_queue ON tasks(sdr_id, status, due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_person ON tasks(person_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_enrollment ON tasks(enrollment_id);

    CREATE TABLE IF NOT EXISTS scoring_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  const row = db.prepare("SELECT count(*) as n FROM companies").get() as { n: number };
  if (row.n > 0) return;

  const insertCompany = db.prepare(`
    INSERT OR IGNORE INTO companies (id, name, domain, industry, size, location, arr, owner_id, description, created_at)
    VALUES (@id, @name, @domain, @industry, @size, @location, @arr, @owner_id, @description, @created_at)
  `);
  const insertPerson = db.prepare(`
    INSERT OR IGNORE INTO people (id, first_name, last_name, email, phone, role, company_id, owner_id, linkedin, last_contacted_at, last_engaged_at, created_at)
    VALUES (@id, @first_name, @last_name, @email, @phone, @role, @company_id, @owner_id, @linkedin, @last_contacted_at, @last_engaged_at, @created_at)
  `);
  const insertDeal = db.prepare(`
    INSERT OR IGNORE INTO deals (id, name, value, currency, stage, company_id, primary_contact_id, owner_id, expected_close_date, probability, sort_index, created_at)
    VALUES (@id, @name, @value, @currency, @stage, @company_id, @primary_contact_id, @owner_id, @expected_close_date, @probability, @sort_index, @created_at)
  `);
  const insertDealContact = db.prepare(`
    INSERT OR IGNORE INTO deal_contacts (deal_id, person_id) VALUES (?, ?)
  `);
  const insertSequence = db.prepare(`
    INSERT OR IGNORE INTO sequences (id, name, description, owner_id, created_at)
    VALUES (@id, @name, @description, @owner_id, @created_at)
  `);
  const insertStep = db.prepare(`
    INSERT OR IGNORE INTO sequence_steps (id, sequence_id, step_number, day_offset, channel)
    VALUES (@id, @sequence_id, @step_number, @day_offset, @channel)
  `);
  const insertEnrollment = db.prepare(`
    INSERT OR IGNORE INTO enrollments (id, sequence_id, person_id, sdr_id, status, exit_reason, enrolled_at, completed_at)
    VALUES (@id, @sequence_id, @person_id, @sdr_id, @status, @exit_reason, @enrolled_at, @completed_at)
  `);
  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO tasks (id, enrollment_id, person_id, sdr_id, step_number, channel, due_date, status, outcome, completed_at, created_at)
    VALUES (@id, @enrollment_id, @person_id, @sdr_id, @step_number, @channel, @due_date, @status, @outcome, @completed_at, @created_at)
  `);
  const insertScoringConfig = db.prepare(`
    INSERT OR IGNORE INTO scoring_config (id, data) VALUES (1, ?)
  `);

  const tx = db.transaction(() => {
    for (const c of SEED_COMPANIES) insertCompany.run(c);
    for (const p of SEED_PEOPLE) insertPerson.run(p);
    let idx = 0;
    let prevStage = "";
    for (const d of SEED_DEALS) {
      if (d.stage !== prevStage) {
        idx = 0;
        prevStage = d.stage;
      }
      insertDeal.run({ ...d, sort_index: idx++ });
    }
    for (const [dealId, personId] of SEED_DEAL_CONTACTS) {
      insertDealContact.run(dealId, personId);
    }
    insertSequence.run(SEED_SEQUENCE);
    for (const s of SEED_SEQUENCE_STEPS) insertStep.run(s);
    for (const e of SEED_ENROLLMENTS) insertEnrollment.run(e);
    for (const t of SEED_TASKS) insertTask.run(t);
    insertScoringConfig.run(SEED_SCORING_CONFIG_JSON);
  });
  tx();
}

export const db = globalThis.__crmDb ?? open();
// Cache the connection on the global in every environment. On warm serverless
// invocations this avoids re-running migrate/seed on every request.
globalThis.__crmDb = db;
