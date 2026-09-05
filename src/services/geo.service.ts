import { OpenAIAdsClient } from "../api/client.js";
import type { GeoLookupResponse } from "../api/types.js";

export class GeoService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async search(query: string, limit: number = 10): Promise<GeoLookupResponse> {
    return this.client.get<GeoLookupResponse>("/geo_lookup/search", {
      q: query,
      limit,
    });
  }
}
