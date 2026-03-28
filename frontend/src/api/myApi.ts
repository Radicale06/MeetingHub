/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ResponseDto {
  data: object;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: object;
  refreshToken: object;
  user: object;
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

export interface ResetPasswordReqDto {
  email: string;
}

export interface ResetPasswordDto {
  newPassword: string;
  resetPasswordToken: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  company?: string;
  timezone?: string;
  language?: string;
}

export interface CreateInstantMeetingDto {
  title?: string;
}

export interface ScheduleMeetingDto {
  title: string;
  description?: string;
  scheduledAt: string;
  inviteeEmails?: string[];
}

export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  scheduledAt?: string;
}

export interface InviteDto {
  emails: string[];
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

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

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title MeetingHub
 * @version 1.0
 * @contact
 *
 * MeetingHub Video Conferencing API
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @name AppControllerGetHello
   * @request GET:/
   */
  appControllerGetHello = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/`,
      method: "GET",
      ...params,
    });

  upload = {
    /**
     * No description
     *
     * @name AppControllerUploadFile
     * @summary Upload an image
     * @request POST:/upload
     * @secure
     */
    appControllerUploadFile: (
      data: {
        /** @format binary */
        file?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<ResponseDto, any>({
        path: `/upload`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  files = {
    /**
     * No description
     *
     * @name AppControllerSeeUploadedFile
     * @summary Visualize uploaded file
     * @request GET:/files/{filepath}
     * @secure
     */
    appControllerSeeUploadedFile: (
      filepath: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/files/${filepath}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  auth = {
    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerLogin
     * @request POST:/auth/login
     */
    authControllerLogin: (data: LoginDto, params: RequestParams = {}) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerRegister
     * @request POST:/auth/register
     */
    authControllerRegister: (data: RegisterDto, params: RequestParams = {}) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerOauthCallback
     * @request POST:/auth/oauth-callback
     */
    authControllerOauthCallback: (
      data: OAuthCallbackDto,
      params: RequestParams = {},
    ) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/oauth-callback`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerRefreshToken
     * @request POST:/auth/refresh-token
     * @secure
     */
    authControllerRefreshToken: (
      data: RefreshTokenDto,
      params: RequestParams = {},
    ) =>
      this.request<AuthResponseDto, any>({
        path: `/auth/refresh-token`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerRequestPasswordReset
     * @request POST:/auth/request-reset-password-email
     */
    authControllerRequestPasswordReset: (
      data: ResetPasswordReqDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/auth/request-reset-password-email`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerResetPassword
     * @request POST:/auth/reset-password
     */
    authControllerResetPassword: (
      data: ResetPasswordDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/auth/reset-password`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerGetAuthenticatedUser
     * @request GET:/auth/me
     * @secure
     */
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
    /**
     * No description
     *
     * @tags user
     * @name UserControllerGetProfile
     * @request GET:/user/me
     * @secure
     */
    userControllerGetProfile: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/user/me`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags user
     * @name UserControllerUpdateProfile
     * @request PATCH:/user/me
     * @secure
     */
    userControllerUpdateProfile: (
      data: UpdateProfileDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/user/me`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags user
     * @name UserControllerUploadAvatar
     * @request POST:/user/me/avatar
     * @secure
     */
    userControllerUploadAvatar: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/user/me/avatar`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags user
     * @name UserControllerRemoveAvatar
     * @request DELETE:/user/me/avatar
     * @secure
     */
    userControllerRemoveAvatar: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/user/me/avatar`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  meetings = {
    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerCreateInstant
     * @request POST:/meetings/instant
     * @secure
     */
    meetingControllerCreateInstant: (
      data: CreateInstantMeetingDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/meetings/instant`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerSchedule
     * @request POST:/meetings/schedule
     * @secure
     */
    meetingControllerSchedule: (
      data: ScheduleMeetingDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/meetings/schedule`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerList
     * @request GET:/meetings
     * @secure
     */
    meetingControllerList: (
      query?: {
        filter?: "upcoming" | "past" | "all";
        limit?: number;
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/meetings`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerFindByCode
     * @request GET:/meetings/{code}
     * @secure
     */
    meetingControllerFindByCode: (code: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/meetings/${code}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerUpdate
     * @request PATCH:/meetings/{id}
     * @secure
     */
    meetingControllerUpdate: (
      id: string,
      data: UpdateMeetingDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/meetings/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerCancel
     * @request DELETE:/meetings/{id}
     * @secure
     */
    meetingControllerCancel: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/meetings/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerInvite
     * @request POST:/meetings/{id}/invite
     * @secure
     */
    meetingControllerInvite: (
      id: string,
      data: InviteDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/meetings/${id}/invite`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerJoin
     * @request POST:/meetings/{code}/join
     * @secure
     */
    meetingControllerJoin: (code: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/meetings/${code}/join`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerEndMeeting
     * @request POST:/meetings/{id}/end
     * @secure
     */
    meetingControllerEndMeeting: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/meetings/${id}/end`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerGetChatMessages
     * @request GET:/meetings/{id}/chat
     * @secure
     */
    meetingControllerGetChatMessages: (
      id: string,
      query: {
        limit: number;
        offset: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/meetings/${id}/chat`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags meetings
     * @name MeetingControllerCreateChatMessage
     * @request POST:/meetings/{id}/chat
     * @secure
     */
    meetingControllerCreateChatMessage: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/meetings/${id}/chat`,
        method: "POST",
        secure: true,
        ...params,
      }),
  };
  reports = {
    /**
     * No description
     *
     * @tags reports
     * @name ReportControllerList
     * @request GET:/reports
     * @secure
     */
    reportControllerList: (
      query: {
        limit: number;
        offset: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/reports`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags reports
     * @name ReportControllerGetByMeeting
     * @request GET:/reports/meeting/{meetingId}
     * @secure
     */
    reportControllerGetByMeeting: (
      meetingId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/reports/meeting/${meetingId}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  recordings = {
    /**
     * No description
     *
     * @tags recordings
     * @name RecordingControllerList
     * @request GET:/recordings
     * @secure
     */
    recordingControllerList: (
      query: {
        limit: number;
        offset: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/recordings`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags recordings
     * @name RecordingControllerGetUrl
     * @request GET:/recordings/{id}/url
     * @secure
     */
    recordingControllerGetUrl: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/recordings/${id}/url`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
}
