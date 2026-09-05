import { OpenAIAdsClient } from "../api/client.js";
import type { DeliveryInsightRow, ConversionInsightRow } from "../api/types.js";

export interface DeliveryInsightsParams {
  time_granularity?: "hourly" | "daily" | "monthly" | "none";
  aggregation_level?: "ad_account" | "campaign" | "ad_group" | "ad";
  fields?: string[];
  filters?: string[]; // JSON-encoded filter objects
  sort?: string[];    // JSON-encoded sort objects
  segments?: string[]; // e.g. ["product"], ["country"], ["device"]
  override_segment_group_order?: string[];
  includes?: string[]; // "zero_impression_items", "zero_impression_products"
  time_ranges?: string[]; // JSON-encoded time range objects
  limit?: number;
  after?: string;
  before?: string;
}

export interface DeliveryInsightsResponse {
  object: "list";
  data: DeliveryInsightRow[];
  count: number;
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

export interface ConversionInsightsParams {
  aggregation_level: "campaign" | "ad_group" | "ad" | "ad_account";
  time_ranges: string[]; // JSON-encoded time range objects
  entity_ids?: string[];
}

export interface ConversionInsightsResponse {
  object: "list";
  data: ConversionInsightRow[];
  count: number;
}

export class InsightService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async getDeliveryInsights(
    scope: "ad_account" | "campaign" | "ad_group" | "ad",
    entityId?: string,
    params?: DeliveryInsightsParams
  ): Promise<DeliveryInsightsResponse> {
    let path = "/ad_account/insights";
    if (scope === "campaign" && entityId) {
      path = `/campaigns/${entityId}/insights`;
    } else if (scope === "ad_group" && entityId) {
      path = `/ad_groups/${entityId}/insights`;
    } else if (scope === "ad" && entityId) {
      path = `/ads/${entityId}/insights`;
    }

    return this.client.get<DeliveryInsightsResponse>(path, params);
  }

  async getConversionInsights(params: ConversionInsightsParams): Promise<ConversionInsightsResponse> {
    return this.client.post<ConversionInsightsResponse>("/conversions/insights", params);
  }
}
