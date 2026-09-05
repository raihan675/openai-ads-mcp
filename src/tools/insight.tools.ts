import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { InsightService } from "../services/insight.service.js";

export function registerInsightTools(server: McpServer, insightService: InsightService) {
  server.registerTool(
    "get_delivery_insights",
    {
      title: "Get Delivery Insights",
      description:
        "Retrieve advertising performance metrics (impressions, clicks, spend, CTR, CPC, CPM). Supports aggregation_level ('ad_account', 'campaign', 'ad_group', 'ad'), time_granularity ('hourly', 'daily', 'monthly', 'none'), segments (['product'], ['country'], ['device']), and zero-impression items.",
      inputSchema: {
        scope: z
          .enum(["ad_account", "campaign", "ad_group", "ad"])
          .describe("Target entity scope for the query"),
        entity_id: z
          .string()
          .optional()
          .describe("Entity ID required if scope is campaign, ad_group, or ad"),
        time_granularity: z
          .enum(["hourly", "daily", "monthly", "none"])
          .optional()
          .describe("Time bucket size. Default 'daily'. 'none' returns full window total."),
        aggregation_level: z
          .enum(["ad_account", "campaign", "ad_group", "ad"])
          .optional()
          .describe("Row entity inside the endpoint scope"),
        start_time: z
          .number()
          .optional()
          .describe("Unix start timestamp in seconds (past 5 years, hourly boundary)"),
        end_time: z
          .number()
          .optional()
          .describe("Unix end timestamp in seconds (hourly boundary)"),
        segments: z
          .array(z.enum(["product", "country", "device"]))
          .optional()
          .describe("Optional breakdown segment dimension"),
        fields: z
          .array(z.string())
          .optional()
          .describe("Specific fields to project (e.g. ['campaign.impressions', 'campaign.clicks', 'campaign.spend'])"),
        limit: z.number().min(1).max(2000).optional().describe("Max rows returned (default 20)"),
        after: z.string().optional().describe("Next page cursor"),
      },
    },
    async ({
      scope,
      entity_id,
      time_granularity,
      aggregation_level,
      start_time,
      end_time,
      segments,
      fields,
      limit,
      after,
    }) => {
      const time_ranges =
        start_time && end_time
          ? [JSON.stringify({ type: "unix_range", start: start_time, end: end_time })]
          : undefined;

      const result = await insightService.getDeliveryInsights(scope, entity_id, {
        time_granularity,
        aggregation_level,
        time_ranges,
        segments,
        fields,
        limit,
        after,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_conversion_insights",
    {
      title: "Get Conversion Insights",
      description:
        "Retrieve attributed conversion totals (conversions, click_through_conversions, view_through_conversions). 'conversions' is always equal to 'click_through_conversions'. View-through conversions use a fixed 1-day impression window for reporting.",
      inputSchema: {
        aggregation_level: z
          .enum(["campaign", "ad_group", "ad", "ad_account"])
          .describe("Aggregation level for the conversion metrics"),
        start_time: z.number().describe("Unix start timestamp in seconds"),
        end_time: z.number().describe("Unix end timestamp in seconds"),
        entity_ids: z.array(z.string()).optional().describe("Optional list of specific entity IDs to filter"),
      },
    },
    async ({ aggregation_level, start_time, end_time, entity_ids }) => {
      const result = await insightService.getConversionInsights({
        aggregation_level,
        time_ranges: [
          JSON.stringify({
            type: "unix_range",
            start: start_time,
            end: end_time,
          }),
        ],
        entity_ids,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
