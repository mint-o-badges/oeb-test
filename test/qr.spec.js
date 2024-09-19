import {Builder, Browser} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import {login} from './login.js';
import path from 'path';
import fs from 'fs';
import {
    navigateToBadgeCreation,
    createBadge,
    deleteBadgeOverApi
} from './badge.js';
import {
    navigateToQrCreation,
    generateQrCode,
    downloadQrCode
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
        driver = await new Builder()
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options)
            .build()

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

    after(async () => {
        await deleteBadgeOverApi();
        await driver.quit();
        fs.rmSync(downloadDirectory, { recursive: true, force: true });
    });
});
