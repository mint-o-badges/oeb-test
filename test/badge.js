import {
    By,
    until,
    Condition
} from 'selenium-webdriver';
import { Actions } from 'selenium-webdriver/lib/input.js';
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

export const downloadDirectory = '/tmp';

const testBadgeTitle = 'automated test title';
const testBadgeDescription = 'automated test description';
const testDuration = '42';
const testImagePath = 'assets/image.png';
const testAwardName = 'automated test name';
const nounProjectSearchText = 'test';
const aiCompetenciesDescriptionText = 'With solid computer skills, you can automate routine tasks, analyze data more effectively, and communicate with colleagues more efficiently.';
const tagName = 'automated test tag';
const microDegreeTitle = 'automated micro degree';
const microDegreeDescription = 'automated micro degree description';


/**
 * This requires that there exists a verified issuer for the user associated with the configured credentials
 */
export async function navigateToBadgeCreation(driver) {
    await driver.get(`${url}/issuer/issuers`);

    // Sometimes the title seems to oscillate back and forth, so we
    // wait here as well
    const expectedTitle = 'Issuers - Open Educational Badges';
    driver.wait(until.titleIs(expectedTitle), defaultWait);

    await driver.wait(until.elementLocated(
        By.css("[id^='create-new-badge-btn']:not(.disabled)")),
        defaultWait);
    const createBadgeButton = await driver.findElement(
        By.css("[id^='create-new-badge-btn']:not(.disabled)"));
    await createBadgeButton.click();

    await driver.wait(until.titleIs('Badge erstellen - Open Educational Badges'), extendedWait);
}

/**
 * Navigates to the badge details of the badge created during automation.
 * If multiple badges are created, use {@link skip} to skip an entry and choose
 * the next available badge instead.
 * @param {import('selenium-webdriver').ThenableWebDriver} driver 
 * @param {number} skip Number of badges to skip before selecting the badge to navigate to
 */
export async function navigateToBadgeDetails(driver, skip = 0) {
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
    let toSkip = skip;
    for (const span of spans) {
        const text = await span.getText();
        if (text === testBadgeTitle) {
            if(toSkip === 0) {
                span.click();
                break;
            }
            toSkip--;
        }
    }

    await driver.wait(until.titleIs(`Badge Class - ${testBadgeTitle} - Open Educational Badges`), defaultWait);
}

export async function navigateToMicroDegreeDetails(driver) {
    // This ensures that the same issuer is used as for the created badge
    await navigateToBadgeCreation(driver);

    await driver.wait(until.elementLocated(By.css('span.breadcrumbs-x-text')), defaultWait);
    const breadcrumbs = await driver.findElements(By.css(
        'span.breadcrumbs-x-text'));
    const issuerBreadcrumb = breadcrumbs[1];
    issuerBreadcrumb.click();

    await driver.wait(until.titleMatches(/Issuer - .* - Open Educational Badges/), defaultWait);

    await driver.wait(until.elementLocated(
        By.css('hlm-tabs-list')), defaultWait);
    const tabs = Array.from(await driver.findElements(
        By.css('hlm-tabs-list > button')));
    await tabs[1].click();

    // For the load
    await driver.wait(until.elementsLocated(By.css("learningpaths-datatable")));

    const receivedMicroDegreeLink = await driver.findElement(
        ExtendedBy.tagWithText("span", microDegreeTitle));
    await receivedMicroDegreeLink.click();
}

/**
 * Navigates to the badge awarding page, expects the badge to have been created already.
 * If multiple badges are created during testing, use {@link skip} to skip
 * over entries and choose the next badge to navigate to.
 * @param {import('selenium-webdriver').ThenableWebDriver} driver 
 * @param {number} skip Number of badges to skip before selecting the one to navigate to
 */
export async function navigateToBadgeAwarding(driver, skip = 0) {
    await navigateToBadgeDetails(driver, skip);

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

export async function navigateToReceivedMicroDegree(driver) {
    // this switches to the micro degree tab of the backpack
    const tabs = await driver.findElements(By.css("hlm-tabs-list > button"));
    await tabs[2].click();

    // For the load
    await driver.wait(until.elementsLocated(By.css("bg-learningpathcard")));

    const receivedMicroDegreeLink = await driver.findElement(
        ExtendedBy.tagWithText("span", microDegreeTitle));
    await receivedMicroDegreeLink.click();

    await driver.wait(until.titleIs(`LearningPath - Open Educational Badges`), defaultWait);
}

/**
 * This assumes that the driver already navigated to the badge creation page
 */
export async function createBadge(driver, badgeType = 'participation') {
    // Initial step: Badge type selection
    const selectedBadgeType = await driver.wait(
        until.elementLocated(By.css(`[href*='${badgeType}']`)), 
        defaultWait);
    await selectedBadgeType.click();

    // Click step 2, as sometimes it goes to 3rd step directly after step 1
    const step2 = await driver.findElement(
        ExtendedBy.tagWithText('div', '2'));
    await step2.click();

    // Next step: Badge details
    // Title field
    const titleField = await driver.findElement(By.css(
        'input[type="text"]'));
    await titleField.sendKeys(testBadgeTitle);
    // Duration field
    const durationField = await driver.findElement(By.css(
        'input[type="number"]'));
    await durationField.clear()
    await durationField.sendKeys(testDuration);
    // Description field
     const shortDescriptionField = await driver.findElement(By.css(
        'textarea'));
    await shortDescriptionField.sendKeys(testBadgeDescription);
    // Image field
    // Testing switching between framed and unframed/owned images is essential as users might experience some issues while doing so
    // 1. Upload own image (insterted into badge frame)
    await uploadImage(driver, "image_field", 2, testImagePath);
    // 2. Upload own image
    await uploadImage(driver, "image_field", 1, testImagePath);
    // 3. Select an image from nounproject
    await selectNounProjectImage(driver, nounProjectSearchText);

    // Click next button to move to the next step
    const nextButton = await driver.findElement(
        ExtendedBy.tagWithText('span', 'Weiter'));
    await nextButton.click();

    // Next step: Add skills - only with competency badge type
    if(badgeType == 'competency'){
        // Add competencies using AI
        await addCompetenciesViaAI(driver, aiCompetenciesDescriptionText);
        // Add competencies by hand
        await addCompetenciesByHand(driver);

        // Click next button to move to the next step
        await nextButton.click();
    }

    // Next step: Add new tag
    await addNewTag(driver, tagName);
    // Click next button to move to the next step
    await nextButton.click();
    
    // Final step: add optional details then submit badge
    await addOptionalDetails(driver);

    const submitButton = await driver.findElement(By.id('create-badge-btn'));
    await submitButton.click();
    
    await driver.wait(until.titleIs(`Badge Class - ${testBadgeTitle} - Open Educational Badges`), extendedWait);
}

async function addOptionalDetails(driver){
    // Open optional badge-detail section
    const optionalDetailSection = await driver.findElement(By.id('optional-details'));
    await optionalDetailSection.click();
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
 * This assumes that the driver already navigated to the backpack page
 */
export async function receiveMicroDegreeBadge(driver) {
    // This checks if the micro degree badge appears in the backpack
    await driver.wait(until.elementLocated(By.linkText(microDegreeTitle)), defaultWait);
    const receivedBadges = await driver.findElements(By.linkText(
        microDegreeTitle));
    assert.equal(receivedBadges.length, 1, "Expected to have received one micro degree badge with the specified title");
}

/**
 * This assumes that the driver already navigated to the received badge page
 */
export async function downloadPdfFromBackpack(driver) {
    await driver.wait(until.elementLocated(By.css(
        'svg[icon="icon_more"]')), defaultWait);
    const moreSvgButton = await driver.findElement(By.css(
        'svg[icon="icon_more"]'));
    await moreSvgButton.click();

    const dropdownButtons = await driver.findElements(By.css(
        'button[role="menuitem"]'));
    const pdfExportButton = dropdownButtons[2];
    await pdfExportButton.click();

    await driver.wait(until.elementLocated(By.css('embed[src="about:blank"]')), defaultWait);

    await driver.switchTo().defaultContent();
    const downloadButton = await driver.findElement(By.id('download-pdf-backpack'));
    // Wait for download button to be enabled
    await driver.wait(until.elementIsEnabled(downloadButton), defaultWait);
    await downloadButton.click();

    await waitForDownload(driver, new RegExp(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_ ]+\.pdf$/));
    // TODO: Verify file content
    clearDownloadDirectory();
}

/**
 * This assumes that the driver already navigated to the received micro degree
 */
export async function downloadMicroDegree(driver) {
    const downloadPdfButton = driver.findElement(
        By.css("oeb-button[variant='secondary']")
    );

    await downloadPdfButton.click();

    await waitForDownload(driver, new RegExp(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_ ]+\.pdf$/));
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

    await waitForDownload(driver, new RegExp(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_ ]+\.pdf$/));
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
    const crdownloadRegExp = new RegExp(regex.source + "\.crdownload", regex.flags);
    const condition = new Condition("for download",
        driver => {
            // Block until all downloads are finished (indicated by .crdownload files)
            while(fs.readdirSync(downloadDirectory).some(f => 
                crdownloadRegExp.test(f)).length > 0)
                continue;

            const matches = fs.readdirSync(downloadDirectory)
                .filter(f => 
                    regex.test(f));

            return matches.length === 1;
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

    const confirmDialog = await driver.findElement(By.css('confirm-dialog'));
    const confirmButton = await confirmDialog.findElement(By.css(
        'button.button:not(.button-secondary)'));
    await confirmButton.click();

    const issuerDatatable = await driver.findElement(By.css(
        'issuer-detail-datatable'));
    const heading = await issuerDatatable.findElement(By.css('h3'));
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

/**
 * Revokes a micro degree from the micro degrees details page.
 * This assumes that the driver already navigated to the micro degree detail page.
 * @param {import('selenium-webdriver').ThenableWebDriver} driver 
 */
export async function revokeMicroDegree(driver) {
    await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('zurücknehmen')),
        defaultWait);
    const revokeButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('zurücknehmen'));
    await revokeButton.click();

    const confirmDialog = await driver.findElement(By.css('confirm-dialog'));
    const confirmButton = await confirmDialog.findElement(By.css(
        'button.button:not(.button-secondary)'));
    await confirmButton.click();

    const microDegreeGraduatesTable = await driver.findElement(By.css(
        'learningpath-graduates-datatable'));

    await driver.wait(until.elementLocated(ExtendedBy.tagWithText("h3", "0 Micro Degree-Empfänger:innen")), defaultWait);
}

/**
 * This assumes that the driver already navigated to the backpack page
 */
export async function confirmRevokedMicroDegree(driver) {
    const receivedBadges = await driver.findElements(By.linkText(
        microDegreeTitle));
    assert.equal(receivedBadges.length, 0, "Expected to have received no micro degree with the specified title");
}

export async function deleteBadgeOverApi(name = testBadgeTitle) {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const badge = await findBadge(apiToken, name);
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
        ExtendedBy.sibling(descriptionHeading, By.css('p')));
    const descriptionText = await descriptionElement.getText();
    assert.equal(descriptionText, testBadgeDescription);

    const divElements = await driver.findElements(By.css('div.tag'));
    assert.equal(divElements.length, 1);

    const categoryHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Kategorie'));
    const categoryElement = await driver.findElement(
        ExtendedBy.sibling(categoryHeading, By.css('dd')));
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
        ExtendedBy.sibling(lastEditedHeading, By.css('dd')));
    const lastEditedTime = await lastEditedElement.findElement(
        By.css('time'));
    const lastEditedText = await lastEditedTime.getText();
    assert.equal(lastEditedText, todayString);

    const createdHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Erstellt am'));
    const createdElement = await driver.findElement(
        ExtendedBy.sibling(createdHeading, By.css('dd')));
    const createdTime = await createdElement.findElement(
        By.css('time'));
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
        ExtendedBy.sibling(descriptionHeading, By.css('p')));
    const descriptionText = await descriptionElement.getText();
    assert.equal(descriptionText, testBadgeDescription);

    const divElements = await driver.findElements(By.css('div.tag'));
    assert.equal(divElements.length, 1);

    const categoryHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Kategorie'));
    const categoryElement = await driver.findElement(
        ExtendedBy.sibling(categoryHeading, By.css('dd')));
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
        ExtendedBy.sibling(lastEditedHeading, By.css('dd')));
    const lastEditedTime = await lastEditedElement.findElement(
        By.css('time'));
    const lastEditedText = await lastEditedTime.getText();
    assert.equal(lastEditedText, todayString);

    const createdHeading = await driver.findElement(
        ExtendedBy.tagWithText('dt', 'Erstellt am'));
    const createdElement = await driver.findElement(
        ExtendedBy.sibling(createdHeading, By.css('dd')));
    const createdTime = await createdElement.findElement(
        By.css('time'));
    const createdText = await createdTime.getText();
    assert.equal(createdText, todayString);

    if(badgeType == 'Kompetenz'){
        const BadgeCompetencies = await driver.findElements(By.css('competency-accordion'))
        // sometimes due to a race condition the ai generated competency isn't properly added
        assert.equal(BadgeCompetencies.length >= 1, true); 
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

/**
 * Creates {@link n} number of  badges
 * @param {import('selenium-webdriver').ThenableWebDriver} driver 
 * @param {number} n Number of badges to create
 */
export async function createBadges(driver, n) {
    for(let i = 0; i < n; i++) {
        await navigateToBadgeCreation(driver);
        await createBadge(driver);
    }
}

/**
 * Creates a micro degree that includes the first {@link n} badges
 * available to the logged in user
 * @param {import('selenium-webdriver').ThenableWebDriver} driver 
 * @param {number} n Number of badges to include
 */
export async function createMicroDegree(driver, n) {
    // Initial step: Badge type selection
    await driver.wait(until.elementLocated(By.css('[href*="learningpaths/create"]')), defaultWait);

    const selectedBadgeType = await driver.findElement(
        By.css('[href*="learningpaths/create"]')
    );
    await selectedBadgeType.click();

    // Next step: Badge details
    // Title field
    const titleField = await driver.findElement(By.css(
        'input[type="text"]'));
    await titleField.sendKeys(microDegreeTitle);

    // Description
    const descriptionField = await driver.findElement(By.css(
        'textarea'));
    await descriptionField.sendKeys(microDegreeDescription);
    
    // Image field
    // Testing switching between framed and unframed/owned images is essential as users might experience some issues while doing so
    // 1. Upload own image (insterted into badge frame)
    await uploadImage(driver, "image_field", 0, testImagePath);
    // 2. Upload own image
    await uploadImage(driver, "image_field", 1, testImagePath);
    // 3. Select an image from nounproject
    await selectNounProjectImage(driver, nounProjectSearchText);

    // Click next button to move to the next step
    const nextButton = await driver.findElement(
        ExtendedBy.tagWithText('span', 'Weiter'));
    await nextButton.click();

    // Next step: Add badges to the micro degree
    const selectableCards = await driver.findElements(
        ExtendedBy.containingText(
            By.css('bg-badgecard'),
            By.css('a'),
            testBadgeTitle
        ));

    for(let i = 0; i < n; i++)
        await selectableCards[i].findElement(By.css('hlm-checkbox')).click();

    // Next step: Order of the badges
    await nextButton.click();
    const badgeCards = await driver.findElements(By.css(
        'bg-badgecard'
    ));
    const dragAndDropAction = new Actions(driver)
        .dragAndDrop(badgeCards[0], badgeCards.at(-1));
    await dragAndDropAction.perform();

    // Next step: Tag and Create
    await nextButton.click();
    await addNewTag(driver, tagName);   
    
    const submitForm = await driver.findElement(By.css('form'));
    await submitForm.submit();

    // The regular expression is for urls of the micro degree like 
    // '/issuer/issuers/{issuerID}/learningpaths/{learningpathID}'
    // but it disallows the path where the micro degree is created:
    // '/issuer/issuers/{issuerID}/learningpaths/create'
    await driver.wait(until.urlMatches(/\/issuer\/issuers\/[^\/]+\/learningpaths\/(?!create$)[^\/]+$/), extendedWait);
}

/**
 * Deletes the micro degree using api requests without UI
 */
export const deleteMicroDegreeOverApi =
    () => deleteBadgeOverApi(microDegreeTitle);

/**
 * Deletes the given number of badges via the api, essentially
 * calling {@link deleteBadgeOverApi} multiple times.
 * @param {number} n The number of badges to delete
 */
export async function deleteBadgesOverApi(n) {
    for(let i = 0; i < n; i++)
        await deleteBadgeOverApi();
}