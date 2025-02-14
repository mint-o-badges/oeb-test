import {By, until} from 'selenium-webdriver';
import assert from 'assert';
import {url, defaultWait} from '../config.js';
import {ExtendedBy} from '../util/selection.js';
import { login } from './login.js';

const testUserEmail = 'automated@test.de';
const testUserFirstName = 'automated';
const testUserLastName = 'test';
const testUserPassword = 'automatedTestPassword';
const verificationPageTitle = 'Verification - Open Educational Badges';

export async function navigateToSignup(driver) {
    await driver.get(`${url}/signup`);

    let title = await driver.getTitle();
    assert.equal(title, 'Signup - Open Educational Badges');
}

/**
 * This assumes that the driver already navigated to the signup page
 */
export async function signup(driver) {
    const emailField = await driver.findElement(By.css(
        'input[type="email"]'));
    await emailField.sendKeys(testUserEmail);

    const textFields = await driver.findElements(By.css(
        'input[type="text"]'));

    const firstNameField = textFields[0];
    await firstNameField.sendKeys(testUserFirstName);

    const lastNameField = textFields[1];
    await lastNameField.sendKeys(testUserLastName);

    const passwordFields = await driver.findElements(By.css(
        'input[type="password"]'));

    const passwordField = passwordFields[0];
    await passwordField.sendKeys(testUserPassword);

    const passwordRepeatField = passwordFields[1];
    await passwordRepeatField.sendKeys(testUserPassword);

    const checkboxes = await driver.findElements(By.tagName(
        'hlm-checkbox-checkicon'));
    const termsCheckbox = checkboxes[0];
    await termsCheckbox.click();

    const altchaCheckbox = await driver.findElement(By.id(
        'altcha_checkbox'));
    await altchaCheckbox.click();

    await driver.wait(until.elementLocated(By.css(
        'div[data-state="verified"]')), 200*1000);

    const submitButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('Account erstellen'));
    await submitButton.click();

    await driver.wait(until.titleIs('Verification - Open Educational Badges'), defaultWait);
}

// Not sure if we still need these functions so I commented them out.
/* export async function deleteUserOverApi(username = 'automated@test.mail', password = 'automatedTestPassword') {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const deletionResult = await deleteUser(apiToken);
    assert.equal(deletionResult, true, "The user deletion failed, probably because the HTTP response code wasn't 2xx");
} */

/* export async function verifyUserOverApi(username = 'automated@test.mail', password = 'automatedTestPassword') {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const user = await getUser(apiToken);
    assert(user);

    assert.equal(user.email, testUserEmail);
    assert.equal(user.first_name, testUserFirstName);
    assert.equal(user.last_name, testUserLastName);
} */

// This is a replacement of the above function `verifyUserOverApi` which requires the access token.
// Note: access token can only requested after being loged in.
export async function verifyUserByLogin(driver) {
    await login(driver, testUserEmail, testUserPassword, verificationPageTitle);
}

export async function navigateToProfile(driver) {
    await driver.get(`${url}/profile/profile`);

    let title = await driver.getTitle();
    assert.equal(title, 'Profile - Open Educational Badges');
}

/**
 * This assumes that the driver already navigated to the profile page
 */
export async function deleteUserViaUI(driver) {
    const menuButton = await driver.findElement(By.id(
        'trigger2'));
    await menuButton.click();

    const dropdownButtons = await driver.findElements(By.id(
        'menu2'));
    const deleteButton = dropdownButtons[0];
    await deleteButton.click();

    const confirmDeleteButton = await driver.wait(until.elementLocated((By.xpath("//button[text()=' Account löschen ']"))), defaultWait)    
    await confirmDeleteButton.click();

    const deleteSuccessMessage = await driver.wait(until.elementLocated(By.xpath("//p[text()='Account erfolgreich gelöscht']")), defaultWait)
    assert(deleteSuccessMessage, "The user account deletion failed!");
}
