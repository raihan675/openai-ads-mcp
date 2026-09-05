import { OpenAIAdsClient } from "../api/client.js";
import type { Ad, AdListResponse, AdStatus, AdCreative } from "../api/types.js";

export interface CreateAdParams {
  ad_group_id: string;
  name: string;
  status: "active" | "paused";
  creative: AdCreative;
}

export interface UpdateAdParams {
  name?: string;
  status?: AdStatus;
  creative?: AdCreative;
}

export interface AdPreviewResult {
  preview_url: string;
  expires_at?: number;
}

export class AdService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async listAds(
    adGroupId: string,
    params?: {
      limit?: number;
      after?: string;
      before?: string;
      order?: "asc" | "desc";
    }
  ): Promise<AdListResponse> {
    return this.client.get<AdListResponse>("/ads", {
      ad_group_id: adGroupId,
      ...params,
    });
  }

  async getAd(adId: string): Promise<Ad> {
    return this.client.get<Ad>(`/ads/${adId}`);
  }

  async createAd(params: CreateAdParams, idempotencyKey?: string): Promise<Ad> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.client.post<Ad>("/ads", params, headers);
  }

  async updateAd(adId: string, params: UpdateAdParams): Promise<Ad> {
    return this.client.post<Ad>(`/ads/${adId}`, params);
  }

  async previewAd(adId: string): Promise<AdPreviewResult> {
    return this.client.post<AdPreviewResult>(`/ads/${adId}/preview`);
  }

  async activateAd(adId: string): Promise<Ad> {
    return this.client.post<Ad>(`/ads/${adId}/activate`);
  }

  async pauseAd(adId: string): Promise<Ad> {
    return this.client.post<Ad>(`/ads/${adId}/pause`);
  }

  async archiveAd(adId: string): Promise<Ad> {
    return this.client.post<Ad>(`/ads/${adId}/archive`);
  }
}
