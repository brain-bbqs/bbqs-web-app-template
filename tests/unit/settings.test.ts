// @vitest-environment jsdom
import { throwingStorage } from "@brain-bbqs/test-utils/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadStoredTheme, saveStoredTheme, THEME_KEY } from "../../src/lib/settings";

let restoreStorage: (() => void) | undefined;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  restoreStorage?.();
  restoreStorage = undefined;
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
    restoreStorage = throwingStorage();
    expect(loadStoredTheme()).toBe(null);
  });

  it("warns rather than throws when storage refuses the write", () => {
    restoreStorage = throwingStorage();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => saveStoredTheme("dark")).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("Could not save theme preference:", expect.any(Error));
  });
});
