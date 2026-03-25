/**
 * Integration test: seed-import CLI orchestrator
 *
 * Requires: TEST_DATABASE_URL env pointing at a running test PostgreSQL database.
 * Run with: npx jest tests/integration/seed-import.integration.test.ts
 */
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { run } from "../../src/scripts/seed-import/index";

const FIXTURE_DIR = path.resolve(__dirname, "fixtures/seed-import");

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://dev:dev123@localhost:5100/ministrosfc_test";

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DB_URL } },
});

// ── helpers ───────────────────────────────────────────────────────────────────

async function truncateSeedTables(): Promise<void> {
  // Only truncate the tables that seed-import manages, without touching auth/user data
  await prisma.$executeRawUnsafe(
    `TRUNCATE "GameParticipant", "Statistics", "Game", "Contact", "Player",
              "Tournament", "OpponentTeam" RESTART IDENTITY CASCADE`,
  );
}

// ── setup / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  await truncateSeedTables();
});

afterAll(async () => {
  await truncateSeedTables();
  await prisma.$disconnect();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("seed-import: run() against fixture CSVs", () => {
  describe("first run", () => {
    beforeAll(async () => {
      await run(["--input", FIXTURE_DIR]);
    });

    it("inserts the correct number of opponent teams", async () => {
      // Fixture has 2 different rivals: La Cocina + Los Tigres
      const count = await prisma.opponentTeam.count();
      expect(count).toBe(2);
    });

    it("inserts the correct number of tournaments", async () => {
      // Fixture has 2 tournaments: "2024 Liga" + "2024 Amistoso"
      const count = await prisma.tournament.count();
      expect(count).toBe(2);
    });

    it("inserts the correct number of players", async () => {
      // 3 players: Diego Garcia, Lucas Romero, Amigo de Pepe
      const count = await prisma.player.count();
      expect(count).toBe(3);
    });

    it("marks exactly one player as GUEST (amigo de ...)", async () => {
      const guests = await prisma.player.count({
        where: { playerType: "GUEST" },
      });
      expect(guests).toBe(1);
    });

    it("resolves SMF position to CMF", async () => {
      const diego = await prisma.player.findFirst({
        where: { name: { contains: "Diego" } },
      });
      expect(diego).not.toBeNull();
      expect(diego!.position).toBe("CMF");
    });

    it("creates a Contact record for the player with a phone number", async () => {
      const count = await prisma.contact.count();
      expect(count).toBe(1);
    });

    it("inserts the correct number of games", async () => {
      // 2 games in Historial fixture
      const count = await prisma.game.count();
      expect(count).toBe(2);
    });

    it("inserts the correct number of game participants", async () => {
      // 4 aparicion rows in fixture (3 for game 1, 1 for game 2 — Diego again)
      const count = await prisma.gameParticipant.count();
      expect(count).toBe(4);
    });

    it("sets all participant confirmationStatus to CONFIRMED", async () => {
      const unconfirmed = await prisma.gameParticipant.count({
        where: { confirmationStatus: { not: "CONFIRMED" } },
      });
      expect(unconfirmed).toBe(0);
    });

    it("stores dateOfBirth as YYYY-MM-DD string", async () => {
      const diego = await prisma.player.findFirst({
        where: { name: { contains: "Diego" } },
      });
      expect(diego!.dateOfBirth).toBe("1990-06-15");
    });
  });

  describe("second run (idempotency)", () => {
    beforeAll(async () => {
      // Run a second time — should truncate + re-insert, ending with identical counts
      await run(["--input", FIXTURE_DIR]);
    });

    it("still has exactly 2 opponent teams after re-import", async () => {
      const count = await prisma.opponentTeam.count();
      expect(count).toBe(2);
    });

    it("still has exactly 3 players after re-import", async () => {
      const count = await prisma.player.count();
      expect(count).toBe(3);
    });

    it("still has exactly 4 game participants after re-import", async () => {
      const count = await prisma.gameParticipant.count();
      expect(count).toBe(4);
    });
  });

  describe("dry-run mode", () => {
    beforeAll(async () => {
      await truncateSeedTables();
    });

    it("does not write any rows to the database", async () => {
      await run(["--input", FIXTURE_DIR, "--dry-run"]);

      const opponentTeamCount = await prisma.opponentTeam.count();
      const playerCount = await prisma.player.count();
      const gameCount = await prisma.game.count();

      expect(opponentTeamCount).toBe(0);
      expect(playerCount).toBe(0);
      expect(gameCount).toBe(0);
    });
  });
});
