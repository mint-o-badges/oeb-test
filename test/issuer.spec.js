import {Builder, Browser} from 'selenium-webdriver';
import {login} from './login.js';
import {screenshot} from '../util/screenshot.js';
import chrome from 'selenium-webdriver/chrome.js';
import {
    navigateToIssuerCreation,
    createIssuer,
    deleteIssuerOverApi,
    navigateToIssuerDetails,
    verifyIssuerDetails,
    verifyIssuerOverApi
} from './issuer.js';

describe('Issuer Test', function() {
    this.timeout(20000);
    let driver;

    before(async () => {
        const host = process.env.SELENIUM || undefined;
        const server = host ? `http://${host}:4444` : '';
        let options = new chrome.Options();
        options.addArguments("--lang=de");
        options.setUserPreferences({
            "intl.accept_languages": "de"
        });
        driver = await new Builder()
            .usingServer(server)
            .forBrowser(Browser.CHROME)
            .setChromeOptions(options)
            .build();
    });


    it('should create an issuer', async function() {
        await login(driver);
        await navigateToIssuerCreation(driver);
        await createIssuer(driver);
    });

    it('should verify the issuer details', async function() {
        await navigateToIssuerDetails(driver);
        await verifyIssuerDetails(driver);
        await verifyIssuerOverApi();
    });

    it('should delete the issuer', async function () {
        await deleteIssuerOverApi();
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
