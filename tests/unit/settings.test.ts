// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadStoredTheme, saveStoredTheme, THEME_KEY } from "../../src/lib/settings";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("stored theme", () => {
  it("is null until the toggle has ever been used", () => {
    expect(loadStoredTheme()).toBe(null);
  });

  it("round-trips a saved choice", () => {
    saveStoredTheme("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(loadStoredTheme()).toBe("dark");
    saveStoredTheme("light");
    expect(loadStoredTheme()).toBe("light");
  });

  it("ignores a stored value that is not a theme", () => {
    localStorage.setItem(THEME_KEY, "sepia");
    expect(loadStoredTheme()).toBe(null);
  });

  it("reads as unset when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadStoredTheme()).toBe(null);
  });

  it("warns rather than throws when storage refuses the write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => saveStoredTheme("dark")).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
