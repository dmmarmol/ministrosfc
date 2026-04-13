import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin tournaments confirmation flow", () => {
  const filePath = resolve(
    __dirname,
    "../../src/pages/admin/tournaments/index.vue",
  );
  const source = readFileSync(filePath, "utf8");

  it("uses shared ConfirmationModal for delete flow", () => {
    expect(source).toContain(
      'import ConfirmationModal from "~/components/ui/ConfirmationModal.vue"',
    );
    expect(source).toContain("<ConfirmationModal");
    expect(source).toContain("askDeleteTournament");
  });

  it("does not use native confirm prompt", () => {
    expect(source).not.toContain("confirm(");
  });
});
