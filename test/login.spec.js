const {By, Builder, Browser, until} = require('selenium-webdriver');
const assert = require('assert');
const {username, password} = require('../secret.js');
const {url} = require('../config.js');

describe('Login Test', function() {
    let driver;

    before(async () => driver = await new Builder().forBrowser(Browser.CHROME).build());

    it('should be able to log in', async function() {
        this.timeout(20000);

        await driver.get(url + '/auth/login');

        let title = await driver.getTitle();
        assert.equal(title, 'Login - Open Educational Badges');

        const emailField = await driver.findElement(By.css(
            'input[placeholder="Deine E-Mail Adresse"]'));
        assert(emailField);

        emailField.click();
        await driver.actions()
            .sendKeys(username)
            .perform();

        const passwordField = await driver.findElement(By.css(
            'input[placeholder="Dein Passwort"]'));
        assert(passwordField);

        passwordField.click();
        await driver.actions()
            .sendKeys(password)
            .perform();

        const loginButton = await driver.findElement(By.css(
            'oeb-button[type="submit"]'));
        assert(loginButton);
        loginButton.click();

        await driver.wait(until.titleIs('Issuers - Open Educational Badges'), 2000);
    });

    after(async () => await driver.quit());
});
