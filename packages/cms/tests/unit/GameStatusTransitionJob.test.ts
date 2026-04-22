import { runGameStatusTransitions } from "../../src/jobs/GameStatusTransitionJob";
import { prisma } from "../../src/config/database";
import { GameStatus } from "@ministrosfc/shared";

jest.mock("../../src/config/database", () => ({
  prisma: {
    game: {
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("../../src/utils/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdateMany: jest.Mock = (prisma as any).game.updateMany;

describe("GameStatusTransitionJob – runGameStatusTransitions", () => {
  beforeEach(() => {
    mockUpdateMany.mockReset();
    mockUpdateMany.mockResolvedValue({ count: 0 });
  });

  it("calls updateMany twice (SCHEDULED→IN_PROGRESS and IN_PROGRESS→COMPLETED)", async () => {
    await runGameStatusTransitions();
    expect(mockUpdateMany).toHaveBeenCalledTimes(2);
  });

  it("first call targets SCHEDULED games with date <= now", async () => {
    await runGameStatusTransitions();
    const [firstCall] = mockUpdateMany.mock.calls;
    expect(firstCall[0].where.status).toBe(GameStatus.SCHEDULED);
    expect(firstCall[0].data).toEqual({ status: GameStatus.IN_PROGRESS });
  });

  it("second call targets IN_PROGRESS games with endDate lte now", async () => {
    await runGameStatusTransitions();
    const [, secondCall] = mockUpdateMany.mock.calls;
    expect(secondCall[0].where.status).toBe(GameStatus.IN_PROGRESS);
    expect(secondCall[0].data).toEqual({ status: GameStatus.COMPLETED });
    expect(secondCall[0].where.endDate).toBeDefined();
  });

  it("does not throw when prisma returns zero-count results", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    await expect(runGameStatusTransitions()).resolves.toBeUndefined();
  });

  it("does not throw when prisma returns positive counts", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 3 });
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });
    await expect(runGameStatusTransitions()).resolves.toBeUndefined();
  });

  it("does not propagate prisma errors (catches and logs)", async () => {
    mockUpdateMany.mockRejectedValue(new Error("DB error"));
    await expect(runGameStatusTransitions()).resolves.toBeUndefined();
  });
});
