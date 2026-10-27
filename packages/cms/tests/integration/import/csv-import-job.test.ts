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

describe("Durable CSV import jobs", () => {
  let adminToken: string;

  beforeAll(async () => {
    const email = `job-admin-${Date.now()}@ministrosfc.test`;
    const password = "SecurePass!123";
    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      password,
      passwordConfirmation: password,
      firstName: "Admin",
      lastName: "Imports",
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

  it(
    "POST /api/v1/import/csv creates a durable import job and GET returns final state",
    async () => {
    const res = await request(app)
      .post("/api/v1/import/csv")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("historial", HISTORIAL_CSV, "historial.csv")
      .attach("jugadores", JUGADORES_CSV, "jugadores.csv")
      .attach("apariciones", APARICIONES_CSV, "apariciones.csv");

    expect(res.status).toBe(202);
    expect(res.body.data.jobId).toBeTruthy();
    expect(res.body.data.status).toBe("queued");

    const jobId = res.body.data.jobId;
    let finalJob: any;

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const poll = await request(app)
        .get(`/api/v1/import/jobs/${jobId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(poll.status).toBe(200);
      finalJob = poll.body.data;
      if (finalJob.status === "completed" || finalJob.status === "failed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    expect(["completed", "failed"]).toContain(finalJob.status);
    expect(finalJob.result || finalJob.error).toBeTruthy();
  }, 20000);
});
