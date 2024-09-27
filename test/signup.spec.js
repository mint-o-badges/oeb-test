import {Builder, Browser} from 'selenium-webdriver';
import {
    navigateToSignup,
    signup,
    deleteUserOverApi
} from './signup.js';
import {implicitWait} from '../config.js';

describe('Signup Test', function() {
    this.timeout(20000);
    let driver;

    before(async () => {
        driver = await new Builder().forBrowser(Browser.CHROME).build();
        await driver.manage().setTimeouts({ implicit: implicitWait });
    });

    it('should be able to sign up', async function() {
        await navigateToSignup(driver);
        await signup(driver);
    });

    after(async () => {
        // TODO: Test deletion via UI
        await deleteUserOverApi();
        await driver.quit()
    });
});
