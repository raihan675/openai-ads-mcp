import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BulkService } from "../services/bulk.service.js";

export function registerBulkTools(server: McpServer, bulkService: BulkService) {
  server.registerTool(
    "submit_bulk_mutation_job",
    {
      title: "Submit Bulk Mutation Job",
      description:
        "Submits an asynchronous bulk job with up to 1,000 operations (campaign.create/update, ad_group.create/update, ad.create/update). Entities can link via campaign_idempotency_key and ad_group_idempotency_key.",
      inputSchema: {
        operations: z
          .array(
            z.object({
              operation_id: z.string().describe("Unique identifier for this operation in the job"),
              type: z.enum([
                "campaign.create",
                "campaign.update",
                "ad_group.create",
                "ad_group.update",
                "ad.create",
                "ad.update",
              ]),
              idempotency_key: z.string().optional().describe("Required for create operations"),
              target_resource_id: z.string().optional().describe("Required for update operations"),
              input: z.record(z.any()).describe("Operation input fields"),
            })
          )
          .min(1)
          .max(1000)
          .describe("Up to 1,000 operations"),
        validate_only: z.boolean().optional().describe("Dry-run validation without applying changes"),
        partial_failure: z.boolean().optional().describe("Continue unaffected operations on error (default true)"),
        idempotency_key: z.string().optional().describe("Job-level idempotency key"),
      },
    },
    async ({ operations, validate_only, partial_failure, idempotency_key }) => {
      const job = await bulkService.submitJob(
        { operations, validate_only, partial_failure },
        idempotency_key
      );
      return {
        content: [{ type: "text", text: JSON.stringify(job, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_bulk_mutation_job_status",
    {
      title: "Get Bulk Job Status & Operations",
      description:
        "Poll bulk job progress (pending, in_progress, completed, partially_failed, failed) and inspect per-operation execution results.",
      inputSchema: {
        job_id: z.string().describe("Bulk mutation job ID (blkmtnjob_*)"),
        include_operations: z.boolean().optional().describe("Whether to fetch the first page of operation results"),
        limit: z.number().optional().describe("Operation results per page (1-100, default 100)"),
        after: z.string().optional().describe("Pagination cursor for operations"),
      },
    },
    async ({ job_id, include_operations, limit, after }) => {
      const job = await bulkService.getJob(job_id);
      let operations = undefined;
      if (include_operations) {
        operations = await bulkService.listOperations(job_id, { limit, after });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ job, operations }, null, 2),
          },
        ],
      };
    }
  );
}
