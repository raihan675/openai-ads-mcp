import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FeedService } from "../services/feed.service.js";

export function registerProductFeedTools(server: McpServer, feedService: FeedService) {
  server.registerTool(
    "update_feed_product_variants",
    {
      title: "Delta Update Product Feed Variants",
      description:
        "Delta update prices, titles, or stock availability for existing variants in a linked merchant feed without re-uploading the entire catalog.",
      inputSchema: {
        feed_id: z.string().describe("The product feed ID (e.g. product_feed_123)"),
        products: z
          .array(
            z.object({
              id: z.string().describe("Parent product ID"),
              variants: z.array(
                z.object({
                  id: z.string().describe("Variant item ID"),
                  title: z.string().optional().describe("Updated title"),
                  price: z
                    .object({
                      amount: z.number().int().describe("Price in minor units (e.g. 8999 for $89.99)"),
                      currency: z.string().describe("3-letter currency code (e.g. USD)"),
                    })
                    .optional(),
                  availability: z
                    .object({
                      available: z.boolean().optional(),
                      status: z.enum(["in_stock", "out_of_stock"]).optional(),
                    })
                    .optional(),
                })
              ),
            })
          )
          .min(1)
          .describe("Array of products and their changed variants"),
      },
    },
    async ({ feed_id, products }) => {
      const result = await feedService.updateProducts(feed_id, products as any);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
