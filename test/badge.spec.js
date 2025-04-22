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
    verifyBadgeOverApi,
    validateBadge,
    clearDownloadDirectory,
    createBadges,
    deleteBadgesOverApi,
    createMicroDegree,
    deleteMicroDegreeOverApi,
    receiveMicroDegreeBadge,
    confirmRevokedMicroDegree,
    downloadMicroDegree,
    navigateToReceivedMicroDegree,
    navigateToMicroDegreeDetails,
    revokeMicroDegree
} from './badge.js';

const BADGES_FOR_MICRO_DEGREE = 3;

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
    });

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
    });

    // micro degree
    it('should create a micro degree', async () => {
        // We need at least three badges to put as part of the degree
        await createBadges(driver, BADGES_FOR_MICRO_DEGREE);
        await navigateToBadgeCreation(driver);
        await createMicroDegree(driver, BADGES_FOR_MICRO_DEGREE);
    })
    .timeout(this.timeout() + BADGES_FOR_MICRO_DEGREE * 10_000); // Allow larger timeout since a number of badges have to be created

    it('should award the micro degree', async function() {
        // users get micro degrees automatically by receiving all badges
        // contained in the degree itself
        for(let i = 0; i < BADGES_FOR_MICRO_DEGREE; i++) {
            await navigateToBadgeAwarding(driver, i);
            await awardBadge(driver);
        }
    })
    .timeout(this.timeout() + BADGES_FOR_MICRO_DEGREE * 10_000); // Allow larger timeout since awarding badges takes a while

    it('should receive the micro degree', async function() {
        await navigateToBackpack(driver);
        await receiveMicroDegreeBadge(driver);
    });

    it('should download the micro degree pdf from the backpack', async function() {
        // TODO: Currently fails due to download not starting for an unknown reason
        await navigateToBackpack(driver);
        await navigateToReceivedMicroDegree(driver);
        await downloadMicroDegree(driver);
    });

    it('should download the micro degree pdf from the internal issuer page', async function() {
        await navigateToMicroDegreeDetails(driver);
        await downloadPdfFromIssuer(driver);
    });

    it('should revoke the micro degree', async function() {
        for(let i = 0; i < BADGES_FOR_MICRO_DEGREE; i++)
        {
            await navigateToBadgeDetails(driver, i);
            await revokeBadge(driver);
        }
        await navigateToMicroDegreeDetails(driver);
        await revokeMicroDegree(driver);

        await navigateToBackpack(driver);
        await confirmRevokedMicroDegree(driver);
    })
    .timeout(this.timeout() + BADGES_FOR_MICRO_DEGREE * 10_000); // Allow larger timeout since there is a number of badges to revoke

    it('delete the micro degree', async function() {
        await deleteMicroDegreeOverApi();
        await deleteBadgesOverApi(BADGES_FOR_MICRO_DEGREE);
    });

    afterEach(async function () {
        await screenshot(driver, this.currentTest);
    });

    after(async () => {
        await driver.quit();
    });
});
