import { By } from "selenium-webdriver";

export class formComponents {
  static setOEBInputValueById(id, value) {
    return async (driver) => {
      const linkDescOebInput = await driver.findElement(By.id(id));
      const linkDescField = await linkDescOebInput.findElement(
        By.tagName("input")
      );
      await linkDescField.sendKeys(value);
    };
  }

  static setOEBInputValueByCSS(cssSelector, value) {
    return async (driver) => {
      const linkDescOebInput = await driver.findElement(
        By.css(`oeb-input[label=${cssSelector}]`)
      );
      const linkDescField = await linkDescOebInput.findElement(
        By.tagName("input")
      );
      await linkDescField.sendKeys(value);
    };
  }

}
