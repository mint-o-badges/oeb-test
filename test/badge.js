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
import {clickUntilInteractable} from '../util/components.js';
import {ExtendedBy, avoidStale} from '../util/selection.js';
import {
    addNewTag,
    setBadgeValidity,
    addCompetenciesByHand,
    addCompetenciesViaAI
} from '../util/badge-helper.js';
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
const currentBadgeStandardVersion = '3.0'


/**
 * This requires that there exists a verified issuer for the user associated with the configured credentials
 */
export async function navigateToBadgeCreation(driver) {
    await driver.get(`${url}/issuer/issuers`);

    // Sometimes the title seems to oscillate back and forth, so we
    // wait here as well
    const expectedTitle = 'Issuers - Open Educational Badges';
    driver.wait(until.titleIs(expectedTitle), defaultWait);

    await avoidStale(async () => {
        const createBadgeButton = await driver.wait(until.elementLocated(
            ExtendedBy.withParent(By.css("oeb-button:not(.disabled)"), By.css("button[id^='create-new-badge-btn']"))),
            defaultWait);
        await createBadgeButton.click();
    });

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
    const tabs = await driver.findElements(
        By.css('hlm-tabs-list > button'));
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

    // move to the badges tab
    const tabs = await driver.findElements(By.css("hlm-tabs-list > button"));
    await tabs[1].click();

    const receivedBadgeLink = await driver.wait(until.elementLocated(By.linkText(testBadgeTitle)), defaultWait);
    receivedBadgeLink.click();

    await driver.wait(until.titleIs(`Backpack - ${testBadgeTitle} - Open Educational Badges`), defaultWait);
}

export async function navigateToReceivedMicroDegree(driver) {
    // this switches to the micro degree tab of the backpack
    const tabs = await driver.findElements(By.css("hlm-tabs-list > button"));
    await tabs[3].click();

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

    // Next step: Badge details
    // Title field
    const titleField = await clickUntilInteractable(async () =>
        await driver.findElement(By.css('input[type="text"]')));
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
    await uploadImage(driver, "image_field", 1, testImagePath);
    // 2. Upload own image
    await uploadImage(driver, "image_field", 0, testImagePath);
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
    await setBadgeValidity(driver);

    const submitButton = await driver.findElement(By.id('create-badge-btn'));
    await submitButton.click();
    
    await driver.wait(until.titleIs(`Badge Class - ${testBadgeTitle} - Open Educational Badges`), extendedWait);
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
    // move to the badges tab
    const condition = new Condition("multiple tabs",
        driver => {
            const tabs = await driver.findElements(
                By.css("hlm-tabs-list > button"));
            return tabs.length >= 2;
        });
    await driver.wait(condition, timeout,
        "Waiting for multiple tabs timed out");
    const tabs = await driver.findElements(By.css("hlm-tabs-list > button"));
    await tabs[1].click();

    // Try three times, since receiving the badge can take some time
    let receivedBadges;
    for (let i = 0; i < 3; i++) {
        try {
            await driver.wait(until.elementLocated(By.linkText(
                testBadgeTitle)), 1000);
        } catch(e) {
            if (e.name === 'NoSuchElementError' ||
                e.name === 'TimeoutError') {
                driver.navigate().refresh();
                continue;
            }
            throw e;
        }
    }
    receivedBadges = await driver.findElements(By.linkText(
        testBadgeTitle));
    assert.equal(receivedBadges.length, 1, "Expected to have received one badge with the specified title");
}

/**
 * This assumes that the driver already navigated to the backpack page
 */
export async function receiveMicroDegreeBadge(driver) {
    await driver.wait(until.elementLocated(By.css("hlm-tabs-list")), defaultWait);

    // move to the badges tab
    const tabs = await driver.findElements(By.css("hlm-tabs-list > button"));
    await tabs[1].click();

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
    const moreSvgButton = await driver.wait(until.elementLocated(By.css(
        'svg[icon="icon_more"]')), defaultWait);
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
    await clickUntilInteractable(async () =>
        await driver.findElement(By.id('download-pdf-backpack')));

    await waitForDownload(driver, new RegExp(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_ ]+\.pdf$/));
    // TODO: Verify file content
    clearDownloadDirectory();
}

/**
 * This assumes that the driver already navigated to the received micro degree
 */
export async function downloadMicroDegree(driver) {
    const downloadPdfButton = await driver.findElement(
        By.css("oeb-button[variant='secondary']")
    );
    await downloadPdfButton.click();

    await waitForDownload(driver, new RegExp(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_ ]+\.pdf$/), defaultWait);
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
    let regex = /\.(pdf|json)$/i;
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
    const revokeButton = await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('zurücknehmen', true, false)),
        defaultWait);
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
    const revokeButton = await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('zurücknehmen', true, false)),
        defaultWait);
    await revokeButton.click();

    const confirmDialog = await driver.findElement(By.css('confirm-dialog'));
    const confirmButton = await confirmDialog.findElement(By.css(
        'button.button:not(.button-secondary)'));
    await confirmButton.click();

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
    const titleElement = await driver.wait(until.elementLocated(By.css(
        'h1.tw-text-purple')));
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
        assert.equal(BadgeCompetencies.length, 2);
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
    const selectedBadgeType = await driver.wait(until.elementLocated(By.css('[href*="learningpaths/create"]')), defaultWait);
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
    // I have NO IDEA why, but for some reason this is required
    // here for the image upload to work on my machine
    await new Promise(r => setTimeout(r, 1000));
    // Testing switching between framed and unframed/owned images is essential as users might experience some issues while doing so
    // 1. Upload own image
    await uploadImage(driver, "image_field", 1, testImagePath);
    // 2. Upload own image (insterted into badge frame)
    await uploadImage(driver, "image_field", 0, testImagePath);
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
    
    // activate Micro Degree
    const activationCheckbox = await driver.findElement(By.css('hlm-checkbox'))
    activationCheckbox.click()
    
    
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

/**
 * Downloads the JSON file of a badge from the awarded badge details page.
 * @returns The content of the json file as string
 * @param {import('selenium-webdriver').ThenableWebDriver} driver
 */
async function downloadBadgeJson(driver) {
  const overflowMenu = await driver.findElement(
    By.css('button:has(svg[icon="icon_more"])')
  );
  await overflowMenu.click();

  const downloadButton = await driver.findElement(
    ExtendedBy.tagWithText('button', `Download JSON-Datei (${currentBadgeStandardVersion})`)
  );
  await downloadButton.click();

  // RegExp for a file like 2025-06-16-some_text.json
  const badgeJsonRegex = new RegExp(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_ ]+\.json$/);
  await waitForDownload(driver, badgeJsonRegex, defaultWait);
  
  const files = fs.readdirSync(downloadDirectory);
  const file = files.filter(f => badgeJsonRegex.test(f))
  const fileContent = fs.readFileSync(`${downloadDirectory}/${file}`, { encoding: 'utf-8'});
  return fileContent;
};

/**
 * Checks if the badge is conform with the currently implemented
 * open badges version and downloads the badges JSON file
 * to check its conformity.
 * This assumes that the driver already navigated to the badge detail page
 * of an awarded badge.
 * @param {import('selenium-webdriver').ThenableWebDriver} driver
 */
export async function validateBadgeVersion(driver) {
  const badgeStandardText = await driver.findElement(
      ExtendedBy.tagWithText("dt", "Badge-Standard")
    );
  const badgeStandardVersion = await driver.findElement(
    ExtendedBy.sibling(badgeStandardText, By.css("dd"))
  );
  const badgeStandardVersionText = await badgeStandardVersion.getText();
  assert.equal(badgeStandardVersionText, currentBadgeStandardVersion);

  const file = await downloadBadgeJson(driver);
  
  const badgeAsJson = JSON.parse(file);
  assert.notStrictEqual(typeof badgeAsJson['@context'], "string");
  // The existence of the /credentials/ part in the context urls are
  // unique for v3. If it exists in any url, it is v3 (which it should be here)
  assert(badgeAsJson['@context'].some(i => i.indexOf('/credentials') >= 0));
  await clearDownloadDirectory();
};

/**
 * Uploads an invalid badge to the backpack and checks if an error is shown.
 * This assumes that the driver already navigated to an awarded badge
 * that will be reuploaded in a modified way.
 * @param {import('selenium-webdriver').ThenableWebDriver} driver
 */
export async function validateUploadedInvalidBadge(driver) {
    const file = await downloadBadgeJson(driver);
    const badge = JSON.parse(file);
    await clearDownloadDirectory();

    // We got a valid badge from the system, lets break it
    badge['@context'] = [];
    const badgeStringToUpload = JSON.stringify(badge);

    await navigateToBackpack(driver);

    await uploadBadgeJson(driver, badgeStringToUpload);

    await driver.wait(until.elementLocated(
      By.css('oeb-dialog div ng-icon[name="lucideCircleX"]')
    ));
};

/**
 * Assumes to be on the backpack page, uploads a JSON as string
 * to import a badge to the backpack
 * @param {import('selenium-webdriver').ThenableWebDriver} driver 
 * @param {string} badgeJson JSON string to use for badge importing
 */
async function uploadBadgeJson(driver, badgeJson) {
    const uploadButton = await driver.wait(until.elementLocated(
      ExtendedBy.submitButtonWithText('Badge hochladen')
    ), defaultWait);
    await uploadButton.click();

    const jsonButton = await driver.wait(until.elementLocated(
      By.css('form hlm-tabs-list button:nth-child(3)')
    ), defaultWait);
    await jsonButton.click();

    const jsonTextarea = await driver.findElement(
      By.css('textarea[name="json_eingeben"]')
    );
    await jsonTextarea.sendKeys(badgeJson);

    const sendBadgeForUploadButton = await driver.findElement(
      ExtendedBy.submitButtonWithText('Badge hinzufügen')
    );
    await sendBadgeForUploadButton.click();
}

/**
 * Dismisses notification toast if there is one
 * because it might block the link on the badge card
 * which leads to a selenium error (ElementClickInterceptedException)
 * @param {import('selenium-webdriver').ThenableWebDriver} driver 
 */
async function dismissNotificationToast(driver) {
    const notificationDismissButton = await driver.findElements(
        By.css('button.notification-x-close')
    );
    if(notificationDismissButton.length > 0) {
        // There can only ever be one toast at a time
        assert(notificationDismissButton.length === 1);
        await notificationDismissButton[0].click();
    }
}

/**
 * Deletes the first imported badge from the backpack, assumes to be
 * on the backpack page.
 * @param {import('selenium-webdriver').ThenableWebDriver} driver
 */
async function deleteImportedBadgeFromBackpack(driver) {
    const importedBadge = await driver.wait(until.elementLocated(
      By.css(`bg-badgecard:has(div.tw-absolute.tw-top-0) a[title='${testBadgeTitle}']`)
    ), defaultWait);
    await importedBadge.click();

    const overflowMenu = await driver.wait(until.elementLocated(
      By.css('button:has(svg[icon="icon_more"])')
    ), defaultWait);
    await overflowMenu.click();

    const deleteFromBackpackButton = await driver.findElement(
      ExtendedBy.tagWithText('button', 'Badge aus Rucksack löschen')
    );
    await deleteFromBackpackButton.click();

    const confirmDeleteButton = await driver.findElement(
      ExtendedBy.tagWithText('button', 'Badge entfernen')
    );
    await confirmDeleteButton.click();
}

/**
 * Uploads a v2 badge to the backpack and checks if it gets added properly.
 * This assumes that the driver already navigated to an awarded badge
 * that will be reuploaded in a modified way.
 * @param {import('selenium-webdriver').ThenableWebDriver} driver
 */
export async function validateUploadedV2Badge(driver) {
    const file = await downloadBadgeJson(driver);
    await clearDownloadDirectory();

    const badge = JSON.parse(file);
    const v2Url = badge['id'].replace('3_0', '2_0');
    const badgeV2Response = await fetch(v2Url);
    const badgeV2JsonString = await badgeV2Response.text();

    await navigateToBackpack(driver);

    await driver.wait(until.elementLocated(
        By.css('bg-badgecard')
    ), defaultWait);
    const badgeCards = await driver.findElements(By.css('bg-badgecard'));
    const badgesBefore = badgeCards.length;

    await uploadBadgeJson(driver, badgeV2JsonString);    

    // Wait until dialog disappears and the backpack updated itself
    await driver.wait(until.elementLocated(
        ExtendedBy.tagWithText(`div:has(div > ng-icon[name="lucideHexagon"]) > p`, `${badgesBefore + 1}`)
    ), defaultWait);

    await dismissNotificationToast(driver);
    await deleteImportedBadgeFromBackpack(driver);
};

/**
 * Uploads a v3 badge to the backpack and checks if it gets added properly.
 * This assumes that the driver already navigated to an awarded badge
 * that will be reuploaded in a modified way.
 * @param {import('selenium-webdriver').ThenableWebDriver} driver
 */
export async function validateUploadedV3Badge(driver) {
    const file = await downloadBadgeJson(driver, testBadgeTitle);
    await clearDownloadDirectory();
    await navigateToBackpack(driver);

    await driver.wait(until.elementLocated(
        By.css('bg-badgecard')
    ), defaultWait);
    const badgeCards = await driver.findElements(By.css('bg-badgecard'));
    const badgesBefore = badgeCards.length;

    await uploadBadgeJson(driver, file);

    // Wait until dialog disappears and the backpack updated itself
    await driver.wait(until.elementLocated(
        ExtendedBy.tagWithText(`div:has(div > ng-icon[name="lucideHexagon"]) > p`, `${badgesBefore + 1}`)
    ), defaultWait);

    await dismissNotificationToast(driver);
    await deleteImportedBadgeFromBackpack(driver);
};
