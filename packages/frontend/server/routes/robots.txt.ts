import { defineEventHandler, setHeader } from "h3";
import { buildRobotsTxt } from "../utils/robots";

export default defineEventHandler((event) => {
  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  return buildRobotsTxt(process.env.APP_ENV);
});
