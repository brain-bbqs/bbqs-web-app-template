import type { AppElements } from "./elements";

// A blank line (\n\n) renders as <br><br>; see showReject. Splitting the "what went wrong" and
// "what to do instead" halves onto their own lines keeps the fix visible at a glance.
const REJECT_NOT_A_FILE = "That wasn't a file.\n\nDrop a single file, or use the browse button instead.";

/**
 * Wires the file dropzone: a click anywhere on it (or on its browse button) opens the file picker,
 * and a drag-and-drop of one file hands that file to `onFile`. Only the first file of a multi-file
 * drop is taken; anything droppable that is not a file (dragged text, a link) is refused with an
 * explanation rather than silently ignored.
 */
export function initDropzone(els: AppElements, onFile: (file: File) => void): void {
  const dz = els.dropzone;

  /**
   * Renders `message` into the reject slot, turning each blank line into a <br><br> gap. The
   * breaks are appended as real elements and the prose as text nodes, so no part of `message`
   * is ever parsed as markup: the messages are static today, but this keeps a future caller
   * from turning a dynamic string (an API error, a filename) into an XSS vector. See SECURITY.md.
   */
  function showReject(message: string): void {
    const el = els.dropzoneReject;
    el.textContent = "";
    message.split("\n\n").forEach((paragraph, i) => {
      if (i) el.append(document.createElement("br"), document.createElement("br"));
      el.append(paragraph);
    });
    el.hidden = false;
  }

  function accept(file: File): void {
    els.dropzoneReject.hidden = true;
    onFile(file);
  }

  // The dropzone accepts exactly one thing, a file, so clicking anywhere on it opens the picker;
  // stopPropagation keeps the browse button's own click (and the synthetic click bubbling back out
  // of the hidden input) from opening a second picker on top.
  dz.addEventListener("click", () => els.fileInput.click());
  els.browseFileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    els.fileInput.click();
  });
  els.fileInput.addEventListener("click", (e) => e.stopPropagation());
  els.fileInput.addEventListener("change", () => {
    const file = els.fileInput.files?.[0];
    if (file) accept(file);
    // Cleared so picking the same file again still fires a change event.
    els.fileInput.value = "";
  });
  ["dragenter", "dragover"].forEach((evt) =>
    dz.addEventListener(evt, (e) => {
      e.preventDefault();
      dz.classList.add("dragover");
    }),
  );
  ["dragleave", "drop"].forEach((evt) =>
    dz.addEventListener(evt, (e) => {
      e.preventDefault();
      dz.classList.remove("dragover");
    }),
  );
  dz.addEventListener("drop", (e) => {
    const transfer = e.dataTransfer;
    if (!transfer) return;
    const file = transfer.files[0] as File | undefined;
    if (file) {
      accept(file);
    } else if (transfer.items.length > 0) {
      showReject(REJECT_NOT_A_FILE);
    }
  });
  // Prevent the browser from navigating away when a drop misses the dropzone.
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => e.preventDefault());
}
