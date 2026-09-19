import { test, expect } from "@chromatic-com/playwright";
import { VIEWPORTS, expectNoHorizontalOverflow } from "../integration/helpers/layout";

// One test per viewport rather than one per Playwright project: see VIEWPORTS for why. The Chromatic
// fixture snapshots the page after each test body, named by the test's title, so the viewport in
// the title is what tells the captures apart.
for (const viewport of VIEWPORTS) {
  const size = { width: viewport.width, height: viewport.height };

  test(`Main page - default [${viewport.name}]`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator("#dropzone")).toBeVisible();
    await expect(page.locator("#file-card")).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });

  test(`Main page - file loaded [${viewport.name}]`, async ({ page }) => {
    await page.setViewportSize(size);
    // The mock file has a fixed name and size (see src/lib/testInjection.ts), so the capture is
    // the same on every run.
    await page.goto("/?test&mock_file");
    await expect(page.locator("#file-card")).toBeVisible();
    await expect(page.locator("#load-card")).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });
}
