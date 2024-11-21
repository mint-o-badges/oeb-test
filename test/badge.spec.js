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
    verifyBadgeOverApi,
    validateCompetencyBadge
} from './badge.js';

describe('Badge Test', function() {
    this.timeout(30000);
    let driver;

    before(async () => {
        // Create download directory if it doesn't exist
        if (!fs.existsSync(downloadDirectory)){
            fs.mkdirSync(downloadDirectory);
        }
        // Set download directory path 
        const downloadPath =  path.resolve('download');
        let options = new chrome.Options();
        options.setUserPreferences({
            "download.default_directory": downloadPath,
        });
        // Setting up webDriver
        driver = await new Builder()
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options)
            .build()
        // maximiz screen to avoid error `element not interactable`
        await driver.manage().window().maximize();
        await driver.manage().setTimeouts({ implicit: implicitWait });
    });

    // This requires that there exists a verified issuer for the user associated with the configured credentials
    // Participation badge
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

    it('should award the participation badge', async function() {
        await navigateToBadgeAwarding(driver);
        await awardBadge(driver);
    });

    it('should receive the participation badge', async function() {
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

    it('should revoke the participation badge', async function() {
        await navigateToBadgeDetails(driver);
        await revokeBadge(driver);
        await navigateToBackpack(driver);
        await confirmRevokedBadge(driver);
    });

    it('delete the participation badge', async function() {
        await deleteBadgeOverApi();
    })

    // Competency badge
    it('should create a competency badge', async function() {
        await navigateToBadgeCreation(driver);
        await createBadge(driver, 'Kompetenz');
    });

    it('should validate the competency badge', async function() {
        await navigateToBadgeDetails(driver);
        await validateCompetencyBadge(driver);
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

    after(async () => {
        await driver.quit();
        fs.rmSync(downloadDirectory, { recursive: true, force: true });
    });
});
