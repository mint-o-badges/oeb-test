const {By, Builder, Browser} = require('selenium-webdriver');
const assert = require('assert');
const {url} = require('../config.js');

describe('Title Test', function() {
    let driver;

    before(async () => driver = await new Builder().forBrowser(Browser.CHROME).build());

    it('should match the expected title', async function() {
        this.timeout(10000);

        await driver.get(url);

        let title = await driver.getTitle();
        assert.equal('Open Educational Badges', title);
    });

    after(async () => await driver.quit());
});
