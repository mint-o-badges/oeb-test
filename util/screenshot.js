import * as fs from "fs";

/**
 * @param {import("playwright/test").PlaywrightTestArgs} driver
 * @param {import("playwright/test").TestInfo} currentTest
 */
export async function screenshot(driver, currentTest) {
  if (!fs.existsSync("./screenshots")) {
    fs.mkdirSync("./screenshots");
  }
  if (!driver) return;
  // Take a screenshot of the result page
  const filename = currentTest.title
    .replace(/['"]+/g, "")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const encodedString = await driver.screenshot();
  await fs.writeFileSync(
    `./screenshots/${filename}.png`,
    encodedString,
    "base64"
  );
}
