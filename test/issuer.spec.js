import { test } from "@playwright/test";
import { login } from "./login.js";
import { screenshot } from "../util/screenshot.js";
import {
  navigateToIssuerCreation,
  createIssuer,
  deleteIssuerOverApi,
  navigateToIssuerDetails,
  verifyIssuerDetails,
  verifyIssuerOverApi,
} from "./issuer.js";

test.describe("Issuer Test", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should create an issuer", async ({ page }) => {
    await navigateToIssuerCreation(page);
    await createIssuer(page);
  });

  test("should verify the issuer details", async ({ page }) => {
    await navigateToIssuerDetails(page);
    await verifyIssuerDetails(page);
    await verifyIssuerOverApi();
  });

  test("should delete the issuer", async () => {
    await deleteIssuerOverApi();
  });

  test.afterEach(async ({ page }, testInfo) => {
    try {
      await screenshot(page, testInfo);
    } catch (e) {
      console.error(`Screenshotting failed: ${e}`);
    }
  });
});
