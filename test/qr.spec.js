import {Builder, Browser} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import {login} from './login.js';
import {url} from '../config.js';
import path from 'path';
import {screenshot} from '../util/screenshot.js';
import {
    navigateToBadgeDetails,
    navigateToBadgeCreation,
    createBadge,
    deleteBadgeOverApi,
    navigateToBackpack,
    receiveBadge,
    clearDownloadDirectory
} from './badge.js';
import {
    navigateToQrCreation,
    generateQrCode,
    downloadQrCode,
    readQrCode,
    requestBadgeViaQr,
    confirmBadgeAwarding
} from './qr.js';

const downloadDirectory = '/tmp'

describe('QR test', function() {
    this.timeout(30000);
    let driver;

    before(async () => {
        // Delete all PDFs from tmp directory
        clearDownloadDirectory();
        let options = new chrome.Options();
        options.addArguments("--lang=de");
        options.setUserPreferences({
            "download.default_directory": downloadDirectory,
            "intl.accept_languages": "de"
        });

        const host = process.env.SELENIUM || undefined;
        const server = host ? `http://${host}:4444` : '';
        driver = await new Builder()
            .usingServer(server)
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options)
            .build()
    });

    it('should create a badge', async function() {
        await login(driver);
        await navigateToBadgeCreation(driver);
        await createBadge(driver);
    });

    it('should create the QR code', async function() {
        await navigateToQrCreation(driver);
        await generateQrCode(driver);
        await downloadQrCode(driver);
    });
    
    it('should read the QR code', async function() {
        const qrCodeUrl = await readQrCode(new RegExp(`^${url}.*`));
        await driver.get(qrCodeUrl);
        await requestBadgeViaQr(driver);
    });

    it('should confirm the QR code awarding', async function() {
        await navigateToBadgeDetails(driver);
        await confirmBadgeAwarding(driver);
    });

    it('should receive the badge', async function() {
        await navigateToBackpack(driver);
        await receiveBadge(driver);
    });

    it('should delete the badge', async function() {
        await deleteBadgeOverApi();
    });

    afterEach(async function () {
        try {
            await screenshot(driver, this.currentTest);
        } catch(e) {
            console.error(`Screenshotting failed: ${e}`);
        }
    });

    after(async () => {
        await driver.quit();
    });
});
