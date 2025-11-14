export async function avoidStale(fn) {
  return await fn();
}

export class ExtendedBy {
  static containingText(
    selector,
    childSelector,
    text,
    trim = true,
    caseSensitive = true
  ) {
    return async (page) => {
      return await avoidStale(async () => {
        const outer = page.locator(selector);
        const count = await outer.count();
        const matches = [];

        for (let i = 0; i < count; i++) {
          const outerElem = outer.nth(i);
          const children = outerElem.locator(childSelector);
          const childCount = await children.count();

          for (let j = 0; j < childCount; j++) {
            const child = children.nth(j);
            let childText = await child.textContent();

            if (trim && childText) {
              childText = childText.trim();
              text = text.trim();
            }
            if (!caseSensitive && childText) {
              childText = childText.toLowerCase();
              text = text.toLowerCase();
            }
            if (childText === text) {
              matches.push(outerElem);
              break;
            }
          }
        }
        return matches;
      });
    };
  }

  /**
   * This assumes that the text is contained by a span by default
   */
  static submitButtonWithText(
    text,
    trim = true,
    caseSensitive = true,
    textTag = "span"
  ) {
    return ExtendedBy.containingText(
      'button[type="submit"]',
      textTag,
      text,
      trim,
      caseSensitive
    );
  }

  static tagWithText(tag, text, trim = true, caseSensitive = true) {
    return async (page) => {
      return await avoidStale(async () => {
        const elems = page.locator(tag);
        const count = await elems.count();
        const matches = [];

        for (let i = 0; i < count; i++) {
          const el = elems.nth(i);
          let elText = await el.textContent();

          if (trim && elText) {
            elText = elText.trim();
            text = text.trim();
          }
          if (!caseSensitive && elText) {
            elText = elText.toLowerCase();
            text = text.toLowerCase();
          }
          if (elText === text) matches.push(el);
        }
        return matches;
      });
    };
  }

  static withParent(parentBy, childBy) {
    return async (page) => {
      return await avoidStale(async () => {
        const parents = page.locator(parentBy);
        const parentCount = await parents.count();
        const allChildren = [];

        for (let i = 0; i < parentCount; i++) {
          const children = parents.nth(i).locator(childBy);
          const childCount = await children.count();
          for (let j = 0; j < childCount; j++) {
            allChildren.push(children.nth(j));
          }
        }
        return allChildren;
      });
    };
  }

  static parentElement(elementLocator) {
    return async (page) => {
      // Playwright can traverse up with `locator('..')`
      return elementLocator.locator("..");
    };
  }

  static sibling(elementLocator, selector) {
    return async (page) => {
      const parent = await ExtendedBy.parentElement(elementLocator)(page);
      const siblings = parent.locator(selector);
      const count = await siblings.count();
      const matches = [];

      for (let i = 0; i < count; i++) {
        const sibling = siblings.nth(i);
        // Exclude the original element itself
        const isSame = await sibling.evaluate(
          (node, original) => node === original,
          await elementLocator.elementHandle()
        );
        if (!isSame) matches.push(sibling);
      }
      return matches;
    };
  }
}
