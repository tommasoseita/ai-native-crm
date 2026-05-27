import "server-only";
import { mkdirSync } from "node:fs";
import { createClient, type Client } from "@libsql/client";
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
  // eslint-disable-next-line no-var
  var __crmDbInit: Promise<Client> | undefined;
}

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    return createClient({ url, authToken });
  }

  // No Turso URL: fall back to a local SQLite file. This is fine for local
  // dev, but the serverless filesystem is ephemeral — refuse to start on a
  // hosted deployment so we never silently lose data to a per-Lambda file.
  if (process.env.VERCEL) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. A persistent libSQL/Turso database is required in production; " +
        "the local file fallback is ephemeral on serverless. Set TURSO_DATABASE_URL and " +
        "TURSO_AUTH_TOKEN in your Vercel project settings.",
    );
  }

  mkdirSync("./data", { recursive: true });
  return createClient({ url: "file:./data/crm.db" });
}

const DDL = `
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
`;

async function seedIfEmpty(client: Client) {
  const r = await client.execute("SELECT count(*) AS n FROM companies");
  const n = Number(r.rows[0]?.n ?? 0);
  if (n > 0) return;

  // Re-sort deal sort_index by group of stage (preserves original behaviour).
  let idx = 0;
  let prevStage = "";
  const dealsWithSort = SEED_DEALS.map((d) => {
    if (d.stage !== prevStage) {
      idx = 0;
      prevStage = d.stage;
    }
    return { ...d, sort_index: idx++ };
  });

  await client.batch(
    [
      ...SEED_COMPANIES.map((c) => ({
        sql: `INSERT OR IGNORE INTO companies (id, name, domain, industry, size, location, arr, owner_id, description, created_at)
              VALUES (:id, :name, :domain, :industry, :size, :location, :arr, :owner_id, :description, :created_at)`,
        args: c,
      })),
      ...SEED_PEOPLE.map((p) => ({
        sql: `INSERT OR IGNORE INTO people (id, first_name, last_name, email, phone, role, company_id, owner_id, linkedin, last_contacted_at, last_engaged_at, created_at)
              VALUES (:id, :first_name, :last_name, :email, :phone, :role, :company_id, :owner_id, :linkedin, :last_contacted_at, :last_engaged_at, :created_at)`,
        args: p,
      })),
      ...dealsWithSort.map((d) => ({
        sql: `INSERT OR IGNORE INTO deals (id, name, value, currency, stage, company_id, primary_contact_id, owner_id, expected_close_date, probability, sort_index, created_at)
              VALUES (:id, :name, :value, :currency, :stage, :company_id, :primary_contact_id, :owner_id, :expected_close_date, :probability, :sort_index, :created_at)`,
        args: d,
      })),
      ...SEED_DEAL_CONTACTS.map(([dealId, personId]) => ({
        sql: "INSERT OR IGNORE INTO deal_contacts (deal_id, person_id) VALUES (?, ?)",
        args: [dealId, personId],
      })),
      {
        sql: `INSERT OR IGNORE INTO sequences (id, name, description, owner_id, created_at)
              VALUES (:id, :name, :description, :owner_id, :created_at)`,
        args: SEED_SEQUENCE,
      },
      ...SEED_SEQUENCE_STEPS.map((s) => ({
        sql: `INSERT OR IGNORE INTO sequence_steps (id, sequence_id, step_number, day_offset, channel)
              VALUES (:id, :sequence_id, :step_number, :day_offset, :channel)`,
        args: s,
      })),
      ...SEED_ENROLLMENTS.map((e) => ({
        sql: `INSERT OR IGNORE INTO enrollments (id, sequence_id, person_id, sdr_id, status, exit_reason, enrolled_at, completed_at)
              VALUES (:id, :sequence_id, :person_id, :sdr_id, :status, :exit_reason, :enrolled_at, :completed_at)`,
        args: e,
      })),
      ...SEED_TASKS.map((t) => ({
        sql: `INSERT OR IGNORE INTO tasks (id, enrollment_id, person_id, sdr_id, step_number, channel, due_date, status, outcome, completed_at, created_at)
              VALUES (:id, :enrollment_id, :person_id, :sdr_id, :step_number, :channel, :due_date, :status, :outcome, :completed_at, :created_at)`,
        args: t,
      })),
      {
        sql: "INSERT OR IGNORE INTO scoring_config (id, data) VALUES (1, ?)",
        args: [SEED_SCORING_CONFIG_JSON],
      },
    ],
    "write",
  );
}

async function initialize(client: Client): Promise<Client> {
  await client.executeMultiple(DDL);
  await seedIfEmpty(client);
  return client;
}

/**
 * Returns the initialized libSQL client. Migration + seed run exactly once
 * per process; concurrent callers all await the same promise.
 */
export function getDb(): Promise<Client> {
  if (!globalThis.__crmDbInit) {
    globalThis.__crmDbInit = initialize(createDbClient());
  }
  return globalThis.__crmDbInit;
}
