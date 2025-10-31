import {By, until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';
import {username, password} from '../secret.js';
import {ExtendedBy} from '../util/selection.js';
import {clickUntilInteractable} from '../util/components.js';
import {
    downloadDirectory,
    navigateToBadgeDetails,
    waitForDownload
} from './badge.js';
import {defaultWait} from '../config.js';
import {Jimp} from 'jimp';
import jsQR from 'jsqr';
import {fromPath} from 'pdf2pic';
import sharp from 'sharp';
import { url } from '../config.js';

export async function navigateToQrCreation(driver) {
    await navigateToBadgeDetails(driver);

    await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('Badge über QR-Code vergeben')), defaultWait);
    const qrCodeButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('Badge über QR-Code vergeben'));
    await qrCodeButton.click();

    const confirmButton = await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText(
            'QR-Code-Vergabe erstellen')), defaultWait,
        "Couldn't find confirm button");
    await confirmButton.click();

    await driver.wait(until.elementLocated(By.css(
        'input[placeholder="Badge Vergabe Juni 2025 in Berlin"]')), defaultWait);
}

/**
 * This assumes that the driver already navigated to the QR creation
 */
export async function generateQrCode(driver) {
    const titelField = await driver.findElement(By.css(
        'input[placeholder="Badge Vergabe Juni 2025 in Berlin"]'));
    await titelField.sendKeys('automated test QR title');

    const nameField = await driver.findElement(By.css(
        'input[placeholder="Mein Vorname und Nachname"]'));
    await nameField.sendKeys('automated test name');

    // TODO: Validity fields

    const generateQrCodeButton = await driver.findElement(By.css(
        'button[type="submit"]'));
    await generateQrCodeButton.click();

    await driver.wait(until.elementLocated(By.css(
        'svg.checkmark')), defaultWait);
    
    const closeDialogButton = await driver.findElement(By.css(
        'button[brndialogclose]'));
    await closeDialogButton.click();

    // the qr code is generated onto a canvas
    await driver.wait(until.elementLocated(By.css('canvas')), defaultWait);
}

/**
 * Generate a QR code with expired validity dates
 * This assumes that the driver already navigated to the QR creation form
 */
export async function generateExpiredQrCode(driver) {
    const titleField = await driver.findElement(By.css(
        'input[placeholder="Badge Vergabe Juni 2025 in Berlin"]'));
    await titleField.sendKeys('automated test expired QR');

    const nameField = await driver.findElement(By.css(
        'input[placeholder="Mein Vorname und Nachname"]'));
    await nameField.sendKeys('automated test name');

    // Set validity dates to expired (yesterday)
    const today = new Date();
    const aDayInMs = 1000 * 60 * 60 * 24;
    const yesterday = new Date(today.getTime() - aDayInMs);
    const twoDaysAgo = new Date(yesterday.getTime() - aDayInMs);

    const validFromInputs = await driver.findElements(By.css(
        'input[type="date"]'));
    
    if (validFromInputs.length >= 1) {
        await driver.executeScript(`
            arguments[0].valueAsNumber = arguments[1];
            arguments[0].dispatchEvent(new Event('input'));
            arguments[0].dispatchEvent(new Event('change'));`,
            validFromInputs[0],
            twoDaysAgo.getTime()
        );
    }

    if (validFromInputs.length >= 2) {
        await driver.executeScript(`
            arguments[0].valueAsNumber = arguments[1];
            arguments[0].dispatchEvent(new Event('input'));
            arguments[0].dispatchEvent(new Event('change'));`,
            validFromInputs[1],
            yesterday.getTime()
        );
    }

    const generateQrCodeButton = await driver.findElement(By.css(
        'button[type="submit"]'));
    await generateQrCodeButton.click();

    await driver.wait(until.elementLocated(By.css(
        'svg.checkmark')), defaultWait);
    
    const closeDialogButton = await driver.findElement(By.css(
        'button[brndialogclose]'));
    await closeDialogButton.click();

    // the qr code is generated onto a canvas
    await driver.wait(until.elementLocated(By.css('canvas')), defaultWait);
}

/**
 * Test that accessing an expired QR code shows the expired message
 */
export async function testExpiredQrCodeDisplay(driver, qrCodeValue) {
    const currentUrl = await driver.getCurrentUrl();
    const { issuerSlug, badgeSlug } = extractFromCurrentUrl(currentUrl);
    
    const qrCodeId = extractQrCodeIdFromUrl(qrCodeValue);
    
    await driver.navigate().to(`${url}/public/issuer/issuers/${issuerSlug}/badges/${badgeSlug}/request/${qrCodeId}`);

    await driver.wait(until.elementLocated(By.css(
        'bg-not-found')), defaultWait);

    const errorElement = await driver.findElement(By.css(
        'bg-not-found'));
    const errorText = await errorElement.getText();

    assert(errorText.includes('nicht mehr gültig'), 
        'Expected expired QR code error message');
}

/**
 * Test that the form is NOT displayed for an expired QR code
 */
export async function testExpiredQrCodeNoForm(driver, qrCodeValue) {
    const currentUrl = await driver.getCurrentUrl();
    const { issuerSlug, badgeSlug } = extractFromCurrentUrl(currentUrl);
    
    const qrCodeId = extractQrCodeIdFromUrl(qrCodeValue);
    
    await driver.navigate().to(`${url}/public/issuer/issuers/${issuerSlug}/badges/${badgeSlug}/request/${qrCodeId}`);

    await driver.sleep(1000);

    // Verify that the request form is NOT present
    const formElements = await driver.findElements(By.css(
        'oeb-input[fieldtype="text"]'));
    
    assert.equal(formElements.length, 0, 
        'Request form should not be displayed for expired QR code');
}

function extractFromCurrentUrl(currentUrl) {
    const urlParts = currentUrl.split('/');
    
    const issuersIndex = urlParts.indexOf('issuers');
    const issuerSlug = urlParts[issuersIndex + 1];
    
    const badgesIndex = urlParts.indexOf('badges');
    const badgeSlug = urlParts[badgesIndex + 1];
    
    return { issuerSlug, badgeSlug };
}

function extractQrCodeIdFromUrl(qrCodeValue) {
    const parts = qrCodeValue.split('/');
    return parts[parts.length - 1];
}

/**
 * This assumes that the QR code already got created
 */
export async function downloadQrCode(driver, title = 'automated test QR title') {
    const downloadQrButton = await driver.wait(until.elementLocated(
        // TODO: Also test PNG download
        ExtendedBy.submitButtonWithText('Download QR-Code-Plakat')), defaultWait);
    await downloadQrButton.click();

    await waitForDownload(driver, new RegExp(`^${title}\\.pdf$`));
}

export async function readQrCode(pattern, filename = 'automated test QR title.pdf') {
    await convertPdfToImg(filename, 'qrcode.png');
    const path = `${downloadDirectory}/qrcode.png`;
    const image = await Jimp.read(path);

    const imageData = {
        data: new Uint8ClampedArray(image.bitmap.data),
        width: image.bitmap.width,
        height: image.bitmap.height,
    };
    const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);

    assert(decodedQR, 'QR code reading failed!');
    const qrCodeValue = decodedQR.data;

    assert.match(qrCodeValue, pattern);
    return qrCodeValue;
}

async function convertPdfToImg(pdfFilename, imageFilename,
    cropOptions = {left: 600, top: 850, width: 900, height: 900}) {
    const splitFilename = imageFilename.split('.');
    // Remove the file ending, since it gets attached again anyway
    let imageName = imageFilename;
    if (splitFilename.length > 1) {
        assert.equal(splitFilename.at(-1), 'png');
        imageName = splitFilename.slice(0,-1).reduce((a, b) => a.concat('.').concat(b))
    }
    const options = {
        density: 100,
        saveFilename: imageName,
        savePath: downloadDirectory,
        format: "png",
        // DIN A4 dimensions
        width: 2100,
        height: 2970
    };
    const convert = fromPath(`${downloadDirectory}/${pdfFilename}`, options);
    const pageToConvertAsImage = 1;

    await convert(pageToConvertAsImage, { responseType: "image" });

    await sharp(`${downloadDirectory}/${imageName}.1.png`)
        .extract(cropOptions)
        .toFile(`${downloadDirectory}/${imageFilename}`);
}

export async function requestBadgeViaQr(driver) {
    await driver.wait(until.elementLocated(By.css(
        'oeb-input[fieldtype="text"]')), defaultWait);
    const textInputs = await driver.findElements(By.css(
        'oeb-input[fieldtype="text"]'));
    assert.equal(textInputs.length, 2);

    const vornameOebInput = textInputs[0];
    const vornameField = await vornameOebInput.findElement(By.css(
        'input'));
    await vornameField.sendKeys('automatedName');

    const nachnameOebInput = textInputs[1];
    const nachnameField = await nachnameOebInput.findElement(By.css(
        'input'));
    await nachnameField.sendKeys('automatedSurname');

    const emailOebInput = await driver.findElement(By.css(
        'oeb-input[fieldtype="email"]'));
    const emailField = await emailOebInput.findElement(By.css(
        'input'));
    await emailField.sendKeys(username);

    const ageConfirmationCheckbox = await driver.findElement(By.css(
        'button[role="checkbox"]'));
    await ageConfirmationCheckbox.click();

    const submitButton = await driver.findElement(By.css(
        'button[type="submit"]'));
    await submitButton.click();

    await driver.wait(until.elementLocated(By.css(
        'svg.checkmark')), defaultWait);
}

/**
 * This assumes that the driver already navigated to the badge detail page
 */
export async function confirmBadgeAwarding(driver) {
    const dropdownButton = await driver.wait(until.elementLocated(
        By.css('button[role="heading"]')), defaultWait);
    await dropdownButton.click();

    // Choose the first request, which is the only one
    await clickUntilInteractable(async () =>
        await driver.findElement(By.css('button[role="checkbox"]')));

    const confirmButton = await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('Badge vergeben')), defaultWait);

    await driver.wait(until.elementIsVisible(confirmButton), defaultWait);
    await confirmButton.click();

    await driver.wait(until.elementLocated(ExtendedBy.tagWithText(
        "span", `Der Badge wurde erfolgreich an ${username} vergeben`)), defaultWait);
}
