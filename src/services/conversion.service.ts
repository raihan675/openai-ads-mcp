import { OpenAIAdsClient } from "../api/client.js";
import type {
  WebPixel,
  RecentPixelEvent,
  ConversionsApiKey,
  ConversionEventSetting,
  ConversionEventSettingListResponse,
} from "../api/types.js";

export interface CreateEventSettingParams {
  name: string;
  event_type: string; // e.g. "order_created", "lead_created", "registration_completed", or "custom"
  attribution_window_days: number; // 30
  source_ids: string[]; // e.g. ["clidsrc_123"]
  custom_event_name?: string;
}

export class ConversionService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async createPixel(name: string, clientType: "web" = "web"): Promise<WebPixel> {
    return this.client.post<WebPixel>("/conversions/pixels", {
      name,
      client_type: clientType,
    });
  }

  async getRecentPixelEvents(pixelId: string): Promise<{ object: "list"; data: RecentPixelEvent[] }> {
    return this.client.get<{ object: "list"; data: RecentPixelEvent[] }>("/conversions/events", {
      pid: pixelId,
    });
  }

  async createApiKey(name: string): Promise<ConversionsApiKey> {
    return this.client.post<ConversionsApiKey>("/conversions/api_keys", { name });
  }

  async createEventSetting(params: CreateEventSettingParams): Promise<ConversionEventSetting> {
    return this.client.post<ConversionEventSetting>("/conversions/event_settings", params);
  }

  async listEventSettings(params?: {
    limit?: number;
    after?: string;
    before?: string;
    order?: "asc" | "desc";
  }): Promise<ConversionEventSettingListResponse> {
    return this.client.get<ConversionEventSettingListResponse>("/conversions/event_settings", params);
  }

  async sendConversionEvents(payload: {
    events: Array<{
      event_name: string;
      event_time?: number;
      event_id?: string;
      action_source?: string;
      user?: {
        email_sha256?: string;
        phone_number_sha256?: string;
        ip_address?: string;
        user_agent?: string;
        obref?: string;
      };
      custom_data?: {
        currency?: string;
        value?: number;
        order_id?: string;
        contents?: Array<{ id: string; quantity: number; item_price?: number }>;
      };
    }>;
  }): Promise<{ status: string; received_events?: number }> {
    return this.client.post<{ status: string; received_events?: number }>(
      "/conversions/events",
      payload
    );
  }
}
