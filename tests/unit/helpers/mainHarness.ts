// Shared harness for tests that boot the real src/main.ts against the real index.html markup.
// Each test file gets its own module registry, so importing main.ts runs its top-level wiring
// exactly once per file; boot with the URL search params the scenario needs before that first
// import (one file per boot scenario, e.g. main.smoke.test.ts and main.mock-file.test.ts).
import { bodyOf, readIndexHtml } from "@brain-bbqs/test-utils/vitest";

export function el<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`missing #${id}`);
  return found as T;
}

/** Picks `file` through the hidden file input, the way the browse button does. */
export function pickFile(file: File): void {
  const input = el<HTMLInputElement>("file-input");
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new Event("change"));
}

export function installMatchMedia(matches = false): void {
  // jsdom has no matchMedia; main.ts only reads `.matches` for the theme toggle's starting point.
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom parses <dialog> but may implement neither showModal() nor close(); the What's New modal
// only needs `open` to track state and a "close" event on close(), so a minimal stand-in keeps
// main.ts's real modal wiring exercisable. Patched on the element's actual prototype, so it works
// whether jsdom maps <dialog> to HTMLDialogElement or a generic element.
export function installDialogPolyfill(): void {
  const proto = Object.getPrototypeOf(document.createElement("dialog")) as {
    showModal?: () => void;
    close?: (returnValue?: string) => void;
  };
  if (typeof proto.showModal !== "function") {
    proto.showModal = function (this: HTMLElement) {
      this.setAttribute("open", "");
    };
  }
  if (typeof proto.close !== "function") {
    proto.close = function (this: HTMLElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
  const desc = Object.getOwnPropertyDescriptor(proto, "open");
  if (!desc || typeof desc.get !== "function") {
    Object.defineProperty(proto, "open", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute("open");
      },
      set(this: HTMLElement, value: boolean) {
        if (value) this.setAttribute("open", "");
        else this.removeAttribute("open");
      },
    });
  }
}

/**
 * Boots the real app: sets the URL (so main.ts's `?test&...` injection reader sees `search`),
 * swaps in the real index.html body without its scripts (main.ts is imported directly instead),
 * installs the matchMedia stub and dialog polyfill, and imports src/main.ts. Call once per test file, from `beforeAll`.
 */
export async function bootMain(search = ""): Promise<void> {
  window.history.replaceState(null, "", `/${search}`);
  document.body.innerHTML = bodyOf(readIndexHtml(), { stripScripts: true });
  installMatchMedia();
  installDialogPolyfill();
  await import("../../../src/main");
}
