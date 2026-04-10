import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler((event) => {
  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  return [
    "User-agent: *",
    "Disallow: /admin",
    "Disallow: /games/*/signup",
    "",
  ].join("\n");
});
