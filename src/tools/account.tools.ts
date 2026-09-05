import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AccountService } from "../services/account.service.js";

export function registerAccountTools(server: McpServer, accountService: AccountService) {
  server.registerTool(
    "get_ad_account",
    {
      title: "Get Ad Account Metadata",
      description:
        "Fetches the OpenAI Ads account associated with the configured API key, including ID, name, destination URL, timezone, currency, and brand review status.",
      inputSchema: {},
    },
    async () => {
      const account = await accountService.getAccount();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(account, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "update_ad_account_brand",
    {
      title: "Update Account Brand Metadata",
      description:
        "Updates the ad account display name or assigns a brand favicon file_id, triggering an automatic brand review required for ad serving.",
      inputSchema: {
        name: z.string().optional().describe("Updated account display name"),
        favicon_file_id: z
          .string()
          .optional()
          .describe("File ID uploaded with purpose: 'account_favicon' (minimum 128x128 px)"),
      },
    },
    async (input) => {
      const updated = await accountService.updateBrand(input);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(updated, null, 2),
          },
        ],
      };
    }
  );
}
