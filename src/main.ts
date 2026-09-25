import "./style.css";
import { humanSize } from "@brain-bbqs/utils";
import changelog from "../CHANGELOG.md?raw";
import { countChangelogVersions, renderChangelogHtml } from "./lib/changelog";
import { saveStoredTheme } from "./lib/settings";
import { readTestInjection, synthesizeMockFile } from "./lib/testInjection";
import { initDropzone } from "./ui/dropzone";
import { getElements } from "./ui/elements";

const els = getElements();

// ---------------------------------------------------------------------------------------------
// The shared shell: the footer version stamp, the "What's New" modal and the light/dark toggle.
// Every BBQS companion app carries these three, wired the same way; what follows them is the app.
// ---------------------------------------------------------------------------------------------

// Footer version stamp; the anchor itself already points at the source repository.
els.versionIndicator.textContent = `v${__APP_VERSION__}`;

// The modal opens on the latest few versions; "Show more" swaps in the entire changelog for
// anyone curious enough to keep reading.
const WHATS_NEW_RECENT_VERSIONS = 3;
els.whatsNewContent.innerHTML = renderChangelogHtml(changelog, WHATS_NEW_RECENT_VERSIONS);
els.whatsNewShowMore.hidden = countChangelogVersions(changelog) <= WHATS_NEW_RECENT_VERSIONS;
els.whatsNewShowMore.addEventListener("click", () => {
  els.whatsNewContent.innerHTML = renderChangelogHtml(changelog, Infinity);
  els.whatsNewShowMore.hidden = true;
});
// The modal is also reachable via the #changelog URL fragment, so the link can be copied and
// shared to drop someone directly into it. Opening writes the fragment (so the address bar
// reflects it); closing strips it back out again so it doesn't linger once dismissed.
const CHANGELOG_HASH = "#changelog";

function openWhatsNewModal(): void {
  if (!els.whatsNewModal.open) els.whatsNewModal.showModal();
  if (window.location.hash !== CHANGELOG_HASH) {
    window.location.hash = CHANGELOG_HASH.slice(1);
  }
}

els.whatsNewButton.addEventListener("click", () => openWhatsNewModal());
els.whatsNewClose.addEventListener("click", () => els.whatsNewModal.close());
els.whatsNewModal.addEventListener("click", (e) => {
  if (e.target === els.whatsNewModal) els.whatsNewModal.close();
});
// Covers every dismissal path (close button, backdrop click, Esc key) so the fragment never
// outlives the modal it points to.
els.whatsNewModal.addEventListener("close", () => {
  if (window.location.hash === CHANGELOG_HASH) {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState({}, "", url.toString());
  }
});
window.addEventListener("hashchange", () => {
  if (window.location.hash === CHANGELOG_HASH) openWhatsNewModal();
});
if (window.location.hash === CHANGELOG_HASH) openWhatsNewModal();

// The inline script in index.html already applied any stored theme override before first paint,
// so the toggle only has to flip and persist it. With nothing stored, data-theme is unset and the
// OS preference is in effect, so the first click flips away from whatever is currently showing.
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
els.themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme ?? (prefersDark.matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  saveStoredTheme(next);
});

// ---------------------------------------------------------------------------------------------
// The app: what happens to a loaded file. This is the part the setup skill replaces.
// ---------------------------------------------------------------------------------------------

/** Swaps the picker card for the loaded-file card, naming what was loaded. */
function showLoadedFile(file: File): void {
  els.fileSummaryName.textContent = file.name;
  els.fileSummaryStats.textContent = file.type ? `${humanSize(file.size)} · ${file.type}` : humanSize(file.size);
  els.loadCard.hidden = true;
  els.fileCard.hidden = false;
}

/** Back to the picker, as if nothing had been loaded. */
function resetFile(): void {
  els.fileCard.hidden = true;
  els.loadCard.hidden = false;
  els.fileSummaryName.textContent = "";
  els.fileSummaryStats.textContent = "";
}

initDropzone(els, showLoadedFile);
els.changeFileBtn.addEventListener("click", resetFile);

// `?test&mock_file` lands straight on the loaded state (see lib/testInjection.ts); with no
// injection the page boots for real, on the picker.
const injection = readTestInjection(window.location.search);
if (injection?.mockFile) showLoadedFile(synthesizeMockFile());
