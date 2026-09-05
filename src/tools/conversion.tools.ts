import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ConversionService } from "../services/conversion.service.js";

export function registerConversionTools(
  server: McpServer,
  conversionService: ConversionService
) {
  server.registerTool(
    "create_web_pixel",
    {
      title: "Create Web Pixel",
      description:
        "Creates a web conversion source and returns both an internal source ID (clidsrc_*) and a public pixel_id. Web pixels automatically support automatic advanced matching.",
      inputSchema: {
        name: z.string().min(3).max(1000).describe("Descriptive name (e.g. 'Acme website')"),
      },
    },
    async ({ name }) => {
      const pixel = await conversionService.createPixel(name, "web");
      return {
        content: [{ type: "text", text: JSON.stringify(pixel, null, 2) }],
      };
    }
  );

  server.registerTool(
    "inspect_recent_pixel_events",
    {
      title: "Inspect Recent Pixel Events",
      description:
        "Test and verify incoming browser pixel events. Returns up to 50 raw events received by OpenAI from the JavaScript pixel SDK during the previous 15 minutes.",
      inputSchema: {
        pixel_id: z.string().describe("The Pixel ID (from create_web_pixel)"),
      },
    },
    async ({ pixel_id }) => {
      const events = await conversionService.getRecentPixelEvents(pixel_id);
      return {
        content: [{ type: "text", text: JSON.stringify(events, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_conversions_api_key",
    {
      title: "Create Conversions API Key (CAPI)",
      description:
        "Generate a server-side Conversions API key to send conversion events directly from backend servers. Note: store securely in server secrets.",
      inputSchema: {
        name: z.string().min(3).max(1000).describe("Descriptive key label (e.g. 'Production CAPI Key')"),
      },
    },
    async ({ name }) => {
      const key = await conversionService.createApiKey(name);
      return {
        content: [{ type: "text", text: JSON.stringify(key, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_conversion_event_setting",
    {
      title: "Create Conversion Event Setting",
      description:
        "Defines an active conversion goal (e.g. 'order_created', 'lead_created', 'registration_completed') bound to a pixel source ID. Required for oCPC conversion-optimized campaigns.",
      inputSchema: {
        name: z.string().describe("Display name for the conversion definition (e.g. 'Purchases')"),
        event_type: z
          .string()
          .describe("Standard event (e.g. 'order_created', 'lead_created', 'registration_completed') or 'custom'"),
        source_id: z
          .string()
          .describe("Conversion source ID returned by pixel creation (clidsrc_*)"),
        attribution_window_days: z
          .number()
          .default(30)
          .describe("Attribution window in days (defaults to 30)"),
        custom_event_name: z
          .string()
          .optional()
          .describe("Required if event_type is 'custom'"),
      },
    },
    async ({ name, event_type, source_id, attribution_window_days, custom_event_name }) => {
      const setting = await conversionService.createEventSetting({
        name,
        event_type,
        attribution_window_days,
        source_ids: [source_id],
        custom_event_name,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(setting, null, 2) }],
      };
    }
  );

  server.registerTool(
    "list_conversion_event_settings",
    {
      title: "List Conversion Event Settings",
      description: "List all conversion definitions configured for the current ad account.",
      inputSchema: {
        limit: z.number().optional(),
        after: z.string().optional(),
      },
    },
    async (params) => {
      const settings = await conversionService.listEventSettings(params);
      return {
        content: [{ type: "text", text: JSON.stringify(settings, null, 2) }],
      };
    }
  );

  server.registerTool(
    "send_test_conversion_event",
    {
      title: "Send Test Conversion Event (CAPI Dispatcher)",
      description:
        "Dispatches a test or live server-side conversion event (e.g., 'order_created', 'lead_created', 'add_to_cart') via the OpenAI Conversions API. Automatically hashes plain emails/phones with SHA-256 and attaches deduplication tokens.",
      inputSchema: {
        event_name: z
          .enum([
            "order_created",
            "checkout_started",
            "items_added",
            "contents_viewed",
            "page_viewed",
            "lead_created",
            "registration_completed",
            "custom",
          ])
          .describe("Standard conversion event name or 'custom'"),
        event_id: z
          .string()
          .optional()
          .describe("Unique event ID for deduplication with pixel (defaults to auto-generated UUID)"),
        currency: z.string().default("USD").describe("Currency code (e.g. 'USD')"),
        value: z.number().optional().describe("Monetary conversion value (e.g. 49.99)"),
        order_id: z.string().optional().describe("E-commerce transaction or order ID"),
        user_email: z.string().optional().describe("Customer email (will be SHA-256 hashed automatically)"),
        user_phone: z.string().optional().describe("Customer phone number (will be normalized and hashed)"),
        obref: z.string().optional().describe("OpenAI ad click reference token (if captured from click URL)"),
        action_source: z
          .enum(["website", "system_generated", "offline"])
          .default("website")
          .describe("Action source channel"),
      },
    },
    async ({
      event_name,
      event_id,
      currency,
      value,
      order_id,
      user_email,
      user_phone,
      obref,
      action_source,
    }) => {
      const { createHash, randomUUID } = await import("node:crypto");

      let emailHash: string | undefined;
      if (user_email) {
        emailHash = createHash("sha256").update(user_email.trim().toLowerCase()).digest("hex");
      }

      let phoneHash: string | undefined;
      if (user_phone) {
        let cleaned = user_phone.trim().replace(/[^\d+]/g, "");
        if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
        phoneHash = createHash("sha256").update(cleaned).digest("hex");
      }

      const generatedEventId = event_id || `evt_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const eventTimeSec = Math.floor(Date.now() / 1000);

      const eventPayload = {
        event_name,
        event_time: eventTimeSec,
        event_id: generatedEventId,
        action_source,
        user: {
          email_sha256: emailHash,
          phone_number_sha256: phoneHash,
          obref,
        },
        custom_data: {
          currency,
          value,
          order_id,
        },
      };

      try {
        const response = await conversionService.sendConversionEvents({
          events: [eventPayload],
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  message: "Conversion event successfully dispatched to OpenAI Conversions API",
                  dispatched_event: eventPayload,
                  api_response: response,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "error",
                  message: "Failed to dispatch conversion event",
                  error: err.message || String(err),
                  payload_attempted: eventPayload,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );
}
