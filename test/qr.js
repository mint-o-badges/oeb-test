import {By, until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';
import {username, password} from '../secret.js';
import {
    downloadDirectory,
    navigateToBadgeDetails,
    waitForDownload
} from './badge.js';
import {Jimp} from 'jimp';
import jsQR from "jsqr";

export async function navigateToQrCreation(driver, name = 'automated test title') {
    await navigateToBadgeDetails(driver, name);

    const qrCodeButton = driver.findElement(By.css(
        'oeb-button[ng-reflect-text="Badge über QR-Code vergeben"]'));
    await qrCodeButton.click();
    await driver.wait(until.elementLocated(By.css(
        'oeb-input[label="Titel"]')));
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
        'hlm-icon[name="lucideCheck"]')));
    
    const closeDialogButton = await driver.findElement(By.css(
        'button[brndialogclose]'));
    await closeDialogButton.click();
}

/**
 * This assumes that the QR code already got created
 */
export async function downloadQrCode(driver) {
    const downloadQrButton = await driver.findElement(By.css(
        'oeb-button[ng-reflect-text="Download QR-Code"]'));
    await downloadQrButton.click();

    await waitForDownload(driver, new RegExp('^qrcode\\.png$'));
}

export async function readQrCode(pattern, fileName = 'qrcode.png') {
    const path = `${downloadDirectory}/${fileName}`;
    const image = await Jimp.read(path);
    const imageData = {
        data: new Uint8ClampedArray(image.bitmap.data),
        width: image.bitmap.width,
        height: image.bitmap.height,
    };
    const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);

    const qrCodeValue = decodedQR.data;
    assert.match(qrCodeValue, pattern);
    return qrCodeValue;
}

export async function requestBadgeViaQr(driver) {
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
        'hlm-icon[name="lucideCheck"]')));
}

/**
 * This assumes that the driver already navigated to the badge detail page
 */
export async function confirmBadgeAwarding(driver) {
    const dropdownButton = await driver.findElement(By.css(
        'button[role="heading"]'));
    await dropdownButton.click();

    await driver.wait(until.elementLocated(By.css(
        'oeb-button[ng-reflect-text="Badge vergeben"]')));
    const confirmButton = await driver.findElement(By.css(
        'oeb-button[ng-reflect-text="Badge vergeben"]'));

    await driver.wait(until.elementIsVisible(confirmButton));
    await confirmButton.click();

    await driver.wait(until.elementLocated(By.css(
        'hlm-icon[name="lucideCheck"]')));
}
