import { env } from "../config/env.js";

export class OpenAIAdsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly errorBody: string,
    public readonly url: string,
    public readonly method: string
  ) {
    super(`OpenAI Ads API [${method} ${url}] returned ${status} ${statusText}: ${errorBody}`);
    this.name = "OpenAIAdsApiError";
  }
}

export class OpenAIAdsClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(customApiKey?: string, customBaseUrl?: string) {
    this.apiKey = customApiKey || env.apiKey;
    this.baseUrl = (customBaseUrl || env.baseUrl).replace(/\/+$/, "");
  }

  private checkApiKey() {
    if (!this.apiKey) {
      throw new Error(
        "OPENAI_ADS_API_KEY is not configured. Please set OPENAI_ADS_API_KEY in your environment or pass it in tool arguments."
      );
    }
  }

  private buildUrl(path: string, params?: Record<string, any>): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(`${key}[]`, String(item));
          }
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, any>;
      customHeaders?: Record<string, string>;
    }
  ): Promise<T> {
    this.checkApiKey();
    const url = this.buildUrl(path, options?.params);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      ...options?.customHeaders,
    };

    let requestBody: string | undefined = undefined;
    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(options.body);
    }

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new OpenAIAdsApiError(response.status, response.statusText, errorText, url, method);
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>("POST", path, { body, customHeaders: headers });
  }

  async patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>("PATCH", path, { body, customHeaders: headers });
  }
}
