import express from "express";
import request from "supertest";
import { z } from "zod";
import { globalErrorHandler } from "../../src/middleware/error-handler";

describe("globalErrorHandler", () => {
  it("returns Spanish details for Zod validation errors", async () => {
    const app = express();
    app.use(express.json());
    app.post("/validate", (req, res) => {
      z.object({ name: z.string().min(3) }).parse(req.body);
      res.sendStatus(204);
    });
    app.use(globalErrorHandler);

    const response = await request(app)
      .post("/validate")
      .send({ name: "ab" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: "VALIDATION_ERROR",
      message: "Debe tener al menos 3 caracteres.",
      statusCode: 400,
    });
  });

  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it.each(["production", "development"])(
    "returns a generic Spanish message for unexpected 500 errors in %s",
    async (nodeEnv) => {
      process.env.NODE_ENV = nodeEnv;
      const app = express();
      app.get("/error", (_req, _res, next) => {
        next(new Error("sensitive implementation detail"));
      });
      app.use(globalErrorHandler);

      const response = await request(app).get("/error");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        code: "INTERNAL_ERROR",
        message: "Error interno del servidor.",
        statusCode: 500,
      });
    },
  );
});
