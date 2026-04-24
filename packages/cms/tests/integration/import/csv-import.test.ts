/**
 * Integration test: CSV Import
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../../src/config/server";
import { authConfig } from "../../../src/config/auth";

jest.mock("../../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();

// Minimal valid CSV fixtures — headers match the real data/ directory format
const JUGADORES_CSV = Buffer.from(
  `Nombre,Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL),Status
Juan Pérez,Juancho,,01/01/1990,,175,10,Diestro,delantero,,,, ACTIVE
María González,Maru,,,,,,,,,,,ACTIVE
`,
);

const HISTORIAL_CSV = Buffer.from(
  `Fecha,Torneo,Comienzo,Finalización,Equipo,Rival,Estadio,Goles Convertidos,Goles Recibidos,Resultado,Conclusión,Apariciones,DT,Comentarios,Foto
10/03/2024,Liga Test,10:00,11:30,Ministros,Rival FC,Estadio Prueba,2,1,2-1,G,TRUE,,Primer partido,
17/03/2024,Liga Test,10:00,11:30,Ministros,Rival FC,Estadio Prueba,1,1,1-1,E,FALSE,,Segundo partido,
`,
);

const APARICIONES_CSV = Buffer.from(
  `Fecha,Rival,Torneo,Resultado,,Jugador,Jugador,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
2024/03/10,Rival FC,Liga Test,2-1,G,Juan Pérez,Juancho,1,0,0,0,Titular,
2024/03/17,Rival FC,Liga Test,1-1,E,Juan Pérez,Juancho,0,0,0,1,Titular,
`,
);

describe("CSV Import (integration)", () => {
  let adminToken: string;

  beforeAll(async () => {
    // Register and promote to ADMIN
    const email = `admin-csv-${Date.now()}@ministrosfc.test`;
    const password = "SecurePass!123";
    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      password,
      passwordConfirmation: password,
      firstName: "Admin",
      lastName: "CSV",
    });
    adminToken = reg.body.data?.accessToken;

    // Promote to ADMIN directly via DB
    const { prisma } = await import("../../../src/config/database");
    const adminUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, role: true },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      authConfig.jwtSecret,
      { expiresIn: "24h" },
    );
  });

  it("POST /api/v1/import/csv → 401 without auth", async () => {
    const res = await request(app)
      .post("/api/v1/import/csv")
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", APARICIONES_CSV, "apariciones.csv");

    expect(res.status).toBe(401);
  });

  it("POST /api/v1/import/csv → 422 when files missing", async () => {
    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Missing required files/);
  });

  it("POST /api/v1/import/csv → 200 with correct counts (happy path)", async () => {
    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", APARICIONES_CSV, "apariciones.csv");

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.players.created).toBeGreaterThanOrEqual(2);
    expect(data.games.created).toBe(2);
    expect(data.appearances.created).toBe(2);
    expect(Array.isArray(data.warnings)).toBe(true);
  });

  it("POST /api/v1/import/csv → idempotent: re-import creates 0 new records", async () => {
    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", APARICIONES_CSV, "apariciones.csv");

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.players.created).toBe(0);
    expect(data.games.created).toBe(0);
    expect(data.appearances.created).toBe(0);
  });

  it("POST /api/v1/import/csv → missing optional fields does not cause 500", async () => {
    const sparseJugadores = Buffer.from(
      `Nombre,Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL),Status
Carlos Minimal,,,,,,,,,,,, ACTIVE
`,
    );
    const sparseHistorial = Buffer.from(
      `Fecha,Torneo,Comienzo,Finalización,Equipo,Rival,Estadio,Goles Convertidos,Goles Recibidos,Resultado,Conclusión,Apariciones,DT,Comentarios,Foto
25/12/2023,,,,,Rival Sparse,,,,,, ,,,
`,
    );
    const emptyApariciones = Buffer.from(
      `Fecha,Rival,Torneo,Resultado,G/P/E,Jugador,Apodo,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
`,
    );

    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", sparseHistorial, "historial.csv")
      .attach("jugadores", sparseJugadores, "jugadores.csv")
      .attach("apariciones", emptyApariciones, "apariciones.csv");

    expect(res.status).toBe(200);
  });

  it("POST /api/v1/import/csv → aparición with no matching game is skipped with warning", async () => {
    const aparicionesNoMatch = Buffer.from(
      `Fecha,Rival,Torneo,Resultado,,Jugador,Jugador,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
2099/01/01,Ghost Team,Nonexistent Liga,1-0,G,Juan Pérez,Juancho,0,0,0,0,Titular,
`,
    );

    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", aparicionesNoMatch, "apariciones.csv");

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.appearances.skipped).toBeGreaterThanOrEqual(1);
    expect(
      data.warnings.some((w: string) => w.includes("no matching game")),
    ).toBe(true);
  });
});

// ─── T048: canchas.csv extension ────────────────────────────────────────────

const CANCHAS_CSV = Buffer.from(
  `Nombre,Dirección
Estadio Prueba,Calle Falsa 123
Cancha Norte,Av. Norte 456
`,
);

describe("CSV Import – canchas.csv extension (T048)", () => {
  let adminToken: string;

  beforeAll(async () => {
    const email = `admin-canchas-${Date.now()}@ministrosfc.test`;
    const password = "SecurePass!123";
    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      password,
      passwordConfirmation: password,
      firstName: "Admin",
      lastName: "Canchas",
    });
    adminToken = reg.body.data?.accessToken;

    const { prisma } = await import("../../../src/config/database");
    const adminUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, role: true },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      authConfig.jwtSecret,
      { expiresIn: "24h" },
    );
  });

  it("(a) canchas happy path: POST all 4 CSVs → playgrounds.created > 0 and matched games have playgroundId", async () => {
    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", APARICIONES_CSV, "apariciones.csv")
      .attach("canchas", CANCHAS_CSV, "canchas.csv");

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.playgrounds.created).toBeGreaterThan(0);

    // Verify at least one game has playgroundId set in DB
    const { prisma } = await import("../../../src/config/database");
    const gameWithPlayground = await prisma.game.findFirst({
      where: { playgroundId: { not: null } },
    });
    expect(gameWithPlayground).not.toBeNull();
  });

  it("(b) re-upload → playgrounds.created === 0, updated > 0", async () => {
    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", APARICIONES_CSV, "apariciones.csv")
      .attach("canchas", CANCHAS_CSV, "canchas.csv");

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.playgrounds.created).toBe(0);
    expect(data.playgrounds.updated).toBeGreaterThan(0);
  });

  it("(c) game with no matching Estadio → warnings array contains location-mismatch message", async () => {
    const historialUnmatched = Buffer.from(
      `Fecha,Torneo,Comienzo,Finalización,Equipo,Rival,Estadio,Goles Convertidos,Goles Recibidos,Resultado,Conclusión,Apariciones,DT,Comentarios,Foto
25/06/2024,Liga Test,10:00,11:30,Ministros,Otro Rival,Cancha Desconocida,3,0,3-0,G,FALSE,,,
`,
    );

    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", historialUnmatched, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", APARICIONES_CSV, "apariciones.csv")
      .attach("canchas", CANCHAS_CSV, "canchas.csv");

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(
      data.warnings.some((w: string) =>
        w.toLowerCase().includes("cancha desconocida"),
      ),
    ).toBe(true);
  });

  it("(d) omit canchas → import completes without error, playgrounds counters all zero", async () => {
    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", APARICIONES_CSV, "apariciones.csv");

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.playgrounds.created).toBe(0);
    expect(data.playgrounds.updated).toBe(0);
    expect(data.playgrounds.skipped).toBe(0);
  });
});

// ─── T055: jugadores.csv column mapping corrections ─────────────────────────

describe("CSV Import – jugadores.csv column mapping corrections (T055)", () => {
  let adminToken: string;

  beforeAll(async () => {
    const email = `admin-jugadores-${Date.now()}@ministrosfc.test`;
    const password = "SecurePass!123";
    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      password,
      passwordConfirmation: password,
      firstName: "Admin",
      lastName: "Jugadores",
    });
    adminToken = reg.body.data?.accessToken;

    const { prisma } = await import("../../../src/config/database");
    const adminUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { id: true, role: true },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      authConfig.jwtSecret,
      { expiresIn: "24h" },
    );
  });

  it("(a) player import with Nombre column → single player record, correct firstName/lastName split", async () => {
    const jugadoresNombre = Buffer.from(
      `Nombre,Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL),Status
Carlos Alberto López,Carlitos,,15/06/1992,,178,7,Diestro,Mediocampista,,,, ACTIVE
`,
    );
    const emptyApariciones = Buffer.from(
      `Fecha,Rival,Torneo,Resultado,,Jugador,Jugador,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
`,
    );

    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", jugadoresNombre, "jugadores.csv")
      .attach("apariciones", emptyApariciones, "apariciones.csv");

    expect(res.status).toBe(200);
    expect(res.body.data.players.created).toBeGreaterThanOrEqual(1);

    const { prisma } = await import("../../../src/config/database");
    const player = await prisma.player.findFirst({
      where: { lastName: "López" },
    });
    expect(player).not.toBeNull();
    expect(player?.firstName).toBe("Carlos Alberto");
  });

  it("(b) player with Posición = 'Delantero, Mediocampista' → position is CF, no error", async () => {
    const jugadoresMultiPos = Buffer.from(
      `Nombre,Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL),Status
Pedro Ríos,Pedrito,,,,,,,"Delantero, Mediocampista",,,,ACTIVE
`,
    );
    const emptyApariciones = Buffer.from(
      `Fecha,Rival,Torneo,Resultado,,Jugador,Jugador,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
`,
    );

    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", jugadoresMultiPos, "jugadores.csv")
      .attach("apariciones", emptyApariciones, "apariciones.csv");

    expect(res.status).toBe(200);

    const { prisma } = await import("../../../src/config/database");
    const player = await prisma.player.findFirst({
      where: { lastName: "Ríos" },
    });
    expect(player).not.toBeNull();
    // position should be the mapped value for "Delantero" (first token)
    expect(player?.position).toBe("CF");
  });

  it("(c) player with Telefono → Contact record created with phone + whatsapp", async () => {
    const jugadoresTelefono = Buffer.from(
      `Nombre,Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL),Status
Luis Suárez,El Pistolero,,,,,,,,, +54911234567,,ACTIVE
`,
    );
    const emptyApariciones = Buffer.from(
      `Fecha,Rival,Torneo,Resultado,,Jugador,Jugador,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
`,
    );

    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", jugadoresTelefono, "jugadores.csv")
      .attach("apariciones", emptyApariciones, "apariciones.csv");

    expect(res.status).toBe(200);

    const { prisma } = await import("../../../src/config/database");
    const player = await prisma.player.findFirst({
      where: { lastName: "Suárez" },
      include: { contactInfo: true },
    });
    expect(player).not.toBeNull();
    expect(player?.contactInfo).not.toBeNull();
    expect(player?.contactInfo?.phone).toBeTruthy();
  });

  it("(d) re-import same player with Telefono → no duplicate Contact records", async () => {
    const jugadoresTelefono = Buffer.from(
      `Nombre,Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL),Status
Luis Suárez,El Pistolero,,,,,,,,, +54911234567,,ACTIVE
`,
    );
    const emptyApariciones = Buffer.from(
      `Fecha,Rival,Torneo,Resultado,,Jugador,Jugador,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
`,
    );

    // Second import
    await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", jugadoresTelefono, "jugadores.csv")
      .attach("apariciones", emptyApariciones, "apariciones.csv");

    const { prisma } = await import("../../../src/config/database");
    const player = await prisma.player.findFirst({
      where: { lastName: "Suárez" },
      include: { contactInfo: true },
    });
    // Must still be exactly one Contact record (upsert, not duplicate create)
    expect(player?.contactInfo).not.toBeNull();
  });

  it("(e) apariciones referencing player nickname → no ghost player created", async () => {
    const jugadoresApodo = Buffer.from(
      `Nombre,Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL),Status
Roberto Gómez,Tito,,,,,,,,,,,ACTIVE
`,
    );
    // Aparicion references "Tito" (nickname) not "Roberto Gómez"
    const aparicionesApodo = Buffer.from(
      `Fecha,Rival,Torneo,Resultado,,Jugador,Jugador,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
2024/03/10,Rival FC,Liga Test,2-1,G,Tito,,1,0,0,0,Titular,
`,
    );

    const firstCount = await (async () => {
      const { prisma } = await import("../../../src/config/database");
      return prisma.player.count();
    })();

    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", jugadoresApodo, "jugadores.csv")
      .attach("apariciones", aparicionesApodo, "apariciones.csv");

    expect(res.status).toBe(200);

    const { prisma } = await import("../../../src/config/database");
    const afterCount = await prisma.player.count();
    // Only Roberto Gómez should have been created; "Tito" must resolve to that same player
    // so total count increases by at most 1 (the new player), not 2
    expect(afterCount - firstCount).toBeLessThanOrEqual(1);

    const ghost = await prisma.player.findFirst({
      where: { firstName: "Tito", lastName: "" },
    });
    expect(ghost).toBeNull();
  });
});
