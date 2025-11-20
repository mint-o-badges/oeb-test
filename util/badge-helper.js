import { defaultWait, extendedWait } from "../config.js";
import { setOEBInputValueById } from "./components.js";
import { expect } from "@playwright/test";

export async function addNewTag(page, tagName) {
  await page.waitForSelector('input[placeholder^="Einen Tag eingeben"]', {
    timeout: defaultWait,
  });
  const tagField = page.locator('input[placeholder^="Einen Tag eingeben"]');
  await tagField.fill(tagName);
  // Clicking the button is harder then pushing enter, since the click is intercepted,
  // if the tag is new
  await tagField.press("Enter");
}

export async function setBadgeValidity(page) {
  // Set duration number
  await setOEBInputValueById(page, "duration-number", "2");
  // Set duration type
  const durationDropdownButton = page.locator("#duration-type button");
  await durationDropdownButton.click();
  const monthOption = page.locator("hlm-option", { hasText: "Monate" });
  await monthOption.click();
}

export async function addCompetenciesByHand(page) {
  const competenciesByHandSection = page.locator(
    "#competencies-by-hand-section"
  );
  await competenciesByHandSection.click();

  const addOwnCompetencyButton = page.locator('oeb-button[icon="lucidePlus"]');
  await addOwnCompetencyButton.click();

  await setOEBInputValueById(page, "competencyTitle_0", "competency title");
  await setOEBInputValueById(
    page,
    "competencyDescriptionInput_0",
    "competency description",
    "textarea"
  );
  await setOEBInputValueById(page, "competencyDurationHour_0", "2");
  await setOEBInputValueById(page, "competencyDurationMinutes_0", "30");
  const competencyCategoryDropdownButton = page.locator(
    "#competencyCategory_0"
  );
  await competencyCategoryDropdownButton.click();
  await page.waitForSelector("hlm-option", { timeout: defaultWait });
  const skillOption = page.locator("hlm-option", { hasText: "Fähigkeit" });
  await skillOption.click();
}

export async function addCompetenciesViaAI(
  page,
  aiCompetenciesDescriptionText
) {
  const aiCompetenciesDescField = page.locator("#ai-competencies-description");
  await aiCompetenciesDescField.fill(aiCompetenciesDescriptionText);
  const suggestCompetenciesButton = page.locator("#suggest-competencies-btn");
  await suggestCompetenciesButton.click();

  // Only use first skill to always ensure we have only one resulting in a deterministic
  // total number of competencies
  await page.waitForSelector("#checkboxAiSkill_0", { timeout: extendedWait });
  const firstAISkillCheckbox = page.locator("#checkboxAiSkill_0");
  await firstAISkillCheckbox.click();
  await expect(firstAISkillCheckbox).toBeEnabled({ timeout: defaultWait });
}

/**
 * Waits for (at least) count tabs (i.e. buttons in hlm-tabs-list)
 */
export async function waitForTabs(page, count) {
  await page.waitForFunction(
    (cnt) => document.querySelectorAll("hlm-tabs-list > button").length >= cnt,
    count,
    { timeout: defaultWait }
  );
}
