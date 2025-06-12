import {
    findBadges,
    requestToken,
    findAssertions,
    revokeAssertions,
    deleteBadge
} from './util/api.js';
import {username, password} from './secret.js';

// Cleans up possible residues of the test execution
export async function mochaGlobalTeardown() {
    console.log("Tearing down...");

    await cleanupBadges();

    console.log("Teardown completed.");
};

async function cleanupBadges() {
    const token = await requestToken(username, password);
    const badges = await findBadges(token, 'automated', true);
    for (let badge of badges) {
        const assertions = await findAssertions(token, badge.entityId);
        await revokeAssertions(token, assertions);
        await deleteBadge(token, badge.entityId);
    }

    const residue = await findBadges(token, 'automated', true);
    if (residue.length != 0)
        console.error("Didn't succeed in deleting residue badges");
}

