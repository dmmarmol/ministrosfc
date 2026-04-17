/**
 * Integration test: CSV Import
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import { createApp } from "../../../src/config/server";

jest.mock("../../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();

// Minimal valid CSV fixtures
const JUGADORES_CSV = Buffer.from(
  `Jugador (2),Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL)
Juan Pérez,Juancho,,01/01/1990,,175,10,Diestro,delantero,,
María González,Maru,,,,,,,,
`,
);

const HISTORIAL_CSV = Buffer.from(
  `Fecha,Torneo,Comienzo,Finalización,Equipo,Rival,Estadio,Goles Convertidos,Goles Recibidos,Resultado,Conclusión,Apariciones,DT,Comentarios,Foto
10/03/2024,Liga Test,10:00,11:30,Ministros,Rival FC,Estadio Prueba,2,1,2-1,G,TRUE,,Primer partido,
17/03/2024,Liga Test,10:00,11:30,Ministros,Rival FC,Estadio Prueba,1,1,1-1,E,FALSE,,Segundo partido,
`,
);

const APARICIONES_CSV = Buffer.from(
  `Fecha,Rival,Torneo,Resultado,G/P/E,Jugador,Apodo,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
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
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    // Re-login to get ADMIN token
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password });
    adminToken = login.body.data?.accessToken;
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
      `Jugador (1),Apodo,Invitado Por,Nacimiento,Edad,Altura,Numero,Pie,Posición,DNI,Telefono,Imagen (URL)
Carlos Minimal,,,,,,,,,,
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
      `Fecha,Rival,Torneo,Resultado,G/P/E,Jugador,Apodo,Goles,Amarilla,Roja,Asistencia,Titular/Suplente,Comentarios
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
