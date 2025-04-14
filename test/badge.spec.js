import {Builder, Browser} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import {login} from './login.js';
import path from 'path';
import {implicitWait} from '../config.js';
import {screenshot} from '../util/screenshot.js';
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
    verifyBadgeOverApi,
    validateBadge,
    clearDownloadDirectory
} from './badge.js';

describe('Badge Test', function() {
    this.timeout(30000);
    let driver;

    before(async () => {
        // Delete all PDFs from tmp directory
        clearDownloadDirectory();
        // Set download directory path 
        let options = new chrome.Options();
        options.addArguments("--lang=de-DE");
        options.setUserPreferences({
            "download.default_directory": downloadDirectory,
        });

        const host = process.env.SELENIUM || undefined;
        const server = host ? `http://${host}:4444` : '';

        // Setting up webDriver
        driver = await new Builder()
            .usingServer(server)
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options)
            .build()
        await driver.manage().setTimeouts({ implicit: implicitWait });
    });

    // This requires that there exists a verified issuer for the user associated with the configured credentials
    it('should login', async function() {
        await login(driver);
    });

    // Participation badge
    it('should create a participation badge', async function() {
        await navigateToBadgeCreation(driver);
        await createBadge(driver);
    });

    it('should validate the participation badge', async function() {
        await navigateToBadgeDetails(driver);
        await validateBadge(driver);
        await verifyBadgeOverApi(driver);
    });

    it('delete the participation badge', async function() {
        await deleteBadgeOverApi();
    })

    // Competency badge
    it('should create a competency badge', async function() {
        await navigateToBadgeCreation(driver);
        await createBadge(driver, 'competency');
    });

    it('should validate the competency badge', async function() {
        await navigateToBadgeDetails(driver);
        await validateBadge(driver, 'Kompetenz');
        await verifyBadgeOverApi(driver);
    });

    it('should award the competency badge', async function() {
        await navigateToBadgeAwarding(driver);
        await awardBadge(driver);
    });

    it('should receive the competency badge', async function() {
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

    it('should revoke the competency badge', async function() {
        await navigateToBadgeDetails(driver);
        await revokeBadge(driver);
        await navigateToBackpack(driver);
        await confirmRevokedBadge(driver);
    });

    it('delete the competency badge', async function() {
        await deleteBadgeOverApi();
    })

    afterEach(async function () {
        await screenshot(driver, this.currentTest);
    });

    after(async () => {
        await driver.quit();
    });
});
