import { AccountService } from "./account.service.js";
import { CampaignService } from "./campaign.service.js";
import { ConversionService } from "./conversion.service.js";
import { InsightService } from "./insight.service.js";

export interface TrackingAuditReport {
  ad_account_id: string;
  ad_account_name: string;
  brand_review_status: string;
  event_settings_count: number;
  event_settings: Array<{
    id: string;
    name: string;
    event_type: string;
    sources: string[];
    archived: boolean;
  }>;
  recent_events_checked: boolean;
  recent_events_count?: number;
  recent_event_types?: string[];
  findings: Array<{
    level: "PASS" | "WARN" | "FAIL";
    title: string;
    detail: string;
  }>;
  recommendations: string[];
}

export interface CampaignPerformanceReport {
  campaign_id: string;
  campaign_name: string;
  status: string;
  bidding_type?: string;
  total_impressions: number;
  total_clicks: number;
  total_spend: number;
  ctr_percent: number;
  average_cpc: number;
  conversions?: number;
  cpa?: number;
  insights_rows_count: number;
  performance_assessment: "STRONG" | "MODERATE" | "NEEDS_ATTENTION" | "INSUFFICIENT_DATA";
  findings: string[];
  recommendations: string[];
}

export class AuditService {
  constructor(
    private readonly accountService: AccountService,
    private readonly campaignService: CampaignService,
    private readonly conversionService: ConversionService,
    private readonly insightService: InsightService
  ) {}

  async auditConversionTracking(pixelId?: string): Promise<TrackingAuditReport> {
    const account = await this.accountService.getAccount();
    const eventSettingsRes = await this.conversionService.listEventSettings();
    const eventSettings = eventSettingsRes.data || [];

    const findings: TrackingAuditReport["findings"] = [];
    const recommendations: string[] = [];

    // Check brand approval
    const brandStatus = account.review?.status || "unknown";
    if (brandStatus === "approved") {
      findings.push({
        level: "PASS",
        title: "Account Brand Review Approved",
        detail: `The ad account brand status is ${brandStatus}. Ads are eligible to deliver.`,
      });
    } else {
      findings.push({
        level: "FAIL",
        title: "Account Brand Review Not Approved",
        detail: `Brand review status is '${brandStatus}'. If reason is 'missing_favicon', upload a brand favicon (128x128px) via upload tool.`,
      });
      recommendations.push("Upload and assign a brand favicon using update_ad_account_brand.");
    }

    // Check event settings
    if (eventSettings.length === 0) {
      findings.push({
        level: "WARN",
        title: "No Conversion Event Settings Found",
        detail: "No active conversion definitions were found in the ad account. oCPC campaigns cannot optimize without an event setting.",
      });
      recommendations.push(
        "Create at least one standard conversion event setting (e.g., 'order_created', 'lead_created') via create_conversion_event_setting."
      );
    } else {
      const activeSettings = eventSettings.filter((s) => !s.archived);
      findings.push({
        level: "PASS",
        title: "Conversion Event Settings Configured",
        detail: `Found ${activeSettings.length} active conversion event setting(s).`,
      });
    }

    // Check recent pixel event stream if pixel ID is provided
    let recentEventsChecked = false;
    let recentEventsCount: number | undefined = undefined;
    let recentEventTypes: string[] | undefined = undefined;

    if (pixelId) {
      recentEventsChecked = true;
      try {
        const streamRes = await this.conversionService.getRecentPixelEvents(pixelId);
        const events = streamRes.data || [];
        recentEventsCount = events.length;
        recentEventTypes = Array.from(new Set(events.map((e) => e.event_type)));

        if (events.length > 0) {
          findings.push({
            level: "PASS",
            title: "Live Pixel Events Detected",
            detail: `Detected ${events.length} event(s) in the last 15 minutes. Types: ${recentEventTypes.join(", ")}.`,
          });
        } else {
          findings.push({
            level: "WARN",
            title: "No Pixel Events in Past 15 Minutes",
            detail: "No browser pixel events arrived in the last 15 minutes. Verify that the JavaScript pixel snippet is installed on active traffic pages.",
          });
          recommendations.push("Trigger a test conversion on your website and verify with inspect_recent_pixel_events.");
        }
      } catch (err: any) {
        findings.push({
          level: "WARN",
          title: "Pixel Event Stream Check Unavailable",
          detail: `Could not retrieve recent pixel events: ${err.message}`,
        });
      }
    } else {
      recommendations.push(
        "Provide a pixel_id to audit real-time browser event ingestion via the conversion event stream."
      );
    }

    return {
      ad_account_id: account.id,
      ad_account_name: account.name,
      brand_review_status: brandStatus,
      event_settings_count: eventSettings.length,
      event_settings: eventSettings.map((s) => ({
        id: s.id,
        name: s.name,
        event_type: s.event_type,
        sources: s.source_ids || [],
        archived: s.archived,
      })),
      recent_events_checked: recentEventsChecked,
      recent_events_count: recentEventsCount,
      recent_event_types: recentEventTypes,
      findings,
      recommendations,
    };
  }

  async analyzeCampaignPerformance(campaignId: string): Promise<CampaignPerformanceReport> {
    const campaign = await this.campaignService.getCampaign(campaignId);
    const insightsRes = await this.insightService.getDeliveryInsights("campaign", campaignId, {
      time_granularity: "none",
      fields: [
        "campaign.id",
        "campaign.name",
        "campaign.impressions",
        "campaign.clicks",
        "campaign.spend",
        "campaign.ctr",
        "campaign.cpc",
      ],
    });

    const rows = insightsRes.data || [];
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpend = 0;

    for (const row of rows) {
      totalImpressions += row.impressions || 0;
      totalClicks += row.clicks || 0;
      totalSpend += row.spend || 0;
    }

    const ctrPercent = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averageCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Retrieve attributed conversions if available
    let totalConversions: number | undefined = undefined;
    let cpa: number | undefined = undefined;

    try {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 86400;
      const convRes = await this.insightService.getConversionInsights({
        aggregation_level: "campaign",
        entity_ids: [campaignId],
        time_ranges: [
          JSON.stringify({
            type: "unix_range",
            start: thirtyDaysAgo,
            end: now,
          }),
        ],
      });

      const convRow = convRes.data?.[0];
      if (convRow) {
        totalConversions = convRow.conversions;
        if (totalConversions > 0) {
          cpa = totalSpend / totalConversions;
        }
      }
    } catch {
      // Conversion insights may not be enabled or funded yet
    }

    const findings: string[] = [];
    const recommendations: string[] = [];
    let assessment: CampaignPerformanceReport["performance_assessment"] = "MODERATE";

    if (totalImpressions === 0) {
      assessment = "INSUFFICIENT_DATA";
      findings.push("Campaign has delivered zero impressions in the queried window.");
      recommendations.push(
        "Verify campaign and ad group status are active, budget is funded, and context_hints/targeting are not overly restrictive."
      );
    } else {
      if (ctrPercent >= 1.5) {
        findings.push(`High engagement: CTR is ${ctrPercent.toFixed(2)}% (above 1.5% benchmark).`);
      } else if (ctrPercent < 0.5) {
        findings.push(`Low engagement: CTR is ${ctrPercent.toFixed(2)}% (below 0.5%).`);
        recommendations.push("Refresh ad creative copy or refine context_hints to target more relevant user intents.");
      }

      if (totalConversions !== undefined) {
        if (totalConversions > 0) {
          findings.push(`Attributed conversions: ${totalConversions} (CPA: $${(cpa || 0).toFixed(2)}).`);
          assessment = "STRONG";
        } else if (totalClicks > 50) {
          findings.push("Over 50 clicks registered with 0 attributed conversions.");
          recommendations.push(
            "Check landing page relevance, verify conversion tracking tags with audit_conversion_tracking, and test form submissions."
          );
          assessment = "NEEDS_ATTENTION";
        }
      }
    }

    return {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      status: campaign.status,
      bidding_type: campaign.bidding_type,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_spend: totalSpend,
      ctr_percent: Number(ctrPercent.toFixed(2)),
      average_cpc: Number(averageCpc.toFixed(2)),
      conversions: totalConversions,
      cpa: cpa !== undefined ? Number(cpa.toFixed(2)) : undefined,
      insights_rows_count: rows.length,
      performance_assessment: assessment,
      findings,
      recommendations,
    };
  }

  async detectSpendAnomalies(params?: {
    campaign_id?: string;
    lookback_days?: number;
    zero_conversion_spend_threshold_usd?: number;
    max_cpa_multiplier?: number;
  }): Promise<{
    status: "HEALTHY" | "ATTENTION_REQUIRED" | "CRITICAL_ACTION_NEEDED";
    lookback_days: number;
    total_campaigns_analyzed: number;
    total_spend_usd: number;
    total_conversions: number;
    critical_anomalies_count: number;
    warning_anomalies_count: number;
    anomalies: Array<{
      severity: "CRITICAL" | "WARNING" | "INFO";
      campaign_id: string;
      campaign_name: string;
      type: string;
      spend_usd: number;
      conversions: number;
      metric_detail: string;
      recommended_action: string;
    }>;
    recommendations: string[];
  }> {
    const lookbackDays = params?.lookback_days || 7;
    const zeroConvThresholdUsd = params?.zero_conversion_spend_threshold_usd || 50;
    const maxCpaMultiplier = params?.max_cpa_multiplier || 2.5;

    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - lookbackDays * 86400;

    let campaigns: Array<{ id: string; name: string; status: string }> = [];
    if (params?.campaign_id) {
      const c = await this.campaignService.getCampaign(params.campaign_id);
      campaigns = [c];
    } else {
      const list = await this.campaignService.listCampaigns({ limit: 50 });
      campaigns = list.data || [];
    }

    const anomalies: Array<{
      severity: "CRITICAL" | "WARNING" | "INFO";
      campaign_id: string;
      campaign_name: string;
      type: string;
      spend_usd: number;
      conversions: number;
      metric_detail: string;
      recommended_action: string;
    }> = [];

    let totalSpendUsd = 0;
    let totalConversions = 0;

    for (const cmp of campaigns) {
      if (cmp.status === "archived") continue;

      let spendUsd = 0;
      let clicks = 0;
      let impressions = 0;
      let conversions = 0;

      try {
        const delivery = await this.insightService.getDeliveryInsights("campaign", cmp.id, {
          time_ranges: [
            JSON.stringify({
              type: "unix_range",
              start: windowStart,
              end: now,
            }),
          ],
        });

        for (const row of delivery.data || []) {
          spendUsd += row.spend || 0;
          clicks += row.clicks || 0;
          impressions += row.impressions || 0;
        }
      } catch {
        // Continue if no delivery
      }

      try {
        const convs = await this.insightService.getConversionInsights({
          aggregation_level: "campaign",
          entity_ids: [cmp.id],
          time_ranges: [
            JSON.stringify({
              type: "unix_range",
              start: windowStart,
              end: now,
            }),
          ],
        });

        for (const row of convs.data || []) {
          conversions += row.conversions || 0;
        }
      } catch {
        // Continue if no conversions reported
      }

      totalSpendUsd += spendUsd;
      totalConversions += conversions;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpa = conversions > 0 ? spendUsd / conversions : undefined;

      // Check Anomaly 1: Runaway spend with zero conversions
      if (spendUsd >= zeroConvThresholdUsd && conversions === 0) {
        anomalies.push({
          severity: "CRITICAL",
          campaign_id: cmp.id,
          campaign_name: cmp.name,
          type: "ZERO_CONVERSION_OVERSPEND",
          spend_usd: Number(spendUsd.toFixed(2)),
          conversions: 0,
          metric_detail: `Spent $${spendUsd.toFixed(2)} with 0 conversions across ${clicks} clicks.`,
          recommended_action: `Pause campaign '${cmp.name}' or verify checkout funnel and tracking pixel tags immediately.`,
        });
      }

      // Check Anomaly 2: Low CTR creative burnout
      if (impressions >= 1000 && ctr < 0.3) {
        anomalies.push({
          severity: "WARNING",
          campaign_id: cmp.id,
          campaign_name: cmp.name,
          type: "LOW_CTR_CREATIVE_BURNOUT",
          spend_usd: Number(spendUsd.toFixed(2)),
          conversions,
          metric_detail: `CTR is critically low at ${ctr.toFixed(2)}% over ${impressions} impressions.`,
          recommended_action: `Refresh sponsored chat ad copy or refine custom_intent_queries to target higher-intent prompts.`,
        });
      }
    }

    const criticalCount = anomalies.filter((a) => a.severity === "CRITICAL").length;
    const warningCount = anomalies.filter((a) => a.severity === "WARNING").length;

    let overallStatus: "HEALTHY" | "ATTENTION_REQUIRED" | "CRITICAL_ACTION_NEEDED" = "HEALTHY";
    if (criticalCount > 0) {
      overallStatus = "CRITICAL_ACTION_NEEDED";
    } else if (warningCount > 0) {
      overallStatus = "ATTENTION_REQUIRED";
    }

    const recommendations: string[] = [];
    if (criticalCount > 0) {
      recommendations.push(
        "Critical spend leakage detected: review offending campaigns and pause ad groups with runaway spend."
      );
    }
    if (warningCount > 0) {
      recommendations.push(
        "Address creative fatigue and low-CTR warnings to avoid paying higher CPCs."
      );
    }
    if (anomalies.length === 0) {
      recommendations.push("Account pacing and conversion health look normal for the analyzed window.");
    }

    return {
      status: overallStatus,
      lookback_days: lookbackDays,
      total_campaigns_analyzed: campaigns.length,
      total_spend_usd: Number(totalSpendUsd.toFixed(2)),
      total_conversions: totalConversions,
      critical_anomalies_count: criticalCount,
      warning_anomalies_count: warningCount,
      anomalies,
      recommendations,
    };
  }
}
