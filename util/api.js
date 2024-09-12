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

    return await response.json();
}

export async function verifyIssuer(token, slug) {
    const issuer = await getIssuer(token, slug);
    // TODO: This doesn't suffice (yet), since the verified option is ignored in the backend
    issuer.verified = true;
    // The image has to be deleted because otherwise it's `None`,
    // which is not interpreted as none
    delete issuer.image;
    console.log(issuer);

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

    console.log(response);

    const body = await response.json();
    console.log(body);

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
    return json.find(obj => obj.name == 'automatedTestName')
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

    return response.ok;
}

function objectToFormData(obj) {
    const formData = new FormData();

    Object.entries(obj).forEach(([key, value]) => {
        formData.append(key, value);
    });

    return formData;
}
