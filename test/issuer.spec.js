import {Builder, Browser} from 'selenium-webdriver';
import {login} from './login.js';
import {
    navigateToIssuerCreation,
    createIssuer,
    deleteIssuerOverApi
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
        // TODO: Verify issuer details
    });

    after(async () => {
        await deleteIssuerOverApi();
        await driver.quit();
    });
});
