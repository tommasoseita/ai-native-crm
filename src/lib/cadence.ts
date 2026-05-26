import "server-only";
import { db } from "./db";
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

export function getDailyQueue(sdrId: string, date: string = todayISO()): DailyQueue {
  const overdue = (
    db
      .prepare(
        `SELECT * FROM tasks
         WHERE sdr_id = ? AND status = 'pending' AND due_date < ?
         ORDER BY due_date ASC, created_at ASC`,
      )
      .all(sdrId, date) as TaskRow[]
  ).map(mapTask);

  const dueToday = (
    db
      .prepare(
        `SELECT * FROM tasks
         WHERE sdr_id = ? AND status = 'pending' AND due_date = ?
         ORDER BY step_number ASC, created_at ASC`,
      )
      .all(sdrId, date) as TaskRow[]
  ).map(mapTask);

  const completedToday = (
    db
      .prepare(
        `SELECT * FROM tasks
         WHERE sdr_id = ? AND status IN ('completed','skipped')
           AND substr(completed_at, 1, 10) = ?
         ORDER BY completed_at DESC`,
      )
      .all(sdrId, date) as TaskRow[]
  ).map(mapTask);

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
export function enrollmentCapacity(sdrId: string, date: string = todayISO()): {
  freeToday: number;
  steadyState: number;
  recommended: number;
} {
  const q = getDailyQueue(sdrId, date);
  const stepCount = listSequenceSteps("seq_cold_call_6").length || 6;
  const steadyState = Math.floor(q.capacity.cap / stepCount);
  const recommended = Math.min(q.capacity.free, steadyState);
  return { freeToday: q.capacity.free, steadyState, recommended };
}

/**
 * Pick the top-scored people that are NOT in an active enrollment, so the SDR
 * can enroll them. Limited by recommended capacity.
 */
export function suggestEnrollments(
  sdrId: string,
  date: string = todayISO(),
  limit?: number,
): { person: Person; score: Score }[] {
  const cap = enrollmentCapacity(sdrId, date);
  const max = limit ?? cap.recommended;
  if (max <= 0) return [];

  // People without an active enrollment.
  const candidates = listPeople().filter((p) => {
    const active = db
      .prepare(
        "SELECT 1 FROM enrollments WHERE person_id = ? AND status = 'active' LIMIT 1",
      )
      .get(p.id);
    return !active;
  });

  const config = getScoringConfig();
  const companies = new Map(listCompanies().map((c) => [c.id, c]));
  const scores = scoreMany(candidates, companies, config, nowDate());

  return candidates
    .map((p) => ({ person: p, score: scores.get(p.id)! }))
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, max);
}

/**
 * Create the tasks for an enrollment based on the sequence steps. Used by
 * both seeding and the enrollPerson server action.
 */
export function generateTasksForEnrollment(
  enrollment: Enrollment,
  randomId: () => string,
): void {
  const steps = listSequenceSteps(enrollment.sequenceId);
  const enrolledAt = new Date(enrollment.enrolledAt + "T00:00:00Z");
  const insertTask = db.prepare(
    `INSERT INTO tasks (id, enrollment_id, person_id, sdr_id, step_number, channel, due_date, status, outcome, completed_at, created_at)
     VALUES (@id, @enrollment_id, @person_id, @sdr_id, @step_number, @channel, @due_date, 'pending', NULL, NULL, @created_at)`,
  );
  const tx = db.transaction(() => {
    for (const step of steps) {
      const d = new Date(enrolledAt);
      d.setUTCDate(d.getUTCDate() + step.dayOffset);
      insertTask.run({
        id: randomId(),
        enrollment_id: enrollment.id,
        person_id: enrollment.personId,
        sdr_id: enrollment.sdrId,
        step_number: step.stepNumber,
        channel: step.channel,
        due_date: d.toISOString().slice(0, 10),
        created_at: enrollment.enrolledAt,
      });
    }
  });
  tx();
}

/**
 * Mark all active tasks of an enrollment as skipped and the enrollment as
 * exited. Used when a contact replies, books a meeting, or is disqualified.
 */
export function exitEnrollment(enrollmentId: string, reason: string): void {
  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE tasks SET status = 'skipped' WHERE enrollment_id = ? AND status = 'pending'",
    ).run(enrollmentId);
    db.prepare(
      `UPDATE enrollments SET status = 'exited', exit_reason = ?, completed_at = ? WHERE id = ?`,
    ).run(reason, todayISO(), enrollmentId);
  });
  tx();
}

/**
 * If all tasks for an enrollment are completed/skipped, mark the enrollment
 * itself as completed.
 */
export function maybeCompleteEnrollment(enrollmentId: string): void {
  const row = db
    .prepare(
      "SELECT COUNT(*) as n FROM tasks WHERE enrollment_id = ? AND status = 'pending'",
    )
    .get(enrollmentId) as { n: number };
  if (row.n === 0) {
    db.prepare(
      `UPDATE enrollments SET status = 'completed', completed_at = ? WHERE id = ? AND status = 'active'`,
    ).run(todayISO(), enrollmentId);
  }
}
