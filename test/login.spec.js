import { test } from "@playwright/test";
import { login } from "./login.js";
import { screenshot } from "../util/screenshot.js";

test.describe("Login Test", () => {
  test("should be able to log in", async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    try {
      await screenshot(page, testInfo);
    } catch (e) {
      console.error(`Screenshotting failed: ${e}`);
    }
  });
});
