import {By, until, WebElementCondition} from 'selenium-webdriver';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url, defaultWait} from '../config.js';
import path from 'path';
import fs from 'fs';
import {
    requestToken,
    findBadge,
    deleteBadge,
    findAssertions,
    revokeAssertions
} from '../util/api.js';
import {ExtendedBy} from '../util/selection.js';

export const downloadDirectory = './download'

const testBadgeTitle = 'automated test title';
const testBadgeDescription = 'automated test description';
const testDuration = '42';
const testImagePath = 'assets/image.png';
const testAwardName = 'automated test name';

/**
 * This requires that there exists a verified issuer for the user associated with the configured credentials
 */
export async function navigateToBadgeCreation(driver) {
    await driver.get(`${url}/issuer/issuers`);

    let title = await driver.getTitle();
    assert.equal(title, 'Issuers - Open Educational Badges');

    const newBadgeButtonLocator = ExtendedBy.containingText(
        By.css('oeb-button:not(.disabled)'), By.tagName('span'),
        'Neuen Badge erstellen');
    await driver.wait(until.elementLocated(newBadgeButtonLocator), defaultWait);

    const createBadgeButton = await driver.findElement(newBadgeButtonLocator);
    createBadgeButton.click();
    await driver.wait(until.titleIs('Create Badge - Open Educational Badges'), defaultWait);
}

export async function navigateToBadgeDetails(driver) {
    // This ensures that the same issuer is used as for the created badge
    await navigateToBadgeCreation(driver);

    await driver.wait(until.elementLocated(By.css('span.breadcrumbs-x-text')), defaultWait);
    const breadcrumbs = await driver.findElements(By.css(
        'span.breadcrumbs-x-text'));
    const issuerBreadcrumb = breadcrumbs[1];
    issuerBreadcrumb.click();

    await driver.wait(until.titleMatches(/Issuer - .* - Open Educational Badges/), defaultWait);

    await driver.wait(until.elementLocated(
        By.css('span.tw-text-oebblack')), defaultWait);
    const spans = Array.from(await driver.findElements(
        By.css('span.tw-text-oebblack')));
    for (const span of spans) {
        const text = await span.getText();
        if (text === testBadgeTitle) {
            span.click();
            break;
        }
    }

    await driver.wait(until.titleIs(`Badge Class - ${testBadgeTitle} - Open Educational Badges`), defaultWait);
}

/**
 * Expects the badge to have been created already
 */
export async function navigateToBadgeAwarding(driver) {
    await navigateToBadgeDetails(driver);

    await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('Badge direkt vergeben')), defaultWait);
    const badgeAwardButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('Badge direkt vergeben'));
    badgeAwardButton.click();

    await driver.wait(until.titleIs(`Award Badge - ${testBadgeTitle} - Open Educational Badges`), defaultWait);
}

export async function navigateToBackpack(driver) {
    await driver.get(`${url}/recipient/badges`);

    const title = await driver.getTitle();
    driver.wait(until.titleIs('Backpack - Open Educational Badges'), defaultWait);
}

export async function navigateToReceivedBadge(driver) {
    await navigateToBackpack(driver);
    await driver.wait(until.elementLocated(By.linkText(testBadgeTitle)), defaultWait);
    const receivedBadgeLink = await driver.findElement(By.linkText(testBadgeTitle));
    receivedBadgeLink.click();

    await driver.wait(until.titleIs(`Backpack - ${testBadgeTitle} - Open Educational Badges`), defaultWait);
}

/**
 * This assumes that the driver already navigated to the badge creation page
 */
export async function createBadge(driver) {
    const categoryDropdownButton = await driver.findElement(By.css(
        'button[role="combobox"]'));
    await categoryDropdownButton.click();

    // TODO: Also create competency badge
    await driver.wait(until.elementLocated(
        ExtendedBy.tagWithText('hlm-option', 'Teilnahme')), defaultWait);
    const participationOption = await driver.findElement(
        ExtendedBy.tagWithText('hlm-option', 'Teilnahme'));
    await participationOption.click();

    const shortDescriptionField = await driver.findElement(By.css(
        'textarea'));
    await shortDescriptionField.sendKeys(testBadgeDescription);

    const durationField = await driver.findElement(By.css(
        'input[type="number"]'));
    await durationField.sendKeys(testDuration);

    const titleField = await driver.findElement(By.css(
        'input[type="text"]'));
    await titleField.sendKeys(testBadgeTitle);

    const imageField = await driver.findElement(By.id('image_field0'));
    const image = path.resolve(testImagePath);
    await imageField.sendKeys(image);

    await driver.wait(until.elementLocated(By.css(
        'img[src^="data:image/png;base64,iVBORw0KGg"]')), defaultWait);

    // TODO: Optionale Badge-Details
    const submitButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('Badge erstellen'));
    submitButton.click();

    await driver.wait(until.titleIs(`Badge Class - ${testBadgeTitle} - Open Educational Badges`), 20000);
}

/**
 * This assumes that the driver already navigated to the badge awarding page
 */
export async function awardBadge(driver, email = username) {
    const nameField = await driver.findElement(By.css(
        'input[type="text"]'));
    await nameField.sendKeys(testAwardName);

    const identifierField = await driver.findElement(By.css(
        'input[type="email"]'));
    await identifierField.sendKeys(email);

    // TODO: optional details

    const submitButton = await driver.findElement(By.css(
        'button[type="submit"].tw-relative'));
    submitButton.click();

    await driver.wait(until.titleIs(`Badge Class - ${testBadgeTitle} - Open Educational Badges`), 20000);
}

/**
 * This assumes that the driver already navigated to the backpack page
 */
export async function receiveBadge(driver) {
    await driver.wait(until.elementLocated(By.linkText(testBadgeTitle)), defaultWait);
    const receivedBadges = await driver.findElements(By.linkText(
        testBadgeTitle));
    assert.equal(receivedBadges.length, 1, "Expected to have received one badge with the specified title");
}

/**
 * This assumes that the driver already navigated to the received badge page
 */
export async function downloadPdfFromBackpack(driver) {
    const moreSvgButton = await driver.findElement(By.css(
        'svg[icon="icon_more"]'));
    await moreSvgButton.click();

    const dropdownButtons = await driver.findElements(By.css(
        'button[role="menuitem"]'));
    const pdfExportButton = dropdownButtons[1];
    await pdfExportButton.click();

    await driver.wait(until.elementLocated(By.css('embed[src^="blob:http"]')), defaultWait);
    const htmlEmbed = await driver.findElement(By.css('embed[src^="blob:http"]'));
    await driver.switchTo().frame(htmlEmbed);

    await driver.wait(until.elementLocated(By.css('embed[src="about:blank"]')), defaultWait);

    await driver.switchTo().defaultContent();
    const downloadButton = await driver.findElement(By.css(
        'button[type="submit"]'));
    await downloadButton.click();

    await waitForDownload(driver, new RegExp(`^${testBadgeTitle} - \\d+\\.pdf$`));
    // TODO: Verify file content
    fs.readdirSync(downloadDirectory).forEach(f => fs.rmSync(`${downloadDirectory}/${f}`));
}

/**
 * This assumes that the driver already navigated to badge detail page
 */
export async function downloadPdfFromIssuer(driver) {
    await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('PDF-Zertifikat')),
        defaultWait);
    const certificateButtons = await driver.findElements(
        ExtendedBy.submitButtonWithText('PDF-Zertifikat'));
    assert.equal(certificateButtons.length, 1, "Only expected one assertion and thus one certificate");
    await certificateButtons[0].click();

    await waitForDownload(driver, new RegExp(`^${testBadgeTitle} - \\d+\\.pdf$`));
    // TODO: Verify file content
    fs.readdirSync(downloadDirectory).forEach(f => fs.rmSync(`${downloadDirectory}/${f}`));
}

export async function waitForDownload(driver, regex, timeout = 5000) {
    let pollId;
    const downloadPoll = resolve => {
        const files = fs.readdirSync(downloadDirectory);
        if (files.length === 0) {
            pollId = setTimeout(_ => downloadPoll(resolve), 100);
            return;
        }
        assert(files.length, 1, "Expected one downloaded file");
        if (!regex.test(files[0])) {
            pollId = setTimeout(_ => downloadPoll(resolve), 100);
            return;
        }
        clearTimeout(pollId);
        resolve();
    };
    const pollingPromise = new Promise(downloadPoll);
    try {
        await driver.wait(pollingPromise, timeout, "Download didn't finish or file content didn't match the pattern within the specified timeout");
    } catch(error) {
        clearTimeout(pollId);
        throw error;
    }
}

/**
 * This assumes that the driver already navigated to the badge detail page
 */
export async function revokeBadge(driver) {
    await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('zurücknehmen')),
        defaultWait);
    const revokeButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('zurücknehmen'));
    await revokeButton.click();

    const confirmDialog = await driver.findElement(By.tagName('confirm-dialog'));
    const confirmButton = await confirmDialog.findElement(By.css(
        'button.button:not(.button-secondary)'));
    await confirmButton.click();

    const issuerDatatable = await driver.findElement(By.tagName(
        'issuer-detail-datatable'));
    const heading = await issuerDatatable.findElement(By.tagName('h3'));
    await driver.wait(until.elementTextIs(heading, '0 Badge Empfänger:innen'), defaultWait);
}

/**
 * This assumes that the driver already navigated to the backpack page
 */
export async function confirmRevokedBadge(driver) {
    const receivedBadges = await driver.findElements(By.linkText(
        testBadgeTitle));
    assert.equal(receivedBadges.length, 0, "Expected to have received no badge with the specified title");
}

export async function deleteBadgeOverApi() {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const badge = await findBadge(apiToken, testBadgeTitle);
    assert(badge, "Failed to find the badge");
    const assertions = await findAssertions(apiToken, badge.entityId);
    const revokationResult = await revokeAssertions(apiToken, assertions);
    assert.equal(revokationResult, true,
        "Revokation for at least one assertion failed, probably because the HTTP response code wasn't 2xx");
    const deletionResult = await deleteBadge(apiToken, badge.entityId);
    assert.equal(deletionResult, true,
        "The badge deletion failed, probably because the HTTP response code wasn't 2xx");
}

export async function validateParticipationBadge(driver) {
    const titleElement = await driver.findElement(By.css(
        'h1.tw-text-purple'));
    const titleText = await titleElement.getText();
    assert.equal(titleText, testBadgeTitle);

    const descriptionHeading = await driver.findElement(
        ExtendedBy.tagWithText('h3', 'Kurzbeschreibung'));
    const descriptionElement = await driver.findElement(
        ExtendedBy.sibling(descriptionHeading, By.tagName('p')));
    const descriptionText = await descriptionElement.getText();
    assert.equal(descriptionText, testBadgeDescription);

    const divElements = await driver.findElements(By.css('div.tag'));
    assert.equal(divElements.length, 0);

    const categoryHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Kategorie'));
    const categoryElement = await driver.findElement(
        ExtendedBy.sibling(categoryHeading, By.tagName('dd')));
    const categoryText = await categoryElement.getText();
    // TODO: It seems the text *should* be "Teilnahme-Badge"
    assert.equal(categoryText, 'Teilnahme- Badge');

    const now = new Date();
    // Construct date string. Make sure that there are leading 0s
    const todayString = ('0' + now.getDate()).slice(-2) + '.'
        + ('0' + (now.getMonth()+1)).slice(-2) + '.'
        + now.getFullYear();

    const lastEditedHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Zuletzt editiert'));
    const lastEditedElement = await driver.findElement(
        ExtendedBy.sibling(lastEditedHeading, By.tagName('dd')));
    const lastEditedTime = await lastEditedElement.findElement(
        By.tagName('time'));
    const lastEditedText = await lastEditedTime.getText();
    assert.equal(lastEditedText, todayString);

    const createdHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Erstellt am'));
    const createdElement = await driver.findElement(
        ExtendedBy.sibling(createdHeading, By.tagName('dd')));
    const createdTime = await createdElement.findElement(
        By.tagName('time'));
    const createdText = await createdTime.getText();
    assert.equal(createdText, todayString);
}

export async function verifyBadgeOverApi() {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const badge = await findBadge(apiToken, testBadgeTitle);
    assert(badge, "Failed to find the badge");

    assert.equal(badge.name, testBadgeTitle);
    assert.equal(badge.description, testBadgeDescription);

    const extensions = badge.extensions;
    const studyLoadExtension = extensions['extensions:StudyLoadExtension'];
    const studyLoad = studyLoadExtension.StudyLoad;
    assert.equal(studyLoad, testDuration);
}
