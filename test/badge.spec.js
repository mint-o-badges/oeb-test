import { test } from "@playwright/test";
import { login } from "./login.js";
import { screenshot } from "../util/screenshot.js";
import {
  navigateToBadgeCreation,
  navigateToBadgeDetails,
  navigateToBadgeAwarding,
  navigateToBackpack,
  navigateToReceivedBadge,
  createBadge,
  awardBadge,
  receiveBadge,
  downloadPdfFromBackpack,
  downloadPdfFromIssuer,
  revokeBadge,
  confirmRevokedBadge,
  deleteBadgeOverApi,
  verifyBadgeOverApi,
  validateBadge,
  createBadges,
  deleteBadgesOverApi,
  createMicroDegree,
  deleteMicroDegreeOverApi,
  receiveMicroDegreeBadge,
  confirmRevokedMicroDegree,
  downloadMicroDegree,
  navigateToReceivedMicroDegree,
  navigateToMicroDegreeDetails,
  revokeMicroDegree,
  validateBadgeVersion,
  validateUploadedV2Badge,
  validateUploadedV3Badge,
  validateUploadedInvalidBadge,
} from "./badge.js";

const BADGES_FOR_MICRO_DEGREE = 2;

test.describe("Badge Test", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe("Participation badge", () => {
    test("should create a participation badge", async ({ page }) => {
      await navigateToBadgeCreation(page);
      await createBadge(page);
    });

    test("should validate the participation badge", async ({ page }) => {
      await navigateToBadgeDetails(page);
      await validateBadge(page);
      await verifyBadgeOverApi(page);
    });

    test("should delete the participation badge", async ({ page }) => {
      await deleteBadgeOverApi();
    });
  });

  test.describe("Competency badge", () => {
    test("should create a competency badge", async ({ page }) => {
      test.slow(); // Allow larger timeout since the AI tool can take a while
      await navigateToBadgeCreation(page);
      await createBadge(page, "competency");
    });

    test("should validate the competency badge", async ({ page }) => {
      await navigateToBadgeDetails(page);
      await validateBadge(page, "Kompetenz");
      await verifyBadgeOverApi(page);
    });

    test("should award the competency badge", async ({ page }) => {
      test.slow();
      await navigateToBadgeAwarding(page);
      await awardBadge(page);
    });

    test("should receive the competency badge", async ({ page }) => {
      await navigateToBackpack(page);
      await receiveBadge(page);
    });

    test("should ensure the received badge is of the latest open badges standard", async ({
      page,
    }) => {
      await navigateToReceivedBadge(page);
      await validateBadgeVersion(page);
    });

    test("should download the pdf from the backpack", async ({ page }) => {
      await navigateToReceivedBadge(page);
      await downloadPdfFromBackpack(page);
    });

    test("should download the pdf from the internal issuer page", async ({
      page,
    }) => {
      await navigateToBadgeDetails(page);
      await downloadPdfFromIssuer(page);
    });

    test("should revoke the competency badge", async ({ page }) => {
      await navigateToBadgeDetails(page);
      await revokeBadge(page);
      await navigateToBackpack(page);
      await confirmRevokedBadge(page);
    });

    test("should delete the competency badge", async ({ page }) => {
      await deleteBadgeOverApi();
    });
  });

  test.describe("Micro degree", () => {
    test("should create a micro degree", async ({ page }) => {
      test.slow(); // Allow larger timeout since a number of badges have to be created
      await createBadges(page, BADGES_FOR_MICRO_DEGREE);
      await navigateToBadgeCreation(page);
      await createMicroDegree(page, BADGES_FOR_MICRO_DEGREE);
    });

    test("should award the micro degree", async ({ page }) => {
      test.slow(); // Allow larger timeout since awarding badges takes a while
      for (let i = 0; i < BADGES_FOR_MICRO_DEGREE; i++) {
        await navigateToBadgeAwarding(page, i);
        await awardBadge(page);
      }
    });

    test("should receive the micro degree", async ({ page }) => {
      await navigateToBackpack(page);
      await receiveMicroDegreeBadge(page);
    });

    test("should download the micro degree pdf from the backpack", async ({
      page,
    }) => {
      await navigateToBackpack(page);
      await navigateToReceivedMicroDegree(page);
      // https://github.com/mint-o-badges/badgr-ui/issues/1231
      // A delay is required here due to a race condition in the application.
      // If removed, the download button will be clicked but won't trigger a download.
      await page.waitForTimeout(1000);
      await downloadMicroDegree(page);
    });

    test("should download the micro degree pdf from the internal issuer page", async ({
      page,
    }) => {
      await navigateToMicroDegreeDetails(page);
      await downloadPdfFromIssuer(page, true);
    });

    test("should revoke the micro degree", async ({ page }) => {
      test.slow(); // Allow larger timeout since there is a number of badges to revoke
      for (let i = 0; i < BADGES_FOR_MICRO_DEGREE; i++) {
        await navigateToBadgeDetails(page, i);
        await revokeBadge(page);
      }
      await navigateToMicroDegreeDetails(page);
      await revokeMicroDegree(page);
      await navigateToBackpack(page);
      await confirmRevokedMicroDegree(page);
    });

    test("should delete the micro degree", async ({ page }) => {
      await deleteMicroDegreeOverApi();
    });

    test("should delete the badges for the micro degree", async ({ page }) => {
      await deleteBadgesOverApi(BADGES_FOR_MICRO_DEGREE);
    });
  });

  test.describe("Badge upload", () => {
    test("should create a badge to test with", async ({ page }) => {
      test.slow();
      await navigateToBadgeCreation(page);
      await createBadge(page);
      await navigateToBadgeAwarding(page);
      await awardBadge(page);
    });

    test("should show message when uploaded badge is invalid", async ({
      page,
    }) => {
      await navigateToReceivedBadge(page);
      await validateUploadedInvalidBadge(page);
    });

    test("should validate a v2 badge as such on upload", async ({ page }) => {
      test.slow();
      await navigateToReceivedBadge(page);
      await validateUploadedV2Badge(page);
      // The validation revokes the badge – restore it
      await navigateToBadgeAwarding(page);
      await awardBadge(page);
    });

    test("should validate a v3 badge as such on upload", async ({ page }) => {
      test.slow();
      await navigateToReceivedBadge(page);
      await validateUploadedV3Badge(page);
      // Restore after revocation
      await navigateToBadgeAwarding(page);
      await awardBadge(page);
    });

    test("should delete the badge to test with", async ({ page }) => {
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
