import { OpenAIAdsClient } from "../api/client.js";
import type { DeltaProduct, DeltaFeedResponse } from "../api/types.js";

export class FeedService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async updateProducts(feedId: string, products: DeltaProduct[]): Promise<DeltaFeedResponse> {
    return this.client.patch<DeltaFeedResponse>(`/feeds/${feedId}/products`, { products });
  }
}
