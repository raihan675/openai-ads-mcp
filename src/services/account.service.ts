import { OpenAIAdsClient } from "../api/client.js";
import type { AdAccount } from "../api/types.js";

export class AccountService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async getAccount(): Promise<AdAccount> {
    return this.client.get<AdAccount>("/ad_account");
  }

  async updateBrand(data: { name?: string; favicon_file_id?: string }): Promise<AdAccount> {
    return this.client.post<AdAccount>("/ad_account/brand", data);
  }
}
