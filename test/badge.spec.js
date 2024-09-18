import {By, Builder, Browser, until, WebElementCondition} from 'selenium-webdriver';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url} from '../config.js';
import {login} from './login.spec.js';
import path from 'path';
import {requestToken, findBadge, deleteBadge} from '../util/api.js';

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
 * This assumes that the driver already navigated to the badge creation page
 */
async function createBadge(driver) {
    const categoryDropdownButton = await driver.findElement(By.css(
        'button[role="combobox"]'));
    await categoryDropdownButton.click();

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

async function deleteBadgeOverApi(title = 'automated test title') {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const badge = await findBadge(apiToken, title);
    assert(badge, "Failed to find the badge");
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
        await deleteBadgeOverApi();
    });

    after(async () => await driver.quit());
});
