import assert from 'assert';
import {By, until} from 'selenium-webdriver';
import {username, password} from '../secret.js';
import {url, defaultWait} from '../config.js';
import {ExtendedBy} from '../util/selection.js';

const issuersPageTitle = 'Issuers - Open Educational Badges';

export async function login(driver, userName = username, userPassword = password, pageTitle = issuersPageTitle) {
    await driver.get(`${url}/auth/login`);

    await driver.wait(until.titleIs(
        'Login - Open Educational Badges'), defaultWait);

    const emailField = await driver.findElement(By.css(
        'input[placeholder="Deine E-Mail Adresse"]'));
    await emailField.sendKeys(userName);

    const passwordField = await driver.findElement(By.css(
        'input[placeholder="Dein Passwort"]'));
    await passwordField.sendKeys(userPassword);

    const loginButton = await driver.findElement(By.css(
        'oeb-button[type="submit"]'));
    loginButton.click();

    await driver.wait(until.titleIs(pageTitle), defaultWait);

    await acceptTerms(driver);
}

export async function acceptTerms(driver) {
    let termsBox = undefined;
    try {
        // The box to accept terms only appears in a later step in
        // rendering; first the issuer page is shown. Thus we wait
        // a second to check if it appears then. If it didn't appear
        // within a second, we just hope it never will.
        const headline = await driver.wait(until.elementLocated(
            ExtendedBy.tagWithText('h1',
                'Neue Nutzungsbedingungen')),
            1000);
        termsBox = await driver.findElement(
            ExtendedBy.parentElement(headline));
    } catch(e) {
        // No new terms to accept
        return;
    }
    
    const checkbox = await termsBox.findElement(
        By.css('hlm-checkbox-checkicon'));
    await checkbox.click();

    const submitButton = await termsBox.findElement(
        By.css('button'));
    await submitButton.click();

    await driver.get(`${url}/issuer`);
    await driver.wait(until.titleIs(issuersPageTitle), defaultWait);
}
