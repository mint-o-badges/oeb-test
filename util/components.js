import { By } from "selenium-webdriver";

export async function setOEBInputValueById(driver, id, value, fieldType='input') {
    const oebInputParent = await driver.findElement(By.id(id));
    const oebInputChild = await oebInputParent.findElement(By.tagName(fieldType)
    );
    await oebInputChild.clear()
    await oebInputChild.sendKeys(value);

}

export async function setOEBInputValueByCSS(driver, cssSelector, value) {
  const oebInputParent = await driver.findElement(
    By.css(`oeb-input[label=${cssSelector}]`)
  );
  const oebInputChild = await oebInputParent.findElement(By.tagName("input"));
  await oebInputChild.clear()
  await oebInputChild.sendKeys(value);
}
