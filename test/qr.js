import {By, until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url} from '../config.js';
import {navigateToBadgeDetails, waitForDownload} from './badge.js';

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
