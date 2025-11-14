import { screenshot } from "../util/screenshot.js";
import { test } from "@playwright/test";
import {
  navigateToSignup,
  signup,
  navigateToProfile,
  deleteUserViaUI,
  verifyUserOverApi,
  deleteUserOverApi,
  loginToCreatedAccount,
} from "./signup.js";

test.describe("Signup Test", () => {
  test("should be able to sign up", async function ({ page }) {
    await navigateToSignup(page);
    await signup(page);
  });

  test("should verify user details", async function ({ page }) {
    await verifyUserOverApi();
  });

  test("should delete user account using UI", async function ({ page }) {
    await loginToCreatedAccount(page);
    await navigateToProfile(page);
    await deleteUserViaUI(page);
  });

  test("should ensure user is deleted over API", async function ({ page }) {
    await deleteUserOverApi();
  });

  test.afterEach(async ({ page }, testInfo) => {
    try {
      await screenshot(page, testInfo);
    } catch (e) {
      console.error(`Screenshotting failed: ${e}`);
    }
  });
});
