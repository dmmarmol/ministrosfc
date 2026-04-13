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

  // ─── Wipe existing data (reverse dependency order) ───────────────────────────
  await prisma.gameParticipant.deleteMany();
  await prisma.statistics.deleteMany();
  await prisma.game.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.player.deleteMany();
  await prisma.opponentTeam.deleteMany();
  await prisma.teamInfo.deleteMany();
  console.log("  ✓ Cleared existing data");

  // ─── Users ───────────────────────────────────────────────────────────────────
  const [adminUser, editorUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@ministrosfc.com",
        passwordHash: await bcrypt.hash("Admin1234!", 12),
        firstName: "Admin",
        lastName: "User",
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: "editor@ministrosfc.com",
        passwordHash: await bcrypt.hash("Editor1234!", 12),
        firstName: "Editor",
        lastName: "User",
        role: Role.EDITOR,
      },
    }),
  ]);

  console.log(`  ✓ Users: ${adminUser.email}, ${editorUser.email}`);

  // ─── Team Info ────────────────────────────────────────────────────────────────
  await prisma.teamInfo.create({
    data: {
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
      firstName: "Juan",
      lastName: "Ramírez",
      nickname: "Juampi",
      position: Position.GK,
      jerseyNumber: 1,
      dominantFoot: Foot.RIGHT,
    },
    {
      firstName: "Federico",
      lastName: "Romero",
      nickname: "Fede",
      position: Position.CB,
      jerseyNumber: 3,
      dominantFoot: Foot.RIGHT,
    },
    {
      firstName: "Martín",
      lastName: "García",
      nickname: "Gafo",
      position: Position.CB,
      jerseyNumber: 4,
      dominantFoot: Foot.RIGHT,
    },
    {
      firstName: "Pablo",
      lastName: "Torres",
      nickname: "Pablito",
      position: Position.CB,
      jerseyNumber: 5,
      dominantFoot: Foot.RIGHT,
    },
    {
      firstName: "Roberto",
      lastName: "Sánchez",
      nickname: "Rober",
      position: Position.CMF,
      jerseyNumber: 6,
      dominantFoot: Foot.RIGHT,
    },
    {
      firstName: "Luis",
      lastName: "Herrera",
      nickname: "Lucho",
      position: Position.CF,
      jerseyNumber: 7,
      dominantFoot: Foot.AMBIDEXTROUS,
    },
    {
      firstName: "Héctor",
      lastName: "Muñoz",
      nickname: "Hectorcito",
      position: Position.CMF,
      jerseyNumber: 8,
      dominantFoot: Foot.LEFT,
    },
    {
      firstName: "Carlos",
      lastName: "López",
      nickname: "Carlitos",
      position: Position.CF,
      jerseyNumber: 9,
      dominantFoot: Foot.LEFT,
    },
    {
      firstName: "Diego",
      lastName: "Martín",
      nickname: "Diegui",
      position: Position.CMF,
      jerseyNumber: 10,
      dominantFoot: Foot.RIGHT,
    },
    {
      firstName: "Andrés",
      lastName: "Vega",
      nickname: "Andresito",
      position: Position.CF,
      jerseyNumber: 11,
      dominantFoot: Foot.RIGHT,
    },
  ];

  const players = await Promise.all(
    playerData.map((p) =>
      prisma.player.create({
        data: {
          ...p,
          playerType: PlayerType.REGISTERED,
          status: PlayerStatus.ACTIVE,
        },
      }),
    ),
  );

  // Link #10 (Diego Martín) to the player user account
  const playerUser10 = players.find((p) => p.jerseyNumber === 10);
  if (!playerUser10) throw new Error("Player #10 not found");
  await prisma.user.create({
    data: {
      email: "player@ministrosfc.com",
      passwordHash: await bcrypt.hash("Player1234!", 12),
      firstName: playerUser10.firstName,
      lastName: playerUser10.lastName,
      role: Role.PLAYER,
      playerId: playerUser10.id,
    },
  });

  console.log(`  ✓ Players: ${players.length} registered`);

  // ─── Opponent Teams ───────────────────────────────────────────────────────────
  const [teamRivers, teamBoca, teamIndependiente] = await Promise.all([
    prisma.opponentTeam.create({
      data: {
        name: "Deportivo Riveros",
        colors: "Red and White",
        city: "Buenos Aires",
      },
    }),
    prisma.opponentTeam.create({
      data: {
        name: "Club Atlético Norte",
        colors: "Blue and Yellow",
        city: "Buenos Aires",
      },
    }),
    prisma.opponentTeam.create({
      data: {
        name: "Los Halcones FC",
        colors: "Green and White",
        city: "Córdoba",
      },
    }),
  ]);
  console.log("  ✓ Opponent teams seeded");

  // ─── Tournament ───────────────────────────────────────────────────────────────
  const tournament = await prisma.tournament.create({
    data: {
      name: "Liga Barrial Primavera 2026",
      description: "Spring 2026 neighborhood league",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-06-30"),
      competitionType: CompetitionType.LEAGUE,
    },
  });
  console.log(`  ✓ Tournament: ${tournament.name}`);

  // ─── Games ────────────────────────────────────────────────────────────────────
  const game1 = await prisma.game.create({
    data: {
      opponentTeamId: teamRivers.id,
      tournamentId: tournament.id,
      date: new Date("2026-03-15T18:00:00Z"),
      endDate: new Date("2026-03-15T19:40:00Z"),
      slug: "2026-03-15-deportivo-riveros",
      location: "Cancha Municipal Norte",
      competitionType: CompetitionType.LEAGUE,
      status: GameStatus.COMPLETED,
      homeTeamScore: 3,
      awayTeamScore: 1,
    },
  });

  const game2 = await prisma.game.create({
    data: {
      opponentTeamId: teamBoca.id,
      tournamentId: tournament.id,
      date: new Date("2026-03-22T18:00:00Z"),
      endDate: new Date("2026-03-22T19:40:00Z"),
      slug: "2026-03-22-club-atletico-norte",
      location: "Estadio Barrial",
      competitionType: CompetitionType.LEAGUE,
      status: GameStatus.COMPLETED,
      homeTeamScore: 1,
      awayTeamScore: 1,
    },
  });

  await Promise.all([
    prisma.game.create({
      data: {
        opponentTeamId: teamIndependiente.id,
        tournamentId: tournament.id,
        date: new Date("2026-04-05T17:00:00Z"),
        endDate: new Date("2026-04-05T18:40:00Z"),
        slug: "2026-04-05-los-halcones-fc",
        location: "Cancha Municipal Norte",
        competitionType: CompetitionType.LEAGUE,
        status: GameStatus.SCHEDULED,
      },
    }),
    prisma.game.create({
      data: {
        opponentTeamId: teamRivers.id,
        date: new Date("2026-04-12T18:00:00Z"),
        endDate: new Date("2026-04-12T19:40:00Z"),
        slug: "2026-04-12-deportivo-riveros",
        location: "Cancha del Barrio Sur",
        competitionType: CompetitionType.FRIENDLY,
        status: GameStatus.SCHEDULED,
      },
    }),
    prisma.game.create({
      data: {
        opponentTeamId: teamBoca.id,
        tournamentId: tournament.id,
        date: new Date("2026-04-19T18:00:00Z"),
        endDate: new Date("2026-04-19T19:40:00Z"),
        slug: "2026-04-19-club-atletico-norte",
        location: "Estadio Barrial",
        competitionType: CompetitionType.LEAGUE,
        status: GameStatus.SCHEDULED,
      },
    }),
  ]);
  console.log("  ✓ Games seeded (2 completed, 3 scheduled)");

  // ─── Game Participants (for completed games) ──────────────────────────────────
  const squad = players.slice(0, 7);
  await Promise.all(
    squad.map((p) =>
      prisma.gameParticipant.create({
        data: {
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
    squad.map((p) =>
      prisma.gameParticipant.create({
        data: {
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
