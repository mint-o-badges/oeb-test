import assert from 'assert';
import {By, until} from 'selenium-webdriver';
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
