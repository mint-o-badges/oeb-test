import {By, until, Key} from "selenium-webdriver";
import {defaultWait, extendedWait} from '../config.js';
import {ExtendedBy} from './selection.js';
import {setOEBInputValueById, setOEBInputValueByCSS } from './components.js';

export async function addNewTag(driver, tagName ){
    await driver.wait(until.elementLocated(By.css('input[placeholder^="Einen Tag eingeben"]')), defaultWait);
    const tagField = await driver.findElement(By.css('input[placeholder^="Einen Tag eingeben"]'));
    await tagField.sendKeys(tagName);
    // Clicking the button is harder then pushing enter, since the click is intercepted,
    // if the tag is new
    await tagField.sendKeys(Key.RETURN);
}

export async function setBadgeValidity(driver){
    // Set duration number
    setOEBInputValueById(driver, "duration-number", 2);
    // Set duration type
    const durationDropdownRegion = await driver.findElement(By.id(
        'duration-type'));
    const durationDropdownButton = await durationDropdownRegion.findElement(
        By.css('button'));
    await durationDropdownButton.click(); 
    const monthOption = await driver.findElement(ExtendedBy.tagWithText('hlm-option', 'Monate'))        
    await monthOption.click(); 
}

export async function addCompetenciesByHand(driver){
    const competenciesByHandSection = await driver.findElement(By.id(
      'competencies-by-hand-section'));
    await competenciesByHandSection.click();

    const addOwnCompetencyButton = await driver.findElement(By.css(
        'oeb-button[icon="lucidePlus"]'));
    await addOwnCompetencyButton.click();


    setOEBInputValueById(driver, "competencyTitle_0", "competency title");
    setOEBInputValueById(driver, "competencyDescriptionInput_0", "competency description", "textarea");
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
}

export async function addCompetenciesViaAI(driver, aiCompetenciesDescriptionText){
    const aiCompetenciesDescField = await driver.findElement(By.id(
      'ai-competencies-description'));
    await aiCompetenciesDescField.sendKeys(aiCompetenciesDescriptionText);
    const suggestCompetenciesButton = await driver.findElement(By.id(
        'suggest-competencies-btn'));
    await suggestCompetenciesButton.click();
    
    // Only use first skill to always ensure we have only one resulting in a deterministic
    // total number of competencies
    await driver.wait(until.elementLocated(By.id('checkboxAiSkill_0')), extendedWait);
    const firstAISkillCheckbox = await driver.findElement(By.id(
        'checkboxAiSkill_0'));
    firstAISkillCheckbox.click();
    await driver.wait(until.elementIsEnabled(firstAISkillCheckbox), defaultWait);
}
