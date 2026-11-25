import { describe, expect, it } from "vitest";
import {
  INTERESTS,
  normalizeCity,
  profileError,
  readSetup,
  testIdentity,
  toggleSelection,
} from "./onboarding";

describe("test onboarding", () => {
  it("accepts any test email with a password without verification", () => {
    expect(testIdentity("email", "tester", "demo")).toBe("email:tester");
    expect(testIdentity("email", "tester", "")).toBeNull();
  });
  it("accepts any test phone with a password without verification", () => {
    expect(testIdentity("phone", "123", "demo")).toBe("phone:123");
    expect(testIdentity("phone", "", "demo")).toBeNull();
  });
  it("requires a display name and valid handle for profile setup", () => {
    expect(profileError("Jordan", "@jordan")).toBe("");
    expect(profileError("", "jordan")).not.toBe("");
    expect(profileError("Jordan", "not a handle")).not.toBe("");
  });
  it("offers all six requested interests", () => {
    expect([...INTERESTS]).toEqual([
      "Comedy & Memes",
      "Trending",
      "Music & Soundtracks",
      "Daily Life & Stories",
      "Gaming & Tech",
      "Sports",
    ]);
  });
  it("adds and removes followed creators and friends", () => {
    expect(toggleSelection([], "nala")).toEqual(["nala"]);
    expect(toggleSelection(["nala"], "nala")).toEqual([]);
  });
  it("reads a completed profile but rejects corrupt stored data", () => {
    const profile = {
      name: "Jordan",
      handle: "@jordan",
      avatar: "/photo.jpg",
      bio: "Music fan",
      interests: ["Music & Soundtracks"],
      following: ["nala"],
      friends: ["zuri"],
    };
    expect(readSetup(JSON.stringify(profile))).toEqual({ ...profile, following: [], friends: [] });
    expect(readSetup('{"name":"Jordan"}')).toBeNull();
    expect(readSetup("bad data")).toBeNull();
  });
  it("removes old sample follows and friends while keeping other IDs", () => {
    const profile = {
      name: "Jordan",
      handle: "@jordan",
      avatar: "/photo.jpg",
      bio: "",
      interests: [],
      following: ["nala", "real-person"],
      friends: ["zuri", "real-friend"],
    };
    expect(readSetup(JSON.stringify(profile))?.following).toEqual(["real-person"]);
    expect(readSetup(JSON.stringify(profile))?.friends).toEqual(["real-friend"]);
  });
  it("normalizes user city/location for Near You discovery", () => {
    expect(normalizeCity("  Johannesburg, South Africa  ")).toEqual({
      location: "Johannesburg, South Africa",
      city: "Johannesburg",
      cityLower: "johannesburg",
    });
    const withCity = {
      name: "Nala",
      handle: "@nala",
      avatar: "",
      bio: "",
      location: "Cape Town",
      city: "Cape Town",
      interests: ["Trending"],
      following: [],
      friends: [],
    };
    expect(readSetup(JSON.stringify(withCity))?.city).toBe("Cape Town");
  });
});
