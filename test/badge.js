import { expect } from "@playwright/test";
import { username, password } from "../secret.js";
import { url, defaultWait, extendedWait } from "../config.js";
import fs from "fs";
import {
  requestToken,
  findBadge,
  deleteBadge,
  findAssertions,
  revokeAssertions,
} from "../util/api.js";
import {
  addNewTag,
  setBadgeValidity,
  addCompetenciesByHand,
  addCompetenciesViaAI,
  waitForTabs,
} from "../util/badge-helper.js";
import { uploadImage, selectNounProjectImage } from "../util/image-upload.js";
import { exec } from "child_process";
import { exitCode, title } from "process";
import { text } from "stream/consumers";

export const downloadDirectory = "/tmp";

const testBadgeTitle = "automated test title";
const testBadgeDescription = "automated test description";
const testDuration = "42";
const testImagePath = "assets/image.png";
const testAwardName = "automated test name";
const nounProjectSearchText = "test";
const aiCompetenciesDescriptionText =
  "With solid computer skills, you can automate routine tasks, analyze data more effectively, and communicate with colleagues more efficiently.";
const tagName = "automated test tag";
const microDegreeTitle = "automated micro degree";
const microDegreeDescription = "automated micro degree description";
const currentBadgeStandardVersion = "3.0";

/**
 * This requires that there exists a verified issuer for the user associated with the configured credentials
 *
 * @param {import('@playwright/test').Page} page – Playwright page instance
 */
export async function navigateToBadgeCreation(page) {
  await page.goto(`${url}/issuer/issuers`);
  await expect(page).toHaveTitle("Issuers - Open Educational Badges", {
    timeout: defaultWait,
  });

  const createBadgeBtn = page
    .locator("oeb-button:not(.disabled) button[id^='create-new-badge-btn']")
    .first();
  await createBadgeBtn.waitFor({ state: "visible", timeout: defaultWait });
  await createBadgeBtn.click();

  await expect(page).toHaveTitle("Badge erstellen - Open Educational Badges", {
    timeout: extendedWait,
  });
}

/**
 * Navigates to the badge details of the badge created during automation.
 * If multiple badges are created, use {@link skip} to skip an entry and choose
 * the next available badge instead.
 *
 * @param {import('@playwright/test').Page} page – Playwright page instance
 * @param {number} [skip=0] – Number of matching badges to skip before selecting one
 */
export async function navigateToBadgeDetails(page, skip = 0) {
  // This ensures that the same issuer is used as for the created badge
  await navigateToBadgeCreation(page);

  const breadcrumbSpans = page.locator("span.breadcrumbs-x-text");
  await breadcrumbSpans.nth(1).click();
  await expect(page).toHaveTitle(/Issuer - .* - Open Educational Badges/, {
    timeout: defaultWait,
  });

  const badgeTitleElements = page.locator("td:first-child p");
  await badgeTitleElements
    .first()
    .waitFor({ state: "visible", timeout: defaultWait });

  const count = await badgeTitleElements.count();
  let skipped = 0;

  for (let i = 0; i < count; i++) {
    const title = await badgeTitleElements.nth(i).innerText();
    if (title.trim() === testBadgeTitle) {
      if (skipped === skip) {
        await badgeTitleElements.nth(i).click();
        break;
      }
      skipped++;
    }
  }

  await expect(page).toHaveTitle(
    `Badge Class - ${testBadgeTitle} - Open Educational Badges`,
    { timeout: defaultWait }
  );
}

/**
 *
 * @param {import("playwright/test").Page} page
 */
export async function navigateToMicroDegreeDetails(page) {
  // This ensures that the same issuer is used as for the created badge
  await navigateToBadgeCreation(page);

  await page
    .locator("span.breadcrumbs-x-text")
    .first()
    .waitFor({ state: "visible", timeout: defaultWait });
  const breadcrumbs = page.locator("span.breadcrumbs-x-text");
  const issuerBreadcrumb = breadcrumbs.nth(1);
  await issuerBreadcrumb.click();

  await expect(page).toHaveTitle(/Issuer - .* - Open Educational Badges/, {
    timeout: defaultWait,
  });

  await waitForTabs(page, 2);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(1).click();

  // For the load
  await page.locator("learningpaths-datatable").waitFor({
    state: "visible",
    timeout: defaultWait,
  });

  const receivedMicroDegreeLink = page.locator("p", {
    hasText: microDegreeTitle,
  });
  await receivedMicroDegreeLink.click();
}

/**
 * Navigates to the badge awarding page, expects the badge to have been created already.
 * If multiple badges are created during testing, use {@link skip} to skip
 * over entries and choose the next badge to navigate to.
 * @param {import('@playwright/test').Page} page
 * @param {number} skip Number of badges to skip before selecting the one to navigate to
 */
export async function navigateToBadgeAwarding(page, skip = 0) {
  await navigateToBadgeDetails(page, skip);

  const badgeAwardButton = page.locator(
    'button:has-text("Badge direkt vergeben")'
  );
  await badgeAwardButton.waitFor({ timeout: defaultWait });
  await badgeAwardButton.click();

  const confirmButton = page.locator('button:has-text("Badge vergeben")');
  await confirmButton.waitFor({ timeout: defaultWait, state: "visible" });
  await confirmButton.click();

  await expect(page).toHaveTitle(
    `Award Badge - ${testBadgeTitle} - Open Educational Badges`,
    { timeout: defaultWait }
  );
}

export async function navigateToBackpack(page) {
  await page.goto(`${url}/recipient/badges`);

  await expect(page).toHaveTitle("Backpack - Open Educational Badges", {
    timeout: defaultWait,
  });
}

/**
 * @param {import("playwright/test").Page} page
 */
export async function navigateToReceivedBadge(page) {
  await navigateToBackpack(page);

  // move to the badges tab
  await waitForTabs(page, 5);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(1).click();

  await page
    .locator("bg-badgecard")
    .first()
    .waitFor({ state: "attached", timeout: defaultWait });

  const receivedBadgeLinks = page.locator("a").getByText(testBadgeTitle);
  expect(
    receivedBadgeLinks,
    "Expected to find only one badge matching the title in my backpack"
  ).toHaveCount(1);
  await receivedBadgeLinks.first().click();

  await page.waitForSelector("loading-dots", { state: "detached" });
  await expect(page).toHaveTitle(
    `Backpack - ${testBadgeTitle} - Open Educational Badges`,
    { timeout: defaultWait }
  );
}

export async function navigateToReceivedMicroDegree(page) {
  // this switches to the micro degree tab of the backpack
  await waitForTabs(page, 5);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(3).click();

  // For the load
  await page
    .locator("bg-learningpathcard")
    .first()
    .waitFor({ timeout: defaultWait });

  const receivedMicroDegreeLink = page.locator("span", {
    hasText: microDegreeTitle,
  });
  await receivedMicroDegreeLink.click();

  await expect(page).toHaveTitle("LearningPath - Open Educational Badges", {
    timeout: defaultWait,
  });
}

/**
 * This assumes that the page already navigated to the badge creation page
 *
 * @param {import("playwright/test").Page} page
 */
export async function createBadge(page, badgeType = "participation") {
  // Initial step: Badge type selection
  const selectedBadgeType = page.locator(`[href*='${badgeType}']`);
  await selectedBadgeType.waitFor({ timeout: defaultWait });
  await selectedBadgeType.click();

  await page.waitForSelector("badgeclass-edit-form", { state: "visible" });
  const form = page.locator("badgeclass-edit-form");

  // Next step: Badge details
  // Title field
  const titleField = form.locator('input[type="text"]');
  await titleField.fill(testBadgeTitle);
  // Duration field
  const durationField = form.locator('input[type="number"]').first();
  await durationField.fill(testDuration);
  // Description field
  const shortDescriptionField = form.locator("textarea");
  await shortDescriptionField.fill(testBadgeDescription);
  // Image field
  // Timeouts between image uploads ensure that the server has time to respond
  // as the images are partially being generated on the server
  await new Promise((r) => setTimeout(r, 1000));
  // Testing switching between framed and unframed/owned images is essential as users might experience some issues while doing so
  // 1. Upload own image (insterted into badge frame)
  await uploadImage(page, "image_field", 0, testImagePath);
  await new Promise((r) => setTimeout(r, 1000));
  // 2. Upload own image
  await uploadImage(page, "image_field", 1, testImagePath);
  await new Promise((r) => setTimeout(r, 1000));
  // 3. Select an image from nounproject
  await selectNounProjectImage(page, nounProjectSearchText);

  // Click next button to move to the next step
  const nextButton = form
    .getByRole("button")
    .getByText("Weiter", { exact: true });
  await nextButton.click();

  // Next step: Add skills - only with competency badge type
  if (badgeType == "competency") {
    // Add competencies using AI
    await addCompetenciesViaAI(page, aiCompetenciesDescriptionText);
    // Add competencies by hand
    await addCompetenciesByHand(page);

    // Click next button to move to the next step
    await nextButton.click();
  }

  // Next step: Add new tag
  await addNewTag(page, tagName);
  // Click next button to move to the next step
  await nextButton.click();

  // Final step: add optional details then submit badge
  await setBadgeValidity(page);

  const submitButton = page.locator("button#create-badge-btn");
  await submitButton.click();
  await submitButton.waitFor({ state: "detached" });
  await page.waitForSelector("loading-dots", { state: "detached" });

  await expect(page).toHaveTitle(
    `Badge Class - ${testBadgeTitle} - Open Educational Badges`,
    { timeout: extendedWait }
  );
}

/**
 * This assumes that the page already navigated to the badge awarding page
 *
 * @param {import("playwright/test").Page} page
 */
export async function awardBadge(page, email = username) {
  const nameField = page.locator('input[type="text"]').first();
  await nameField.fill(testAwardName);

  const identifierField = page.locator('input[type="email"]');
  await identifierField.fill(email);

  // TODO: optional details

  const submitButton = page.locator('button:has-text("Badge vergeben")');
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await page.waitForSelector("form", {
    state: "detached",
    timeout: defaultWait,
  });

  await expect(page).toHaveTitle(
    `Badge Class - ${testBadgeTitle} - Open Educational Badges`,
    { timeout: extendedWait }
  );
}

/**
 * This assumes that the page already navigated to the backpack page
 */
export async function receiveBadge(page) {
  // move to the badges tab
  await waitForTabs(page, 5);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(1).click();

  // Try a couple of times, since receiving the badge can take some time
  for (let i = 0; i < 10; i++) {
    try {
      await page
        .locator("a")
        .getByText(testBadgeTitle)
        .waitFor({ timeout: 1000 });
    } catch (e) {
      if (e.name === "TimeoutError") {
        await page.reload();
        continue;
      }
      throw e;
    }
  }
  const receivedBadges = page.locator(`a:has-text("${testBadgeTitle}")`);
  expect(
    receivedBadges,
    "Expected to have received one badge with the specified title"
  ).toHaveCount(1);
}

/**
 * This assumes that the page already navigated to the backpack page
 * @param {import("playwright/test").Page} page
 */
export async function receiveMicroDegreeBadge(page) {
  // move to the badges tab
  await waitForTabs(page, 5);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(3).click();

  await page
    .locator("bg-learningpathcard")
    .first()
    .waitFor({ timeout: defaultWait });

  // This checks if the micro degree badge appears in the backpack
  const badgeLocator = page.locator("bg-learningpathcard span", {
    hasText: microDegreeTitle,
  });
  await badgeLocator.waitFor({ state: "visible", timeout: defaultWait });

  expect(
    badgeLocator,
    "Expected to have received one badge with the specified title"
  ).toHaveCount(1);
}

/**
 * This assumes that the page already navigated to the received badge page
 *
 * @param {import("playwright/test").Page} page
 */
export async function downloadPdfFromBackpack(page) {
  const moreSvgButton = page.locator('svg[icon="icon_more"]');
  await moreSvgButton.waitFor({ timeout: defaultWait });
  await moreSvgButton.click();

  const dropdownButtons = page.locator('button[role="menuitem"]');
  const pdfExportButton = dropdownButtons.nth(2);
  await pdfExportButton.click();

  await page.waitForSelector("embed", { state: "visible" });
  const downloadButton = page.locator("button#download-pdf-backpack");
  await expect(downloadButton).toBeEnabled({ timeout: defaultWait });
  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  await downloadPromise;
}

/**
 * This assumes that the page already navigated to the received micro degree
 */
export async function downloadMicroDegree(page) {
  const downloadPdfButton = page
    .locator("oeb-button[variant='secondary']")
    .getByText("PDF-Zertifikat herunterladen");
  const downloadPromise = page.waitForEvent("download");
  await downloadPdfButton.click();
  await downloadPromise;
}

/**
 * This assumes that the page already navigated to badge detail page
 */
export async function downloadPdfFromIssuer(page, isMicroDegree = false) {
  if (!isMicroDegree) {
    await waitForTabs(page, 2);
    const tabs = page.locator("hlm-tabs-list > button");
    await tabs.nth(1).click(); // move to recipients tabs
  }

  const certificateButtons = page.locator("button", {
    hasText: "PDF-Zertifikat",
  });
  expect(
    certificateButtons,
    "Only expected one assertion and thus one certificate"
  ).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await certificateButtons.first().click();
  await downloadPromise;
}

/**
 * This assumes that the page already navigated to the badge detail page
 */
export async function revokeBadge(page) {
  await waitForTabs(page, 2);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(1).click(); // move to recipients tabs

  const revokeButton = page.locator('button:has-text("zurücknehmen")');
  await revokeButton.click();

  const confirmDialog = page.locator("confirm-dialog");
  const confirmButton = confirmDialog.locator(
    "button.button:not(.button-secondary)"
  );
  await confirmButton.waitFor({ timeout: defaultWait });
  await confirmButton.click();

  const issuerDatatable = page.locator("issuer-detail-datatable");
  const heading = issuerDatatable.locator("p");
  await expect(heading).toHaveText(/0/, { timeout: defaultWait });
  expect((await heading.textContent()).toLowerCase().trim()).toBe(
    "0 Badge - Empfänger:innen".toLowerCase().trim()
  );
}

/**
 * This assumes that the page already navigated to the backpack page
 */
export async function confirmRevokedBadge(page) {
  const receivedBadges = page.locator(`a:has-text("${testBadgeTitle}")`);
  const count = await receivedBadges.count();
  expect(
    count,

    "Expected to have received no badge with the specified title"
  ).toBe(0);
}

/**
 * Revokes a micro degree from the micro degrees details page.
 * This assumes that the page already navigated to the micro degree detail page.
 *
 * @param {import("playwright/test").Page} page
 */
export async function revokeMicroDegree(page) {
  const revokeButton = page.locator('button:has-text("zurücknehmen")');
  await revokeButton.waitFor({ timeout: defaultWait });
  await revokeButton.click();

  const confirmDialog = page.locator("confirm-dialog");
  const confirmButton = confirmDialog.locator(
    "button.button:not(.button-secondary)"
  );
  await confirmButton.waitFor({ timeout: defaultWait });
  await confirmButton.click();

  const heading = page.locator("h3:has(+ learningpath-graduates-datatable)");
  await expect(heading).toHaveText(/0/, { timeout: defaultWait });
  expect(
    (await heading.textContent()).toLowerCase().trim(),
    "0 Micro Degree-Empfänger:innen".toLowerCase().trim()
  );
}

/**
 * This assumes that the page already navigated to the backpack page
 */
export async function confirmRevokedMicroDegree(page) {
  // this switches to the micro degree tab of the backpack
  await waitForTabs(page, 5);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(3).click();

  await page
    .locator('input[placeholder="Lernpfade durchsuchen"]')
    .waitFor({ timeout: defaultWait });

  const receivedBadges = page.locator(`span:has-text("${microDegreeTitle}")`);
  const count = await receivedBadges.count();
  expect(
    count,
    "Expected to have received no micro degree with the specified title"
  ).toBe(0);
}

/**
 * Deletes a badge via the backend API.
 */
export async function deleteBadgeOverApi(name = testBadgeTitle) {
  const apiToken = await requestToken(username, password);
  expect(apiToken, "Failed to request an API token").toBeTruthy();
  const badge = await findBadge(apiToken, name);
  expect(badge, "Failed to find the badge").toBeTruthy();
  const assertions = await findAssertions(apiToken, badge.entityId);
  const revokationResult = await revokeAssertions(apiToken, assertions);
  expect(
    revokationResult,
    "Revokation for at least one assertion failed, probably because the HTTP response code wasn't 2xx"
  ).toBeTruthy();
  const deletionResult = await deleteBadge(apiToken, badge.entityId);
  expect(
    deletionResult,
    "The badge deletion failed, probably because the HTTP response code wasn't 2xx"
  ).toBeTruthy();
}

export async function validateParticipationBadge(page) {
  const titleElement = page.locator("h1.tw-text-purple");
  const titleText = await titleElement.textContent();
  expect(titleText, testBadgeTitle);

  const descriptionHeading = page.locator('h3:has-text("Kurzbeschreibung")');
  const descriptionElement = descriptionHeading.locator(
    "xpath=following-sibling::p"
  );
  const descriptionText = await descriptionElement.textContent();
  expect(descriptionText).toBe(testBadgeDescription);

  const divElements = page.locator("div.tag");
  expect(await divElements.count()).toBe(1);

  const categoryHeading = page.locator('dt:has-text("Kategorie")');
  const categoryElement = categoryHeading.locator(
    "xpath=following-sibling::dd"
  );
  const categoryText = await categoryElement.textContent();
  expect(categoryText).toBe("Teilnahme-Badge");

  const now = new Date();
  const todayString =
    ("0" + now.getDate()).slice(-2) +
    "." +
    ("0" + (now.getMonth() + 1)).slice(-2) +
    "." +
    now.getFullYear();

  const lastEditedHeading = page.locator('dt:has-text("Zuletzt editiert")');
  const lastEditedElement = lastEditedHeading.locator(
    "xpath=following-sibling::dd"
  );
  const lastEditedTime = lastEditedElement.locator("time");
  const lastEditedText = await lastEditedTime.textContent();
  expect(lastEditedText).toBe(todayString);

  const createdHeading = page.locator('dt:has-text("Erstellt am")');
  const createdElement = createdHeading.locator("xpath=following-sibling::dd");
  const createdTime = createdElement.locator("time");
  const createdText = await createdTime.textContent();
  expect(createdText).toBe(todayString);
}

/**
 *
 * @param {import("playwright/test").Page} page
 */
export async function validateBadge(page, badgeType = "Teilnahme") {
  const titleElement = page.locator("h1.tw-text-purple");
  expect(titleElement).toHaveText(testBadgeTitle);

  const descriptionHeading = page.locator('h3:has-text("Kurzbeschreibung")');
  const descriptionElement = descriptionHeading.locator(
    "xpath=following-sibling::p"
  );
  const descriptionText = await descriptionElement.textContent();
  expect(descriptionText).toBe(testBadgeDescription);

  const divElements = page.locator("div.tag");
  expect(await divElements.count()).toBe(1);

  const category = page
    .locator("dt", { hasText: "Kategorie" })
    .locator(" + dd");
  expect(category).toHaveText(`${badgeType}-Badge`);

  const now = new Date();
  const todayString =
    ("0" + now.getDate()).slice(-2) +
    "." +
    ("0" + (now.getMonth() + 1)).slice(-2) +
    "." +
    now.getFullYear();

  const createdHeading = page.locator('dt:has-text("Erstellt am")');
  const createdElement = createdHeading.locator("xpath=following-sibling::dd");
  const createdTime = createdElement.locator("time");
  const createdText = await createdTime.textContent();
  expect(createdText).toBe(todayString);

  if (badgeType == "Kompetenz") {
    const badgeCompetencies = page.locator("competency-accordion");
    expect(badgeCompetencies).toHaveCount(2);
  }
}

export async function verifyBadgeOverApi() {
  const apiToken = await requestToken(username, password);
  expect(apiToken, "Failed to request an API token").toBeTruthy();
  const badge = await findBadge(apiToken, testBadgeTitle);
  expect(badge, "Failed to find the badge").toBeTruthy();

  expect(badge.name).toBe(testBadgeTitle);
  expect(badge.description).toBe(testBadgeDescription);

  const extensions = badge.extensions;
  const studyLoadExtension = extensions["extensions:StudyLoadExtension"];
  const studyLoad = studyLoadExtension.StudyLoad;
  expect(`${studyLoad / 60}`).toBe(testDuration);
}

/**
 * Creates {@link n} number of badges
 * @param {import('@playwright/test').Page} page
 * @param {number} n Number of badges to create
 */
export async function createBadges(page, n) {
  for (let i = 0; i < n; i++) {
    await navigateToBadgeCreation(page);
    await createBadge(page);
  }
}

/**
 * Creates a micro degree that includes the first {@link n} badges
 * available to the logged‑in user
 * @param {import('@playwright/test').Page} page
 * @param {number} n Number of badges to include
 */
export async function createMicroDegree(page, n) {
  // Initial step: Badge type selection
  const selectedBadgeType = page.locator('[href*="learningpaths/create"]');
  await selectedBadgeType.click();

  await page.waitForSelector("learningpath-edit-form", { state: "visible" });
  const form = page.locator("learningpath-edit-form");

  // Next step: Badge details
  // Title field
  const titleField = form.locator('input[type="text"]');
  await titleField.fill(microDegreeTitle);

  // Description
  const descriptionField = form.locator("textarea");
  await descriptionField.fill(microDegreeDescription);

  // Image field
  // Timeouts between image uploads ensure that the server has time to respond
  // as the images are partially being generated on the server
  await page.waitForTimeout(1000);
  // Testing switching between framed and unframed/owned images is essential as users might experience some issues while doing so
  // 1. Upload own image
  await uploadImage(page, "image_field", 0, testImagePath);
  await page.waitForTimeout(1000);
  // 2. Upload own image (insterted into badge frame)
  await uploadImage(page, "image_field", 1, testImagePath);
  await page.waitForTimeout(1000);
  // 3. Select an image from nounproject
  await selectNounProjectImage(page, nounProjectSearchText);

  // Click next button to move to the next step
  const nextButton = form
    .getByRole("button")
    .getByText("Weiter", { exact: true });
  await nextButton.click();

  // Next step: Add badges to the micro degree
  const badgeCardLocator = form.locator("bg-badgecard");
  const badgeCardCount = await badgeCardLocator.count();
  expect(badgeCardCount).toBeGreaterThanOrEqual(n);
  const selectableCards = badgeCardLocator.filter({
    has: page.locator("a", { hasText: testBadgeTitle }),
  });

  for (let i = 0; i < n; i++) {
    const card = selectableCards.nth(i);
    const checkboxInCard = card.locator('button[role="checkbox"]');
    await checkboxInCard.click();
  }

  // Next step: Order of the badges
  await nextButton.click();
  const firstCard = badgeCardLocator.first();
  const lastCard = badgeCardLocator.last();
  await firstCard.dragTo(lastCard);

  // Next step: Tag and Create
  await nextButton.click();
  await addNewTag(page, tagName);

  // activate Micro Degree
  const activationCheckbox = form.locator('button[role="checkbox"]');
  await activationCheckbox.click();

  await page.getByRole("button").getByText("Lernpfad erstellen").click();

  // The regular expression is for urls of the micro degree like
  // '/issuer/issuers/{issuerID}/learningpaths/{learningpathID}'
  // but it disallows the path where the micro degree is created:
  // '/issuer/issuers/{issuerID}/learningpaths/create'
  await page.waitForURL(
    /\/issuer\/issuers\/[^\/]+\/learningpaths\/(?!create$)[^\/]+$/,
    { timeout: extendedWait }
  );
  await page
    .locator("oeb-learning-path")
    .waitFor({ state: "visible", timeout: extendedWait });
}

/**
 * Deletes the micro degree using api requests without UI
 */
export const deleteMicroDegreeOverApi = () =>
  deleteBadgeOverApi(microDegreeTitle);

/**
 * Deletes the given number of badges via the api, essentially
 * calling {@link deleteBadgeOverApi} multiple times.
 * @param {number} n The number of badges to delete
 */
export async function deleteBadgesOverApi(n) {
  for (let i = 0; i < n; i++) await deleteBadgeOverApi();
}

/**
 * Downloads the JSON file of a badge from the awarded badge details page.
 * @returns {Promise<string>} The content of the json file as string
 */
async function downloadBadgeJson(page) {
  const overflowMenu = page.locator('button:has(svg[icon="icon_more"])');
  await overflowMenu.click();

  const downloadButton = page.locator(
    `button:has-text("Download JSON-Datei (${currentBadgeStandardVersion})")`
  );

  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;
  return text(await download.createReadStream());
}

/**
 * Checks if the badge is conform with the currently implemented
 * open badges version and downloads the badges JSON file
 * to check its conformity.
 * This assumes that the page already nigated to the badge detail page
 * of an awarded badge.
 */
export async function validateBadgeVersion(page) {
  const badgeStandardText = page.locator('dt:has-text("Badge-Standard")');
  const badgeStandardVersion = badgeStandardText.locator(
    "xpath=following-sibling::dd"
  );
  expect(badgeStandardVersion).toContainText(currentBadgeStandardVersion);

  const file = await downloadBadgeJson(page);
  const badgeAsJson = JSON.parse(file);
  expect(typeof badgeAsJson["@context"]).toBe("object");
  expect(
    badgeAsJson["@context"].some((i) => i.includes("/credentials"))
  ).toBeTruthy();
}

/**
 * Uploads an invalid badge to the backpack and checks if an error is shown.
 * This assumes that the page already navigated to an awarded badge
 * that will be reuploaded in a modified way.
 */
export async function validateUploadedInvalidBadge(page) {
  const file = await downloadBadgeJson(page);
  const badge = JSON.parse(file);

  badge["@context"] = [];
  const badgeStringToUpload = JSON.stringify(badge);

  await navigateToBackpack(page);
  await uploadBadgeJson(page, badgeStringToUpload);

  await page
    .locator('oeb-dialog div ng-icon[name="lucideCircleX"]')
    .waitFor({ timeout: defaultWait });
}

/**
 * Assumes to be on the backpack page, uploads a JSON as string
 * to import a badge to the backpack
 * @param {import('@playwright/test').Page} page
 * @param {string} badgeJson JSON string to use for badge importing
 */
async function uploadBadgeJson(page, badgeJson) {
  const uploadButton = page.locator('button:has-text("Badge hochladen")');
  await uploadButton.waitFor({ timeout: defaultWait });
  await uploadButton.click();

  await waitForTabs(page, 5);
  const jsonButton = page.locator("form hlm-tabs-list button:nth-child(3)");
  await jsonButton.waitFor({ timeout: defaultWait });
  await jsonButton.click();

  const jsonTextarea = page.locator('textarea[name="json_eingeben"]');
  await jsonTextarea.fill(badgeJson);

  const sendBadgeForUploadButton = page.locator(
    'button:has-text("Badge hinzufügen")'
  );
  await sendBadgeForUploadButton.click();
}

/**
 * Dismisses notification toast if there is one
 * because it might block the link on the badge card
 * which leads to a selenium error (ElementClickInterceptedException)
 */
async function dismissNotificationToast(page) {
  const notificationDismissButton = page.locator("button.notification-x-close");
  const count = await notificationDismissButton.count();
  if (count > 0) {
    expect(count).toBe(1);
    await notificationDismissButton.first().click();
  }
}

/**
 * Deletes the first imported badge from the backpack, assumes to be
 * on the backpack page.
 */
async function deleteImportedBadgeFromBackpack(page) {
  const importedBadge = page.locator(
    "bg-badgecard:has(div.tw-absolute.tw-top-0) a",
    { hasText: testBadgeTitle }
  );
  await importedBadge.click();

  const overflowMenu = page.locator('button:has(svg[icon="icon_more"])');
  await overflowMenu.click();

  const deleteFromBackpackButton = page.locator("button", {
    hasText: "Badge aus Rucksack löschen",
  });
  await deleteFromBackpackButton.click();

  const confirmDeleteButton = page.locator("button", {
    hasText: "Badge entfernen",
  });
  await confirmDeleteButton.click();
  await page.waitForTimeout(1_000);
}

/**
 * Uploads a v2 badge to the backpack and checks if it gets added properly.
 * This assumes that the page already navigated to an awarded badge
 * that will be reuploaded in a modified way.
 */
export async function validateUploadedV2Badge(page) {
  const file = await downloadBadgeJson(page);

  const badge = JSON.parse(file);
  const v2Url = badge["id"].replace("3_0", "2_0");
  const badgeV2Response = await fetch(v2Url);
  const badgeV2String = await badgeV2Response.text();

  await navigateToBadgeDetails(page);
  await revokeBadge(page);
  await navigateToBackpack(page);

  // move to the badges tab
  await waitForTabs(page, 5);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(1).click();

  await page
    .locator("bg-badgecard")
    .first()
    .waitFor({ state: "attached", timeout: defaultWait });
  const badgesBefore = await page.locator("bg-badgecard").count();

  await uploadBadgeJson(page, badgeV2String);

  await page
    .locator(
      `div:has(div > ng-icon[name="lucideHexagon"]) > p:has-text("${
        badgesBefore + 1
      }")`
    )
    .waitFor({ state: "visible", timeout: defaultWait });

  await dismissNotificationToast(page);
  await deleteImportedBadgeFromBackpack(page);
}

/**
 * Uploads a v3 badge to the backpack and checks if it gets added properly.
 * This assumes that the page already navigated to an awarded badge
 * that will be reuploaded in a modified way.
 */
export async function validateUploadedV3Badge(page) {
  const file = await downloadBadgeJson(page);
  await navigateToBadgeDetails(page);
  await revokeBadge(page);
  await navigateToBackpack(page);

  // move to the badges tab
  await waitForTabs(page, 5);
  const tabs = page.locator("hlm-tabs-list > button");
  await tabs.nth(1).click();

  await page
    .locator("bg-badgecard")
    .first()
    .waitFor({ state: "attached", timeout: defaultWait });
  const badgesBefore = await page.locator("bg-badgecard").count();

  await uploadBadgeJson(page, file);

  await page
    .locator(
      `div:has(div > ng-icon[name="lucideHexagon"]) > p:has-text("${
        badgesBefore + 1
      }")`
    )
    .waitFor({ timeout: defaultWait });

  await dismissNotificationToast(page);
  await deleteImportedBadgeFromBackpack(page);
}
