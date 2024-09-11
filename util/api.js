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

export async function verifyIssuer(username, password, slug) {
    const token = await requestToken(username, password);
    return await tokenVerifyIssuer(token, slug);
}

async function tokenVerifyIssuer(token, slug) {
    const issuer = await tokenGetIssuer(token, slug);
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

async function tokenGetIssuer(token, slug) {
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

function objectToFormData(obj) {
    const formData = new FormData();

    Object.entries(obj).forEach(([key, value]) => {
        formData.append(key, value);
    });

    return formData;
}
