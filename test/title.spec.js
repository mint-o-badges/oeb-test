import {By, Builder, Browser} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';
import {url} from '../config.js';
import {screenshot} from '../util/screenshot.js';

describe('Title Test', function() {
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

    it('should match the expected title', async function() {
        await driver.get(url);

        let title = await driver.getTitle();
        assert.equal(title, 'Open Educational Badges');
    });

    afterEach(async function () {
        try {
            await screenshot(driver, this.currentTest);
        } catch(e) {
            console.error(`Screenshotting failed: ${e}`);
        }
    });

    after(async () => await driver.quit());
});
