import {Builder, Browser} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import {login} from './login.js';
import {url, implicitWait} from '../config.js';
import path from 'path';
import fs from 'fs';
import {
    navigateToBadgeDetails,
    navigateToBadgeCreation,
    createBadge,
    deleteBadgeOverApi,
    navigateToBackpack,
    receiveBadge
} from './badge.js';
import {
    navigateToQrCreation,
    generateQrCode,
    downloadQrCode,
    readQrCode,
    requestBadgeViaQr,
    confirmBadgeAwarding
} from './qr.js';

const downloadDirectory = './download'

describe('QR test', function() {
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

        // Create badge
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

    after(async () => {
        await deleteBadgeOverApi();
        await driver.quit();
        fs.rmSync(downloadDirectory, { recursive: true, force: true });
    });
});
