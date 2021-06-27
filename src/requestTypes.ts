export interface GetNonceResponse {
  status: number;
  body: {
    nonce: string;
  };
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

export interface GetAccessTokenResponse {
  status: number;
  body: User;
}

export interface GetRefreshTokenResponse {
  status: number;
  body: User;
}

export interface NotifyObject {
  appli: number;
  callbackurl: string;
  expires: number;
  comment: string;
}

export interface GetNotifyResponse {
  status: number;
  body: {
    appli: number;
    callbackurl: string;
    comment: string;
  };
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

export type Measure = {
  value: number;
  type: number;
  unit: number;
  algo?: number; // deprecated
  fm?: number; // deprecated
  fw?: number; // deprecated
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
  more: number;
  offset: number;
};

export type GetHeartListResponse = {
  status: number;
  body: {
    more: boolean;
    offset: number;
    series: Series[];
  };
};

export type Series = {
  model: number;
  bloodpressure: {
    diastole: number;
    systole: number;
  };
  heart_rate: number;
  timestamp: number;
  deviceid: string;
  ecg: {
    signalid: number;
    afib: number;
  };
};
