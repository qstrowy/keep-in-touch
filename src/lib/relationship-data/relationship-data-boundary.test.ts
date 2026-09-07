import { describe, expect, it } from "vitest";

import { MissingRelationshipOwnerError } from "./types";

describe("relationship-data boundary", () => {
  it("exports the owner-validation error for the future local vault", () => {
    expect(new MissingRelationshipOwnerError()).toBeInstanceOf(Error);
  });
});
