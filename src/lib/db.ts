import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { SEED_COMPANIES, SEED_PEOPLE, SEED_DEALS, SEED_DEAL_CONTACTS } from "./seed";

declare global {
  var __crmDb: Database.Database | undefined;
}

function open() {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "crm.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
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
    INSERT OR IGNORE INTO people (id, first_name, last_name, email, phone, role, company_id, owner_id, linkedin, last_contacted_at, created_at)
    VALUES (@id, @first_name, @last_name, @email, @phone, @role, @company_id, @owner_id, @linkedin, @last_contacted_at, @created_at)
  `);
  const insertDeal = db.prepare(`
    INSERT OR IGNORE INTO deals (id, name, value, currency, stage, company_id, primary_contact_id, owner_id, expected_close_date, probability, sort_index, created_at)
    VALUES (@id, @name, @value, @currency, @stage, @company_id, @primary_contact_id, @owner_id, @expected_close_date, @probability, @sort_index, @created_at)
  `);
  const insertDealContact = db.prepare(`
    INSERT OR IGNORE INTO deal_contacts (deal_id, person_id) VALUES (?, ?)
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
  });
  tx();
}

export const db = globalThis.__crmDb ?? open();
if (process.env.NODE_ENV !== "production") {
  globalThis.__crmDb = db;
}
