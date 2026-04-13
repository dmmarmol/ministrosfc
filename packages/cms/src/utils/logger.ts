import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";
const isJest = process.env.JEST_WORKER_ID != null;

export const logger = pino({
  level: isTest || isJest ? "silent" : isProduction ? "info" : "debug",
  ...(isProduction || isTest
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:HH:MM:ss",
          },
        },
      }),
});
