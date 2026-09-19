// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initDropzone } from "../../src/ui/dropzone";
import type { AppElements } from "../../src/ui/elements";

interface Harness {
  dz: HTMLDivElement;
  reject: HTMLParagraphElement;
  fileInput: HTMLInputElement;
  browseFileBtn: HTMLButtonElement;
  onFile: ReturnType<typeof vi.fn>;
}

function setup(): Harness {
  const dz = document.createElement("div");
  const reject = document.createElement("p");
  reject.hidden = true;
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  const browseFileBtn = document.createElement("button");
  // Mirror the real layout: the button, message, and hidden input live inside the dropzone,
  // so their clicks bubble to it.
  dz.append(browseFileBtn, reject, fileInput);
  document.body.appendChild(dz);
  const els = { dropzone: dz, dropzoneReject: reject, fileInput, browseFileBtn } as unknown as AppElements;
  const onFile = vi.fn();
  initDropzone(els, onFile);
  return { dz, reject, fileInput, browseFileBtn, onFile };
}

function setInputFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, "files", { value: files, configurable: true });
}

function dropEvent(dataTransfer: unknown): Event {
  const e = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(e, "dataTransfer", { value: dataTransfer });
  return e;
}

/** A DataTransfer stand-in: `files` as dropped, and one item per file (or per non-file thing). */
function transferOf(files: File[], nonFileItems = 0): unknown {
  const items = [
    ...files.map(() => ({ kind: "file" })),
    ...Array.from({ length: nonFileItems }, () => ({ kind: "string" })),
  ];
  return { files, items };
}

beforeEach(() => {
  document.body.textContent = "";
});

describe("initDropzone browse wiring", () => {
  it("opens the file picker when the dropzone itself is clicked", () => {
    const { dz, fileInput } = setup();
    const click = vi.spyOn(fileInput, "click").mockImplementation(() => {});
    dz.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("opens the file picker exactly once from the browse button, despite bubbling", () => {
    const { browseFileBtn, fileInput } = setup();
    const click = vi.spyOn(fileInput, "click").mockImplementation(() => {});
    browseFileBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("keeps a click on the hidden input itself from bubbling into another picker open", () => {
    const { fileInput } = setup();
    const click = vi.spyOn(fileInput, "click").mockImplementation(() => {});
    // The input's own (synthetic) click bubbles up through the dropzone; stopPropagation must
    // keep the dropzone's click handler from opening a second picker on top.
    fileInput.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(click).not.toHaveBeenCalled();
  });

  it("hands the picked file over and clears the input so the same file can be picked again", () => {
    const { fileInput, onFile } = setup();
    const file = new File(["x"], "notes.txt");
    setInputFiles(fileInput, [file]);
    fileInput.dispatchEvent(new Event("change"));
    expect(onFile).toHaveBeenCalledWith(file);
    expect(fileInput.value).toBe("");
  });

  it("does nothing on a change event that carries no files", () => {
    const { fileInput, reject, onFile } = setup();
    setInputFiles(fileInput, []);
    fileInput.dispatchEvent(new Event("change"));
    expect(onFile).not.toHaveBeenCalled();
    expect(reject.hidden).toBe(true);
  });
});

describe("initDropzone drag & drop", () => {
  it("toggles the dragover styling across the drag lifecycle", () => {
    const { dz } = setup();
    dz.dispatchEvent(new Event("dragenter", { cancelable: true }));
    expect(dz.classList.contains("dragover")).toBe(true);
    dz.dispatchEvent(new Event("dragleave", { cancelable: true }));
    expect(dz.classList.contains("dragover")).toBe(false);
    dz.dispatchEvent(new Event("dragover", { cancelable: true }));
    expect(dz.classList.contains("dragover")).toBe(true);
  });

  it("hands over the first dropped file and drops the dragover styling", () => {
    const { dz, onFile } = setup();
    const first = new File(["a"], "a.txt");
    const second = new File(["b"], "b.txt");
    dz.dispatchEvent(new Event("dragenter", { cancelable: true }));
    dz.dispatchEvent(dropEvent(transferOf([first, second])));
    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile).toHaveBeenCalledWith(first);
    expect(dz.classList.contains("dragover")).toBe(false);
  });

  it("refuses a drop that carries no file, explaining what to do instead", () => {
    const { dz, reject, onFile } = setup();
    dz.dispatchEvent(dropEvent(transferOf([], 1)));
    expect(onFile).not.toHaveBeenCalled();
    expect(reject.hidden).toBe(false);
    expect(reject.textContent).toContain("browse button");

    // The two halves sit on their own lines, separated by a <br><br> gap...
    expect(reject.querySelectorAll("br")).toHaveLength(2);
    expect(reject.childNodes[0].textContent).toBe("That wasn't a file.");
    // ...built from real nodes, so the prose is never parsed as markup.
    expect(reject.querySelectorAll("*")).toHaveLength(2);
  });

  it("clears the refusal once a file is accepted", () => {
    const { dz, reject, onFile } = setup();
    dz.dispatchEvent(dropEvent(transferOf([], 1)));
    expect(reject.hidden).toBe(false);

    dz.dispatchEvent(dropEvent(transferOf([new File(["x"], "a.txt")])));
    expect(onFile).toHaveBeenCalledTimes(1);
    expect(reject.hidden).toBe(true);
  });

  it("ignores a drop that yields nothing at all", () => {
    const { dz, reject, onFile } = setup();
    dz.dispatchEvent(dropEvent(transferOf([])));
    expect(onFile).not.toHaveBeenCalled();
    expect(reject.hidden).toBe(true);
  });

  it("ignores a drop event without a DataTransfer entirely", () => {
    const { dz, reject, onFile } = setup();
    dz.dispatchEvent(new Event("drop", { bubbles: true, cancelable: true }));
    expect(onFile).not.toHaveBeenCalled();
    expect(reject.hidden).toBe(true);
  });

  it("prevents the browser's default navigation for drags that miss the dropzone", () => {
    setup();
    const dragover = new Event("dragover", { cancelable: true });
    window.dispatchEvent(dragover);
    expect(dragover.defaultPrevented).toBe(true);

    const drop = new Event("drop", { cancelable: true });
    window.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
  });
});
