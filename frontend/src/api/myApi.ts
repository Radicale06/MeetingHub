/* eslint-disable */
/* tslint:disable */
/*
 * MeetingHub API Client
 * Will be auto-regenerated from swagger.json when backend runs
 */

// ── DTOs ────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface OAuthCallbackDto {
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ResetPasswordDto {
  newPassword: string;
  resetPasswordToken: string;
}

export interface ResetPasswordReqDto {
  email: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    roleId: number;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    jobTitle?: string;
    company?: string;
    timezone?: string;
    language?: string;
  };
}

// ── HTTP Client ─────────────────────────────

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  secure?: boolean;
  path: string;
  type?: ContentType;
  query?: QueryParamsType;
  format?: "json" | "text" | "blob";
  body?: unknown;
  baseUrl?: string;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl">;
  securityWorker?: (
    securityData: SecurityDataType | null
  ) => Promise<RequestParams | void> | RequestParams | void;
}

export interface HttpResponse<D, E = unknown> extends Response {
  data: D;
  error: E;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  private toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    return Object.keys(query)
      .filter((key) => typeof query[key] !== "undefined")
      .map((key) =>
        Array.isArray(query[key])
          ? query[key].map((v: any) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join("&")
          : `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`
      )
      .join("&");
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string" ? JSON.stringify(input) : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};

    const mergedParams: RequestParams = {
      ...this.baseApiParams,
      ...params,
      ...secureParams,
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params.headers || {}),
        ...((secureParams as any).headers || {}),
      },
    };

    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || "json";

    return fetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...mergedParams,
        headers: {
          ...(mergedParams.headers || {}),
          ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
        },
        body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
      }
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = await response[responseFormat as "json"]()
        .then((d) => {
          if (r.ok) {
            r.data = d;
          } else {
            r.error = d;
          }
          return r;
        })
        .catch((e) => {
          r.error = e;
          return r;
        });

      if (!response.ok) throw data;
      return data;
    });
  };
}

// ── API Class ───────────────────────────────

export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  auth = {
    authControllerLogin: (data: LoginDto, params: RequestParams = {}) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    authControllerRegister: (data: RegisterDto, params: RequestParams = {}) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    authControllerOauthCallback: (data: OAuthCallbackDto, params: RequestParams = {}) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/oauth-callback`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    authControllerRefreshToken: (data: RefreshTokenDto, params: RequestParams = {}) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/refresh-token`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    authControllerRequestPasswordReset: (data: ResetPasswordReqDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/request-reset-password-email`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    authControllerResetPassword: (data: ResetPasswordDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/reset-password`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    authControllerGetAuthenticatedUser: (params: RequestParams = {}) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };

  user = {
    userControllerGetProfile: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/user/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    userControllerUpdateProfile: (data: any, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/user/me`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };

  meetings = {
    createInstant: (data: { title?: string }, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings/instant`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    schedule: (data: { title: string; description?: string; scheduledAt: string; inviteeEmails?: string[] }, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings/schedule`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    list: (query?: { filter?: string; limit?: number; offset?: number }, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings`,
        method: "GET",
        query: query as any,
        secure: true,
        format: "json",
        ...params,
      }),

    getByCode: (code: string, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings/${code}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    join: (code: string, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings/${code}/join`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    end: (id: string, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings/${id}/end`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    invite: (id: string, data: { emails: string[] }, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings/${id}/invite`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    getChatMessages: (id: string, query?: { limit?: number; offset?: number }, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings/${id}/chat`,
        method: "GET",
        query: query as any,
        secure: true,
        format: "json",
        ...params,
      }),

    sendChatMessage: (id: string, data: { content: string }, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/meetings/${id}/chat`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };

  recordings = {
    list: (query?: { limit?: number; offset?: number }, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/recordings`,
        method: "GET",
        query: query as any,
        secure: true,
        format: "json",
        ...params,
      }),

    getUrl: (id: string, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/recordings/${id}/url`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };

  reports = {
    list: (query?: { limit?: number; offset?: number }, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/reports`,
        method: "GET",
        query: query as any,
        secure: true,
        format: "json",
        ...params,
      }),

    getByMeeting: (meetingId: string, params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/reports/meeting/${meetingId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
