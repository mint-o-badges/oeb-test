import {Builder, Browser} from 'selenium-webdriver';
import {screenshot} from '../util/screenshot.js';
import chrome from 'selenium-webdriver/chrome.js';
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

    it('should ensure user is deleted over API', async function () {
        await deleteUserOverApi();
    });

    afterEach(async function () {
        await screenshot(driver, this.currentTest);
    });

    after(async () => {
        await driver.quit()
    });
});
