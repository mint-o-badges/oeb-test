import {By, until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';
import {username, password} from '../secret.js';
import {ExtendedBy} from '../util/selection.js';
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

export async function navigateToQrCreation(driver, name = 'automated test title') {
    await navigateToBadgeDetails(driver, name);

    await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('Badge über QR-Code vergeben')), defaultWait);
    const qrCodeButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('Badge über QR-Code vergeben'));
    await qrCodeButton.click();
    await driver.wait(until.elementLocated(By.css(
        'oeb-input[label="Titel"]')), defaultWait);
}

/**
 * This assumes that the driver already navigated to the QR creation
 */
export async function generateQrCode(driver) {
    const titelOebInput = await driver.findElement(By.css(
        'oeb-input[label="Titel"]'));
    const titelField = await titelOebInput.findElement(By.tagName('input'));
    await titelField.sendKeys('automated test QR title');

    const nameOebInput = await driver.findElement(By.css(
        'oeb-input[label="Name Ersteller:in"]'));
    const nameField = await nameOebInput.findElement(By.tagName('input'));
    await nameField.sendKeys('automated test name');

    // TODO: Validity fields

    const generateQrCodeButton = await driver.findElement(By.css(
        'oeb-button[text="QR-Code generieren"]'));
    await generateQrCodeButton.click();

    await driver.wait(until.elementLocated(By.css(
        'hlm-icon[name="lucideCheck"]')), defaultWait);
    
    const closeDialogButton = await driver.findElement(By.css(
        'button[brndialogclose]'));
    await closeDialogButton.click();
}

/**
 * This assumes that the QR code already got created
 */
export async function downloadQrCode(driver, title = 'automated test QR title') {
    const downloadQrButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('Download QR-Code'));
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
        'oeb-input[label="Vorname"]')), defaultWait);
    const vornameOebInput = await driver.findElement(By.css(
        'oeb-input[label="Vorname"]'));
    const vornameField = await vornameOebInput.findElement(By.tagName(
        'input'));
    await vornameField.sendKeys('automatedName');

    const nachnameOebInput = await driver.findElement(By.css(
        'oeb-input[label="Nachname"]'));
    const nachnameField = await nachnameOebInput.findElement(By.tagName(
        'input'));
    await nachnameField.sendKeys('automatedSurname');

    const emailOebInput = await driver.findElement(By.css(
        'oeb-input[label="E-Mail"]'));
    const emailField = await emailOebInput.findElement(By.tagName(
        'input'));
    await emailField.sendKeys(username);

    const ageConfirmationCheckbox = await driver.findElement(By.tagName(
        'brn-checkbox'));
    await ageConfirmationCheckbox.click();

    const submitButton = await driver.findElement(By.css(
        'oeb-button[type="submit"]'));
    await submitButton.click();

    await driver.wait(until.elementLocated(By.css(
        'hlm-icon[name="lucideCheck"]')), defaultWait);
}

/**
 * This assumes that the driver already navigated to the badge detail page
 */
export async function confirmBadgeAwarding(driver) {
    await driver.wait(until.elementLocated(By.css(
        'button[role="heading"]')), defaultWait);
    const dropdownButton = await driver.findElement(By.css(
        'button[role="heading"]'));
    await dropdownButton.click();

    await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('Badge vergeben')), defaultWait);
    const confirmButton = await driver.findElement(
        ExtendedBy.submitButtonWithText('Badge vergeben'));

    await driver.wait(until.elementIsVisible(confirmButton), defaultWait);
    await confirmButton.click();

    await driver.wait(until.elementLocated(By.css(
        'hlm-icon[name="lucideCheck"]')), defaultWait);
}
