import {Builder, Browser} from 'selenium-webdriver';
import {login} from './login.js';
import {screenshot} from '../util/screenshot.js';
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
        driver = await new Builder()
            .usingServer(server)
            .forBrowser(Browser.CHROME)
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

    afterEach(async function () {
        await screenshot(driver, this.currentTest);
    });

    after(async () => {
        await deleteIssuerOverApi();
        await driver.quit();
    });
});
