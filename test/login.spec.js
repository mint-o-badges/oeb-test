import {Builder, Browser} from 'selenium-webdriver';
import {login} from './login.js';
import {implicitWait} from '../config.js';

describe('Login Test', function() {
    this.timeout(20000);
    let driver;

    beforeEach(async () => {
        const host = process.env.SELENIUM || undefined;
        const server = host ? `http://${host}:4444` : '';
        driver = await new Builder()
            .usingServer(server)
            .forBrowser(Browser.CHROME)
            .build();
        await driver.manage().setTimeouts({ implicit: implicitWait });
    });

    it('should be able to log in', async function() {
        await login(driver);
    });

    after(async () => await driver.quit());
});
