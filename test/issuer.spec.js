import {Builder, Browser} from 'selenium-webdriver';
import {login} from './login.js';
import {
    navigateToIssuerCreation,
    createIssuer,
    deleteIssuerOverApi,
    navigateToIssuerDetails,
    verifyIssuerDetails,
    verifyIssuerOverApi
} from './issuer.js';
import {implicitWait} from '../config.js';

describe('Issuer Test', function() {
    this.timeout(20000);
    let driver;

    before(async () => {
        driver = await new Builder().forBrowser(Browser.CHROME).build();
        await driver.manage().setTimeouts({ implicit: implicitWait });
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

    after(async () => {
        await deleteIssuerOverApi();
        await driver.quit();
    });
});
