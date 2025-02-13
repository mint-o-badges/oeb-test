import {Builder, Browser} from 'selenium-webdriver';
import {screenshot} from '../util/screenshot.js';
import {
    navigateToSignup,
    signup,
    deleteUserOverApi,
    verifyUserOverApi,
    verifyUserByLogin
} from './signup.js';
import {implicitWait} from '../config.js';

describe('Signup Test', function() {
    this.timeout(20000);
    let driver;

    before(async () => {
        const host = process.env.SELENIUM || undefined;
        const server = host ? `http://${host}:4444` : '';
        driver = await new Builder()
        .usingServer(server)
            .forBrowser(Browser.CHROME)
            .build();
        await driver.manage().setTimeouts({ implicit: implicitWait });
    });

    it('should be able to sign up', async function() {
        await navigateToSignup(driver);
        await signup(driver);
    });

    it('should verify user details', async function() {
        // await verifyUserOverApi();
        await verifyUserByLogin(driver);
        
    });

    afterEach(async function () {
        await screenshot(driver, this.currentTest);
    });

    after(async () => {
        // TODO: Test deletion via UI
        await deleteUserOverApi();
        await driver.quit()
    });
});
