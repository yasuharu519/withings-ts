import { GetAccessTokenResponse, GetNonceResponse, GetNotifyListResponse, GetRefreshTokenResponse, AddNotifySubscribeResponse, RevokeNotifyResponse, GetMeasureResult, GetNotifyResponse } from "./requestTypes";
declare class WithingsClient {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    CALLBACK_URI: string;
    constructor(client_id: string, client_secret: string, callback_uri: string);
    /**
     * take paramters as map, sort by key and create signature
     * @param params map of key/value
     * @returns created signature
     */
    private createSignature;
    /**
     * post request base
     */
    private postRequest;
    /**
     * post request with signature parameters
     */
    private requestWithSignature;
    /**
     * Signature V2 - Getnonce
     */
    getNonce(): Promise<GetNonceResponse>;
    /**
     * OAuth2.0 - Generates URL to get authentication code
     */
    generateGetAuthenticationCodeUrl(state: string, scope: string[], isDemo?: boolean): URL;
    /**
     * OAuth2.0 - Get your access token
     */
    getAccessToken(authorizationCode: string): Promise<GetAccessTokenResponse>;
    /**
     * OAuth2.0 - Refresh your access token
     */
    getRefreshToken(refresh_token: string): Promise<GetRefreshTokenResponse>;
    /**
     * Notify - Get
     */
    getNotify(accessToken: string, url: URL): Promise<GetNotifyResponse>;
    /**
     * Notify - List
     */
    getNotifyList(accessToken: string): Promise<GetNotifyListResponse>;
    /**
     * Notify - Subscribe
     */
    subscribeNotify(accessToken: string, url: URL, appli: string): Promise<AddNotifySubscribeResponse>;
    /**
     * Notify - Revoke
     */
    revokeNotify(accessToken: string, url: URL, appli: string): Promise<RevokeNotifyResponse>;
    /**
     * Measure - Getmeas
     */
    getMeas(accessToken: string, startdate: number, enddate: number): Promise<GetMeasureResult>;
}
export default WithingsClient;
