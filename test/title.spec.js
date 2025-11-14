import { test, expect } from "@playwright/test";
import { url } from "../config.js";
import { screenshot } from "../util/screenshot.js";

test.describe("Title Test", () => {
  test("should match the expected title", async ({ page }) => {
    await page.goto(url);
    const title = await page.title();
    expect(title).toBe("Open Educational Badges");
  });

  test.afterEach(async ({ page }, testInfo) => {
    try {
      await screenshot(page, testInfo);
    } catch (e) {
      console.error(`Screenshotting failed: ${e}`);
    }
  });
});
