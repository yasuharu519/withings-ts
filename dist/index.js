"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const axios_1 = require("axios");
const querystring = require("querystring");
const WITHINGS_API_ENDPOINT = "https://wbsapi.withings.net";
const WITHINGS_ENDPOINTS = {
    authorize2: "https://account.withings.com/oauth2_user/authorize2",
    signature: `${WITHINGS_API_ENDPOINT}/v2/signature`,
    oauth2: `${WITHINGS_API_ENDPOINT}/v2/oauth2`,
    notify: `${WITHINGS_API_ENDPOINT}/notify`,
    measure: `${WITHINGS_API_ENDPOINT}/measure`,
};
const WITHINGS_ACTIONS = {
    getnonce: "getnonce",
    requesttoken: "requesttoken",
    subscribe: "subscribe",
    revoke: "revoke",
    getmeas: "getmeas",
    get: "get",
    list: "list",
};
const WITHINGS_GRANT_TYPE = {
    authorization_code: "authorization_code",
    refresh_token: "refresh_token",
};
class WithingsClient {
    constructor(client_id, client_secret, callback_uri) {
        this.CLIENT_ID = client_id;
        this.CLIENT_SECRET = client_secret;
        this.CALLBACK_URI = callback_uri;
    }
    /**
     * take paramters as map, sort by key and create signature
     * @param params map of key/value
     * @returns created signature
     */
    createSignature(params) {
        // sort parameters
        const keyParams = Object.keys(params)
            .sort()
            .map((key) => params[key])
            .join(",");
        return crypto
            .createHmac("sha256", this.CLIENT_SECRET)
            .update(keyParams)
            .digest("hex");
    }
    /**
     * post request base
     */
    async postRequest(endpoint, params = new Map(), headers) {
        const response = await axios_1.default.post(`${endpoint}?${querystring.stringify(Object.fromEntries(params))}`, null, {
            headers: Object.assign({ "Content-Type": "multipart/form-data" }, headers),
        });
        return response;
    }
    /**
     * post request with signature parameters
     */
    async requestWithSignature(endpoint, action, params, headers) {
        const nonce = (await this.getNonce()).body.nonce;
        const signatureToken = new Map([
            ["action", action],
            ["client_id", this.CLIENT_ID],
            ["nonce", nonce],
        ]);
        const response = await this.postRequest(endpoint, new Map([...signatureToken.entries(), ...params.entries()]).set("signature", this.createSignature(Object.fromEntries(signatureToken))), headers);
        return response.data;
    }
    /**
     * Signature V2 - Getnonce
     */
    async getNonce() {
        const signatureToken = new Map([
            ["action", WITHINGS_ACTIONS.getnonce],
            ["client_id", this.CLIENT_ID],
            ["timestamp", Math.floor(new Date().getTime() / 1000).toString()],
        ]);
        const response = await this.postRequest(WITHINGS_ENDPOINTS.signature, new Map([...signatureToken.entries()]).set("signature", this.createSignature(Object.fromEntries(signatureToken))));
        return response.data;
    }
    /**
     * OAuth2.0 - Generates URL to get authentication code
     */
    generateGetAuthenticationCodeUrl(state, scope, isDemo = false) {
        const params = new Map([
            ["response_type", "code"],
            ["client_id", this.CLIENT_ID],
            ["state", state],
            ["scope", scope.join(",")],
            ["redirect_uri", this.CALLBACK_URI],
        ]);
        if (isDemo) {
            params.set("mode", "demo");
        }
        return new URL(`${WITHINGS_ENDPOINTS.authorize2}?${querystring.stringify(Object.fromEntries(params))}`);
    }
    /**
     * OAuth2.0 - Get your access token
     */
    async getAccessToken(authorizationCode) {
        const params = new Map([
            ["client_secret", this.CLIENT_SECRET],
            ["grant_type", WITHINGS_GRANT_TYPE.authorization_code],
            ["code", authorizationCode],
            ["redirect_uri", this.CALLBACK_URI],
        ]);
        return this.requestWithSignature(WITHINGS_ENDPOINTS.oauth2, WITHINGS_ACTIONS.requesttoken, params);
    }
    /**
     * OAuth2.0 - Refresh your access token
     */
    async getRefreshToken(refresh_token) {
        const params = new Map([
            ["client_secret", this.CLIENT_SECRET],
            ["grant_type", WITHINGS_GRANT_TYPE.refresh_token],
            ["refresh_token", refresh_token],
        ]);
        return this.requestWithSignature(WITHINGS_ENDPOINTS.oauth2, WITHINGS_ACTIONS.requesttoken, params);
    }
    /**
     * Notify - Get
     */
    async getNotify(accessToken, url) {
        const query = new Map([
            ["action", WITHINGS_ACTIONS.get],
            ["callbackurl", url.href],
            ["appli", "1"],
        ]);
        const response = await this.postRequest(WITHINGS_ENDPOINTS.notify, query, { Authorization: `Bearer ${accessToken}` });
        return response.data;
    }
    /**
     * Notify - List
     */
    async getNotifyList(accessToken) {
        const query = new Map([
            ["action", "list"],
        ]);
        const response = await this.postRequest(WITHINGS_ENDPOINTS.notify, query, { Authorization: `Bearer ${accessToken}` });
        return response.data;
    }
    /**
     * Notify - Subscribe
     */
    async subscribeNotify(accessToken, url, appli) {
        const params = new Map([
            ["callbackurl", url.href],
            ["appli", appli],
        ]);
        return this.requestWithSignature(WITHINGS_ENDPOINTS.notify, WITHINGS_ACTIONS.subscribe, params, { Authorization: `Bearer ${accessToken}` });
    }
    /**
     * Notify - Revoke
     */
    async revokeNotify(accessToken, url, appli) {
        const params = new Map([
            ["callbackurl", url.href],
            ["appli", appli],
        ]);
        return this.requestWithSignature(WITHINGS_ENDPOINTS.notify, WITHINGS_ACTIONS.revoke, params, { Authorization: `Bearer ${accessToken}` });
    }
    /**
     * Measure - Getmeas
     */
    async getMeas(accessToken, startdate, enddate) {
        const params = new Map([
            ["action", WITHINGS_ACTIONS.getmeas],
            ["meastypes", "1,4,5.6,8,9,10,11,12,54,71,73,76,77,88,91"],
            ["category", "1"],
            ["startdate", startdate.toString()],
            ["enddate", enddate.toString()],
        ]);
        return this.requestWithSignature(WITHINGS_ENDPOINTS.measure, WITHINGS_ACTIONS.getmeas, params, { Authorization: `Bearer ${accessToken}` });
    }
}
exports.default = WithingsClient;
