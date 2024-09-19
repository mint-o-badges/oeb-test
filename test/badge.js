import {By, until, WebElementCondition} from 'selenium-webdriver';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url} from '../config.js';
import path from 'path';
import fs from 'fs';
import {
    requestToken,
    findBadge,
    deleteBadge,
    findAssertions,
    revokeAssertions
} from '../util/api.js';

export const downloadDirectory = './download'

/**
 * This requires that there exists a verified issuer for the user associated with the configured credentials
 */
export async function navigateToBadgeCreation(driver) {
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

export async function navigateToBadgeDetails(driver, name = 'automated test title') {
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
}

/**
 * Expects the badge to have been created already
 */
export async function navigateToBadgeAwarding(driver, name = 'automated test title') {
    await navigateToBadgeDetails(driver, name);

    const badgeAwardButton = await driver.findElement(By.css(
        'oeb-button[ng-reflect-text="Badge direkt vergeben"'));
    badgeAwardButton.click();

    await driver.wait(until.titleIs(`Award Badge - ${name} - Open Educational Badges`), 2000);
}

export async function navigateToBackpack(driver) {
    await driver.get(`${url}/recipient/badges`);

    const title = await driver.getTitle();
    driver.wait(until.titleIs('Backpack - Open Educational Badges'), 2000);
}

export async function navigateToReceivedBadge(driver, badgeName = 'automated test title') {
    await navigateToBackpack(driver);
    const receivedBadgeCard = await driver.findElement(By.css(
        `bg-badgecard[ng-reflect-badge-title="${badgeName}"]`));
    const receivedBadgeLink = await receivedBadgeCard.findElement(By.tagName('a'));
    receivedBadgeLink.click();

    await driver.wait(until.titleIs(`Backpack - ${badgeName} - Open Educational Badges`), 2000);
}

/**
 * This assumes that the driver already navigated to the badge creation page
 */
export async function createBadge(driver) {
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
export async function awardBadge(driver, email = username, badgeName = 'automated test title') {
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
export async function receiveBadge(driver, badgeName = 'automated test title') {
    const receivedBadges = await driver.findElements(By.css(
        `bg-badgecard[ng-reflect-badge-title="${badgeName}"]`));
    assert.equal(receivedBadges.length, 1, "Expected to have received one badge with the specified title");
}

/**
 * This assumes that the driver already navigated to the received badge page
 */
export async function downloadPdfFromBackpack(driver, badgeName = 'automated test title') {
    const moreSvgButton = await driver.findElement(By.css(
        'svg[icon="icon_more"]'));
    await moreSvgButton.click();

    const dropdownButtons = await driver.findElements(By.css(
        'button[role="menuitem"]'));
    const pdfExportButton = dropdownButtons[1];
    await pdfExportButton.click();

    await driver.wait(until.elementLocated(By.css('embed[src^="blob:http"]')));
    const htmlEmbed = await driver.findElement(By.css('embed[src^="blob:http"]'));
    await driver.switchTo().frame(htmlEmbed);

    await driver.wait(until.elementLocated(By.css('embed[src="about:blank"]')));

    await driver.switchTo().defaultContent();
    const downloadButton = await driver.findElement(By.css(
        'button[type="submit"]'));
    await downloadButton.click();

    await waitForPdfDownload(driver, badgeName);
    // TODO: Verify file content
    fs.readdirSync(downloadDirectory).forEach(f => fs.rmSync(`${downloadDirectory}/${f}`));
}

/**
 * This assumes that the driver already navigated to badge detail page
 */
export async function downloadPdfFromIssuer(driver, badgeName = 'automated test title') {
    const certificateButtons = await driver.findElements(By.css(
        'oeb-button[ng-reflect-text="PDF-Zertifikat"]'));
    assert.equal(certificateButtons.length, 1, "Only expected one assertion and thus one certificate");
    await certificateButtons[0].click();

    await waitForPdfDownload(driver, badgeName);
    // TODO: Verify file content
    fs.readdirSync(downloadDirectory).forEach(f => fs.rmSync(`${downloadDirectory}/${f}`));
}

async function waitForPdfDownload(driver, badgeName = 'automated test title') {
    const downloadPoll = resolve => {
        const files = fs.readdirSync(downloadDirectory);
        if (files.length == 0) {
            setTimeout(_ => downloadPoll(resolve), 100);
            return;
        }
        assert(files.length, 1, "Expected one downloaded file");
        const regex = new RegExp(`${badgeName} - \\d+\\.pdf`);
        if (!regex.test(files[0])) {
            setTimeout(_ => downloadPoll(resolve), 100);
            return;
        }
        resolve();
    };
    const pollingPromise = new Promise(downloadPoll);
    await driver.wait(pollingPromise, 20000, "Download didn't finish or file content didn't match the pattern within the specified timeout");
}

/**
 * This assumes that the driver already navigated to the badge detail page
 */
export async function revokeBadge(driver, badgeName = 'automated test title') {
    const revokeButton = await driver.findElement(By.css(
        'oeb-button[ng-reflect-text="zurücknehmen"]'));
    await revokeButton.click();

    const confirmDialog = await driver.findElement(By.tagName('confirm-dialog'));
    const confirmButton = await confirmDialog.findElement(By.css(
        'button.button:not(.button-secondary)'));
    await confirmButton.click();
}

/**
 * This assumes that the driver already navigated to the backpack page
 */
export async function confirmRevokedBadge(driver, badgeName = 'automated test title') {
    const receivedBadges = await driver.findElements(By.css(
        `bg-badgecard[ng-reflect-badge-title="${badgeName}"]`));
    assert.equal(receivedBadges.length, 0, "Expected to have received no badge with the specified title");
}

export async function deleteBadgeOverApi(title = 'automated test title') {
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
