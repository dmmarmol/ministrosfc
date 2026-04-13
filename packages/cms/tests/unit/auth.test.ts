import { authenticate, optionalAuthenticate } from "../../src/middleware/auth";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Use the same secret as env-setup.js so jwt.verify in the middleware validates correctly
const SECRET =
  "test-secret-key-at-least-64-chars-long-for-test-suite-only-do-not-use";

function makeValidToken(
  payload = { userId: "user-1", role: "PLAYER" as const },
) {
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
}

function makeExpiredToken() {
  return jwt.sign({ userId: "user-1", role: "PLAYER" }, SECRET, {
    expiresIn: -1,
  });
}

function makeReq(authHeader?: string): Partial<Request> {
  return {
    headers: { authorization: authHeader },
  } as Partial<Request>;
}

function makeRes(): Partial<Response> {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("authenticate", () => {
  it("calls next() and sets req.user when token is valid", () => {
    const req = makeReq(`Bearer ${makeValidToken()}`) as Request;
    const res = makeRes() as Response;
    const next: NextFunction = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user).toMatchObject({
      userId: "user-1",
      role: "PLAYER",
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is absent", () => {
    const req = makeReq(undefined) as Request;
    const res = makeRes() as Response;
    const next: NextFunction = jest.fn();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("optionalAuthenticate", () => {
  it("sets req.user and calls next() when token is valid", () => {
    const req = makeReq(`Bearer ${makeValidToken()}`) as Request;
    const res = makeRes() as Response;
    const next: NextFunction = jest.fn();

    optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user).toMatchObject({
      userId: "user-1",
      role: "PLAYER",
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() without error when Authorization header is absent", () => {
    const req = makeReq(undefined) as Request;
    const res = makeRes() as Response;
    const next: NextFunction = jest.fn();

    optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() without error when token is expired", () => {
    const req = makeReq(`Bearer ${makeExpiredToken()}`) as Request;
    const res = makeRes() as Response;
    const next: NextFunction = jest.fn();

    optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() without error when token is malformed", () => {
    const req = makeReq("Bearer not-a-valid-jwt") as Request;
    const res = makeRes() as Response;
    const next: NextFunction = jest.fn();

    optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });
});
