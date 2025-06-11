/**
 * In this file utility functions for interacting with the API are provided
 */
import {backendUrl, extendedWait} from '../config.js';

export async function requestToken(username, password) {
    const data = new FormData();
    data.append('grant_type', 'password');
    data.append('client_id', 'public');
    data.append('scope', 'rw:profile rw:issuer rw:backpack');
    data.append('username', username);
    data.append('password', password);
     
    const path = `${backendUrl}/o/token`;
    const response = await fetch(path, {
        method: 'POST',
        body: data
    });

    const cookies = response.headers.get("set-cookie");
    if (cookies) {
        const accessTokenCookie = cookies?.split(";").find((cookie) => cookie.trim().startsWith("access_token="));
        const accessToken = accessTokenCookie ? accessTokenCookie.split("=")[1] : null;
        const jsonResponse = await response.json();
        jsonResponse.access_token = accessToken
        return await jsonResponse;
    }

    return await response.json();
}

async function request(path, method, body, token) {
    let response;
    if (body && body.length)
        response = await fetch(path, {
            method: method,
            body: body,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
            },
            signal: AbortSignal.timeout(extendedWait)
        });
    else
        response = await fetch(path, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
            },
            signal: AbortSignal.timeout(extendedWait)
        });

    if (!response.ok) {
        let body;
        try {
            body = await response.text();
        } catch(e) {
            console.error(`Getting request text failed with error: '${e}'`);
            body = response;
        }
        console.error(`Request to '${path}' failed with status: ${response.status}`);
        console.error(`Response body: ${body}`);
    }
    
    return response;
}

export async function verifyIssuer(token, slug) {
    const issuer = await getIssuer(token, slug);
    // TODO: This doesn't suffice (yet), since the verified option is ignored in the backend
    issuer.verified = true;
    // The image has to be deleted because otherwise it's `None`,
    // which is not interpreted as none
    delete issuer.image;

    const path = `${backendUrl}/v1/issuer/issuers/${slug}`;
    const response = await request(path, 'PUT', JSON.stringify(issuer), token);

    return await response.ok;
}

export async function getIssuer(token, slug) {
    const path = `${backendUrl}/v1/issuer/issuers/${slug}`;
    const response = await request(path, 'GET', '', token);

    return await response.json();
}

export async function findIssuer(token, name) {
    const path = `${backendUrl}/v1/issuer/issuers`;
    const response = await request(path, 'GET', '', token);

    const json = await response.json();
    if (!Array.isArray(json))
        return null;
    return json.find(obj => obj.name == name)
}

export async function deleteIssuer(token, slug) {
    const path = `${backendUrl}/v1/issuer/issuers/${slug}`;
    const response = await request(path, 'DELETE', '', token);

    return response.ok;
}

/**
 * This deletes the user associated with the token
 */
export async function deleteUser(token) {
    const path = `${backendUrl}/v1/user/profile`;
    const response = await request(path, 'DELETE', '', token);

    return response.ok;
}

/**
 * This gets the user associated with the token
 */
export async function getUser(token) {
    const path = `${backendUrl}/v1/user/profile`;
    const response = await request(path, 'GET', '', token);

    const json = await response.json();
    return json;
}

export async function findBadge(token, name) {
    const path = `${backendUrl}/v2/badgeclasses`;
    const response = await request(path, 'GET', '', token);

    const json = await response.json();
    const result = json.result;
    if (!Array.isArray(result))
        return null;
    return result.find(obj => obj.name == name)
}

export async function findAssertions(token, badgeId) {
    const path = `${backendUrl}/v2/badgeclasses/${badgeId}/assertions?include_revoked=false`;
    const response = await request(path, 'GET', '', token);

    const json = await response.json();
    return json.result;
}

export async function revokeAssertions(token, assertions) {
    let finalResult = true;
    for (const assertion of assertions) {
        const result = await revokeAssertion(token, assertion.entityId);
        finalResult = finalResult && result;
    }
    return finalResult;
}

export async function revokeAssertion(token, assertionId) {
    const path = `${backendUrl}/v2/assertions/${assertionId}`;
    const body = {
        "revocation_reason": "automated deletion"
    }
    const response = await request(path, 'DELETE', JSON.stringify(body), token);

    return response.ok;
}

export async function deleteBadge(token, entityId) {
    const path = `${backendUrl}/v2/badgeclasses/${entityId}`;
    const response = await request(path, 'DELETE', '', token);

    return response.ok;
}

function objectToFormData(obj) {
    const formData = new FormData();

    Object.entries(obj).forEach(([key, value]) => {
        formData.append(key, value);
    });

    return formData;
}
