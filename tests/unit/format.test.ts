import { describe, expect, it } from "vitest";
import { humanSize } from "../../src/lib/format";

describe("humanSize", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1023, "1023 B"],
    [1024, "1.0 KB"],
    [1536, "1.5 KB"],
    [10240, "10 KB"],
    [1048576, "1.0 MB"],
    [5 * 1024 ** 3, "5.0 GB"],
    [1024 ** 4, "1.0 TB"],
  ])("formats %d bytes as %s", (bytes, expected) => {
    expect(humanSize(bytes)).toBe(expected);
  });

  it("never goes past terabytes", () => {
    expect(humanSize(1024 ** 5)).toBe("1024 TB");
  });
});
