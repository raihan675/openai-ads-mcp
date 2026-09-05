#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Core client
import { OpenAIAdsClient } from "./api/client.js";

// Services
import { AccountService } from "./services/account.service.js";
import { CampaignService } from "./services/campaign.service.js";
import { AdGroupService } from "./services/ad-group.service.js";
import { AdService } from "./services/ad.service.js";
import { FileService } from "./services/file.service.js";
import { InsightService } from "./services/insight.service.js";
import { ConversionService } from "./services/conversion.service.js";
import { AudienceService } from "./services/audience.service.js";
import { FeedService } from "./services/feed.service.js";
import { BulkService } from "./services/bulk.service.js";
import { GeoService } from "./services/geo.service.js";
import { AuditService } from "./services/audit.service.js";

// Tools
import { registerAccountTools } from "./tools/account.tools.js";
import { registerCampaignTools } from "./tools/campaign.tools.js";
import { registerAdGroupTools } from "./tools/ad-group.tools.js";
import { registerAdTools } from "./tools/ad.tools.js";
import { registerInsightTools } from "./tools/insight.tools.js";
import { registerConversionTools } from "./tools/conversion.tools.js";
import { registerAudienceTools } from "./tools/audience.tools.js";
import { registerProductFeedTools } from "./tools/product-feed.tools.js";
import { registerBulkTools } from "./tools/bulk.tools.js";
import { registerTargetingTools } from "./tools/targeting.tools.js";
import { registerAuditTools } from "./tools/audit.tools.js";

async function main() {
  const server = new McpServer({
    name: "openai-ads-mcp",
    version: "1.0.0",
  });

  // Initialize core API client
  const client = new OpenAIAdsClient();

  // Instantiate domain services
  const accountService = new AccountService(client);
  const campaignService = new CampaignService(client);
  const adGroupService = new AdGroupService(client);
  const adService = new AdService(client);
  const fileService = new FileService(client);
  const insightService = new InsightService(client);
  const conversionService = new ConversionService(client);
  const audienceService = new AudienceService(client);
  const feedService = new FeedService(client);
  const bulkService = new BulkService(client);
  const geoService = new GeoService(client);
  const auditService = new AuditService(
    accountService,
    campaignService,
    conversionService,
    insightService
  );

  // Register all tool suites
  registerAccountTools(server, accountService);
  registerCampaignTools(server, campaignService, adGroupService, adService);
  registerAdGroupTools(server, adGroupService);
  registerAdTools(server, adService, fileService);
  registerInsightTools(server, insightService);
  registerConversionTools(server, conversionService);
  registerAudienceTools(server, audienceService);
  registerProductFeedTools(server, feedService);
  registerBulkTools(server, bulkService);
  registerTargetingTools(server, geoService);
  registerAuditTools(server, auditService);

  // Register MCP Prompts for guided AI workflows
  server.registerPrompt(
    "audit-account-tracking",
    {
      title: "Audit Account Tracking Health",
      description: "Guides the AI agent to run a thorough audit of brand approval, pixels, and conversion events.",
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Please run an audit on my OpenAI Ads account using the audit_conversion_tracking tool. Review the brand approval status, check that conversion event settings are configured properly for oCPC, and give me recommendations if anything is missing.",
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "analyze-campaign-performance",
    {
      title: "Analyze Campaign Performance",
      description: "Guides the AI agent to evaluate campaign CTR, CPC, CPA, and conversions to provide recommendations.",
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "First list my campaigns with list_campaigns. Then choose the top active campaign and analyze its performance using analyze_campaign_performance and get_delivery_insights. Highlight strengths, potential budget waste, and actionable optimizations.",
          },
        },
      ],
    })
  );

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpenAI Ads MCP server running on stdio transport");
}

main().catch((error) => {
  console.error("Fatal error starting OpenAI Ads MCP server:", error);
  process.exit(1);
});
