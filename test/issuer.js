import {By, until, WebElementCondition} from 'selenium-webdriver';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url} from '../config.js';
import {requestToken, findIssuer, deleteIssuer} from '../util/api.js';
import path from 'path';

export async function navigateToIssuerCreation(driver) {
    await driver.get(`${url}/issuer/create`);

    let title = await driver.getTitle();
    assert.equal(title, 'Create Issuer - Open Educational Badges');
}

/**
 * This assumes that the driver already navigated to the issuer creation page
 */
export async function createIssuer(driver) {
    const imageField = await driver.findElement(By.id(
        'image_field0'));

    const image = path.resolve('assets/image.png');
    await imageField.sendKeys(image);

    await driver.wait(until.elementLocated(By.css(
        'img[src^="data:image/png;base64,iVBORw0KGg"]')));

    const textFields = await driver.findElements(By.css(
        'input[type="text"]'));

    const nameField = textFields[0];
    await nameField.sendKeys('automatedTestName');

    const websiteField = await driver.findElement(By.css(
        'input[type="url"]'));
    await websiteField.sendKeys('automatedTest.de');

    const dropdownButtons = await driver.findElements(By.css(
        'button[role="combobox"]'));

    const mailDropdownButton = dropdownButtons[0];
    await mailDropdownButton.click();

    const mailOption = await driver.findElement(By.css(
        'hlm-option[ng-reflect-value="' + username + '"]'));
    await mailOption.click();

    const description = await driver.findElement(By.tagName(
        'textarea'));
    await description.sendKeys('automatedTestDescription');

    const categoryDropdownButton = dropdownButtons[1];
    await categoryDropdownButton.click();

    const categoryOption = await driver.findElement(By.css(
        'hlm-option#cdk-option-2'));
    categoryOption.click();

    const streetField = textFields[1];
    streetField.sendKeys('automatedTestStreet');

    const numberFields = await driver.findElements(By.css(
        'input[type="number"]'));

    const streetnumberField = numberFields[0];
    streetnumberField.sendKeys('42');

    const postalCodeField = numberFields[1];
    postalCodeField.sendKeys('4242');

    const cityField = textFields[2];
    cityField.sendKeys('automatedTestCity');

    const submitButton = (await driver.findElements(By.css(
        'button[type="submit"]')))[1];
    submitButton.click();

    await driver.wait(until.titleIs('Issuer - automatedTestName - Open Educational Badges'), 2000);
}

export async function deleteIssuerOverApi(name = 'automatedTestName') {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const issuer = await findIssuer(apiToken, name);
    assert(issuer, "Failed to find the issuer");
    const slug = issuer.slug;
    assert(slug, "Failed to obtain the slug of the issuer");
    const deletionResult = await deleteIssuer(apiToken, slug);
    assert.equal(deletionResult, true,
        "The issuer deletion failed, probably because the HTTP response code wasn't 2xx");
}
