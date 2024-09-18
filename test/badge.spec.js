import {By, Builder, Browser, until, WebElementCondition} from 'selenium-webdriver';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url} from '../config.js';
import {login} from './login.spec.js';
import path from 'path';
import {requestToken, findBadge, deleteBadge, findAssertions, revokeAssertions} from '../util/api.js';

/**
 * This requires that there exists a verified issuer for the user associated with the configured credentials
 */
async function navigateToBadgeCreation(driver) {
    await driver.get(`${url}/issuer/issuers`);

    let title = await driver.getTitle();
    assert.equal(title, 'Issuers - Open Educational Badges');

    const newBadgeButtonLocator = By.css(
        'oeb-button[ng-reflect-text="Neuen Badge erstellen"][ng-reflect-disabled="false"]');
    await driver.wait(until.elementLocated(newBadgeButtonLocator), 2000);

    const createBadgeButton = await driver.findElement(newBadgeButtonLocator);
    createBadgeButton.click();
    await driver.wait(until.titleIs('Create Badge - Open Educational Badges'), 2000);
}

/**
 * Expects the badge to have been created already
 */
async function navigateToBadgeAwarding(driver, name = 'automated test title') {
    // This ensures that the same issuer is used as for the created badge
    await navigateToBadgeCreation(driver);

    const breadcrumbs = await driver.findElements(By.css(
        'span.breadcrumbs-x-text'));
    const issuerBreadcrumb = breadcrumbs[1];
    issuerBreadcrumb.click();

    await driver.wait(until.titleMatches(/Issuer - .* - Open Educational Badges/), 2000);

    const badgeLink = await driver.findElement(By.js(() => {
        const elements = document.querySelectorAll('span.tw-text-oebblack')
        const elementArray = Array.from(elements);
        return elementArray.find(node => node.textContent = 'Bild Test');
    }));
    badgeLink.click();

    await driver.wait(until.titleIs(`Badge Class - ${name} - Open Educational Badges`), 2000);

    const badgeAwardButton = await driver.findElement(By.css(
        'oeb-button[ng-reflect-text="Badge direkt vergeben"'));
    badgeAwardButton.click();

    await driver.wait(until.titleIs(`Award Badge - ${name} - Open Educational Badges`), 2000);
}

async function navigateToBackpack(driver) {
    await driver.get(`${url}/recipient/badges`);

    let title = await driver.getTitle();
    assert.equal(title, 'Backpack - Open Educational Badges');
}

/**
 * This assumes that the driver already navigated to the badge creation page
 */
async function createBadge(driver) {
    const categoryDropdownButton = await driver.findElement(By.css(
        'button[role="combobox"]'));
    await categoryDropdownButton.click();

    // TODO: Also create competency badge
    const participationOption = await driver.findElement(By.css(
        'hlm-option[ng-reflect-value="participation"]'));
    participationOption.click();

    const shortDescriptionField = await driver.findElement(By.css(
        'textarea'));
    await shortDescriptionField.sendKeys('automated test description');

    const durationField = await driver.findElement(By.css(
        'input[type="number"]'));
    await durationField.sendKeys('42');

    const titleField = await driver.findElement(By.css(
        'input[type="text"]'));
    await titleField.sendKeys('automated test title');

    const imageField = await driver.findElement(By.id('image_field0'));
    const image = path.resolve('assets/image.png');
    await imageField.sendKeys(image);

    await driver.wait(until.elementLocated(By.css(
        'img[src^="data:image/png;base64,iVBORw0KGg"]')));

    // TODO: Optionale Badge-Details
    const submitButton = await driver.findElement(By.css(
        'oeb-button[ng-reflect-text="Badge erstellen"]'));
    submitButton.click();

    await driver.wait(until.titleIs('Badge Class - automated test title - Open Educational Badges'), 20000);
}

/**
 * This assumes that the driver already navigated to the badge awarding page
 */
async function awardBadge(driver, email = username, badgeName = 'automated test title') {
    const nameField = await driver.findElement(By.css(
        'input[type="text"]'));
    await nameField.sendKeys('automated test name');

    const identifierField = await driver.findElement(By.css(
        'input[type="email"]'));
    await identifierField.sendKeys(email);

    // TODO: optional details

    const submitButton = await driver.findElement(By.css(
        'button[type="submit"].tw-relative'));
    submitButton.click();

    await driver.wait(until.titleIs(`Badge Class - ${badgeName} - Open Educational Badges`), 20000);
}

/**
 * This assumes that the driver already navigated to the backpack page
 */
async function receiveBadge(driver, badgeName = 'automated test title') {
    const receivedBadges = await driver.findElements(By.css(
        `bg-badgecard[ng-reflect-badge-title="${badgeName}"]`));
    assert.equal(receivedBadges.length, 1, "Expected to have received one badge with the specified title");
}

async function deleteBadgeOverApi(title = 'automated test title') {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const badge = await findBadge(apiToken, title);
    assert(badge, "Failed to find the badge");
    const assertions = await findAssertions(apiToken, badge.entityId);
    const revokationResult = await revokeAssertions(apiToken, assertions);
    assert.equal(revokationResult, true,
        "Revokation for at least one assertion failed, probably because the HTTP response code wasn't 2xx");
    const deletionResult = await deleteBadge(apiToken, badge.entityId);
    assert.equal(deletionResult, true,
        "The badge deletion failed, probably because the HTTP response code wasn't 2xx");
}

describe('Badge Test', function() {
    this.timeout(30000);
    let driver;

    before(async () => driver = await new Builder().forBrowser(Browser.CHROME).build());

    // This requires that there exists a verified issuer for the user associated with the configured credentials
    it('should create a participation badge', async function() {
        await login(driver);
        await navigateToBadgeCreation(driver);
        await createBadge(driver);
    });

    it('should award the badge', async function() {
        await navigateToBadgeAwarding(driver);
        await awardBadge(driver);
    });

    it('should receive the badge', async function() {
        await navigateToBackpack(driver);
        await receiveBadge(driver);
    });

    after(async () => {
        await deleteBadgeOverApi();
        await driver.quit();
    });
});
