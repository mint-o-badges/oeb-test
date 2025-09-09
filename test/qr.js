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
        'input[placeholder="Badge Vergabe Juni 2024"]')), defaultWait);
}

/**
 * This assumes that the driver already navigated to the QR creation
 */
export async function generateQrCode(driver) {
    const titelField = await driver.findElement(By.css(
        'input[placeholder="Badge Vergabe Juni 2024"]'));
    await titelField.sendKeys('automated test QR title');

    const nameField = await driver.findElement(By.css(
        'input[placeholder="Mein Vorname und Nachname"]'));
    await nameField.sendKeys('automated test name');

    // TODO: Validity fields

    const generateQrCodeButton = await driver.findElement(By.css(
        'oeb-button[type="submit"]'));
    await generateQrCodeButton.click();

    await driver.wait(until.elementLocated(By.css(
        'svg.checkmark')), defaultWait);
    
    const closeDialogButton = await driver.findElement(By.css(
        'button[brndialogclose]'));
    await closeDialogButton.click();
}

/**
 * This assumes that the QR code already got created
 */
export async function downloadQrCode(driver, title = 'automated test QR title') {
    const downloadQrButton = await driver.findElement(
        // TODO: Also test PNG download
        ExtendedBy.submitButtonWithText('Download QR-Code-Plakat'));
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
        'hlm-checkbox'));
    await ageConfirmationCheckbox.click();

    const submitButton = await driver.findElement(By.css(
        'oeb-button[type="submit"]'));
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
        await driver.findElement(By.css('hlm-checkbox')));

    const confirmButton = await driver.wait(until.elementLocated(
        ExtendedBy.submitButtonWithText('Badge vergeben')), defaultWait);

    await driver.wait(until.elementIsVisible(confirmButton), defaultWait);
    await confirmButton.click();

    await driver.wait(until.elementLocated(ExtendedBy.tagWithText(
        "span", `Der Badge wurde erfolgreich an ${username} vergeben`)), defaultWait);
}
