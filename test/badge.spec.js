import {Builder, Browser} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import {login} from './login.js';
import path from 'path';
import fs from 'fs';
import {implicitWait} from '../config.js';
import {
    downloadDirectory,
    navigateToBadgeCreation,
    navigateToBadgeDetails,
    navigateToBadgeAwarding,
    navigateToBackpack,
    navigateToReceivedBadge,
    createBadge,
    awardBadge,
    receiveBadge,
    downloadPdfFromBackpack,
    downloadPdfFromIssuer,
    revokeBadge,
    confirmRevokedBadge,
    deleteBadgeOverApi,
    validateParticipationBadge,
    verifyBadgeOverApi
} from './badge.js';

describe('Badge Test', function() {
    this.timeout(30000);
    let driver;

    before(async () => {
        if (!fs.existsSync(downloadDirectory)){
            fs.mkdirSync(downloadDirectory);
        }
        const downloadPath = path.resolve('download');
        let options = new chrome.Options();
        options.setUserPreferences({
            "download.default_directory": downloadPath,
        });

        const host = process.env.SELENIUM || undefined;
        const server = host ? `http://${host}:4444` : '';
        driver = await new Builder()
            .usingServer(server)
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options)
            .build()
        await driver.manage().setTimeouts({ implicit: implicitWait });
    });

    // This requires that there exists a verified issuer for the user associated with the configured credentials
    it('should create a participation badge', async function() {
        await login(driver);
        await navigateToBadgeCreation(driver);
        await createBadge(driver);
    });

    it('should validate the participation badge', async function() {
        await navigateToBadgeDetails(driver);
        await validateParticipationBadge(driver);
        await verifyBadgeOverApi(driver);
    });

    it('should award the badge', async function() {
        await navigateToBadgeAwarding(driver);
        await awardBadge(driver);
    });

    it('should receive the badge', async function() {
        await navigateToBackpack(driver);
        await receiveBadge(driver);
    });

    it('should download the pdf from the backpack', async function() {
        await navigateToReceivedBadge(driver);
        await downloadPdfFromBackpack(driver);
    });

    it('should download the pdf from the internal issuer page', async function() {
        await navigateToBadgeDetails(driver);
        await downloadPdfFromIssuer(driver);
    });

    it('should revoke the badge', async function() {
        await navigateToBadgeDetails(driver);
        await revokeBadge(driver);
        await navigateToBackpack(driver);
        await confirmRevokedBadge(driver);
    });

    after(async () => {
        await deleteBadgeOverApi();
        await driver.quit();
        fs.rmSync(downloadDirectory, { recursive: true, force: true });
    });
});
