export interface GetNonceResponse {
  status: number;
  body: {
    nonce: string;
  };
}

export interface GetAccessTokenResponse {
  status: number;
  body: {
    user: User;
  };
}

export interface GetRefreshTokenResponse {
  status: number;
  body: {
    user: User;
  };
}

export interface NotifyObject {
  appli: number;
  callbackurl: string;
  expires: number;
  comment: string;
}

export interface GetNotifyListResponse {
  status: number;
  body: {
    profiles: NotifyObject[];
  };
}

export interface AddNotifySubscribeResponse {
  status: number;
  body: {};
}

export interface RevokeNotifyResponse {
  status: number;
  body: {};
}

export interface User {
  userid: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  csrf_token: string;
  token_type: string;
}

export type Measure = {
  value: number;
  type: number;
  unit: number;
  algo?: number;
  fm?: number;
};

export type MeasureGroups = {
  grpid: number;
  attrib: number;
  date: number;
  created: number;
  category: number;
  deviceid: string;
  hash_deviceid: string;
  measures: Measure[];
  comment: string;
};

export type GetMeasureResult = {
  updatetime: number;
  timezone: string;
  measuregrps: MeasureGroups[];
};
