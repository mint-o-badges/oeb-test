import * as fs from 'fs';
export async function screenshot(driver, currentTest) {
    if (!fs.existsSync('./screenshots')){
        fs.mkdirSync('./screenshots');
    }
    if (!driver) 
        return;
    // Take a screenshot of the result page
    const filename = currentTest.fullTitle()
        .replace(/['"]+/g, '')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
    const encodedString = await driver.takeScreenshot();
    await fs.writeFileSync(`./screenshots/${filename}.png`,
        encodedString, 'base64');
}
