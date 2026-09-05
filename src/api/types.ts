// OpenAI Ads API Type Definitions based on official documentation

export interface AdAccountReview {
  status: "approved" | "rejected" | "in_review";
  reason?: string;
}

export interface AdAccount {
  id: string;
  name: string;
  url: string | null;
  preview_url: string | null;
  status: "active" | "disabled" | string;
  timezone: string;
  currency_code: string;
  review?: AdAccountReview;
}

export interface CampaignBudget {
  lifetime_spend_limit_micros: number;
}

export interface LocationTarget {
  id: string;
  type?: "country" | "region" | "dma" | string;
  country_code?: string;
  name?: string;
  region_code?: string;
  canonical_name?: string;
}

export interface CampaignTargeting {
  locations?: {
    include?: LocationTarget[];
    countries?: string[];
  };
  custom_audiences?: {
    ids?: string[];
  };
  excluded_custom_audiences?: {
    ids?: string[];
  };
}

export type CampaignBiddingType = "impressions" | "clicks" | "conversions";
export type CampaignStatus = "active" | "paused" | "archived";

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  status: CampaignStatus;
  bidding_type?: CampaignBiddingType;
  budget: CampaignBudget;
  start_time?: number | null;
  end_time?: number | null;
  mode?: "product_feed" | null;
  product_feed_id?: string;
  conversion_event_setting_ids?: string[];
  targeting?: CampaignTargeting;
  created_at: number;
  updated_at: number;
}

export interface CampaignListResponse {
  object: "list";
  data: Campaign[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

export interface CustomAudienceBidMultiplier {
  custom_audience_id: string;
  bid_multiplier_micros: number; // 100000 (0.1x) to 10000000 (10x)
}

export interface ProductFilter {
  field: string;
  operator: "in" | "gt" | "gte" | "lt" | "lte";
  values: string[];
}

export interface ProductSet {
  product_feed_id: string;
  filters?: ProductFilter[];
}

export interface AdGroupBiddingConfig {
  billing_event_type: "impression" | "click";
  max_bid_micros: number;
  custom_audience_bid_multipliers?: CustomAudienceBidMultiplier[];
}

export type AdGroupStatus = "active" | "paused" | "archived";

export interface AdGroup {
  id: string;
  campaign_id: string;
  name: string;
  description?: string | null;
  context_hints?: string[];
  status: AdGroupStatus;
  bidding_config: AdGroupBiddingConfig;
  product_set?: ProductSet;
  created_at: number;
  updated_at: number;
}

export interface AdGroupListResponse {
  object: "list";
  data: AdGroup[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

export interface ChatCardCreative {
  type: "chat_card";
  title: string;
  body: string;
  target_url: string;
  file_id: string;
  image_url?: string;
}

export interface ProductAdTemplateCreative {
  type: "product_ad_template";
  title: string; // e.g. "{{product.title}}"
  body: string;  // e.g. "{{product.body}}"
  price?: string; // e.g. "{{product.price}}"
}

export type AdCreative = ChatCardCreative | ProductAdTemplateCreative;
export type AdStatus = "active" | "paused" | "archived";
export type AdReviewStatus = "in_review" | "approved" | "rejected";

export interface Ad {
  id: string;
  ad_group_id: string;
  name: string;
  status: AdStatus;
  creative: AdCreative;
  review_status: AdReviewStatus;
  created_at: number;
  updated_at: number;
}

export interface AdListResponse {
  object: "list";
  data: Ad[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

export interface FileUploadResult {
  file_id: string;
}

export interface WebPixel {
  id: string;
  client_type: "web";
  name: string;
  pixel_id: string;
}

export interface RecentPixelEvent {
  action_source: string;
  api_channel: string;
  custom_event_name: string | null;
  data_source_id: string;
  event_data_json: string;
  event_timestamp_ms: number;
  event_type: string;
  received_at_ms: number;
}

export interface ConversionsApiKey {
  name: string;
  api_key: string;
}

export interface EventSettingSource {
  id: string;
  name: string;
}

export interface ConversionEventSetting {
  id: string;
  name: string;
  event_type: string;
  custom_event_name?: string | null;
  attribution_window_days: number;
  ad_account_id: string;
  source_ids: string[];
  sources?: EventSettingSource[];
  campaigns?: string[];
  archived: boolean;
  version: number;
}

export interface ConversionEventSettingListResponse {
  object: "list";
  data: ConversionEventSetting[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

export interface CustomAudience {
  id: string;
  name: string;
  description?: string | null;
  status: "upload_pending" | "processing" | "rockset_ingest_pending" | "publishing" | "ready" | "too_small" | "failed" | "archived" | string;
  hash_spec_version?: string;
  uploaded_identifier_count_range?: string;
  matched_identifier_count_range?: string;
  matched_user_count_range?: string;
  invalid_identifier_count_range?: string;
  membership_revision?: number;
  created_at?: number;
  updated_at?: number;
}

export interface AudienceOperation {
  operation_id: string;
  custom_audience_id: string;
  operation: "add" | "remove" | "replace" | "merge";
  status: "processing" | "succeeded" | "failed";
}

export interface DeltaVariantPrice {
  amount: number; // e.g. 8999 for $89.99
  currency: string;
}

export interface DeltaVariantAvailability {
  available?: boolean;
  status?: "in_stock" | "out_of_stock";
}

export interface DeltaVariant {
  id: string;
  title?: string;
  price?: DeltaVariantPrice;
  availability?: DeltaVariantAvailability;
}

export interface DeltaProduct {
  id: string;
  variants: DeltaVariant[];
}

export interface DeltaFeedResponse {
  id: string;
  accepted: boolean;
}

export interface BulkMutationJob {
  id: string;
  status: "pending" | "in_progress" | "completed" | "partially_failed" | "failed";
  operation_count: number;
  created_at: number;
  completed_at: number | null;
}

export interface BulkOperationResult {
  operation_id: string;
  type: string;
  status: "created" | "updated" | "validated" | "failed" | "skipped";
  resource_id?: string | null;
  submitted_version_id?: string | null;
  error_code?: string | null;
  error?: string | null;
  retryable?: boolean | null;
  retry_after_seconds?: number | null;
}

export interface BulkOperationListResponse {
  object: "list";
  data: BulkOperationResult[];
  has_more: boolean;
  complete: boolean;
  error?: string | null;
}

export interface DeliveryInsightRow {
  id: string;
  start_time: number;
  end_time: number;
  readable_time?: string;
  timezone?: string;
  campaign_id?: string;
  campaign_name?: string;
  ad_group_id?: string;
  ad_group_name?: string;
  ad_id?: string;
  ad_name?: string;
  impressions?: number;
  clicks?: number;
  spend?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  product_feed_id?: string;
  item_id?: string;
  product_title?: string;
  product_impressions?: number;
  product_clicks?: number;
}

export interface ConversionInsightRow {
  entity_id: string;
  conversions: number;
  click_through_conversions: number;
  view_through_conversions: number;
}

export interface GeoLocationItem {
  id: string;
  type: "country" | "region" | "dma";
  name: string;
  canonical_name: string;
  country_code: string;
  region_code: string;
}

export interface GeoLookupResponse {
  count: number;
  query: string;
  results: GeoLocationItem[];
}
