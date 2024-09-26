import {By} from 'selenium-webdriver';

export class ExtendedBy {
    static containingText(selector, childSelector, text) {
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
                    const nodeText = await node.getText();
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
            const res = selectedArray.filter((_, i) => mapped[i]);
            return res;
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
}
