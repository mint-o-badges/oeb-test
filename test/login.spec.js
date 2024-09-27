import {Builder, Browser} from 'selenium-webdriver';
import {login} from './login.js';
import {implicitWait} from '../config.js';

describe('Login Test', function() {
    this.timeout(20000);
    let driver;

    before(async () => {
        driver = await new Builder().forBrowser(Browser.CHROME).build();
        await driver.manage().setTimeouts({ implicit: implicitWait });
    });

    it('should be able to log in', async function() {
        await login(driver);
    });

    after(async () => await driver.quit());
});
