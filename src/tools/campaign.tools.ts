import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CampaignService } from "../services/campaign.service.js";
import type { AdGroupService } from "../services/ad-group.service.js";
import type { AdService } from "../services/ad.service.js";

export function registerCampaignTools(
  server: McpServer,
  campaignService: CampaignService,
  adGroupService?: AdGroupService,
  adService?: AdService
) {
  server.registerTool(
    "list_campaigns",
    {
      title: "List Campaigns",
      description: "List campaigns in the current OpenAI Ads account with pagination.",
      inputSchema: {
        limit: z.number().min(1).max(500).optional().describe("Number of items to return (1-500). Default 20."),
        after: z.string().optional().describe("Cursor for pagination"),
        before: z.string().optional().describe("Cursor for previous page"),
        order: z.enum(["asc", "desc"]).optional().describe("Sort order by creation time"),
      },
    },
    async (input) => {
      const result = await campaignService.listCampaigns(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_campaign",
    {
      title: "Get Campaign",
      description: "Fetch a single OpenAI Ads campaign by its ID.",
      inputSchema: {
        campaign_id: z.string().describe("The campaign ID (e.g. cmpn_101)"),
      },
    },
    async ({ campaign_id }) => {
      const campaign = await campaignService.getCampaign(campaign_id);
      return {
        content: [{ type: "text", text: JSON.stringify(campaign, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_campaign",
    {
      title: "Create Campaign",
      description:
        "Create an ad campaign. Note: lifetime_spend_limit_micros is in currency millionths (e.g. 25000000 = $25.00 USD). Bidding type cannot be changed after creation.",
      inputSchema: {
        name: z.string().min(3).max(1000).describe("Campaign name (3-1000 chars)"),
        status: z.enum(["active", "paused"]).describe("Initial status. 'paused' is recommended while creating child resources."),
        lifetime_spend_limit_micros: z
          .number()
          .min(1000000)
          .describe("Lifetime budget limit in micros (min 1,000,000 = $1.00 USD)"),
        description: z.string().optional().describe("Campaign description"),
        bidding_type: z
          .enum(["impressions", "clicks", "conversions"])
          .optional()
          .describe("Bidding objective. Defaults to 'impressions'. For oCPC, use 'conversions'."),
        conversion_event_setting_ids: z
          .array(z.string())
          .optional()
          .describe("Required for 'conversions' bidding: exactly one active standard event setting ID."),
        start_time: z.number().optional().describe("Unix timestamp in seconds for campaign start"),
        end_time: z.number().optional().describe("Unix timestamp in seconds for campaign end"),
        location_ids: z
          .array(z.string())
          .optional()
          .describe("List of target location IDs (regions/DMAs from search_geo_locations)"),
        idempotency_key: z.string().optional().describe("Optional unique idempotency key for safe retries"),
      },
    },
    async ({
      name,
      status,
      lifetime_spend_limit_micros,
      description,
      bidding_type,
      conversion_event_setting_ids,
      start_time,
      end_time,
      location_ids,
      idempotency_key,
    }) => {
      const targeting = location_ids && location_ids.length > 0
        ? { locations: { include: location_ids.map((id) => ({ id })) } }
        : undefined;

      const campaign = await campaignService.createCampaign(
        {
          name,
          status,
          budget: { lifetime_spend_limit_micros },
          description,
          bidding_type,
          conversion_event_setting_ids,
          start_time,
          end_time,
          targeting,
        },
        idempotency_key
      );

      return {
        content: [{ type: "text", text: JSON.stringify(campaign, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_campaign",
    {
      title: "Update Campaign",
      description:
        "Update campaign budget, schedule, status, or description. Note: bidding_type cannot be updated.",
      inputSchema: {
        campaign_id: z.string().describe("The campaign ID to update"),
        name: z.string().optional().describe("Updated campaign name"),
        description: z.string().nullable().optional().describe("Updated description or null to clear"),
        status: z.enum(["active", "paused", "archived"]).optional().describe("Updated status"),
        lifetime_spend_limit_micros: z
          .number()
          .optional()
          .describe("Updated lifetime budget in micros (e.g. 30000000 for $30.00)"),
        start_time: z.number().nullable().optional().describe("Unix timestamp start time or null"),
        end_time: z.number().nullable().optional().describe("Unix timestamp end time or null"),
      },
    },
    async ({
      campaign_id,
      name,
      description,
      status,
      lifetime_spend_limit_micros,
      start_time,
      end_time,
    }) => {
      const budget = lifetime_spend_limit_micros
        ? { lifetime_spend_limit_micros }
        : undefined;

      const updated = await campaignService.updateCampaign(campaign_id, {
        name,
        description,
        status,
        budget,
        start_time,
        end_time,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(updated, null, 2) }],
      };
    }
  );

  server.registerTool(
    "set_campaign_state",
    {
      title: "Set Campaign State",
      description:
        "Explicitly activate, pause, or archive a campaign. Archiving is irreversible.",
      inputSchema: {
        campaign_id: z.string().describe("The campaign ID"),
        action: z.enum(["activate", "pause", "archive"]).describe("Target state transition"),
      },
    },
    async ({ campaign_id, action }) => {
      let result;
      if (action === "activate") {
        result = await campaignService.activateCampaign(campaign_id);
      } else if (action === "pause") {
        result = await campaignService.pauseCampaign(campaign_id);
      } else {
        result = await campaignService.archiveCampaign(campaign_id);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "clone_campaign_structure",
    {
      title: "Clone Campaign Structure & Hierarchy",
      description:
        "Deep-copies an existing campaign along with all its child ad groups and ads into a new campaign (created in paused state by default). Allows overriding name, budget, or flight dates.",
      inputSchema: {
        source_campaign_id: z.string().describe("Existing campaign ID to clone from"),
        new_name: z.string().optional().describe("Name for the cloned campaign (defaults to '{Source Name} (Clone)')"),
        lifetime_spend_limit_micros: z
          .number()
          .optional()
          .describe("Optional budget override in micros (e.g. 50000000 for $50.00)"),
        include_ads: z.boolean().default(true).describe("Whether to also clone ads within ad groups"),
        activate_after_cloning: z
          .boolean()
          .default(false)
          .describe("If true, activates the new campaign and ad groups after cloning (default is false/paused)"),
      },
    },
    async ({
      source_campaign_id,
      new_name,
      lifetime_spend_limit_micros,
      include_ads = true,
      activate_after_cloning = false,
    }) => {
      // Fetch source campaign
      const sourceCampaign = await campaignService.getCampaign(source_campaign_id);

      const targetBudget = lifetime_spend_limit_micros
        ? { lifetime_spend_limit_micros }
        : sourceCampaign.budget;

      const clonedCampaign = await campaignService.createCampaign({
        name: new_name || `${sourceCampaign.name} (Clone)`,
        status: "paused",
        budget: targetBudget,
        description: `Cloned from ${sourceCampaign.name} (${source_campaign_id})`,
        bidding_type: sourceCampaign.bidding_type,
        conversion_event_setting_ids: sourceCampaign.conversion_event_setting_ids,
        targeting: sourceCampaign.targeting,
      });

      const clonedAdGroupsSummary: Array<{
        original_ad_group_id: string;
        cloned_ad_group_id: string;
        name: string;
        cloned_ads_count: number;
      }> = [];

      if (adGroupService) {
        const adGroupsList = await adGroupService.listAdGroups(source_campaign_id, {
          limit: 100,
        });

        for (const ag of adGroupsList.data || []) {
          const newAg = await adGroupService.createAdGroup({
            campaign_id: clonedCampaign.id,
            name: `${ag.name} (Clone)`,
            status: "paused",
            bidding_config: ag.bidding_config,
            description: ag.description || undefined,
            context_hints: ag.context_hints,
          });

          let clonedAdsCount = 0;
          if (include_ads && adService) {
            const adsList = await adService.listAds(ag.id, {
              limit: 100,
            });

            for (const ad of adsList.data || []) {
              await adService.createAd({
                ad_group_id: newAg.id,
                name: `${ad.name} (Clone)`,
                status: "paused",
                creative: ad.creative,
              });
              clonedAdsCount++;
            }
          }

          if (activate_after_cloning) {
            await adGroupService.activateAdGroup(newAg.id);
          }

          clonedAdGroupsSummary.push({
            original_ad_group_id: ag.id,
            cloned_ad_group_id: newAg.id,
            name: newAg.name,
            cloned_ads_count: clonedAdsCount,
          });
        }
      }

      if (activate_after_cloning) {
        await campaignService.activateCampaign(clonedCampaign.id);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                message: `Successfully cloned campaign '${sourceCampaign.name}'`,
                new_campaign: {
                  id: clonedCampaign.id,
                  name: clonedCampaign.name,
                  status: activate_after_cloning ? "active" : "paused",
                  bidding_type: clonedCampaign.bidding_type,
                  budget: clonedCampaign.budget,
                },
                cloned_ad_groups: clonedAdGroupsSummary,
                total_ad_groups_cloned: clonedAdGroupsSummary.length,
                total_ads_cloned: clonedAdGroupsSummary.reduce(
                  (acc, ag) => acc + ag.cloned_ads_count,
                  0
                ),
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
