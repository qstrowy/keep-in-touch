import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { MissingRelationshipOwnerError } from "./types";

describe("relationship-data boundary", () => {
  it("exports the owner-validation error for the future local vault", () => {
    expect(new MissingRelationshipOwnerError()).toBeInstanceOf(Error);
  });

  it("rejects network calls and remote imports in relationship-data modules", async () => {
    const eslint = new ESLint();
    const filePaths = ["src/lib/interactions/interaction.ts", "src/lib/relationship-data/local-vault.ts"];
    const results = await Promise.all([
      ...filePaths.map((filePath) => eslint.lintText('void fetch("https://example.invalid");', { filePath })),
      ...filePaths.map((filePath) => eslint.lintText('import { createClient } from "@/lib/supabase";', { filePath })),
    ]);

    expect(results.flatMap(([result]) => result.messages.map((message) => message.ruleId))).toEqual(
      expect.arrayContaining(["no-restricted-globals", "no-restricted-imports"]),
    );
  }, 15_000);
});
