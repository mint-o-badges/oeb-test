import {By, Builder, Browser, until} from 'selenium-webdriver';
import assert from 'assert';
import {url} from '../config.js';
import {requestToken, deleteUser} from '../util/api.js';

describe('Signup Test', function() {
    this.timeout(20000);
    let driver;

    before(async () => driver = await new Builder().forBrowser(Browser.CHROME).build());

    it('should be able to sign up', async function() {
        await driver.get(`${url}/signup`);

        let title = await driver.getTitle();
        assert.equal(title, 'Signup - Open Educational Badges');

        const emailField = await driver.findElement(By.css(
            'input[type="email"]'));
        await emailField.sendKeys('automated@test.mail');

        const textFields = await driver.findElements(By.css(
            'input[type="text"]'));

        const firstNameField = textFields[0];
        await firstNameField.sendKeys('automated');

        const lastNameField = textFields[1];
        await lastNameField.sendKeys('test');

        const passwordFields = await driver.findElements(By.css(
            'input[type="password"]'));

        const passwordField = passwordFields[0];
        await passwordField.sendKeys('automatedTestPassword');

        const passwordRepeatField = passwordFields[1];
        await passwordRepeatField.sendKeys('automatedTestPassword');

        const altchaCheckbox = await driver.findElement(By.id(
            'altcha_checkbox'));
        altchaCheckbox.click();

        await driver.wait(until.elementLocated(By.css(
            'div[data-state="verified"]')), 200*1000);

        const submitButton = (await driver.findElements(By.css(
            'button[type="submit"]')))[1];
        submitButton.click();

        await driver.wait(until.titleIs('Verification - Open Educational Badges'), 2000);


        const apiToken = await requestToken('automated@test.mail', 'automatedTestPassword');
        assert(apiToken);
        const deletionResult = await deleteUser(apiToken);
        assert(deletionResult);
    });

    after(async () => await driver.quit());
});
