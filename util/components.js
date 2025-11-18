import { expect } from "@playwright/test";

export async function setOEBInputValueById(
  page,
  id,
  value,
  fieldType = "input"
) {
  const parent = page.locator(`#${id}`);
  const child = parent.locator(fieldType);

  await expect(child).toBeVisible(); // optional sanity check
  await child.fill(""); // clears any existing content
  await child.type(value);
}

export async function setOEBInputValueByLabel(page, label, value) {
  // Locate the <oeb-input> that has the given label attribute
  const parent = page.locator(`oeb-input[label="${label}"]`);
  const child = parent.locator("input");

  await expect(child).toBeVisible(); // optional sanity check
  await child.fill("");
  await child.type(value);
}
