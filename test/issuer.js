import {By, until, WebElementCondition} from 'selenium-webdriver';
import assert from 'assert';
import {username, password} from '../secret.js';
import {url, defaultWait} from '../config.js';
import {requestToken, findIssuer, deleteIssuer} from '../util/api.js';
import {ExtendedBy} from '../util/selection.js';
import path from 'path';

const testIssuerName = 'automatedTestName';
const testIssuerImagePath = 'assets/image.png';
const testIssuerWebsite = 'automatedTest.de';
const testIssuerDescription = 'automatedTestDescription with a minimum length of 200 characters. These are indeed a looot of characters. This seems quite useless, but who am I to judge? I\'m just the miserable person writing such a uselessly long description, ain\'t I.';
const testIssuerStreet = 'automatedTestStreet';
const testIssuerStreetnumber = '42';
const testIssuerPostalCode = '4242';
const testIssuerCity = 'automatedTestCity';

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

    const image = path.resolve(testIssuerImagePath);
    await imageField.sendKeys(image);

    await driver.wait(until.elementLocated(By.css(
        'img[src^="data:image/png;base64,iVBORw0KGg"]')));

    const textFields = await driver.findElements(By.css(
        'input[type="text"]'));

    const nameField = textFields[0];
    await nameField.sendKeys(testIssuerName);

    const websiteField = await driver.findElement(By.css(
        'input[type="url"]'));
    await websiteField.sendKeys(testIssuerWebsite);

    const dropdownButtons = await driver.findElements(By.css(
        'button[role="combobox"]'));

    const mailDropdownButton = dropdownButtons[0];
    await mailDropdownButton.click();

    await driver.wait(until.elementLocated(
        ExtendedBy.tagWithText('hlm-option', username)), defaultWait);
    const mailOption = await driver.findElement(
        ExtendedBy.tagWithText('hlm-option', username));
    await mailOption.click();

    const description = await driver.findElement(By.tagName(
        'textarea'));
    await description.sendKeys(testIssuerDescription);

    const categoryDropdownButton = dropdownButtons[1];
    await categoryDropdownButton.click();

    const categoryOption = await driver.findElement(By.css(
        'hlm-option#cdk-option-2'));
    categoryOption.click();

    const streetField = textFields[1];
    streetField.sendKeys(testIssuerStreet);

    const numberFields = await driver.findElements(By.css(
        'input[type="number"]'));

    const streetnumberField = numberFields[0];
    streetnumberField.sendKeys(testIssuerStreetnumber);

    const postalCodeField = numberFields[1];
    postalCodeField.sendKeys(testIssuerPostalCode);

    const cityField = textFields[2];
    cityField.sendKeys(testIssuerCity);

    const submitButton = (await driver.findElements(By.css(
        'button[type="submit"]')))[1];
    submitButton.click();

    await driver.wait(until.titleIs(`Issuer - ${testIssuerName} - Open Educational Badges`), defaultWait);
}

export async function deleteIssuerOverApi() {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const issuer = await findIssuer(apiToken, testIssuerName);
    assert(issuer, "Failed to find the issuer");
    const slug = issuer.slug;
    assert(slug, "Failed to obtain the slug of the issuer");
    const deletionResult = await deleteIssuer(apiToken, slug);
    assert.equal(deletionResult, true,
        "The issuer deletion failed, probably because the HTTP response code wasn't 2xx");
}

export async function navigateToIssuerDetails(driver) {
    await driver.get(`${url}/issuer`);

    await driver.wait(until.elementLocated(By.linkText(testIssuerName)), defaultWait);
    const issuerLink = await driver.findElement(By.linkText(testIssuerName));
    issuerLink.click();

    await driver.wait(until.titleIs(`Issuer - ${testIssuerName} - Open Educational Badges`), defaultWait);
}

/**
 * This assumes that the driver already navigated to the issuer details
 */
export async function verifyIssuerDetails(driver) {
    const descriptionElements = await driver.findElements(
        ExtendedBy.tagWithText('p', testIssuerDescription));
    assert.equal(descriptionElements.length, 1,
        `Expected one element with the specified description (got ${descriptionElements.length})`);
    // This seems to be all the details we display
}

export async function verifyIssuerOverApi() {
    const apiToken = await requestToken(username, password);
    assert(apiToken, "Failed to request an API token");
    const issuer = await findIssuer(apiToken, testIssuerName);
    assert(issuer, "Failed to find the issuer");

    assert.equal(issuer.name, testIssuerName);
    // The url is always pretended with "http://" or "https://"
    assert.equal(issuer.url, `http://${testIssuerWebsite}`);
    assert.equal(issuer.description, testIssuerDescription);
    assert.equal(issuer.street, testIssuerStreet);
    assert.equal(issuer.streetnumber, testIssuerStreetnumber);
    assert.equal(issuer.zip, testIssuerPostalCode);
    assert.equal(issuer.city, testIssuerCity);
}
