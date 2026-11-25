/**
 * Unit tests for the throttled game-status synchronization (spec 022, US3).
 *
 * The old implementation ran a 5-minute timer, which woke the (scale-to-zero)
 * database around the clock. The sync now runs once at startup and, at most once
 * per 5-minute window, when a request reads games. Nothing runs while idle.
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  gameStatusSyncMiddleware,
  recordGameStatusSync,
  resetGameStatusSyncForTests,
  syncGameStatusesIfStale,
} from "../../src/jobs/GameStatusSync";
import { runGameStatusTransitions } from "../../src/jobs/GameStatusTransitionJob";

jest.mock("../../src/jobs/GameStatusTransitionJob", () => ({
  runGameStatusTransitions: jest.fn(),
}));

const mockRun = runGameStatusTransitions as jest.Mock;
const WINDOW_MS = 5 * 60 * 1000;

describe("syncGameStatusesIfStale", () => {
  beforeEach(() => {
    resetGameStatusSyncForTests();
    mockRun.mockReset();
    mockRun.mockResolvedValue(undefined);
  });

  it("runs the first time it is called", async () => {
    await syncGameStatusesIfStale(1_000);

    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it("does not run again inside the 5-minute window", async () => {
    await syncGameStatusesIfStale(1_000);
    await syncGameStatusesIfStale(1_000 + WINDOW_MS - 1);

    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it("runs again once the window has passed", async () => {
    await syncGameStatusesIfStale(1_000);
    await syncGameStatusesIfStale(1_000 + WINDOW_MS);

    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it("shares a single in-flight run between concurrent callers", async () => {
    let release!: () => void;
    mockRun.mockReturnValue(
      new Promise<void>((resolve) => (release = resolve)),
    );

    const first = syncGameStatusesIfStale(1_000);
    const second = syncGameStatusesIfStale(1_001);
    release();
    await Promise.all([first, second]);

    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it("never throws into the caller when the job fails", async () => {
    mockRun.mockRejectedValue(new Error("db down"));

    await expect(syncGameStatusesIfStale(1_000)).resolves.toBeUndefined();
  });

  it("treats a startup run as the start of the window", async () => {
    recordGameStatusSync(1_000);
    await syncGameStatusesIfStale(1_000 + 1_000);

    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe("gameStatusSyncMiddleware", () => {
  beforeEach(() => {
    resetGameStatusSyncForTests();
    mockRun.mockReset();
    mockRun.mockResolvedValue(undefined);
  });

  it("syncs before handling a GET and then continues", async () => {
    const next = jest.fn();

    await gameStatusSyncMiddleware(
      { method: "GET" } as never,
      {} as never,
      next,
    );

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("skips non-read requests without touching the database", async () => {
    const next = jest.fn();

    await gameStatusSyncMiddleware(
      { method: "POST" } as never,
      {} as never,
      next,
    );

    expect(mockRun).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("continues even if the sync fails", async () => {
    mockRun.mockRejectedValue(new Error("boom"));
    const next = jest.fn();

    await gameStatusSyncMiddleware(
      { method: "GET" } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("startup (main.ts)", () => {
  const main = readFileSync(join(__dirname, "../../src/main.ts"), "utf8");

  it("registers no recurring timer, so an idle process never queries the database", () => {
    expect(main).not.toMatch(/setInterval\s*\(/);
  });

  it("still synchronizes game statuses once at startup", () => {
    expect(main).toMatch(/runGameStatusTransitions\(\)/);
  });
});
