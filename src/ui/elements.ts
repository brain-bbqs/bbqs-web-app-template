// Typed lookups for the static skeleton markup in index.html. Every id the app touches is
// registered here, so a renamed or dropped element fails on import (and in the boot smoke test)
// rather than as a null dereference somewhere down the page.

function required<T extends Element>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Expected #${id} to exist in the document`);
  return el as unknown as T;
}

export function getElements() {
  return {
    themeToggle: required<HTMLButtonElement>("theme-toggle"),
    loadCard: required<HTMLElement>("load-card"),
    dropzone: required<HTMLDivElement>("dropzone"),
    dropzoneReject: required<HTMLParagraphElement>("dropzone-reject"),
    browseFileBtn: required<HTMLButtonElement>("browse-file-btn"),
    fileInput: required<HTMLInputElement>("file-input"),
    fileCard: required<HTMLElement>("file-card"),
    fileSummaryName: required<HTMLSpanElement>("file-summary-name"),
    fileSummaryStats: required<HTMLSpanElement>("file-summary-stats"),
    changeFileBtn: required<HTMLButtonElement>("change-file-btn"),
    versionIndicator: required<HTMLAnchorElement>("version-indicator"),
    whatsNewButton: required<HTMLButtonElement>("whats-new-button"),
    whatsNewModal: required<HTMLDialogElement>("whats-new-modal"),
    whatsNewClose: required<HTMLButtonElement>("whats-new-close"),
    whatsNewContent: required<HTMLDivElement>("whats-new-content"),
    whatsNewShowMore: required<HTMLButtonElement>("whats-new-show-more"),
  };
}

export type AppElements = ReturnType<typeof getElements>;
