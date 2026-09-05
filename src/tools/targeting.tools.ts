import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GeoService } from "../services/geo.service.js";

export function registerTargetingTools(server: McpServer, geoService: GeoService) {
  server.registerTool(
    "search_geo_locations",
    {
      title: "Search Geo Locations",
      description:
        "Search targetable locations (countries, regions, and DMAs) by keyword query to obtain location IDs for campaign targeting.",
      inputSchema: {
        query: z.string().min(2).describe("Search term (e.g. 'San Francisco', 'California', 'United States')"),
        limit: z.number().min(1).max(50).optional().describe("Maximum results to return (default 10)"),
      },
    },
    async ({ query, limit = 10 }) => {
      const results = await geoService.search(query, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );
}
