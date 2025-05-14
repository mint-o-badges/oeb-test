import {By} from "selenium-webdriver";

export async function setOEBInputValueById(driver, id, value, fieldType='input') {
    const oebInputParent = await driver.findElement(By.id(id));
    const oebInputChild = await oebInputParent.findElement(By.css(fieldType)
    );
    await oebInputChild.clear()
    await oebInputChild.sendKeys(value);

}

export async function setOEBInputValueByCSS(driver, cssSelector, value) {
    const oebInputParent = await driver.findElement(
      By.css(`oeb-input[label=${cssSelector}]`)
    );
    const oebInputChild = await oebInputParent.findElement(By.css("input"));
    await oebInputChild.clear()
    await oebInputChild.sendKeys(value);
}

export async function clickUntilInteractable(elementCreator, tries=100) {
    for (let i = 0; i < tries-1; i++) {
        try {
            const element = await elementCreator();
            await element.click();
            return element;
        } catch(e) {
            if (e.name === 'ElementNotInteractableError') {
                await new Promise(res => setTimeout(res, 100));
                continue;
            }
            throw e;
        }
    }
    // After the tries, throw the error
    const element = await elementCreator();
    await element.click();
    return element;
}
