import { expect } from "@playwright/test";
import { username, password } from "../secret.js";
import { url, defaultWait } from "../config.js";
import { requestToken, findIssuer, deleteIssuer } from "../util/api.js";
import { uploadImage } from "../util/image-upload.js";

const testIssuerName = "automatedTestName";
const testIssuerImagePath = "assets/image.png";
const testIssuerWebsite = "automatedTest.de";
const testIssuerDescription =
  "automatedTestDescription with a minimum length of 200 characters. These are indeed a looot of characters. This seems quite useless, but who am I to judge? I'm just the miserable person writing such a uselessly long description, ain't I.";
const testIssuerStreet = "automatedTestStreet";
const testIssuerStreetnumber = "42";
const testIssuerPostalCode = "4242";
const testLinkedInId = "12345678";
const testIssuerCity = "automatedTestCity";

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export async function navigateToIssuerCreation(page) {
  await page.goto(`${url}/issuer/create`);
  await expect(page).toHaveTitle("Create Issuer - Open Educational Badges");
}

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export async function createIssuer(page) {
  const form = await page.locator("issuer-edit-form");
  await uploadImage(page, "image_field", 0, testIssuerImagePath);

  const textInputs = await page.locator('input[type="text"]').all();
  const numberInputs = await page.locator('input[type="number"]').all();

  await textInputs[0].fill(testIssuerName);
  await page.locator('input[type="url"]').fill(testIssuerWebsite);

  const mailDropdown = page.locator('button[role="combobox"]').nth(0);
  await mailDropdown.click();
  const mailOption = page.locator(`hlm-option:has-text("${username}")`);
  await mailOption.waitFor({ timeout: defaultWait });
  await mailOption.click();

  await page.locator("textarea").fill(testIssuerDescription);

  const categoryDropdown = page.locator('button[role="combobox"]').nth(1);
  await categoryDropdown.click();
  const categoryOption = page.locator("hlm-option").first();
  await categoryOption.waitFor({ timeout: defaultWait });
  await categoryOption.click();

  await textInputs[1].fill(testIssuerStreet);
  await textInputs[2].fill(testIssuerStreetnumber);
  await numberInputs[0].fill(testLinkedInId);
  await numberInputs[1].fill(testIssuerPostalCode);
  await textInputs[3].fill(testIssuerCity);

  await page.locator('button[role="checkbox"]').click();
  await form.locator('button[type="submit"]').click();

  await expect(page).toHaveTitle(
    `Issuer - ${testIssuerName} - Open Educational Badges`,
    {
      timeout: defaultWait,
    }
  );
}

export async function deleteIssuerOverApi() {
  const apiToken = await requestToken(username, password);
  expect(apiToken, "Failed to request an API token");
  const issuer = await findIssuer(apiToken, testIssuerName);
  expect(issuer, "Failed to find the issuer");
  const slug = issuer.slug;
  expect(slug, "Failed to obtain the slug of the issuer");
  const deletionResult = await deleteIssuer(apiToken, slug);
  expect(
    deletionResult,
    "The issuer deletion failed, probably because the HTTP response code wasn't 2xx"
  ).toBeTruthy();
}

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export async function navigateToIssuerDetails(page) {
  await page.goto(`${url}/issuer`);
  const link = page.locator(`a:has-text("${testIssuerName}")`);
  await link.click();
  await expect(page).toHaveTitle(
    `Issuer - ${testIssuerName} - Open Educational Badges`,
    {
      timeout: defaultWait,
    }
  );
}

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export async function verifyIssuerDetails(page) {
  await page.waitForSelector("loading-dots", { state: "detached" });
  const description = await page.getByText(testIssuerDescription);
  expect(description).toBeVisible();
  expect(
    description,
    `Expected exactly one element with the specified description`
  ).toHaveCount(1);
}

export async function verifyIssuerOverApi() {
  const apiToken = await requestToken(username, password);
  expect(apiToken, "Failed to request an API token");
  const issuer = await findIssuer(apiToken, testIssuerName);
  expect(issuer, "Failed to find the issuer");

  expect(issuer.name).toBe(testIssuerName);
  // The url is always pretended with "http://" or "https://"
  expect(issuer.url).toBe(`http://${testIssuerWebsite}`);
  expect(issuer.description).toBe(testIssuerDescription);
  expect(issuer.street).toBe(testIssuerStreet);
  expect(issuer.streetnumber).toBe(testIssuerStreetnumber);
  expect(issuer.zip).toBe(testIssuerPostalCode);
  expect(issuer.city).toBe(testIssuerCity);
}
