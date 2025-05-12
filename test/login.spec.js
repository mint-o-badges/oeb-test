import {Builder, Browser} from 'selenium-webdriver';
import {login} from './login.js';
import {screenshot} from '../util/screenshot.js';

describe('Login Test', function() {
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

    it('should be able to log in', async function() {
        await login(driver);
    });

    afterEach(async function () {
        await screenshot(driver, this.currentTest);
    });

    after(async () => await driver.quit());
});
