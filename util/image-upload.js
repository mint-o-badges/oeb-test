import path from "node:path";
import { defaultWait } from "../config.js";
import { ExtendedBy } from "./selection.js";

/**
 * Uploads the image at {@link imagePath} to the {@link n}th element whose id starts with {@link elementId}
 * @param {import('@playwright/test').Page} page
 * @param {string} elementId   Id prefix of the <input type="file"> elements
 * @param {number} nthElement  Zero‑based index of the matching element
 * @param {string} imagePath   Relative path to the image file
 */
export async function uploadImage(page, elementId, nthElement, imagePath) {
  const fields = await page.locator(`[id^='${elementId}']`).all();
  const fileInput = fields[nthElement];
  const absolutePath = path.resolve(imagePath);

  await fileInput.setInputFiles(absolutePath);
  await page
    .locator('img[src^="data:image/png;base64,iVBORw0KGg"]')
    .waitFor({ timeout: defaultWait });
}

/**
 * Opens the Noun‑Project dialog, searches for {@link searchText} and selects the first result.
 * @param {import('@playwright/test').Page} page
 * @param {string} searchText
 */
export async function selectNounProjectImage(page, searchText) {
  const nounProjectOption = await page
    .locator(ExtendedBy.tagWithText("span", "aus bestehenden Icons wählen"))
    .first();
  await nounProjectOption.waitFor({ timeout: defaultWait });
  await nounProjectOption.click();

  const searchField = page.locator("#forminput");
  await searchField.waitFor({ timeout: defaultWait });
  await searchField.fill(searchText);

  const chooseButton = page.locator(
    "tr.datatable-x-row:nth-child(1) > td:nth-child(3) > button:nth-child(1)"
  );
  await chooseButton.waitFor({ timeout: defaultWait });
  await chooseButton.click();

  await page
    .locator('img[src^="data:image/png;base64,iVBORw0KGg"]')
    .waitFor({ timeout: defaultWait });
}
