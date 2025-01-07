import {By, WebElement} from 'selenium-webdriver';

export class ExtendedBy {
    static containingText(selector, childSelector, text, trim = true) {
        return (async (driver) => {
            // Find elements from outer selector
            const selected = await driver.findElements(selector);
            const selectedArray = Array.from(selected);
            // Filter the elements.
            // Since the filtering is done async, first map them
            const mappedPromises = await selectedArray.map(async node => {
                // Find the children from the child selector
                const children = await node.findElements(childSelector);
                const childrenArray = Array.from(children);
                // Find if one or more children match the text.
                // Since this is done asnyc, first map them
                const mappedPromises = childrenArray.map(async node => {
                    let nodeText = await node.getText();
                    if (trim) {
                        nodeText = nodeText.trim();
                        text = text.trim();
                    }
                    return nodeText == text;
                });
                // Wait for the results of the mapping
                const mapped = await Promise.all(mappedPromises);
                // Check if at least one element matched
                return mapped.some(_ => _);
            });
            // Wait for the results of the mapping
            const mapped = await Promise.all(mappedPromises);
            // Filter the elements where the mapping yielded true
            return selectedArray.filter((_, i) => mapped[i]);
        });
    }

    /**
     * This assumes that the text is contained by a span by default
     */
    static submitButtonWithText(text, textTag = 'span') {
        return ExtendedBy.containingText(
            By.css('button[type="submit"]'), By.tagName('span'),
            text);
    }

    static tagWithText(tag, text, trim = true) {
        return (async (driver) => {
            const selected = await driver.findElements(By.tagName(tag));
            const selectedArray = Array.from(selected);
            const mappedPromises = selectedArray.map(async node => {
                try {
                    let nodeText = await node.getText();
                    if (trim) {
                        nodeText = nodeText.trim();
                        text = text.trim();
                    }
                    return nodeText === text;
                } catch(e) {
                    if (e.name === 'StaleElementReferenceError')
                        return false;
                    throw e;
                }
            });
            const mapped = await Promise.all(mappedPromises);
            return selectedArray.filter((_, i) => mapped[i]);
        });
    }

    static parentElement(element) {
        return (async (driver) => {
            const res = await element.findElement(By.xpath('./..'));
            return res;
        });
    }

    static sibling(element, selector) {
        return (async (driver) => {
            const parentElement = await driver.findElement(
                ExtendedBy.parentElement(element));
            const children = await parentElement.findElements(selector);
            const mappedPromises = children.map(async (child) => {
                const parentOfChild = await driver.findElement(
                    ExtendedBy.parentElement(child));
                return await WebElement.equals(parentElement, parentOfChild);
            });
            const map = await Promise.all(mappedPromises);
            return children.filter((_, i) => map[i]);
        });
    }
}

