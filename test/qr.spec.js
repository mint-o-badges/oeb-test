import { test } from "@playwright/test";
import { login } from "./login.js";
import { url } from "../config.js";
import { screenshot } from "../util/screenshot.js";
import {
  navigateToBadgeDetails,
  navigateToBadgeCreation,
  createBadge,
  deleteBadgeOverApi,
  navigateToBackpack,
  receiveBadge,
} from "./badge.js";
import {
  navigateToQrCreation,
  generateQrCode,
  downloadQrCode,
  readQrCode,
  requestBadgeViaQr,
  confirmBadgeAwarding,
  generateExpiredQrCode,
  testExpiredQrCodeDisplay,
  testExpiredQrCodeNoForm,
} from "./qr.js";

test.describe("QR test", () => {
  test("should create a badge", async ({ page }) => {
    await login(page);
    await navigateToBadgeCreation(page);
    await createBadge(page);
  });

  test("should create the QR code", async ({ page }) => {
    await navigateToQrCreation(page);
    await generateQrCode(page);
    await downloadQrCode(page);
  });

  test("should read the QR code", async ({ page }) => {
    const qrCodeUrl = await readQrCode(new RegExp(`^${url}.*`));
    await page.goto(qrCodeUrl);
    await requestBadgeViaQr(page);
  });

  test("should confirm the QR code awarding", async ({ page }) => {
    await navigateToBadgeDetails(page);
    await confirmBadgeAwarding(page);
  });

  test("should receive the badge", async ({ page }) => {
    await navigateToBackpack(page);
    await receiveBadge(page);
  });

  test("should delete the badge", async () => {
    await deleteBadgeOverApi();
  });

  test.describe("Expired QR Code", () => {
    test.beforeAll(async ({ page }) => {
      await login(page);
      await navigateToBadgeCreation(page);
      await createBadge(page);
    });

    test("should create an expired QR code", async ({ page }) => {
      await navigateToQrCreation(page);
      await generateExpiredQrCode(page);
      await downloadQrCode(page, "automated test expired QR");
    });

    test("should show expired message when accessing expired QR code", async ({
      page,
    }) => {
      const qrCodeUrl = await readQrCode(
        new RegExp(`^${url}.*`),
        "automated test expired QR.pdf"
      );
      await testExpiredQrCodeDisplay(page, qrCodeUrl);
    });

    test("should not display request form for expired QR code", async ({
      page,
    }) => {
      const qrCodeUrl = await readQrCode(
        new RegExp(`^${url}.*`),
        "automated test expired QR.pdf"
      );
      await testExpiredQrCodeNoForm(page, qrCodeUrl);
    });

    test.afterAll(async () => {
      await deleteBadgeOverApi();
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    try {
      await screenshot(page, testInfo);
    } catch (e) {
      console.error(`Screenshotting failed: ${e}`);
    }
  });
});
