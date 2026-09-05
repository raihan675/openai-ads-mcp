import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { AudienceService } from "../services/audience.service.js";

export function registerAudienceTools(server: McpServer, audienceService: AudienceService) {
  server.registerTool(
    "list_custom_audiences",
    {
      title: "List Custom Audiences",
      description:
        "List custom audiences for the current ad account. Use 'intended_use' ('inclusion', 'exclusion', 'bid_multiplier') to filter only eligible audiences.",
      inputSchema: {
        intended_use: z
          .enum(["inclusion", "exclusion", "bid_multiplier"])
          .optional()
          .describe("Filter by intended use eligibility"),
        custom_audience_ids: z
          .array(z.string())
          .optional()
          .describe("Optional specific audience IDs to check"),
        limit: z.number().optional(),
      },
    },
    async (params) => {
      const result = await audienceService.listAudiences(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_custom_audience",
    {
      title: "Get Custom Audience",
      description:
        "Retrieve audience status, privacy-preserving size ranges (e.g. under_25k, 25k_100k), and current membership_revision.",
      inputSchema: {
        custom_audience_id: z.string().describe("Custom audience ID (caud_*)"),
      },
    },
    async ({ custom_audience_id }) => {
      const audience = await audienceService.getAudience(custom_audience_id);
      return {
        content: [{ type: "text", text: JSON.stringify(audience, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_custom_audience",
    {
      title: "Create Custom Audience",
      description:
        "Creates a new custom audience. Can create an empty audience for incremental builds or attach an uploaded file_id.",
      inputSchema: {
        name: z.string().min(3).describe("Audience display name"),
        description: z.string().optional().describe("Audience description"),
        file_id: z.string().optional().describe("File ID from upload (purpose=custom_audience)"),
        identifier_type: z
          .enum(["email", "phone", "email_sha256", "phone_number_sha256", "gaid"])
          .optional()
          .describe("Required if single-type file without auto resolution"),
        identifier_resolution: z
          .enum(["auto"])
          .optional()
          .describe("Set to 'auto' for multi-column CSVs"),
        filename: z.string().optional(),
        mimetype: z.string().optional(),
        file_size: z.number().optional(),
      },
    },
    async (params) => {
      const audience = await audienceService.createAudience(params);
      return {
        content: [{ type: "text", text: JSON.stringify(audience, null, 2) }],
      };
    }
  );

  server.registerTool(
    "mutate_audience_membership",
    {
      title: "Add or Remove Audience Members",
      description:
        "Add or remove customer identifiers from an existing custom audience. Accepts inline identifiers or an uploaded file_id. Returns an asynchronous operation ID.",
      inputSchema: {
        custom_audience_id: z.string().describe("Audience ID"),
        action: z.enum(["add", "remove"]).describe("Mutation action"),
        expected_revision: z.number().optional().describe("Current membership revision for optimistic concurrency"),
        identifiers: z
          .array(
            z.object({
              identifier_type: z.enum([
                "email",
                "phone",
                "email_sha256",
                "phone_number_sha256",
                "gaid",
              ]),
              identifier: z.string(),
            })
          )
          .optional()
          .describe("Inline list of identifiers (up to 10,000 items)"),
        file_id: z.string().optional().describe("Uploaded delta file ID"),
        idempotency_key: z.string().optional().describe("Idempotency key for safe retries"),
      },
    },
    async ({
      custom_audience_id,
      action,
      expected_revision,
      identifiers,
      file_id,
      idempotency_key,
    }) => {
      let operation;
      const params = { expected_revision, identifiers, file_id };
      if (action === "add") {
        operation = await audienceService.addMembers(custom_audience_id, params, idempotency_key);
      } else {
        operation = await audienceService.removeMembers(custom_audience_id, params, idempotency_key);
      }

      return {
        content: [{ type: "text", text: JSON.stringify(operation, null, 2) }],
      };
    }
  );

  server.registerTool(
    "merge_custom_audiences",
    {
      title: "Merge Custom Audiences",
      description:
        "Merges 2 to 64 existing, ready audiences in the same ad account into a new union audience.",
      inputSchema: {
        name: z.string().min(3).describe("Name for the merged audience"),
        custom_audience_ids: z
          .array(z.string())
          .min(2)
          .max(64)
          .describe("2 to 64 existing ready audience IDs"),
        idempotency_key: z.string().optional(),
      },
    },
    async ({ name, custom_audience_ids, idempotency_key }) => {
      const operation = await audienceService.mergeAudiences(
        name,
        custom_audience_ids,
        idempotency_key
      );
      return {
        content: [{ type: "text", text: JSON.stringify(operation, null, 2) }],
      };
    }
  );

  server.registerTool(
    "archive_custom_audience",
    {
      title: "Archive Custom Audience",
      description: "Permanently archive a custom audience. Archived audiences cannot be restored.",
      inputSchema: {
        custom_audience_id: z.string().describe("Audience ID"),
      },
    },
    async ({ custom_audience_id }) => {
      const result = await audienceService.archiveAudience(custom_audience_id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_audience_operation_status",
    {
      title: "Get Audience Operation Status",
      description:
        "Poll the status of an asynchronous membership operation (add, remove, replace, merge) until 'succeeded' or 'failed'.",
      inputSchema: {
        custom_audience_id: z.string().describe("Target audience ID"),
        operation_id: z.string().describe("Operation ID returned by membership mutation"),
      },
    },
    async ({ custom_audience_id, operation_id }) => {
      const operation = await audienceService.getOperation(custom_audience_id, operation_id);
      return {
        content: [{ type: "text", text: JSON.stringify(operation, null, 2) }],
      };
    }
  );

  server.registerTool(
    "prepare_custom_audience_payload",
    {
      title: "Prepare & Hash Custom Audience Payload",
      description:
        "Normalizes raw emails (trimmed, lowercase) and phone numbers (E.164 standard) into SHA-256 hashes per OpenAI specification. Optionally uploads the hashed members directly to a custom audience.",
      inputSchema: {
        emails: z
          .array(z.string())
          .optional()
          .describe("List of plain-text customer emails to normalize and hash"),
        phones: z
          .array(z.string())
          .optional()
          .describe("List of plain-text phone numbers (e.g., '+1 415-555-2671' or '4155552671')"),
        custom_audience_id: z
          .string()
          .optional()
          .describe("Optional audience ID to automatically upload to"),
        action: z
          .enum(["add", "remove"])
          .default("add")
          .describe("Whether to add or remove members if auto-uploading"),
        auto_upload: z
          .boolean()
          .default(false)
          .describe("If true and custom_audience_id is set, immediately dispatch mutation"),
      },
    },
    async ({ emails = [], phones = [], custom_audience_id, action = "add", auto_upload = false }) => {
      const hashedIdentifiers: Array<{
        identifier_type: "email_sha256" | "phone_number_sha256";
        identifier: string;
      }> = [];

      let validEmails = 0;
      let skippedEmails = 0;

      for (const rawEmail of emails) {
        const cleaned = rawEmail.trim().toLowerCase();
        if (cleaned && cleaned.includes("@") && cleaned.includes(".")) {
          const hash = createHash("sha256").update(cleaned).digest("hex");
          hashedIdentifiers.push({
            identifier_type: "email_sha256",
            identifier: hash,
          });
          validEmails++;
        } else {
          skippedEmails++;
        }
      }

      let validPhones = 0;
      let skippedPhones = 0;

      for (const rawPhone of phones) {
        // Strip everything except digits and leading +
        let digits = rawPhone.trim().replace(/[^\d+]/g, "");
        if (digits.startsWith("00")) {
          digits = "+" + digits.slice(2);
        } else if (!digits.startsWith("+") && digits.length === 10) {
          // Default 10-digit number to US +1
          digits = "+1" + digits;
        } else if (!digits.startsWith("+") && digits.length === 11 && digits.startsWith("1")) {
          digits = "+" + digits;
        }

        if (digits.startsWith("+") && digits.length >= 8) {
          const hash = createHash("sha256").update(digits).digest("hex");
          hashedIdentifiers.push({
            identifier_type: "phone_number_sha256",
            identifier: hash,
          });
          validPhones++;
        } else {
          skippedPhones++;
        }
      }

      let uploadResult = null;
      if (auto_upload && custom_audience_id && hashedIdentifiers.length > 0) {
        if (action === "add") {
          uploadResult = await audienceService.addMembers(custom_audience_id, {
            identifiers: hashedIdentifiers,
          });
        } else {
          uploadResult = await audienceService.removeMembers(custom_audience_id, {
            identifiers: hashedIdentifiers,
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: {
                  total_processed: emails.length + phones.length,
                  valid_hashed_identifiers: hashedIdentifiers.length,
                  valid_emails: validEmails,
                  skipped_emails: skippedEmails,
                  valid_phones: validPhones,
                  skipped_phones: skippedPhones,
                  uploaded: Boolean(uploadResult),
                },
                upload_operation: uploadResult,
                hashed_identifiers: auto_upload ? undefined : hashedIdentifiers,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
