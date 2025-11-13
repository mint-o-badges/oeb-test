import { url, defaultWait } from "../config.js";
import { requestToken, deleteUser, getUser } from "../util/api.js";
import { login } from "./login.js";
import { expect } from "@playwright/test";

const testUserEmail = "automated@test.de";
const testUserFirstName = "automated";
const testUserLastName = "test";
const testUserPassword = "automatedTestPassword1!";
const verificationPageTitle = "Verification - Open Educational Badges";

export async function navigateToSignup(page) {
  await page.goto(`${url}/signup`);
  await expect(page).toHaveTitle(
    "Signup - Open Educational Badges",
    defaultWait
  );
}

/**
 * This assumes `page` is already on the signup URL.
 */
export async function signup(page) {
  await page.fill('input[type="email"]', testUserEmail);
  const textFields = await page.locator('input[type="text"]').all();
  await textFields[0].fill(testUserFirstName);
  await textFields[1].fill(testUserLastName);

  const passwordFields = await page.locator('input[type="password"]').all();
  await passwordFields[0].fill(testUserPassword);
  await passwordFields[1].fill(testUserPassword);

  await page.locator('button[role="checkbox"]').first().click();

  await page.locator("#altcha_checkbox").click();

  await page.waitForSelector('div[data-state="verified"]', {
    timeout: 200_000,
  });

  await page.getByRole("button", { name: "Account erstellen" }).click();

  await expect(page).toHaveTitle(
    "Verification - Open Educational Badges",
    defaultWait
  );
}

export async function verifyUserOverApi(
  username = testUserEmail,
  password = testUserPassword
) {
  const apiToken = await requestToken(username, password);
  expect(apiToken, "Failed to request an API token").toBeTruthy();
  const user = await getUser(apiToken);
  expect(user).toBeTruthy();

  expect(user.email).toBe(testUserEmail);
  expect(user.first_name).toBe(testUserFirstName);
  expect(user.last_name).toBe(testUserLastName);
}

export async function loginToCreatedAccount(page) {
  await login(page, testUserEmail, testUserPassword, verificationPageTitle);
}

export async function navigateToProfile(page) {
  await page.goto(`${url}/profile/profile`);
  await expect(page).toHaveTitle(
    "Profile - Open Educational Badges",
    defaultWait
  );
}

export async function deleteUserOverApi(
  username = testUserEmail,
  password = testUserPassword
) {
  const apiToken = await requestToken(username, password);
  // If the token request returns an error, the user was already removed via UI.
  if (apiToken.error) return;

  expect(apiToken, "Failed to request an API token").toBeTruthy();
  const deletionResult = await deleteUser(apiToken);
  if (!deletionResult) {
    throw new Error(
      "The user deletion failed, probably because the HTTP response code wasn't 2xx"
    );
  }
}

/**
 * Delete a user via the UI.
 * Assumes the page is already on the profile screen.
 */
export async function deleteUserViaUI(page) {
  await page.locator("#trigger2").click();

  const deleteButton = page.locator("#menu2").first();
  await deleteButton.click();

  const confirmBtn = page.getByRole("button", { name: "Account löschen" });
  await confirmBtn.click();

  // wait for navigation to the start page (URL pattern /public/start…)
  await page.waitForURL(/\/public\/start[^\/]*$/, {
    timeout: defaultWait,
  });
}
