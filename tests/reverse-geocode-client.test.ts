import { describe, expect, it } from "vitest";
import { placeNameFromLookup } from "../src/lib/reverse-geocode-client";

describe("placeNameFromLookup", () => {
  it("prefers the city and falls back to a smaller locality", () => {
    expect(placeNameFromLookup({ city: "Bengaluru", locality: "Indiranagar" })).toBe("Bengaluru");
    expect(placeNameFromLookup({ city: "", locality: "Indiranagar" })).toBe("Indiranagar");
  });

  it("requires a usable name", () => {
    expect(placeNameFromLookup({ city: "  ", locality: null })).toBeNull();
    expect(placeNameFromLookup(null)).toBeNull();
  });
});
