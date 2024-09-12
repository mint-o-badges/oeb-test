import {By, Builder, Browser, until} from 'selenium-webdriver';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url} from '../config.js';

export async function login(driver) {
    await driver.get(`${url}/auth/login`);

    let title = await driver.getTitle();
    assert.equal(title, 'Login - Open Educational Badges');

    const emailField = await driver.findElement(By.css(
        'input[placeholder="Deine E-Mail Adresse"]'));
    await emailField.sendKeys(username);

    const passwordField = await driver.findElement(By.css(
        'input[placeholder="Dein Passwort"]'));
    await passwordField.sendKeys(password);

    const loginButton = await driver.findElement(By.css(
        'oeb-button[type="submit"]'));
    loginButton.click();

    await driver.wait(until.titleIs('Issuers - Open Educational Badges'), 2000);
}

describe('Login Test', function() {
    this.timeout(20000);
    let driver;

    before(async () => driver = await new Builder().forBrowser(Browser.CHROME).build());

    it('should be able to log in', async function() {
        await login(driver);
    });

    after(async () => await driver.quit());
});
