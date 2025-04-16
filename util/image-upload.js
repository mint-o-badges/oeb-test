import { By, until } from "selenium-webdriver";
import { defaultWait } from "../config.js";
import path from "path";
import { ExtendedBy } from "./selection.js";

/**
 * Uploads the image at {@link imagePath} to the {@link n}th element whose id starts with {@link element_id}
 * @param {any} driver 
 * @param {string} element_id Id of the element to upload the image to
 * @param {number} nthElement Number of the element with the given id
 * @param {string} imagePath Path to the image file to upload
 */
export async function uploadImage(driver, element_id, nthElement, imagePath) {
    let imageField;
    if(nthElement === 0)
        imageField = await driver.findElement(By.css(`[id^='${element_id}']`));
    else
        imageField = await driver.findElements(By.css(`[id^='${element_id}']`))[nthElement - 1];
    const image = path.resolve(imagePath);
    await imageField.sendKeys(image);
    await driver.wait(
        until.elementLocated(
            By.css('img[src^="data:image/png;base64,iVBORw0KGg"]')
        ),
        defaultWait
    );
}

export async function selectNounProjectImage(driver, searchText) {
    // Open noun-project dialog
    const nounProject_option = await driver.wait(
        until.elementLocated(ExtendedBy.tagWithText("button", "anderes Icon suchen")),
        defaultWait
    );
    await nounProject_option.click();

    // Search for an image
    const searchIconField = await driver.wait(
        until.elementLocated(By.id("forminput")),
        defaultWait
    );
    await searchIconField.sendKeys(searchText);
    // Select first image in the list
    const chooseIconButton = await driver.wait(
        until.elementLocated(
            By.css(
                "tr.datatable-x-row:nth-child(1) > td:nth-child(3) > button:nth-child(1)"
            )
        ),
        defaultWait
    );
    await chooseIconButton.click();
    await driver.wait(
        until.elementLocated(
            By.css('img[src^="data:image/png;base64,iVBORw0KGg"]')
        ),
        defaultWait
    );
}
