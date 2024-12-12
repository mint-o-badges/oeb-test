import {By, until} from "selenium-webdriver";
import {defaultWait} from '../config.js';
import {ExtendedBy} from './selection.js';

export async function badgeAddNewTag(driver, tagName ){
    await driver.wait(until.elementLocated(By.css('input[placeholder="Neuer Tag..."]')), defaultWait);
    const tagField = await driver.findElement(By.css('input[placeholder="Neuer Tag..."]'));
    await tagField.sendKeys(tagName);
    const addTagButton = await driver.findElement(By.id('add-tag-btn'));
    await addTagButton.click()
}

export async function linkToEduStandards(driver ){
    const linkStandardsSection = await driver.findElement(By.id(
      'link-standards-btn'));
    await linkStandardsSection.click(); 
    setOEBInputValueByCSS(driver, "Name", "link Name");
    setOEBInputValueByCSS(driver, "URL", "http://test.de");
    setOEBInputValueById(driver, "alignment_description_0", "link Desc");

    // educational standards more options
    // open section
    const LinkMoreOptionsSection = await driver.findElement(By.id(
      'link-more-options-btn'));
    await LinkMoreOptionsSection.click(); 
    // Add Frame
    const frameField = await driver.findElement(By.id('forminput2'));
    await frameField.sendKeys("Frame");
    // Add code
    const frameCodeField = await driver.findElement(By.id('url'));
    await driver.actions()
        .scroll(0, 0, 0, 0, frameCodeField)
        .perform()
    await frameCodeField.sendKeys(12345);
}

export async function setBdgeValidaty(driver){
    // open section
    const badgeValiditySection = await driver.findElement(By.id(
      'badge-validity-btn'));
    await badgeValiditySection.click(); 
    // Set duration number
    setOEBInputValueById(driver, "duration-number", 2);
    // Set duration type
    const DurationDropdownButton = await driver.findElement(By.id(
        'duration-type'));
    await DurationDropdownButton.click(); 
    const MonthOption = driver.findElement(By.xpath("//*[text()='Monate']"))        
    await MonthOption.click(); 
}

export async function addCompetenciesByHand(driver){
    const competenciesByHandSection = await driver.findElement(By.id(
      'competencies-by-hand-section'));
    await competenciesByHandSection.click();
    setOEBInputValueById(driver, "competencyTitle_0", "competency title");
    setOEBInputValueById(driver, "competencyDurationHour_0", 2);
    setOEBInputValueById(driver, "competencyDurationMinutes_0", 30);
    const competencyCategoryDropdownButton = await driver.findElement(By.id(
        'competencyCategory_0'));
    await competencyCategoryDropdownButton.click();
    await driver.wait(until.elementLocated(
        ExtendedBy.tagWithText('hlm-option', "Fähigkeit")), defaultWait);
    const skillOption = await driver.findElement(
        ExtendedBy.tagWithText('hlm-option', "Fähigkeit"));
    await skillOption.click();
    setOEBInputValueById(driver, "competencyDescriptionInput_0", "competency description", "textarea");
    setOEBInputValueById(driver, "escoIdentifierInput_0", "test/skill/0000-0000-0000-0000-0000");
}

export async function addCompetenciesViaAI(driver, aiCompetenciesDescriptionText){
    const aiCompetenciesDescField = await driver.findElement(By.id(
      'ai-competencies-description'));
    await aiCompetenciesDescField.sendKeys(aiCompetenciesDescriptionText);
    const suggestCompetenciesButton = await driver.findElement(By.id(
        'suggest-competencies-btn'));
    await suggestCompetenciesButton.click();
    
    // Select first and third skills
    const firstAISkillCheckbox = await driver.findElement(By.id(
        'checkboxAiSkill_0'));
    firstAISkillCheckbox.click();
    const thirdAISkillCheckbox = await driver.findElement(By.id(
        'checkboxAiSkill_2'));
    thirdAISkillCheckbox.click();
}
