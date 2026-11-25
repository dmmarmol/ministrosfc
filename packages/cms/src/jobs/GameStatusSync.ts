import type { NextFunction, Request, Response } from "express";
import { runGameStatusTransitions } from "./GameStatusTransitionJob";

/**
 * Throttled, request-driven game-status synchronization.
 *
 * Replaces the former 5-minute timer. A timer queried the database around the
 * clock, which kept the scale-to-zero database awake and exhausted its free
 * compute allowance. Now the sync runs once at startup and, at most once per
 * window, when a request reads games. An idle process never queries.
 */
export const GAME_STATUS_SYNC_WINDOW_MS = 5 * 60 * 1000;

let lastRunAt: number | null = null;
let inFlight: Promise<void> | null = null;

/** Marks a sync as just done (used by the startup run) so the window starts then. */
export function recordGameStatusSync(now: number = Date.now()): void {
  lastRunAt = now;
}

/** Test helper: forget the last run. */
export function resetGameStatusSyncForTests(): void {
  lastRunAt = null;
  inFlight = null;
}

/**
 * Runs the transitions unless one ran within the window. Concurrent callers share
 * the same in-flight run. Never rejects: failures are already logged by the job.
 */
export async function syncGameStatusesIfStale(
  now: number = Date.now(),
): Promise<void> {
  if (inFlight) {
    await inFlight;
    return;
  }
  if (lastRunAt !== null && now - lastRunAt < GAME_STATUS_SYNC_WINDOW_MS) {
    return;
  }

  lastRunAt = now;
  inFlight = Promise.resolve()
    .then(() => runGameStatusTransitions())
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
    });
  await inFlight;
}

/** Express middleware: keep statuses fresh before games are read. */
export async function gameStatusSyncMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.method === "GET") {
    await syncGameStatusesIfStale();
  }
  next();
}
