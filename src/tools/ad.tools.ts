import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AdService } from "../services/ad.service.js";
import { FileService } from "../services/file.service.js";

export function registerAdTools(
  server: McpServer,
  adService: AdService,
  fileService: FileService
) {
  server.registerTool(
    "upload_creative_asset",
    {
      title: "Upload Creative Asset from URL",
      description:
        "Upload a remote image URL to OpenAI Ads and receive a reusable file_id for ads (chat_card) or brand review (account_favicon).",
      inputSchema: {
        image_url: z.string().url().describe("Publicly accessible HTTPS URL of the image"),
        purpose: z
          .enum(["account_favicon", "custom_audience"])
          .optional()
          .describe("Purpose of asset. Set to 'account_favicon' when uploading brand icon (min 128x128)."),
      },
    },
    async ({ image_url, purpose }) => {
      const result = await fileService.uploadFromUrl(image_url, purpose);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "list_ads",
    {
      title: "List Ads",
      description: "List ads for a specific ad group ID.",
      inputSchema: {
        ad_group_id: z.string().describe("Parent ad group ID (e.g. adgrp_301)"),
        limit: z.number().min(1).max(500).optional(),
        after: z.string().optional(),
        order: z.enum(["asc", "desc"]).optional(),
      },
    },
    async ({ ad_group_id, ...params }) => {
      const result = await adService.listAds(ad_group_id, params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_ad",
    {
      title: "Get Ad",
      description: "Fetch an ad by ID, including creative details and review_status.",
      inputSchema: {
        ad_id: z.string().describe("Ad ID (e.g. ad_501)"),
      },
    },
    async ({ ad_id }) => {
      const ad = await adService.getAd(ad_id);
      return {
        content: [{ type: "text", text: JSON.stringify(ad, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_ad",
    {
      title: "Create Ad",
      description:
        "Create an ad in an ad group. Supports 'chat_card' (title 3-50 chars, body max 100 chars, destination target_url, and uploaded file_id) or 'product_ad_template' (for product feed campaigns).",
      inputSchema: {
        ad_group_id: z.string().describe("Parent ad group ID"),
        name: z.string().min(3).max(1000).describe("Internal organizational name"),
        status: z.enum(["active", "paused"]).describe("Initial status"),
        creative_type: z.enum(["chat_card", "product_ad_template"]).describe("Creative format"),
        title: z.string().min(3).max(50).describe("Card title (3-50 chars)"),
        body: z.string().max(100).describe("Card description body (max 100 chars)"),
        target_url: z.string().url().optional().describe("Destination URL (required for chat_card)"),
        file_id: z.string().optional().describe("Uploaded image file_id (required for chat_card)"),
        price: z.string().optional().describe("Price string or '{{product.price}}' for product_ad_template"),
        idempotency_key: z.string().optional(),
      },
    },
    async ({
      ad_group_id,
      name,
      status,
      creative_type,
      title,
      body,
      target_url,
      file_id,
      price,
      idempotency_key,
    }) => {
      let creative: any;
      if (creative_type === "chat_card") {
        if (!target_url || !file_id) {
          throw new Error("Both target_url and file_id are required for chat_card creatives.");
        }
        creative = {
          type: "chat_card",
          title,
          body,
          target_url,
          file_id,
        };
      } else {
        creative = {
          type: "product_ad_template",
          title,
          body,
          price,
        };
      }

      const ad = await adService.createAd(
        {
          ad_group_id,
          name,
          status,
          creative,
        },
        idempotency_key
      );

      return {
        content: [{ type: "text", text: JSON.stringify(ad, null, 2) }],
      };
    }
  );

  server.registerTool(
    "preview_ad",
    {
      title: "Preview Ad",
      description: "Generate a 24-hour temporary web preview URL for an existing ad.",
      inputSchema: {
        ad_id: z.string().describe("Ad ID"),
      },
    },
    async ({ ad_id }) => {
      const preview = await adService.previewAd(ad_id);
      return {
        content: [{ type: "text", text: JSON.stringify(preview, null, 2) }],
      };
    }
  );

  server.registerTool(
    "set_ad_state",
    {
      title: "Set Ad State",
      description: "Activate, pause, or archive an ad. Archiving is permanent.",
      inputSchema: {
        ad_id: z.string().describe("Ad ID"),
        action: z.enum(["activate", "pause", "archive"]),
      },
    },
    async ({ ad_id, action }) => {
      let result;
      if (action === "activate") {
        result = await adService.activateAd(ad_id);
      } else if (action === "pause") {
        result = await adService.pauseAd(ad_id);
      } else {
        result = await adService.archiveAd(ad_id);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "generate_ad_intent_queries",
    {
      title: "Generate Conversational Ad Intent Queries & Copy",
      description:
        "Generates realistic, high-intent ChatGPT user queries (custom_intent_queries) and conversational sponsored ad copy tailored to your product, audience, and value propositions.",
      inputSchema: {
        product_name: z.string().describe("Name of the product or service"),
        product_category: z.string().describe("Category (e.g., 'E-commerce Analytics', 'B2B SaaS CRM')"),
        target_audience: z.string().describe("Target buyer persona (e.g., 'Growth Marketers, Agency Founders')"),
        landing_page_url: z.string().url().describe("Destination landing page URL"),
        key_benefits: z.array(z.string()).describe("Top 2-4 core value propositions or features"),
        competitors_or_alternatives: z
          .array(z.string())
          .optional()
          .describe("Key competitors or legacy alternatives users might ask about"),
        num_queries: z
          .number()
          .min(5)
          .max(30)
          .default(15)
          .describe("Number of intent query variations to produce"),
      },
    },
    async ({
      product_name,
      product_category,
      target_audience,
      landing_page_url,
      key_benefits,
      competitors_or_alternatives = [],
      num_queries = 15,
    }) => {
      const intentClusters: Record<string, string[]> = {
        solution_seeking: [
          `How to improve ${product_category.toLowerCase()} for ${target_audience.toLowerCase()}`,
          `Best way to ${key_benefits[0] ? key_benefits[0].toLowerCase() : "grow conversions"}`,
          `How can I automate ${key_benefits[1] ? key_benefits[1].toLowerCase() : "ad reporting"}?`,
          `Solutions for ${target_audience.toLowerCase()} struggling with ${product_category.toLowerCase()}`,
        ],
        recommendation_and_discovery: [
          `What is the best ${product_category.toLowerCase()} software in 2026?`,
          `Can you recommend a platform for ${target_audience.toLowerCase()} to ${key_benefits[0] ? key_benefits[0].toLowerCase() : "scale"}?`,
          `Top rated tools for ${product_category.toLowerCase()}`,
          `What software should I use for ${key_benefits[0] ? key_benefits[0].toLowerCase() : "conversions"}?`,
        ],
        comparison_and_alternatives: [
          competitors_or_alternatives.length > 0
            ? `Alternatives to ${competitors_or_alternatives[0]} with better ${key_benefits[0] ? key_benefits[0].toLowerCase() : "pricing"}`
            : `How does modern ${product_category.toLowerCase()} compare to legacy tools?`,
          competitors_or_alternatives.length > 1
            ? `Comparison between ${competitors_or_alternatives.join(", ")} and new tools`
            : `What are the pros and cons of different ${product_category.toLowerCase()} providers?`,
          `Is there a better solution than manual ${product_category.toLowerCase()}?`,
        ],
        how_to_and_tactical: [
          `Step by step guide to ${key_benefits[0] ? key_benefits[0].toLowerCase() : "track conversions"}`,
          `How do professional ${target_audience.toLowerCase()} handle ${product_category.toLowerCase()}?`,
          `Best practices for ${key_benefits[1] ? key_benefits[1].toLowerCase() : "optimization"}`,
        ],
        high_commercial_intent: [
          `Cost of implementing ${product_category.toLowerCase()}`,
          `ROI of upgrading our ${product_category.toLowerCase()} stack`,
          `Fastest way to get started with ${key_benefits[0] ? key_benefits[0].toLowerCase() : "tracking"}`,
        ],
      };

      // Flatten and slice
      const allQueries: string[] = [];
      Object.values(intentClusters).forEach((list) => allQueries.push(...list));
      const selectedQueries = allQueries.slice(0, num_queries);

      // Conversational markdown ad variations
      const domain = new URL(landing_page_url).hostname;
      const copyVariations = [
        {
          style: "Benefit-driven",
          title: `${product_name} — Built for ${target_audience}`,
          body_markdown: `Looking to level up your ${product_category.toLowerCase()}?\n\n- **${key_benefits[0] || "Accurate Tracking"}**\n- **${key_benefits[1] || "Automated Insights"}**\n- Seamless integration tailored for ${target_audience}.\n\nGet started in minutes.`,
          call_to_action: "Learn More",
          click_url: landing_page_url,
          display_url: domain,
        },
        {
          style: "Direct Solution",
          title: `Stop Guessing: ${product_name}`,
          body_markdown: `Solve ${product_category.toLowerCase()} challenges once and for all. Empower your team with ${key_benefits.join(", ")}.\n\nSee how leading brands scale with ${product_name}.`,
          call_to_action: "Sign Up",
          click_url: landing_page_url,
          display_url: domain,
        },
      ];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary: `Generated ${selectedQueries.length} conversational intent queries and 2 ad copy variations.`,
                ready_to_use_custom_intent_queries: selectedQueries,
                categorized_intent_clusters: intentClusters,
                suggested_ad_copy_variations: copyVariations,
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
