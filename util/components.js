import { By } from "selenium-webdriver";

export async function setOEBInputValueById(driver, id, value) {
    const linkDescOebInput = await driver.findElement(By.id(id));
    const linkDescField = await linkDescOebInput.findElement(
      By.tagName("input")
    );
    await linkDescField.sendKeys(value);

}

export async function setOEBInputValueByCSS(driver, cssSelector, value) {
  const linkDescOebInput = await driver.findElement(
    By.css(`oeb-input[label=${cssSelector}]`)
  );
  const linkDescField = await linkDescOebInput.findElement(By.tagName("input"));
  await linkDescField.sendKeys(value);
}
    };
  }

}
