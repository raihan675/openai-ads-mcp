import { OpenAIAdsClient } from "../api/client.js";
import type {
  AdGroup,
  AdGroupListResponse,
  AdGroupStatus,
  AdGroupBiddingConfig,
  ProductSet,
} from "../api/types.js";

export interface CreateAdGroupParams {
  campaign_id: string;
  name: string;
  status: "active" | "paused";
  bidding_config: AdGroupBiddingConfig;
  description?: string;
  context_hints?: string[];
  product_set?: ProductSet;
}

export interface UpdateAdGroupParams {
  name?: string;
  description?: string | null;
  status?: AdGroupStatus;
  context_hints?: string[];
  bidding_config?: AdGroupBiddingConfig;
  product_set?: ProductSet;
}

export class AdGroupService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async listAdGroups(
    campaignId: string,
    params?: {
      limit?: number;
      after?: string;
      before?: string;
      order?: "asc" | "desc";
    }
  ): Promise<AdGroupListResponse> {
    return this.client.get<AdGroupListResponse>("/ad_groups", {
      campaign_id: campaignId,
      ...params,
    });
  }

  async getAdGroup(adGroupId: string): Promise<AdGroup> {
    return this.client.get<AdGroup>(`/ad_groups/${adGroupId}`);
  }

  async createAdGroup(params: CreateAdGroupParams, idempotencyKey?: string): Promise<AdGroup> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.client.post<AdGroup>("/ad_groups", params, headers);
  }

  async updateAdGroup(adGroupId: string, params: UpdateAdGroupParams): Promise<AdGroup> {
    return this.client.post<AdGroup>(`/ad_groups/${adGroupId}`, params);
  }

  async activateAdGroup(adGroupId: string): Promise<AdGroup> {
    return this.client.post<AdGroup>(`/ad_groups/${adGroupId}/activate`);
  }

  async pauseAdGroup(adGroupId: string): Promise<AdGroup> {
    return this.client.post<AdGroup>(`/ad_groups/${adGroupId}/pause`);
  }

  async archiveAdGroup(adGroupId: string): Promise<AdGroup> {
    return this.client.post<AdGroup>(`/ad_groups/${adGroupId}/archive`);
  }
}
