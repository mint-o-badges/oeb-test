import { expect } from "@playwright/test";
import { username } from "../secret.js";
import { downloadDirectory, navigateToBadgeDetails } from "./badge.js";
import { defaultWait, url } from "../config.js";
import { Jimp } from "jimp";
import jsQR from "jsqr";
import { fromPath } from "pdf2pic";
import sharp from "sharp";

export async function navigateToQrCreation(page) {
  await navigateToBadgeDetails(page);

  const qrBtn = page
    .locator("button", {
      hasText: "Badge über QR-Code vergeben",
    })
    .first();
  await expect(qrBtn).toBeVisible({ timeout: defaultWait });
  await qrBtn.click();

  const confirmBtn = page.locator("button", {
    hasText: "QR-Code-Vergabe erstellen",
  });
  await expect(confirmBtn).toBeVisible({ timeout: defaultWait });
  await confirmBtn.click();

  await expect(
    page.locator('input[placeholder="Badge Vergabe Juni 2025 in Berlin"]')
  ).toBeVisible({ timeout: defaultWait });
}

/**
 * This assumes that the page already navigated to the QR creation
 */
export async function generateQrCode(page) {
  await page.fill(
    'input[placeholder="Badge Vergabe Juni 2025 in Berlin"]',
    "automated test QR title"
  );
  await page.fill(
    'input[placeholder="Mein Vorname und Nachname"]',
    "automated test name"
  );

  await page.click('button[type="submit"]');
  await expect(page.locator("svg.checkmark")).toBeVisible({
    timeout: defaultWait,
  });
  await page.click("button[brndialogclose]");
  await page.waitForTimeout(1000);
}

/**
 * Generate a QR code with expired validity dates
 * This assumes that the driver already navigated to the QR creation form
 *
 * @param {import("playwright/test").Page} page
 */
export async function generateExpiredQrCode(page) {
  await page.fill(
    'input[placeholder="Badge Vergabe Juni 2025 in Berlin"]',
    "automated test expired QR"
  );
  await page.fill(
    'input[placeholder="Mein Vorname und Nachname"]',
    "automated test name"
  );

  const today = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const yesterday = new Date(today.getTime() - dayMs);
  const twoDaysAgo = new Date(yesterday.getTime() - dayMs);

  const unfold = page.locator("button", { hasText: "Gültigkeit des QR-Codes" });
  await expect(unfold).toBeVisible();
  await unfold.click();

  const dateInputs = page.locator('input[type="date"]');
  const inputCount = await dateInputs.count();
  expect(inputCount).toBeGreaterThanOrEqual(2);

  const elem = dateInputs.nth(0);
  await elem.fill(twoDaysAgo.toISOString().split("T")[0]);

  const elem2 = dateInputs.nth(1);
  await elem2.fill(yesterday.toISOString().split("T")[0]);

  await page.click('button[type="submit"]');
  await expect(page.locator("svg.checkmark")).toBeVisible({
    timeout: defaultWait,
  });
  await page.click("button[brndialogclose]");

  // the qr code is generated onto a canvas which takes a bit of time and
  // may shift the layout
  await page.waitForTimeout(1000);
}

/**
 * Test that accessing an expired QR code shows the expired message
 */
export async function testExpiredQrCodeDisplay(page, qrCodeValue) {
  const currentUrl = page.url();
  const { issuerSlug, badgeSlug } = extractFromCurrentUrl(currentUrl);
  const qrCodeId = extractQrCodeIdFromUrl(qrCodeValue);

  await page.goto(
    `${url}/public/issuer/issuers/${issuerSlug}/badges/${badgeSlug}/request/${qrCodeId}`
  );

  const notFound = page.locator("bg-not-found");
  await expect(notFound).toBeVisible({ timeout: defaultWait });
  const errorText = await notFound.textContent();

  expect(
    errorText?.includes("nicht mehr gültig"),
    "Expected expired QR code error message"
  ).toBeTruthy();
}

/**
 * Test that the form is NOT displayed for an expired QR code
 */
export async function testExpiredQrCodeNoForm(page, qrCodeValue) {
  const currentUrl = page.url();
  const { issuerSlug, badgeSlug } = extractFromCurrentUrl(currentUrl);
  const qrCodeId = extractQrCodeIdFromUrl(qrCodeValue);

  await page.goto(
    `${url}/public/issuer/issuers/${issuerSlug}/badges/${badgeSlug}/request/${qrCodeId}`
  );

  const formInputs = page.locator('oeb-input[fieldtype="text"]');
  await expect(
    formInputs,
    "Request form should not be displayed for expired QR code"
  ).toBeHidden();
}

/**
 * This assumes that the QR code already got created
 *
 * @param {import("playwright/test").Page} page
 */
export async function downloadQrCode(page) {
  const downloadBtn = page.locator("button", {
    hasText: "Download QR-Code-Plakat",
  });
  await expect(downloadBtn).toBeVisible({ timeout: defaultWait });
  const downloadPromise = page.waitForEvent("download");
  await downloadBtn.click();
  const download = await downloadPromise;
  return download.path();
}

export async function readQrCode(pattern, path) {
  await convertPdfToImg(path, "qrcode.png");

  const imgPath = `${downloadDirectory}/qrcode.png`;
  const image = await Jimp.read(imgPath);

  const imageData = {
    data: new Uint8ClampedArray(image.bitmap.data),
    width: image.bitmap.width,
    height: image.bitmap.height,
  };

  const decoded = jsQR(imageData.data, imageData.width, imageData.height);
  expect(decoded, "QR code reading failed!").toBeTruthy();

  const qrCodeValue = decoded.data;
  expect(qrCodeValue).toMatch(pattern);
  return qrCodeValue;
}

async function convertPdfToImg(
  path,
  imageFilename,
  cropOptions = { left: 600, top: 850, width: 900, height: 900 }
) {
  const splitFilename = imageFilename.split(".");
  // Remove the file ending, since it gets attached again anyway
  let imageName = imageFilename;
  if (splitFilename.length > 1) {
    expect(splitFilename.at(-1)).toBe("png");
    imageName = splitFilename
      .slice(0, -1)
      .reduce((a, b) => a.concat(".").concat(b));
  }
  const options = {
    density: 100,
    saveFilename: imageName,
    savePath: downloadDirectory,
    format: "png",
    // DIN A4 dimensions
    width: 2100,
    height: 2970,
  };
  const convert = fromPath(path, options);
  const pageToConvertAsImage = 1;

  await convert(pageToConvertAsImage, { responseType: "image" });

  await sharp(`${downloadDirectory}/${imageName}.1.png`)
    .extract(cropOptions)
    .toFile(`${downloadDirectory}/${imageFilename}`);
}

export async function requestBadgeViaQr(page) {
  const textInputs = page.locator('oeb-input[fieldtype="text"]');
  await expect(textInputs).toHaveCount(2, { timeout: defaultWait });

  await textInputs.nth(0).locator("input").fill("automatedName");
  await textInputs.nth(1).locator("input").fill("automatedSurname");

  await page
    .locator('oeb-input[fieldtype="email"]')
    .locator("input")
    .fill(username);

  await page.locator('button[role="checkbox"]').click();
  await page.click('button[type="submit"]');
  await expect(page.locator("svg.checkmark")).toBeVisible({
    timeout: defaultWait,
  });
}

/**
 * This assumes that the driver already navigated to the badge detail page
 * @param {import('@playwright/test').Page} page – Playwright page object
 */
export async function confirmBadgeAwarding(page) {
  // Open the dropdown that lists pending requests
  const dropdownButton = page.locator('button[role="heading"]');
  await expect(dropdownButton).toBeVisible({ timeout: defaultWait });
  await dropdownButton.click();

  // Click the first checkbox in the list (the only request)
  const cb = page.locator('button[role="checkbox"]').first();
  await expect(cb).toBeEnabled({ timeout: defaultWait });
  await cb.click();

  // “Badge vergeben” confirm button
  const confirmButton = page.locator("button", { hasText: "Badge vergeben" });
  await expect(confirmButton).toBeVisible({ timeout: defaultWait });
  await confirmButton.click();

  // Verify the success message contains the user’s e‑mail address
  const successSpan = page.locator("span", {
    hasText: `Der Badge wurde erfolgreich an ${username} vergeben`,
  });
  await expect(successSpan).toBeVisible({ timeout: defaultWait });
}

/**
 * @param {import("playwright/test").Page} page
 */
export async function goToQRCode(page) {
  await navigateToBadgeDetails(page);
  const qrAward = page.locator("qrcode-awards");
  expect(qrAward).toBeVisible({ timeout: defaultWait });

  const moreButton = qrAward.locator("oeb-dropdown");
  await moreButton.click();

  const toQR = page.getByRole("menuitem").getByText("Zum QR-Code");
  await toQR.click();
}

function extractFromCurrentUrl(currentUrl) {
  const urlParts = currentUrl.split("/");

  const issuersIndex = urlParts.indexOf("issuers");
  const issuerSlug = urlParts[issuersIndex + 1];

  const badgesIndex = urlParts.indexOf("badges");
  const badgeSlug = urlParts[badgesIndex + 1];

  return { issuerSlug, badgeSlug };
}

function extractQrCodeIdFromUrl(qrCodeValue) {
  const parts = qrCodeValue.split("/");
  return parts[parts.length - 1];
}
