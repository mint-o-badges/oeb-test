import { By, until } from "selenium-webdriver";
import { defaultWait } from "../config.js";
import path from "path";

export async function uploadImage(driver, element_id, imagePath) {
    const imageField = await driver.findElement(By.id(element_id));
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
    // Try 5 times to avoid stale reference errors
    for (let i = 0; i < 5; i++) {
        try {
            const nounProject_option = await driver.wait(
                until.elementLocated(By.id("nounProject_span")),
                defaultWait
            );
            await nounProject_option.click();
            break;
        } catch(e) {
        }
    }
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
