import {Builder, Browser} from 'selenium-webdriver';
import {screenshot} from '../util/screenshot.js';
import {
    navigateToSignup,
    signup,
    navigateToProfile,
    deleteUserViaUI,
    verifyUserOverApi,
    deleteUserOverApi,
    loginToCreatedAccount
} from './signup.js';

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
    });

    it('should be able to sign up', async function() {
        await navigateToSignup(driver);
        await signup(driver);
    });

    it('should verify user details', async function() {
        await verifyUserOverApi();
    });

    it('should delete user account using UI', async function() {
        await loginToCreatedAccount(driver);
        await navigateToProfile(driver);
        await deleteUserViaUI(driver);
    });

    afterEach(async function () {
        await screenshot(driver, this.currentTest);
    });

    after(async () => {
        await deleteUserOverApi();  // Ensure user is deleted
        await driver.quit()
    });
});
