import { OpenAIAdsClient } from "../api/client.js";
import type { FileUploadResult } from "../api/types.js";

export class FileService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async uploadFromUrl(
    imageUrl: string,
    purpose?: "account_favicon" | "custom_audience"
  ): Promise<FileUploadResult> {
    const body: Record<string, string> = { image_url: imageUrl };
    if (purpose) {
      body.purpose = purpose;
    }
    return this.client.post<FileUploadResult>("/upload", body);
  }
}
