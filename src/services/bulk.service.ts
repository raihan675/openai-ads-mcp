import { OpenAIAdsClient } from "../api/client.js";
import type { BulkMutationJob, BulkOperationListResponse } from "../api/types.js";

export interface BulkJobParams {
  operations: any[];
  validate_only?: boolean;
  partial_failure?: boolean;
}

export class BulkService {
  constructor(private readonly client: OpenAIAdsClient) {}

  async submitJob(params: BulkJobParams, idempotencyKey?: string): Promise<BulkMutationJob> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return this.client.post<BulkMutationJob>("/bulk_mutation_jobs", params, headers);
  }

  async getJob(jobId: string): Promise<BulkMutationJob> {
    return this.client.get<BulkMutationJob>(`/bulk_mutation_jobs/${jobId}`);
  }

  async listOperations(
    jobId: string,
    params?: { limit?: number; after?: string }
  ): Promise<BulkOperationListResponse> {
    return this.client.get<BulkOperationListResponse>(
      `/bulk_mutation_jobs/${jobId}/operations`,
      params
    );
  }
}
