import { OpenAIAdsClient } from "../api/client.js";
import type {
  Campaign,
  CampaignListResponse,
  CampaignStatus,
  CampaignBiddingType,
  CampaignBudget,
  CampaignTargeting,
} from "../api/types.js";

export interface CreateCampaignParams {
  name: string;
  status: "active" | "paused";
  budget: CampaignBudget;
  description?: string;
  start_time?: number;
  end_time?: number;
  bidding_type?: CampaignBiddingType;
  mode?: "product_feed";
  product_feed_id?: string;
  conversion_event_setting_ids?: string[];
  targeting?: CampaignTargeting;
}

export interface UpdateCampaignParams {
  name?: string;
  description?: string | null;
  status?: CampaignStatus;
  budget?: CampaignBudget;
  start_time?: number | null;
  end_time?: number | null;
  targeting?: CampaignTargeting | null;
}

export class CampaignService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async listCampaigns(params?: {
    limit?: number;
    after?: string;
    before?: string;
    order?: "asc" | "desc";
  }): Promise<CampaignListResponse> {
    return this.client.get<CampaignListResponse>("/campaigns", params);
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    return this.client.get<Campaign>(`/campaigns/${campaignId}`);
  }

  async createCampaign(params: CreateCampaignParams, idempotencyKey?: string): Promise<Campaign> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.client.post<Campaign>("/campaigns", params, headers);
  }

  async updateCampaign(campaignId: string, params: UpdateCampaignParams): Promise<Campaign> {
    // Official Ads API uses POST for resource updates, not PATCH or PUT
    return this.client.post<Campaign>(`/campaigns/${campaignId}`, params);
  }

  async activateCampaign(campaignId: string): Promise<Campaign> {
    return this.client.post<Campaign>(`/campaigns/${campaignId}/activate`);
  }

  async pauseCampaign(campaignId: string): Promise<Campaign> {
    return this.client.post<Campaign>(`/campaigns/${campaignId}/pause`);
  }

  async archiveCampaign(campaignId: string): Promise<Campaign> {
    return this.client.post<Campaign>(`/campaigns/${campaignId}/archive`);
  }
}
