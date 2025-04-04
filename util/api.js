/**
 * In this file utility functions for interacting with the API are provided
 */
import {backendUrl} from '../config.js';

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

export async function verifyIssuer(token, slug) {
    const issuer = await getIssuer(token, slug);
    // TODO: This doesn't suffice (yet), since the verified option is ignored in the backend
    issuer.verified = true;
    // The image has to be deleted because otherwise it's `None`,
    // which is not interpreted as none
    delete issuer.image;

    const path = `${backendUrl}/v1/issuer/issuers/${slug}`;
    const response = await fetch(path, {
        method: 'PUT',
        body: JSON.stringify(issuer),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    return await response.ok;
}

export async function getIssuer(token, slug) {
    const path = `${backendUrl}/v1/issuer/issuers/${slug}`;
    const response = await fetch(path, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    return await response.json();
}

export async function findIssuer(token, name) {
    const path = `${backendUrl}/v1/issuer/issuers`;
    const response = await fetch(path, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    const json = await response.json();
    if (!Array.isArray(json))
        return null;
    return json.find(obj => obj.name == name)
}

export async function deleteIssuer(token, slug) {
    const path = `${backendUrl}/v1/issuer/issuers/${slug}`;
    const response = await fetch(path, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    if (!response.ok)
        console.log("Deleting the issuer failed. Response:", response);

    return response.ok;
}

/**
 * This deletes the user associated with the token
 */
export async function deleteUser(token) {
    const path = `${backendUrl}/v1/user/profile`;
    const response = await fetch(path, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    if (!response.ok)
        console.log("Deleting the user failed. Response:", response);

    return response.ok;
}

/**
 * This gets the user associated with the token
 */
export async function getUser(token) {
    const path = `${backendUrl}/v1/user/profile`;
    const response = await fetch(path, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    if (!response.ok)
        console.log("Getting the user failed. Response:", response);

    const json = await response.json();
    return json;
}

export async function findBadge(token, name) {
    const path = `${backendUrl}/v2/badgeclasses`;
    const response = await fetch(path, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    const json = await response.json();
    const result = json.result;
    if (!Array.isArray(result))
        return null;
    return result.find(obj => obj.name == name)
}

export async function findAssertions(token, badgeId) {
    const path = `${backendUrl}/v2/badgeclasses/${badgeId}/assertions?include_revoked=false`;
    const response = await fetch(path, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    const json = await response.json();
    return json.result;
}

export async function revokeAssertions(token, assertions) {
    const results = assertions.map(assertion => revokeAssertion(token, assertion.entityId));
    return results.every(res => res);
}

export async function revokeAssertion(token, assertionId) {
    const path = `${backendUrl}/v2/assertions/${assertionId}`;
    const body = {
        "revocation_reason": "automated deletion"
    }
    const response = await fetch(path, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        },
        body: JSON.stringify(body)
    });

    return response.ok;
}

export async function deleteBadge(token, entityId) {
    const path = `${backendUrl}/v2/badgeclasses/${entityId}`;
    const response = await fetch(path, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`
        }
    });

    return response.ok;
}

function objectToFormData(obj) {
    const formData = new FormData();

    Object.entries(obj).forEach(([key, value]) => {
        formData.append(key, value);
    });

    return formData;
}
