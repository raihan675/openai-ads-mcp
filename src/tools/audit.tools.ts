import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AuditService } from "../services/audit.service.js";

export function registerAuditTools(server: McpServer, auditService: AuditService) {
  server.registerTool(
    "audit_conversion_tracking",
    {
      title: "Audit Conversion Tracking Health",
      description:
        "Comprehensive tracking audit. Inspects ad account brand approval, configured conversion event settings, and optionally polls the 15-minute live pixel stream to diagnose missing events, tag misconfigurations, and CAPI readiness.",
      inputSchema: {
        pixel_id: z
          .string()
          .optional()
          .describe("Optional pixel ID to verify live browser event stream in the last 15 minutes"),
      },
    },
    async ({ pixel_id }) => {
      const report = await auditService.auditConversionTracking(pixel_id);
      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    }
  );

  server.registerTool(
    "analyze_campaign_performance",
    {
      title: "Analyze Campaign Performance & ROAS",
      description:
        "Analyzes campaign metrics (impressions, clicks, spend, CTR, CPC, conversions, CPA). Provides diagnostic assessments (STRONG, MODERATE, NEEDS_ATTENTION) and actionable optimization recommendations.",
      inputSchema: {
        campaign_id: z.string().describe("The campaign ID to evaluate"),
      },
    },
    async ({ campaign_id }) => {
      const analysis = await auditService.analyzeCampaignPerformance(campaign_id);
      return {
        content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }],
      };
    }
  );

  server.registerTool(
    "detect_spend_anomalies",
    {
      title: "Detect Spend & CPA Anomalies (Guardrail)",
      description:
        "Scans recent delivery and conversion metrics for runaway spend, zero-conversion budget drain, low-CTR creative burnout, and abnormal CPA spikes across campaigns. Recommends immediate remediation actions.",
      inputSchema: {
        campaign_id: z.string().optional().describe("Optional specific campaign ID to check (checks all active if omitted)"),
        lookback_days: z.number().min(1).max(30).default(7).describe("Number of days of data to analyze (default: 7)"),
        zero_conversion_spend_threshold_usd: z
          .number()
          .default(50)
          .describe("Alert threshold for spend in USD with zero attributed conversions (default: $50)"),
        max_cpa_multiplier: z
          .number()
          .default(2.5)
          .describe("Multiplier above target bid to flag as CPA runaway (default: 2.5)"),
      },
    },
    async ({
      campaign_id,
      lookback_days = 7,
      zero_conversion_spend_threshold_usd = 50,
      max_cpa_multiplier = 2.5,
    }) => {
      const report = await auditService.detectSpendAnomalies({
        campaign_id,
        lookback_days,
        zero_conversion_spend_threshold_usd,
        max_cpa_multiplier,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    }
  );
}
