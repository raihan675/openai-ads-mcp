import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AdGroupService } from "../services/ad-group.service.js";

export function registerAdGroupTools(server: McpServer, adGroupService: AdGroupService) {
  server.registerTool(
    "list_ad_groups",
    {
      title: "List Ad Groups",
      description: "List ad groups for a specific parent campaign ID.",
      inputSchema: {
        campaign_id: z.string().describe("Parent campaign ID (e.g. cmpn_101)"),
        limit: z.number().min(1).max(500).optional().describe("Number of items to return"),
        after: z.string().optional().describe("Pagination cursor"),
        order: z.enum(["asc", "desc"]).optional(),
      },
    },
    async ({ campaign_id, ...params }) => {
      const result = await adGroupService.listAdGroups(campaign_id, params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_ad_group",
    {
      title: "Get Ad Group",
      description: "Fetch an ad group by its ID.",
      inputSchema: {
        ad_group_id: z.string().describe("The ad group ID (e.g. adgrp_301)"),
      },
    },
    async ({ ad_group_id }) => {
      const adGroup = await adGroupService.getAdGroup(ad_group_id);
      return {
        content: [{ type: "text", text: JSON.stringify(adGroup, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_ad_group",
    {
      title: "Create Ad Group",
      description:
        "Create an ad group under a campaign. Billing event must match campaign objective ('impression' for CPM; 'click' for CPC and oCPC). max_bid_micros is in millionths (e.g. 60000 = $0.06/event or $60 CPM; 100000000 = $100 CPA bid).",
      inputSchema: {
        campaign_id: z.string().describe("Parent campaign ID"),
        name: z.string().min(3).max(1000).describe("Ad group name"),
        status: z.enum(["active", "paused"]).describe("Initial status"),
        billing_event_type: z.enum(["impression", "click"]).describe("Billing event type"),
        max_bid_micros: z.number().min(1).describe("Max bid in currency micros"),
        description: z.string().optional().describe("Description"),
        context_hints: z
          .array(z.string())
          .optional()
          .describe("Context keywords/descriptions for relevant conversation placements"),
        bid_multipliers: z
          .array(
            z.object({
              custom_audience_id: z.string(),
              bid_multiplier_micros: z.number().min(100000).max(10000000),
            })
          )
          .optional()
          .describe("Custom audience bid adjustments (100000 = 0.1x to 10000000 = 10x)"),
        idempotency_key: z.string().optional().describe("Optional idempotency key"),
      },
    },
    async ({
      campaign_id,
      name,
      status,
      billing_event_type,
      max_bid_micros,
      description,
      context_hints,
      bid_multipliers,
      idempotency_key,
    }) => {
      const adGroup = await adGroupService.createAdGroup(
        {
          campaign_id,
          name,
          status,
          bidding_config: {
            billing_event_type,
            max_bid_micros,
            custom_audience_bid_multipliers: bid_multipliers,
          },
          description,
          context_hints,
        },
        idempotency_key
      );

      return {
        content: [{ type: "text", text: JSON.stringify(adGroup, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_ad_group",
    {
      title: "Update Ad Group",
      description: "Update ad group name, description, context_hints, status, or bidding_config.",
      inputSchema: {
        ad_group_id: z.string().describe("Ad group ID"),
        name: z.string().optional().describe("Updated name"),
        description: z.string().nullable().optional().describe("Updated description or null"),
        status: z.enum(["active", "paused", "archived"]).optional(),
        context_hints: z.array(z.string()).optional(),
        billing_event_type: z.enum(["impression", "click"]).optional(),
        max_bid_micros: z.number().optional(),
      },
    },
    async ({
      ad_group_id,
      name,
      description,
      status,
      context_hints,
      billing_event_type,
      max_bid_micros,
    }) => {
      const bidding_config =
        billing_event_type && max_bid_micros
          ? { billing_event_type, max_bid_micros }
          : undefined;

      const updated = await adGroupService.updateAdGroup(ad_group_id, {
        name,
        description,
        status,
        context_hints,
        bidding_config,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(updated, null, 2) }],
      };
    }
  );

  server.registerTool(
    "set_ad_group_state",
    {
      title: "Set Ad Group State",
      description: "Activate, pause, or archive an ad group. Archiving is irreversible.",
      inputSchema: {
        ad_group_id: z.string().describe("Ad group ID"),
        action: z.enum(["activate", "pause", "archive"]),
      },
    },
    async ({ ad_group_id, action }) => {
      let result;
      if (action === "activate") {
        result = await adGroupService.activateAdGroup(ad_group_id);
      } else if (action === "pause") {
        result = await adGroupService.pauseAdGroup(ad_group_id);
      } else {
        result = await adGroupService.archiveAdGroup(ad_group_id);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
