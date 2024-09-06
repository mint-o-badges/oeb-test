import {By, Builder, Browser} from 'selenium-webdriver';
import assert from 'assert';
import {url} from '../config.js';

describe('Title Test', function() {
    this.timeout(10000);
    let driver;

    before(async () => driver = await new Builder().forBrowser(Browser.CHROME).build());

    it('should match the expected title', async function() {
        await driver.get(url);

        let title = await driver.getTitle();
        assert.equal(title, 'Open Educational Badges');
    });

    after(async () => await driver.quit());
});
