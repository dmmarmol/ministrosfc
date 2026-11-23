import express from "express";
import request from "supertest";
import type { NextFunction, Request, Response } from "express";
import { gameRouter } from "../../src/routes/games";
import { tournamentRouter } from "../../src/routes/tournaments";
import { buildGames } from "../../src/scripts/seed-import/transformers/games";
import { buildTournaments } from "../../src/scripts/seed-import/transformers/tournaments";
import type { ParsedHistorialRow } from "../../src/scripts/seed-import/parsers/parseHistorial";

jest.mock("../../src/middleware/auth", () => ({
  authenticate: (_req: Request, _res: Response, next: NextFunction) => next(),
  optionalAuthenticate: (
    _req: Request,
    _res: Response,
    next: NextFunction,
  ) => next(),
}));

jest.mock("../../src/middleware/rbac", () => ({
  requireRole: () =>
    (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const app = express();
app.use(express.json());
app.use("/api/v1/games", gameRouter);
app.use("/api/v1/tournaments", tournamentRouter);

function importRow(tournament: string): ParsedHistorialRow {
  return {
    raw: {
      Fecha: "15/03/2024",
      Torneo: tournament,
      Comienzo: "",
      Finalización: "",
      Equipo: "Ministros FC",
      Rival: "La Cocina",
      Estadio: "",
      "Goles Convertidos": "",
      "Goles Recibidos": "",
      Resultado: "",
      Conclusión: "",
      Apariciones: "",
      DT: "",
      Comentarios: "",
      Foto: "",
    },
    parsedDate: new Date("2024-03-15T00:00:00.000Z"),
  };
}

describe("canonical competition type contract", () => {
  it("rejects SEASON in game creation requests", async () => {
    const response = await request(app)
      .post("/api/v1/games")
      .send({
        date: "2026-11-15T16:00:00.000Z",
        opponentTeamId: "123e4567-e89b-42d3-a456-426614174000",
        competitionType: "SEASON",
      });

    expect(response.status).toBe(400);
  });

  it("rejects SEASON in tournament creation requests", async () => {
    const response = await request(app)
      .post("/api/v1/tournaments")
      .send({
        name: "Season Cup",
        competitionType: "SEASON",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });

    expect(response.status).toBe(400);
  });

  it.each(["Torneo Apertura", "Torneo Clausura"])(
    "maps legacy %s game and tournament imports to LEAGUE",
    (tournament) => {
      const row = importRow(tournament);
      const games = buildGames([row], { "La Cocina": "team-1" }, {});
      const tournaments = buildTournaments([row]);

      expect(games.data[0]?.competitionType).toBe("LEAGUE");
      expect(tournaments.data[0]?.competitionType).toBe("LEAGUE");
    },
  );
});
