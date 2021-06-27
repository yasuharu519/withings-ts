import * as crypto from "crypto";
import axios from "axios";
import {
  GetAccessTokenResponse,
  GetNonceResponse,
  GetNotifyListResponse,
  GetRefreshTokenResponse,
  AddNotifySubscribeResponse,
  RevokeNotifyResponse,
  GetMeasureResult,
  GetNotifyResponse,
  GetHeartListResponse
} from "./requestTypes";
import * as querystring from "querystring";

const WITHINGS_API_ENDPOINT = "https://wbsapi.withings.net";
const WITHINGS_ENDPOINTS = {
  authorize2: "https://account.withings.com/oauth2_user/authorize2",
  signature: `${WITHINGS_API_ENDPOINT}/v2/signature`,
  oauth2: `${WITHINGS_API_ENDPOINT}/v2/oauth2`,
  notify: `${WITHINGS_API_ENDPOINT}/notify`,
  measure: `${WITHINGS_API_ENDPOINT}/measure`,
  heart: `${WITHINGS_API_ENDPOINT}/heart`,

} as const;
type WITHINGS_ENDPOINTS = typeof WITHINGS_ENDPOINTS[keyof typeof WITHINGS_ENDPOINTS];

const WITHINGS_ACTIONS = {
  getnonce: "getnonce",
  requesttoken: "requesttoken",
  subscribe: "subscribe",
  revoke: "revoke",
  getmeas: "getmeas",
  get: "get",
  list: "list",
} as const;
type WITHINGS_ACTIONS = typeof WITHINGS_ACTIONS[keyof typeof WITHINGS_ACTIONS];

const WITHINGS_GRANT_TYPE = {
  authorization_code: "authorization_code",
  refresh_token: "refresh_token",
} as const;
type WITHINGS_GRANT_TYPE = typeof WITHINGS_GRANT_TYPE[keyof typeof WITHINGS_GRANT_TYPE];

class WithingsClient {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  CALLBACK_URI: string;

  constructor(client_id: string, client_secret: string, callback_uri: string) {
    this.CLIENT_ID = client_id;
    this.CLIENT_SECRET = client_secret;
    this.CALLBACK_URI = callback_uri;
  }

  /**
   * take paramters as map, sort by key and create signature
   * @param params map of key/value
   * @returns created signature
   */
  private createSignature(params: { [key: string]: string }): string {
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
  private async postRequest<ResponseType>(
    endpoint: WITHINGS_ENDPOINTS,
    params: Map<string, string> = new Map(),
    headers?: Object
  ) {
    const response = await axios.post<ResponseType>(
      `${endpoint}?${querystring.stringify(Object.fromEntries(params))}`,
      null,
      {
        headers: Object.assign(
          { "Content-Type": "multipart/form-data" },
          headers
        ),
      }
    );

    return response;
  }

  /**
   * post request with signature parameters
   */
  private async requestWithSignature<ResponseType>(
    endpoint: WITHINGS_ENDPOINTS,
    action: WITHINGS_ACTIONS,
    params: Map<string, string>,
    headers?: Object
  ) {
    const nonce = (await this.getNonce()).body.nonce;
    const signatureToken = new Map([
      ["action", action],
      ["client_id", this.CLIENT_ID],
      ["nonce", nonce],
    ]);

    const response = await this.postRequest<ResponseType>(
      endpoint,
      new Map([...signatureToken.entries(), ...params.entries()]).set(
        "signature",
        this.createSignature(Object.fromEntries(signatureToken))
      ),
      headers
    );

    return response.data;
  }

  /**
   * Signature V2 - Getnonce
   */
  public async getNonce(): Promise<GetNonceResponse> {
    const signatureToken = new Map([
      ["action", WITHINGS_ACTIONS.getnonce],
      ["client_id", this.CLIENT_ID],
      ["timestamp", Math.floor(new Date().getTime() / 1000).toString()],
    ]);

    const response = await this.postRequest<GetNonceResponse>(
      WITHINGS_ENDPOINTS.signature,
      new Map([...signatureToken.entries()]).set(
        "signature",
        this.createSignature(Object.fromEntries(signatureToken))
      )
    );

    return response.data;
  }

  /**
   * OAuth2.0 - Generates URL to get authentication code
   */
  generateGetAuthenticationCodeUrl(
    state: string,
    scope: string[],
    isDemo: boolean = false
  ): URL {
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

    return new URL(
      `${WITHINGS_ENDPOINTS.authorize2}?${querystring.stringify(
        Object.fromEntries(params)
      )}`
    );
  }

  /**
   * OAuth2.0 - Get your access token
   */
  async getAccessToken(
    authorizationCode: string
  ): Promise<GetAccessTokenResponse> {
    const params = new Map([
      ["client_secret", this.CLIENT_SECRET],
      ["grant_type", WITHINGS_GRANT_TYPE.authorization_code],
      ["code", authorizationCode],
      ["redirect_uri", this.CALLBACK_URI],
    ]);

    return this.requestWithSignature<GetAccessTokenResponse>(
      WITHINGS_ENDPOINTS.oauth2,
      WITHINGS_ACTIONS.requesttoken,
      params
    );
  }

  /**
   * OAuth2.0 - Refresh your access token
   */
  async getRefreshToken(
    refresh_token: string
  ): Promise<GetRefreshTokenResponse> {
    const params = new Map([
      ["client_secret", this.CLIENT_SECRET],
      ["grant_type", WITHINGS_GRANT_TYPE.refresh_token],
      ["refresh_token", refresh_token],
    ]);
    return this.requestWithSignature<GetRefreshTokenResponse>(
      WITHINGS_ENDPOINTS.oauth2,
      WITHINGS_ACTIONS.requesttoken,
      params
    );
  }

  /**
   * Notify - Get
   */
  async getNotify(accessToken: string, url: URL): Promise<GetNotifyResponse> {
    const query = new Map([
      ["action", WITHINGS_ACTIONS.get],
      ["callbackurl", url.href],
      ["appli", "1"],
    ]);

    const response = await this.postRequest<GetNotifyResponse>(
      WITHINGS_ENDPOINTS.notify,
      query,
      { Authorization: `Bearer ${accessToken}` }
    );

    return response.data;
  }

  /**
   * Notify - List
   */
  async getNotifyList(accessToken: string): Promise<GetNotifyListResponse> {
    const query = new Map([
      ["action", "list"],
    ]);

    const response = await this.postRequest<GetNotifyListResponse>(
      WITHINGS_ENDPOINTS.notify,
      query,
      { Authorization: `Bearer ${accessToken}` }
    );

    return response.data;
  }

  /**
   * Notify - Subscribe
   */
  async subscribeNotify(
    accessToken: string,
    url: URL,
    appli : string
  ): Promise<AddNotifySubscribeResponse> {
    
    const params = new Map([
      ["callbackurl", url.href],
      ["appli", appli],
    ]);

    return this.requestWithSignature<AddNotifySubscribeResponse>(
      WITHINGS_ENDPOINTS.notify,
      WITHINGS_ACTIONS.subscribe,
      params,
      { Authorization: `Bearer ${accessToken}` }
    );
  }

  /**
   * Notify - Revoke
   */
  async revokeNotify(
    accessToken: string,
    url: URL,
    appli : string
  ): Promise<RevokeNotifyResponse> {
    const params = new Map([
      ["callbackurl", url.href],
      ["appli", appli],
    ]);

    return this.requestWithSignature<RevokeNotifyResponse>(
      WITHINGS_ENDPOINTS.notify,
      WITHINGS_ACTIONS.revoke,
      params,
      { Authorization: `Bearer ${accessToken}` }
    );
  }

  /**
   * Heart - List
   */

   async getHeartList(
    accessToken: string,
    startdate: number,
    enddate: number,
    offset : number
  ): Promise<GetHeartListResponse> {
    const params = new Map([
      ["action", WITHINGS_ACTIONS.list],
      ["offset", offset.toString()],
      ["startdate", startdate.toString()],
      ["enddate", enddate.toString()],
    ]);

    return this.requestWithSignature<GetHeartListResponse>(
      WITHINGS_ENDPOINTS.heart,
      WITHINGS_ACTIONS.list,
      params,
      { Authorization: `Bearer ${accessToken}` }
    );
  }




  /**
   * Measure - Getmeas
   */
  async getMeas(
    accessToken: string,
    startdate: number,
    enddate: number
  ): Promise<GetMeasureResult> {
    const params = new Map([
      ["action", WITHINGS_ACTIONS.getmeas],
      ["meastypes", "1,4,5.6,8,9,10,11,12,54,71,73,76,77,88,91"],
      ["category", "1"],
      ["startdate", startdate.toString()],
      ["enddate", enddate.toString()],
    ]);

    return this.requestWithSignature<GetMeasureResult>(
      WITHINGS_ENDPOINTS.measure,
      WITHINGS_ACTIONS.getmeas,
      params,
      { Authorization: `Bearer ${accessToken}` }
    );
  }
}

export default WithingsClient;
