import {
  PrismaClient,
  Role,
  PlayerType,
  PlayerStatus,
  Position,
  Foot,
  GameStatus,
  CompetitionType,
  ConfirmationStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  // ─── Users ───────────────────────────────────────────────────────────────────
  const [adminUser, editorUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@ministrosfc.com" },
      update: {},
      create: {
        email: "admin@ministrosfc.com",
        passwordHash: await bcrypt.hash("Admin1234!", 12),
        name: "Admin User",
        role: Role.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: "editor@ministrosfc.com" },
      update: {},
      create: {
        email: "editor@ministrosfc.com",
        passwordHash: await bcrypt.hash("Editor1234!", 12),
        name: "Editor User",
        role: Role.EDITOR,
      },
    }),
  ]);

  console.log(`  ✓ Users: ${adminUser.email}, ${editorUser.email}`);

  // ─── Team Info ────────────────────────────────────────────────────────────────
  await prisma.teamInfo.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ministros F.C.",
      description: "Our football club.",
      foundedYear: 2010,
      colors: "Gold and Black",
      location: "Buenos Aires, Argentina",
    },
  });

  console.log("  ✓ Team info seeded");

  // ─── Registered Players ───────────────────────────────────────────────────────
  const playerData = [
    {
      name: "Diego Martín",
      nickname: "Diegui",
      position: Position.CMF,
      jerseyNumber: 10,
      dominantFoot: Foot.RIGHT,
    },
    {
      name: "Carlos López",
      nickname: "Carlitos",
      position: Position.CF,
      jerseyNumber: 9,
      dominantFoot: Foot.LEFT,
    },
    {
      name: "Martín García",
      nickname: "Gafo",
      position: Position.CB,
      jerseyNumber: 4,
      dominantFoot: Foot.RIGHT,
    },
    {
      name: "Juan Ramírez",
      nickname: "Juampi",
      position: Position.GK,
      jerseyNumber: 1,
      dominantFoot: Foot.RIGHT,
    },
    {
      name: "Pablo Torres",
      nickname: "Pablito",
      position: Position.CB,
      jerseyNumber: 5,
      dominantFoot: Foot.RIGHT,
    },
    {
      name: "Héctor Muñoz",
      nickname: "Hectorcito",
      position: Position.CMF,
      jerseyNumber: 8,
      dominantFoot: Foot.LEFT,
    },
    {
      name: "Andrés Vega",
      nickname: "Andresito",
      position: Position.CF,
      jerseyNumber: 11,
      dominantFoot: Foot.RIGHT,
    },
    {
      name: "Federico Romero",
      nickname: "Fede",
      position: Position.CB,
      jerseyNumber: 3,
      dominantFoot: Foot.RIGHT,
    },
    {
      name: "Roberto Sánchez",
      nickname: "Rober",
      position: Position.CMF,
      jerseyNumber: 6,
      dominantFoot: Foot.RIGHT,
    },
    {
      name: "Luis Herrera",
      nickname: "Lucho",
      position: Position.CF,
      jerseyNumber: 7,
      dominantFoot: Foot.AMBIDEXTROUS,
    },
  ];

  const players = await Promise.all(
    playerData.map((p) =>
      prisma.player.upsert({
        where: {
          id: `20000000-0000-4000-8000-${p.jerseyNumber.toString().padStart(12, "0")}`,
        },
        update: {},
        create: {
          id: `20000000-0000-4000-8000-${p.jerseyNumber.toString().padStart(12, "0")}`,
          ...p,
          playerType: PlayerType.REGISTERED,
          status: PlayerStatus.ACTIVE,
        },
      }),
    ),
  );

  // Link first player to a player user account
  const firstPlayer = players[0];
  if (!firstPlayer) throw new Error("No players seeded");
  const playerUser = await prisma.user.upsert({
    where: { email: "player@ministrosfc.com" },
    update: {},
    create: {
      email: "player@ministrosfc.com",
      passwordHash: await bcrypt.hash("Player1234!", 12),
      name: firstPlayer.name,
      role: Role.PLAYER,
      playerId: firstPlayer.id,
    },
  });

  console.log(
    `  ✓ Players: ${players.length} registered, user: ${playerUser.email}`,
  );

  // ─── Opponent Teams ───────────────────────────────────────────────────────────
  const [teamRivers, teamBoca, teamIndependiente] = await Promise.all([
    prisma.opponentTeam.upsert({
      where: { name: "Deportivo Riveros" },
      update: {},
      create: {
        name: "Deportivo Riveros",
        colors: "Red and White",
        city: "Buenos Aires",
      },
    }),
    prisma.opponentTeam.upsert({
      where: { name: "Club Atlético Norte" },
      update: {},
      create: {
        name: "Club Atlético Norte",
        colors: "Blue and Yellow",
        city: "Buenos Aires",
      },
    }),
    prisma.opponentTeam.upsert({
      where: { name: "Los Halcones FC" },
      update: {},
      create: {
        name: "Los Halcones FC",
        colors: "Green and White",
        city: "Córdoba",
      },
    }),
  ]);

  console.log("  ✓ Opponent teams seeded");

  // ─── Tournament ───────────────────────────────────────────────────────────────
  const tournament = await prisma.tournament.upsert({
    where: { id: "10000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "10000000-0000-4000-8000-000000000001",
      name: "Liga Barrial Primavera 2026",
      description: "Spring 2026 neighborhood league",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-06-30"),
      competitionType: CompetitionType.LEAGUE,
    },
  });

  console.log(`  ✓ Tournament: ${tournament.name}`);

  // ─── Games ────────────────────────────────────────────────────────────────────
  const game1 = await prisma.game.upsert({
    where: { id: "30000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "30000000-0000-4000-8000-000000000001",
      opponentTeamId: teamRivers.id,
      tournamentId: tournament.id,
      date: new Date("2026-03-15T18:00:00Z"),
      location: "Cancha Municipal Norte",
      competitionType: CompetitionType.LEAGUE,
      status: GameStatus.COMPLETED,
      homeTeamScore: 3,
      awayTeamScore: 1,
    },
  });

  const game2 = await prisma.game.upsert({
    where: { id: "30000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "30000000-0000-4000-8000-000000000002",
      opponentTeamId: teamBoca.id,
      tournamentId: tournament.id,
      date: new Date("2026-03-22T18:00:00Z"),
      location: "Estadio Barrial",
      competitionType: CompetitionType.LEAGUE,
      status: GameStatus.COMPLETED,
      homeTeamScore: 1,
      awayTeamScore: 1,
    },
  });

  await Promise.all([
    prisma.game.upsert({
      where: { id: "30000000-0000-4000-8000-000000000003" },
      update: {},
      create: {
        id: "30000000-0000-4000-8000-000000000003",
        opponentTeamId: teamIndependiente.id,
        tournamentId: tournament.id,
        date: new Date("2026-04-05T17:00:00Z"),
        location: "Cancha Municipal Norte",
        competitionType: CompetitionType.LEAGUE,
        status: GameStatus.SCHEDULED,
      },
    }),
    prisma.game.upsert({
      where: { id: "30000000-0000-4000-8000-000000000004" },
      update: {},
      create: {
        id: "30000000-0000-4000-8000-000000000004",
        opponentTeamId: teamRivers.id,
        date: new Date("2026-04-12T18:00:00Z"),
        location: "Cancha del Barrio Sur",
        competitionType: CompetitionType.FRIENDLY,
        status: GameStatus.SCHEDULED,
      },
    }),
    prisma.game.upsert({
      where: { id: "30000000-0000-4000-8000-000000000005" },
      update: {},
      create: {
        id: "30000000-0000-4000-8000-000000000005",
        opponentTeamId: teamBoca.id,
        tournamentId: tournament.id,
        date: new Date("2026-04-19T18:00:00Z"),
        location: "Estadio Barrial",
        competitionType: CompetitionType.LEAGUE,
        status: GameStatus.SCHEDULED,
      },
    }),
  ]);

  console.log("  ✓ Games seeded (2 completed, 3 scheduled)");

  // ─── Game Participants (for completed games) ──────────────────────────────────
  await Promise.all(
    players.slice(0, 7).map((p) =>
      prisma.gameParticipant.upsert({
        where: { gameId_playerId: { gameId: game1.id, playerId: p.id } },
        update: {},
        create: {
          gameId: game1.id,
          playerId: p.id,
          confirmationStatus: ConfirmationStatus.CONFIRMED,
          confirmedAt: new Date(),
          goalsScored: p.jerseyNumber === 9 ? 2 : p.jerseyNumber === 10 ? 1 : 0,
          assists: p.jerseyNumber === 10 ? 1 : p.jerseyNumber === 8 ? 1 : 0,
          minutesPlayed: 90,
        },
      }),
    ),
  );

  await Promise.all(
    players.slice(0, 7).map((p) =>
      prisma.gameParticipant.upsert({
        where: { gameId_playerId: { gameId: game2.id, playerId: p.id } },
        update: {},
        create: {
          gameId: game2.id,
          playerId: p.id,
          confirmationStatus: ConfirmationStatus.CONFIRMED,
          confirmedAt: new Date(),
          goalsScored: p.jerseyNumber === 10 ? 1 : 0,
          assists: 0,
          minutesPlayed: 90,
        },
      }),
    ),
  );

  console.log("  ✓ Game participants seeded");
  console.log("\n✅ Database seeded successfully!");
  console.log("\nSeed credentials:");
  console.log("  Admin:  admin@ministrosfc.com  / Admin1234!");
  console.log("  Editor: editor@ministrosfc.com / Editor1234!");
  console.log("  Player: player@ministrosfc.com / Player1234!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
