import * as path from "path";
import * as fs from "fs";
import { PrismaClient } from "@prisma/client";
import { parseHistorial } from "./parsers/parseHistorial";
import { parseJugadores } from "./parsers/parseJugadores";
import { parseApariciones } from "./parsers/parseApariciones";
import { buildOpponentTeams } from "./transformers/opponentTeams";
import { buildTournaments } from "./transformers/tournaments";
import { buildPlayers } from "./transformers/players";
import { buildGames } from "./transformers/games";
import { buildGameParticipants } from "./transformers/gameParticipants";
import { truncateAll } from "./db/truncate";
import { insertAll } from "./db/insert";

const DEFAULT_INPUT_DIR = path.resolve(
  __dirname,
  "../../../../data/imports"
);

interface CliFlags {
  dryRun: boolean;
  inputDir: string;
  verbose: boolean;
}

function parseFlags(args: string[]): CliFlags {
  const flags: CliFlags = {
    dryRun: false,
    inputDir: DEFAULT_INPUT_DIR,
    verbose: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--verbose") flags.verbose = true;
    else if (arg === "--input" && args[i + 1]) {
      const next = args[++i];
      if (next) flags.inputDir = path.resolve(next);
    }
  }
  return flags;
}

function requireFile(dir: string, name: string): string {
  const full = path.join(dir, name);
  if (!fs.existsSync(full)) {
    process.stderr.write(`[error] Missing required file: ${full}\n`);
    process.exit(1);
  }
  return fs.readFileSync(full, "utf-8");
}

export async function run(args: string[] = process.argv.slice(2)): Promise<void> {
  const flags = parseFlags(args);
  const startTime = Date.now();

  process.stdout.write(
    `[import] Starting import from ${flags.inputDir}/\n`
  );

  // ── 1. Read CSV files ────────────────────────────────────────────────────────
  const historialCsv = requireFile(flags.inputDir, "Historial.csv");
  const jugadoresCsv = requireFile(flags.inputDir, "Jugadores.csv");
  const aparicionesCsv = requireFile(flags.inputDir, "Apariciones.csv");

  // ── 2. Parse ─────────────────────────────────────────────────────────────────
  let historialRows, jugadoresRows, aparicionesRows;
  try {
    historialRows = parseHistorial(historialCsv);
    jugadoresRows = parseJugadores(jugadoresCsv);
    aparicionesRows = parseApariciones(aparicionesCsv);
  } catch (err) {
    process.stderr.write(`[error] CSV parsing failed: ${String(err)}\n`);
    process.exit(2);
  }

  process.stdout.write(
    `[import] Reading Historial.csv... ${historialRows.length} rows\n`
  );
  process.stdout.write(
    `[import] Reading Jugadores.csv... ${jugadoresRows.length} rows\n`
  );
  process.stdout.write(
    `[import] Reading Apariciones.csv... ${aparicionesRows.length} rows\n\n`
  );

  // ── 3. Transform ─────────────────────────────────────────────────────────────
  const { data: opponentTeams, opponentTeamMap } = buildOpponentTeams(historialRows);
  const { data: tournaments, tournamentMap } = buildTournaments(historialRows);
  const {
    players,
    contacts,
    playerMapByName,
    playerMapByNickname,
  } = buildPlayers(jugadoresRows);
  const { data: games, gameMap } = buildGames(
    historialRows,
    opponentTeamMap,
    tournamentMap
  );
  const { data: gameParticipants, skipped } = buildGameParticipants(
    aparicionesRows,
    gameMap,
    playerMapByName,
    playerMapByNickname
  );

  process.stdout.write(
    `[import] Derived: ${opponentTeams.length} unique opponent teams\n`
  );
  process.stdout.write(
    `[import] Derived: ${tournaments.length} unique tournaments\n`
  );

  if (flags.verbose) {
    skipped.forEach((s) =>
      process.stderr.write(
        `[warn] Skipped row (${s.reason}): game="${s.gameKey}" player="${s.playerName}"\n`
      )
    );
  }

  // ── 4. Dry-run: print plan and exit ──────────────────────────────────────────
  if (flags.dryRun) {
    process.stdout.write(`\n[dry-run] Parsing all files...\n`);
    process.stdout.write(
      `[dry-run] OpponentTeams:      ${opponentTeams.length} records would be inserted\n`
    );
    process.stdout.write(
      `[dry-run] Tournaments:        ${tournaments.length} records would be inserted\n`
    );
    process.stdout.write(
      `[dry-run] Players:            ${players.length} records would be inserted\n`
    );
    process.stdout.write(
      `[dry-run] Contacts:           ${contacts.length} records would be inserted\n`
    );
    process.stdout.write(
      `[dry-run] Games:              ${games.length} records would be inserted\n`
    );
    process.stdout.write(
      `[dry-run] GameParticipants:   ${gameParticipants.length} records would be inserted` +
        (skipped.length > 0 ? ` (${skipped.length} would be skipped)` : "") +
        `\n`
    );
    process.stdout.write(`[dry-run] No database writes performed.\n`);
    return;
  }

  // ── 5. Persist ───────────────────────────────────────────────────────────────
  const prisma = new PrismaClient();

  try {
    process.stdout.write(`[import] Truncating tables...\n\n`);

    await prisma.$transaction(
      async (tx) => {
        await truncateAll(tx);

        process.stdout.write(
          `[import] Inserting OpponentTeams... `
        );
        await insertAll(tx, {
          opponentTeams,
          tournaments,
          players,
          contacts,
          games,
          gameParticipants,
        });
      },
      { timeout: 60_000, maxWait: 5_000 }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    process.stdout.write(
      `[import] Inserting OpponentTeams... ✓ ${opponentTeams.length} inserted\n`
    );
    process.stdout.write(
      `[import] Inserting Tournaments...   ✓ ${tournaments.length} inserted\n`
    );
    process.stdout.write(
      `[import] Inserting Players...       ✓ ${players.length} inserted\n`
    );
    process.stdout.write(
      `[import] Inserting Contacts...      ✓ ${contacts.length} inserted\n`
    );
    process.stdout.write(
      `[import] Inserting Games...         ✓ ${games.length} inserted\n`
    );
    process.stdout.write(
      `[import] Inserting GameParticipants... ✓ ${gameParticipants.length} inserted` +
        (skipped.length > 0 ? ` (${skipped.length} skipped)` : "") +
        `\n`
    );
    process.stdout.write(`\n[import] ✅ Import complete in ${elapsed}s\n`);
  } catch (err) {
    const msg = String(err);
    if (
      msg.includes("connect") ||
      msg.includes("connection") ||
      msg.includes("ECONNREFUSED")
    ) {
      process.stderr.write(`[error] Database connection error: ${msg}\n`);
      process.exit(3);
    }
    process.stderr.write(`[error] Database transaction error: ${msg}\n`);
    process.exit(4);
  } finally {
    await prisma.$disconnect();
  }
}
