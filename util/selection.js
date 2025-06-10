import {By, WebElement} from 'selenium-webdriver';

export async function avoidStale(f) {
    // Try 5 times to avoid stale reference errors
    for (let i = 0; i < 5; i++) {
        try {
            return await f();
        } catch(e) {
            if (e.name === 'StaleElementReferenceError')
                continue;
            throw e;
        }
        break;
    }
}

export class ExtendedBy {
    static containingText(selector, childSelector, text,
        trim = true, caseSensitive = true) {
        return (async (driver) => {
            return await avoidStale(async () => {
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
                    const innerMappedPromises = childrenArray.map(async node => {
                        let nodeText = await node.getText();
                        if (trim && nodeText) {
                            nodeText = nodeText.trim();
                            text = text.trim();
                        }
                        if (!caseSensitive && nodeText) {
                            nodeText = nodeText.toLowerCase();
                            text = text.toLowerCase();
                        }
                        return nodeText == text;
                    });
                    // Wait for the results of the mapping
                    const mapped = await Promise.all(innerMappedPromises);
                    // Check if at least one element matched
                    return mapped.some(_ => _);
                });
                // Wait for the results of the mapping
                const mapped = await Promise.all(mappedPromises);
                // Filter the elements where the mapping yielded true
                return selectedArray.filter((_, i) => mapped[i]);
            });
        });
    }

    /**
     * This assumes that the text is contained by a span by default
     */
    static submitButtonWithText(
        text, trim = true, caseSensitive = true, textTag = 'span') {
        return ExtendedBy.containingText(
            By.css('button[type="submit"]'), By.css('span'),
            text, trim, caseSensitive);
    }

    static tagWithText(
        tag, text, trim = true, caseSensitive = true) {
        return (async (driver) => {
            return await avoidStale(async () => {
                const selected = await driver.findElements(By.css(tag));
                const selectedArray = Array.from(selected);
                const mappedPromises = selectedArray.map(async node => {
                    let nodeText = await node.getText();
                    if (trim && nodeText) {
                        nodeText = nodeText.trim();
                        text = text.trim();
                    }
                    if (!caseSensitive && nodeText) {
                        nodeText = nodeText.toLowerCase();
                        text = text.toLowerCase();
                    }
                    return nodeText === text;
                });
                const mapped = await Promise.all(mappedPromises);
                return selectedArray.filter((_, i) => mapped[i]);
            });
        });
    }

    static withParent(parentBy, childBy) {
        return (async (driver) => {
            return await avoidStale(async () => {
                const parentNodes = await driver.findElements(parentBy);
                const parentArray = Array.from(parentNodes);
                const childrenPromises = parentArray.map(async node => await node.findElements(childBy));
                const childrenNotFlat = await Promise.all(childrenPromises);
                const children = childrenNotFlat.flat();
                return children;
            });
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

