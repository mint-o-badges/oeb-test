// tests/global-teardown.mjs
import {
  findBadges,
  requestToken,
  findAssertions,
  revokeAssertions,
  deleteBadge,
} from "./util/api.js";
import { username, password } from "./secret.js";

/**
 * Playwright calls this function once after the entire test run finishes.
 * It receives the test configuration, but we only need it for logging.
 */
export default async ({ config }) => {
  console.log("🧹 Tearing down Playwright test run …");

  try {
    await cleanupBadges();
    console.log("✅ Teardown completed.");
  } catch (err) {
    console.error("❌ Teardown failed:", err);
  }
};

async function cleanupBadges() {
  const token = await requestToken(username, password);
  const badges = await findBadges(token, "automated", true);
  for (let badge of badges) {
    const assertions = await findAssertions(token, badge.entityId);
    await revokeAssertions(token, assertions);
    await deleteBadge(token, badge.entityId);
  }

  const residue = await findBadges(token, "automated", true);
  if (residue.length != 0)
    console.error("Didn't succeed in deleting residue badges");
}
