import "server-only";
import { getDb } from "./db";
import { teamMemberById, type Enrollment, type Person, type Task } from "./types";
import {
  listCompanies,
  listPeople,
  listSequenceSteps,
  getScoringConfig,
} from "./queries";
import { scoreMany } from "./scoring";
import type { Score } from "./types";
import { today as nowDate, todayISO } from "./utils";

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

export type DailyQueue = {
  date: string;
  sdrId: string;
  overdue: Task[];
  dueToday: Task[];
  completedToday: Task[];
  capacity: { cap: number; used: number; pending: number; free: number };
};

export async function getDailyQueue(
  sdrId: string,
  date: string = todayISO(),
): Promise<DailyQueue> {
  const db = await getDb();

  const [overdueR, dueTodayR, completedR] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM tasks
            WHERE sdr_id = ? AND status = 'pending' AND due_date < ?
            ORDER BY due_date ASC, created_at ASC`,
      args: [sdrId, date],
    }),
    db.execute({
      sql: `SELECT * FROM tasks
            WHERE sdr_id = ? AND status = 'pending' AND due_date = ?
            ORDER BY step_number ASC, created_at ASC`,
      args: [sdrId, date],
    }),
    db.execute({
      sql: `SELECT * FROM tasks
            WHERE sdr_id = ? AND status IN ('completed','skipped')
              AND substr(completed_at, 1, 10) = ?
            ORDER BY completed_at DESC`,
      args: [sdrId, date],
    }),
  ]);

  const overdue = (overdueR.rows as unknown as TaskRow[]).map(mapTask);
  const dueToday = (dueTodayR.rows as unknown as TaskRow[]).map(mapTask);
  const completedToday = (completedR.rows as unknown as TaskRow[]).map(mapTask);

  const member = teamMemberById(sdrId);
  const cap = member?.dailyCap ?? 35;
  const used = completedToday.length;
  const pending = overdue.length + dueToday.length;
  const free = Math.max(0, cap - used - pending);

  return {
    date,
    sdrId,
    overdue,
    dueToday,
    completedToday,
    capacity: { cap, used, pending, free },
  };
}

/**
 * How many *new* enrollments this SDR can take on today.
 * Each new enrollment will create a step-1 task due today (consuming 1 slot
 * from `free`). Later steps land on future dates, so they don't compete for
 * today's capacity. We therefore allow up to `free` new enrollments — but we
 * never recommend more than what the cap can sustain at steady state
 * (cap / step count).
 */
export async function enrollmentCapacity(
  sdrId: string,
  date: string = todayISO(),
): Promise<{ freeToday: number; steadyState: number; recommended: number }> {
  const [q, steps] = await Promise.all([
    getDailyQueue(sdrId, date),
    listSequenceSteps("seq_cold_call_6"),
  ]);
  const stepCount = steps.length || 6;
  const steadyState = Math.floor(q.capacity.cap / stepCount);
  const recommended = Math.min(q.capacity.free, steadyState);
  return { freeToday: q.capacity.free, steadyState, recommended };
}

/**
 * Pick the top-scored people that are NOT in an active enrollment, so the SDR
 * can enroll them. Limited by recommended capacity.
 */
export async function suggestEnrollments(
  sdrId: string,
  date: string = todayISO(),
  limit?: number,
): Promise<{ person: Person; score: Score }[]> {
  const cap = await enrollmentCapacity(sdrId, date);
  const max = limit ?? cap.recommended;
  if (max <= 0) return [];

  const db = await getDb();
  const allPeople = await listPeople();
  // One query to find which people have active enrollments; filter in memory.
  const active = await db.execute(
    "SELECT person_id FROM enrollments WHERE status = 'active'",
  );
  const activeSet = new Set(
    (active.rows as unknown as { person_id: string }[]).map((r) => r.person_id),
  );
  const candidates = allPeople.filter((p) => !activeSet.has(p.id));

  const [config, companies] = await Promise.all([
    getScoringConfig(),
    listCompanies(),
  ]);
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const scores = scoreMany(candidates, companyMap, config, nowDate());

  return candidates
    .map((p) => ({ person: p, score: scores.get(p.id)! }))
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, max);
}

/**
 * Create the tasks for an enrollment based on the sequence steps. Used by
 * both seeding and the enrollPerson server action.
 */
export async function generateTasksForEnrollment(
  enrollment: Enrollment,
  randomId: () => string,
): Promise<void> {
  const steps = await listSequenceSteps(enrollment.sequenceId);
  const enrolledAt = new Date(enrollment.enrolledAt + "T00:00:00Z");
  const db = await getDb();
  await db.batch(
    steps.map((step) => {
      const d = new Date(enrolledAt);
      d.setUTCDate(d.getUTCDate() + step.dayOffset);
      return {
        sql: `INSERT INTO tasks (id, enrollment_id, person_id, sdr_id, step_number, channel, due_date, status, outcome, completed_at, created_at)
              VALUES (:id, :enrollment_id, :person_id, :sdr_id, :step_number, :channel, :due_date, 'pending', NULL, NULL, :created_at)`,
        args: {
          id: randomId(),
          enrollment_id: enrollment.id,
          person_id: enrollment.personId,
          sdr_id: enrollment.sdrId,
          step_number: step.stepNumber,
          channel: step.channel,
          due_date: d.toISOString().slice(0, 10),
          created_at: enrollment.enrolledAt,
        },
      };
    }),
    "write",
  );
}

/**
 * Mark all active tasks of an enrollment as skipped and the enrollment as
 * exited. Used when a contact replies, books a meeting, or is disqualified.
 */
export async function exitEnrollment(
  enrollmentId: string,
  reason: string,
): Promise<void> {
  const db = await getDb();
  await db.batch(
    [
      {
        sql: "UPDATE tasks SET status = 'skipped' WHERE enrollment_id = ? AND status = 'pending'",
        args: [enrollmentId],
      },
      {
        sql: "UPDATE enrollments SET status = 'exited', exit_reason = ?, completed_at = ? WHERE id = ?",
        args: [reason, todayISO(), enrollmentId],
      },
    ],
    "write",
  );
}

/**
 * If all tasks for an enrollment are completed/skipped, mark the enrollment
 * itself as completed.
 */
export async function maybeCompleteEnrollment(enrollmentId: string): Promise<void> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM tasks WHERE enrollment_id = ? AND status = 'pending'",
    args: [enrollmentId],
  });
  const n = Number(r.rows[0]?.n ?? 0);
  if (n === 0) {
    await db.execute({
      sql: "UPDATE enrollments SET status = 'completed', completed_at = ? WHERE id = ? AND status = 'active'",
      args: [todayISO(), enrollmentId],
    });
  }
}
