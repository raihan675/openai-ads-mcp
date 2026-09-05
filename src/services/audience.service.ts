import { OpenAIAdsClient } from "../api/client.js";
import type { CustomAudience, AudienceOperation } from "../api/types.js";

export interface InlineIdentifier {
  identifier_type: "email" | "phone" | "email_sha256" | "phone_number_sha256" | "gaid";
  identifier: string;
}

export interface CreateAudienceParams {
  name: string;
  description?: string;
  file_id?: string;
  identifier_type?: string;
  identifier_resolution?: "auto";
  filename?: string;
  mimetype?: string;
  file_size?: number;
}

export interface MutateAudienceParams {
  expected_revision?: number;
  identifiers?: InlineIdentifier[];
  file_id?: string;
  identifier_resolution?: "auto";
}

export interface ReplaceAudienceParams {
  expected_revision: number;
  file_id: string;
  identifier_resolution?: "auto";
}

export class AudienceService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async listAudiences(params?: {
    limit?: number;
    intended_use?: "inclusion" | "exclusion" | "bid_multiplier";
    custom_audience_ids?: string[];
  }): Promise<{ object: "list"; data: CustomAudience[]; policy_revision?: string }> {
    return this.client.get<{ object: "list"; data: CustomAudience[]; policy_revision?: string }>(
      "/custom_audiences",
      params
    );
  }

  async getAudience(audienceId: string): Promise<CustomAudience> {
    return this.client.get<CustomAudience>(`/custom_audiences/${audienceId}`);
  }

  async createAudience(params: CreateAudienceParams): Promise<CustomAudience> {
    return this.client.post<CustomAudience>("/custom_audiences", params);
  }

  async addMembers(
    audienceId: string,
    params: MutateAudienceParams,
    idempotencyKey?: string
  ): Promise<AudienceOperation> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.client.post<AudienceOperation>(
      `/custom_audiences/${audienceId}/add`,
      params,
      headers
    );
  }

  async removeMembers(
    audienceId: string,
    params: MutateAudienceParams,
    idempotencyKey?: string
  ): Promise<AudienceOperation> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.client.post<AudienceOperation>(
      `/custom_audiences/${audienceId}/remove`,
      params,
      headers
    );
  }

  async replaceMembers(
    audienceId: string,
    params: ReplaceAudienceParams,
    idempotencyKey?: string
  ): Promise<AudienceOperation> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.client.post<AudienceOperation>(
      `/custom_audiences/${audienceId}/replace`,
      params,
      headers
    );
  }

  async mergeAudiences(
    name: string,
    audienceIds: string[],
    idempotencyKey?: string
  ): Promise<AudienceOperation & { custom_audience_id: string }> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.client.post<AudienceOperation & { custom_audience_id: string }>(
      "/custom_audiences/merge",
      { name, custom_audience_ids: audienceIds },
      headers
    );
  }

  async archiveAudience(audienceId: string): Promise<CustomAudience> {
    return this.client.post<CustomAudience>(`/custom_audiences/${audienceId}/archive`);
  }

  async getOperation(audienceId: string, operationId: string): Promise<AudienceOperation> {
    return this.client.get<AudienceOperation>(
      `/custom_audiences/${audienceId}/operations/${operationId}`
    );
  }
}
