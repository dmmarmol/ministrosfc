import { run } from "./seed-import/index";

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
