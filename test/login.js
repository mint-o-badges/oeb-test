import { username, password } from "../secret.js";
import { url, defaultWait } from "../config.js";
import { expect } from "@playwright/test";

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} userName
 * @param {string} userPassword
 * @param {string} pageTitle
 */
export async function login(
  page,
  userName = username,
  userPassword = password,
  pageTitle = issuersPageTitle
) {
  await page.goto(`${url}/auth/login`);
  await expect(page).toHaveTitle(
    "Login - Open Educational Badges",
    defaultWait
  );

  await page.fill('input[placeholder="Deine E-Mail-Adresse"]', userName);
  await page.fill('input[placeholder="Dein Passwort"]', userPassword);

  const loginForm = page.locator("login");
  await loginForm.getByRole("button", { name: /login|einloggen/i }).click();

  await expect(page).toHaveTitle(pageTitle, defaultWait);

  await acceptTerms(page);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function acceptTerms(page) {
  // The box to accept terms only appears in a later step in
  // rendering; first the issuer page is shown. Thus we wait
  // a second to check if it appears then. If it didn't appear
  // within a second, we just hope it never will.
  const headingLocator = page.locator("h1", {
    hasText: "Neue Nutzungsbedingungen",
  });

  try {
    // Wait up to 1 s for the heading; if it never appears we skip the flow.
    await headingLocator.waitFor({ timeout: 1_000 });

    // The terms container is the parent of the heading.
    const termsBox = headingLocator.locator(".."); // parent element

    await termsBox.locator("hlm-checkbox-check").click();
    await termsBox.locator("button").click();
    await page.goto(`${url}/issuer`);
    await expect(page).toHaveTitle(issuersPageTitle, defaultWait);
  } catch (e) {
    // If the heading never appears, there are no new terms – just return.
    return;
  }
}
