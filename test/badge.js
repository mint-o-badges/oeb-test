import {
    By,
    until,
    Condition
} from 'selenium-webdriver';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url, defaultWait, extendedWait} from '../config.js';
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
import {addNewTag, linkToEduStandards, setBdgeValidaty, addCompetenciesByHand, addCompetenciesViaAI} from '../util/badge-helper.js';
import {uploadImage, selectNounProjectImage} from '../util/image-upload.js';

export const downloadDirectory = '/tmp'

const testBadgeTitle = 'automated test title';
const testBadgeDescription = 'automated test description';
const testDuration = '42';
const testImagePath = 'assets/image.png';
const testAwardName = 'automated test name';
const nounProjectSearchText = 'test';
const aiCompetenciesDescriptionText = 'With solid computer skills, you can automate routine tasks, analyze data more effectively, and communicate with colleagues more efficiently.'
const tagName = 'automated test tag'

/**
 * This requires that there exists a verified issuer for the user associated with the configured credentials
 */
export async function navigateToBadgeCreation(driver) {
    await driver.get(`${url}/issuer/issuers`);

    // Sometimes the title seems to oscillate back and forth, so we
    // wait here as well
    const expectedTitle = 'Issuers - Open Educational Badges';
    driver.wait(until.titleIs(expectedTitle), defaultWait);
    // The rendering process of the issuers page is quite weird,
    // so we wait for that to finish.
    // For that we take the first card (and hope that it's a valid
    // issuer) and wait until it has all three buttons
    const card = await driver.wait(until.elementLocated(
        ExtendedBy.containingText(
            By.css('div.tw-border-purple.tw-grow'),
            By.tagName('span'),
            // Search for "Lernpfad erstellen" because only
            // verified issuers have this button
            'Lernpfad erstellen')),
        defaultWait,
        "Couldn't find card");
    const condition = new Condition("for issuers to have fully loaded",
        async driver => {
            const children = await card.findElements(By.tagName('oeb-button'));
            return children.length === 3;
        });
    await driver.wait(condition, defaultWait,
        "Issuer loading didn't complete");

    await driver.wait(until.elementLocated(
        By.css("[id^='create-new-badge-btn']:not(.disabled)")),
        defaultWait);
    const createBadgeButton = await card.findElement(
        By.css("[id^='create-new-badge-btn']:not(.disabled)"));
    await createBadgeButton.click();

    await driver.wait(until.titleIs('Create Badge - Open Educational Badges'), extendedWait);
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

    const badgeAwardButton = await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('Badge direkt vergeben')),
        defaultWait);
    await badgeAwardButton.click();

    const confirmButton = await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('Badge vergeben')),
        defaultWait,
        "Couldn't find confirm button");
    await confirmButton.click();

    await driver.wait(until.titleIs(`Award Badge - ${testBadgeTitle} - Open Educational Badges`), defaultWait);
}

export async function navigateToBackpack(driver) {
    await driver.get(`${url}/recipient/badges`);

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
export async function createBadge(driver, badgeType = 'Teilnahme') {
    const categoryDropdownButton = await driver.findElement(By.css(
        'button[role="combobox"]'));
    await categoryDropdownButton.click();

    // Category selection 
    await driver.wait(until.elementLocated(
        ExtendedBy.tagWithText('hlm-option', badgeType)), defaultWait);
    const participationOption = await driver.findElement(
        ExtendedBy.tagWithText('hlm-option', badgeType));
    await participationOption.click();

    // Description field
    const shortDescriptionField = await driver.findElement(By.css(
        'textarea'));
    await shortDescriptionField.sendKeys(testBadgeDescription);

    // Duration field
    const durationField = await driver.findElement(By.css(
        'input[type="number"]'));
    await durationField.clear()
    await durationField.sendKeys(testDuration);

    // Title field
    const titleField = await driver.findElement(By.css(
        'input[type="text"]'));
    await titleField.sendKeys(testBadgeTitle);

    // Image field
    // Testing switching between framed and unframed/owned images is essential as users might experience some issues while doing so
    // 1. Upload own image (insterted into badge frame)
    uploadImage(driver, "image_field0", testImagePath);
    // 2. Upload own image
    await uploadImage(driver, "image_field1", testImagePath);
    // 3. Select an image from nounproject
    await selectNounProjectImage(driver, nounProjectSearchText);

    // * Badge with skills - only with competency badge type
    if(badgeType == 'Kompetenz'){
        // Add competencies using AI
        await addCompetenciesViaAI(driver, aiCompetenciesDescriptionText);
        // Add competencies by hand
        await addCompetenciesByHand(driver);
    }
    
    // * Optional Badge-Details
    await addOptionalDetails(driver);

    const submitButton = await driver.findElement(By.id('create-badge-btn'));
    await submitButton.click();
    
    await driver.wait(until.titleIs(`Badge Class - ${testBadgeTitle} - Open Educational Badges`), extendedWait);
}

async function addOptionalDetails(driver){
    // Open optional badge-detail section
    const optionalDetailSection = await driver.findElement(By.id('optional-details'));
    await optionalDetailSection.click();

    // Add new tag
    await addNewTag(driver, tagName);
    // Link badge to educational standards
    await linkToEduStandards(driver);
    // Badge validity
    await setBdgeValidaty(driver);
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

    const htmlEmbed = await driver.wait(until.elementLocated(
        By.css('embed[src^="blob:http"]')), defaultWait);
    await driver.switchTo().frame(htmlEmbed);

    await driver.wait(until.elementLocated(By.css('embed[src="about:blank"]')), defaultWait);

    await driver.switchTo().defaultContent();
    const downloadButton = await driver.findElement(By.id(
        'download-pdf-backpack'));
    await downloadButton.click();

    await waitForDownload(driver, new RegExp(`^${testBadgeTitle} - \\d+\\.pdf$`));
    // TODO: Verify file content
    clearDownloadDirectory();
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
    clearDownloadDirectory();
}

export function clearDownloadDirectory() {
    let regex = /[.]pdf$/
    fs.readdirSync(downloadDirectory)
        .filter(f => regex.test(f))
        .map(f => fs.unlinkSync(downloadDirectory + '/' + f))
}

export async function waitForDownload(driver, regex, timeout = 5000) {
    const condition = new Condition("for download",
        driver => {
            const files = fs.readdirSync(downloadDirectory);
            if (files.length === 0)
                return false;

            let count = 0;
            for (const file of files) {
                if (regex.test(file)) {
                    count++;
                }
            }

            if (count === 0)
                return false;

            assert(count, 1, "Expected one downloaded file");
            return true;
        });
    await driver.wait(condition, timeout,
        "Download didn't finish or file content didn't match the pattern within the specified timeout");
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
    assert.equal(divElements.length, 1);

    const categoryHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Kategorie'));
    const categoryElement = await driver.findElement(
        ExtendedBy.sibling(categoryHeading, By.tagName('dd')));
    const categoryText = await categoryElement.getText();
    assert.equal(categoryText, 'Teilnahme-Badge');

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

export async function validateBadge(driver, badgeType = 'Teilnahme') {
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
    assert.equal(divElements.length, 1);

    const categoryHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Kategorie'));
    const categoryElement = await driver.findElement(
        ExtendedBy.sibling(categoryHeading, By.tagName('dd')));
    const categoryText = await categoryElement.getText();
    assert.equal(categoryText, `${badgeType}-Badge`);

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

    if(badgeType == 'Kompetenz'){
        const BadgeCompetencies = await driver.findElements(By.css('competency-accordion'))
        assert.equal(BadgeCompetencies.length, 3);
    }
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
    // Study-load is in minutes while test-duration is in hours
    assert.equal(studyLoad/60, testDuration);
}
