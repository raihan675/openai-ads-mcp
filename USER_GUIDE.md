# OpenAI Ads MCP Server — Comprehensive Tool-by-Tool Guide

This guide covers all **43 tools** available in the `openai-ads-mcp` server. Each entry explains **what the tool does in simple words** and provides a **ready-to-use prompt idea** you can copy and paste into your AI assistant.

---

## ⚙️ Antigravity Configuration & Setup

To connect and use this MCP server inside Google Antigravity:

### 1. Global Configuration File
Open your Antigravity MCP configuration file:
- **Location**: `~/.gemini/config/mcp_config.json`
- **Windows Path**: `C:\Users\HP\.gemini\config\mcp_config.json`

### 2. Add to `mcpServers`
Add the following entry inside the `"mcpServers"` object:

```json
{
  "mcpServers": {
    "openai-ads-mcp": {
      "command": "node",
      "args": [
        "C:/Users/HP/.gemini/antigravity/scratch/openai-ads-mcp/dist/index.js"
      ],
      "env": {
        "OPENAI_ADS_API_KEY": "your_openai_ads_api_key_here"
      }
    }
  }
}
```

> **Note**: If `node` is not in your global system PATH, you can use the exact node binary path, for example:
> `"command": "C:/Users/HP/.gemini/antigravity/scratch/node-v20.18.0-win-x64/node.exe"`

### 3. Verify in Antigravity
1. Restart Antigravity or open a new chat session.
2. Click **Additional Options (`...`) > MCP Servers** in the UI.
3. You will see `openai-ads-mcp` with all **43 tools** active and ready.

---

## 1. Account & Brand Management

### `get_ad_account`
- **What it does in simple words**: Shows your OpenAI Ads account identity, review status, currency, time zone, and brand approval.
- **Prompt Idea**:
  > *"Check my OpenAI Ads account details and tell me if my account review status is approved to deliver ads."*

### `update_ad_account_brand`
- **What it does in simple words**: Sets your business name, primary website URL, or uploads a brand icon/favicon (minimum 128x128 px), which is required before ads can run.
- **Prompt Idea**:
  > *"Update my brand details: set brand name to 'Web Analytics Pro', website URL to 'https://dev-offlinetracking.pantheonsite.io/', and attach favicon file ID 'file_123'."*

---

## 2. Campaign Management

### `list_campaigns`
- **What it does in simple words**: Lists all advertising campaigns in your account, including their daily/lifetime budgets and whether they are active or paused.
- **Prompt Idea**:
  > *"List all my current campaigns, show me their status, and format their budgets in dollars."*

### `get_campaign`
- **What it does in simple words**: Retrieves deep details of a specific campaign by its ID (bidding type, flight dates, budget, conversion goals).
- **Prompt Idea**:
  > *"Fetch the full details for campaign ID 'cmpn_101' and tell me what bidding strategy it is using."*

### `create_campaign`
- **What it does in simple words**: Launches a new advertising campaign. Supports Impression bidding, Click bidding, or Conversion-Optimized (oCPC) bidding with integer micros budgets ($1.00 USD = 1,000,000 micros).
- **Prompt Idea**:
  > *"Create a new paused campaign named 'Summer Retargeting' with a daily budget of $20.00 USD and bidding type set to 'clicks'."*

### `update_campaign`
- **What it does in simple words**: Modifies an existing campaign's name, daily/lifetime budget limit, or start/end flight dates.
- **Prompt Idea**:
  > *"Update campaign 'cmpn_101': increase the daily budget to $35.00 USD and rename it to 'Summer Retargeting - Scaled'."*

### `set_campaign_state`
- **What it does in simple words**: Changes a campaign's state between `activate` (start serving), `pause` (temporarily stop), or `archive` (permanently delete).
- **Prompt Idea**:
  > *"Pause campaign 'cmpn_101' immediately."*

### `clone_campaign_structure`
- **What it does in simple words**: Copies an entire winning campaign, including all of its child ad groups and ads, into a new draft campaign for rapid split-testing.
- **Prompt Idea**:
  > *"Clone campaign 'cmpn_101' into a new campaign named 'Fall Promo Split Test' with a daily budget of $30.00 USD, keeping it paused."*

---

## 3. Ad Groups & Targeting

### `list_ad_groups`
- **What it does in simple words**: Shows all ad groups across your account or filtered under a specific campaign.
- **Prompt Idea**:
  > *"List all ad groups inside campaign 'cmpn_101' and show me their max bid settings."*

### `get_ad_group`
- **What it does in simple words**: Retrieves targeting rules (geo locations, audiences) and bid limits for a single ad group.
- **Prompt Idea**:
  > *"Get details for ad group 'ag_202' and check what geographic locations it is targeting."*

### `create_ad_group`
- **What it does in simple words**: Creates a targeting bucket under a campaign. Sets billing event type (`click` or `impression`) and maximum bid limit (e.g. CPA bid).
- **Prompt Idea**:
  > *"Create an ad group named 'US Marketers' under campaign 'cmpn_101' with a max click bid of $1.50 USD."*

### `update_ad_group`
- **What it does in simple words**: Edits an ad group's bid amount or modifies its targeting rules.
- **Prompt Idea**:
  > *"Update ad group 'ag_202' and lower the max bid to $1.20 USD."*

### `set_ad_group_state`
- **What it does in simple words**: Starts, pauses, or archives a specific ad group.
- **Prompt Idea**:
  > *"Activate ad group 'ag_202'."*

---

## 4. Creatives, Ads & Copy Generation

### `upload_creative_asset`
- **What it does in simple words**: Uploads an image from an image URL to OpenAI servers and returns a permanent `file_id` to use in ads or favicons.
- **Prompt Idea**:
  > *"Upload this image URL 'https://example.com/banner.png' as an ad creative asset and give me the file_id."*

### `list_ads`
- **What it does in simple words**: Lists all sponsored chat ads, their approval status, and ad copy.
- **Prompt Idea**:
  > *"List all ads inside ad group 'ag_202' and check if any ads were rejected."*

### `get_ad`
- **What it does in simple words**: Shows the complete creative layout, CTA button, headline, and destination URL for an ad.
- **Prompt Idea**:
  > *"Show me the details and review status for ad 'ad_303'."*

### `create_ad`
- **What it does in simple words**: Publishes a sponsored conversational ad with a headline, markdown body copy, CTA button ('Sign Up', 'Learn More'), destination link, and ChatGPT prompt intent triggers.
- **Prompt Idea**:
  > *"Create a sponsored chat ad in ad group 'ag_202' promoting our web analytics service with title 'Fix Tracking Loss', CTA 'Sign Up', and link 'https://dev-offlinetracking.pantheonsite.io/'."*

### `preview_ad`
- **What it does in simple words**: Generates an interactive visual mockup showing exactly how the sponsored chat ad appears inside ChatGPT.
- **Prompt Idea**:
  > *"Preview ad 'ad_303' and give me the temporary preview link."*

### `set_ad_state`
- **What it does in simple words**: Turns a specific ad on (`activate`), off (`pause`), or archives it.
- **Prompt Idea**:
  > *"Pause ad 'ad_303'."*

### `generate_ad_intent_queries`
- **What it does in simple words**: AI Brainstorming tool that generates realistic, conversational ChatGPT prompt queries (`custom_intent_queries`) and matching ad copy variations based on your product.
- **Prompt Idea**:
  > *"Generate 15 conversational intent queries and 2 ad copy variations for my site 'https://dev-offlinetracking.pantheonsite.io/' offering server-side conversion tracking for e-commerce."*

---

## 5. Reporting & Insights

### `get_delivery_insights`
- **What it does in simple words**: Queries raw performance data: impressions, clicks, spend, and CTR grouped by day, device, country, or product.
- **Prompt Idea**:
  > *"Show me daily delivery insights (impressions, clicks, spend, CTR) for campaign 'cmpn_101' over the last 14 days."*

### `get_conversion_insights`
- **What it does in simple words**: Reports total attributed purchases, leads, and conversion value per campaign across post-click and post-view windows.
- **Prompt Idea**:
  > *"Pull conversion insights for all active campaigns over the last 30 days and show me total purchases and cost per purchase."*

---

## 6. Conversions, Web Pixel & CAPI

### `create_web_pixel`
- **What it does in simple words**: Creates an official OpenAI web tracking pixel for your website and returns the Pixel ID.
- **Prompt Idea**:
  > *"Create a new web pixel named 'Storefront Main Pixel' for my site."*

### `inspect_recent_pixel_events`
- **What it does in simple words**: Debugging tool that verifies live browser events received by OpenAI from your pixel in the last 15 minutes.
- **Prompt Idea**:
  > *"Inspect the recent pixel events stream for pixel ID '134534...' to confirm my browser events are firing."*

### `create_conversions_api_key`
- **What it does in simple words**: Generates a secure server-to-server CAPI token to send offline or backend purchase events directly from your server.
- **Prompt Idea**:
  > *"Create a new Conversions API key named 'Backend Order Sync Key'."*

### `create_conversion_event_setting`
- **What it does in simple words**: Defines an optimization goal (e.g. `order_created`, `lead_created`) tied to your pixel source ID with custom attribution windows. Required for oCPC campaigns.
- **Prompt Idea**:
  > *"Create a conversion event setting named 'Completed Purchases' for event type 'order_created' linked to pixel source 'clidsrc_123'."*

### `list_conversion_event_settings`
- **What it does in simple words**: Lists all configured conversion goals in your account and shows which ones are eligible for automated bidding.
- **Prompt Idea**:
  > *"List all active conversion event settings in my account."*

### `send_test_conversion_event`
- **What it does in simple words**: Dispatches a test conversion event directly via CAPI, automatically hashing customer emails/phones and attaching deduplication IDs.
- **Prompt Idea**:
  > *"Send a test 'order_created' conversion event for $75.00 USD with customer email 'buyer@example.com' using send_test_conversion_event."*

---

## 7. Custom Audiences

### `list_custom_audiences`
- **What it does in simple words**: Lists your custom audience segments and shows match status and size thresholds.
- **Prompt Idea**:
  > *"List all custom audiences in my account and check which ones are ready for targeting."*

### `get_custom_audience`
- **What it does in simple words**: Checks the match size of an audience (e.g. `under_25k`, `25k_100k`) and whether it qualifies for inclusion or exclusion.
- **Prompt Idea**:
  > *"Get details for custom audience 'caud_404' to see if it meets the 25k match threshold."*

### `create_custom_audience`
- **What it does in simple words**: Creates a new first-party audience container for customer retention or exclusion.
- **Prompt Idea**:
  > *"Create a new custom audience named 'VIP Customers 2026'."*

### `prepare_custom_audience_payload`
- **What it does in simple words**: Takes plain-text customer emails and phone numbers, validates them, trims, standardizes to E.164, and hashes them with SHA-256. Can also upload them automatically.
- **Prompt Idea**:
  > *"Hash these customer emails: 'alice@gmail.com', 'bob@yahoo.com' and phone '+1 415-555-1234' and upload them directly to audience 'caud_404'."*

### `mutate_audience_membership`
- **What it does in simple words**: Adds, removes, or overwrites hashed member identifiers in an existing audience segment.
- **Prompt Idea**:
  > *"Add a list of hashed email identifiers to custom audience 'caud_404'."*

### `merge_custom_audiences`
- **What it does in simple words**: Combines two or more existing audience segments into a single unified audience.
- **Prompt Idea**:
  > *"Merge audience 'caud_101' and 'caud_102' into a new audience named 'All Past Buyers Combined'."*

### `archive_custom_audience`
- **What it does in simple words**: Permanently deletes/archives an unused audience segment.
- **Prompt Idea**:
  > *"Archive custom audience 'caud_old_123'."*

### `get_audience_operation_status`
- **What it does in simple words**: Checks whether an asynchronous audience upload job has finished processing.
- **Prompt Idea**:
  > *"Check the status of audience mutation operation 'op_505' for audience 'caud_404'."*

---

## 8. Product Feeds & Delta Feeds

### `update_feed_product_variants`
- **What it does in simple words**: Submits rapid, lightweight price or stock updates to your e-commerce catalog without re-uploading the whole file.
- **Prompt Idea**:
  > *"Update product feed 'feed_999': change price of SKU 'SHOE-BLK-10' to $89.99 USD and set availability to 'in_stock'."*

---

## 9. Bulk Operations (Asynchronous Batching)

### `submit_bulk_mutation_job`
- **What it does in simple words**: Submits dozens or hundreds of campaign, ad group, and ad updates in a single background batch job.
- **Prompt Idea**:
  > *"Submit a bulk mutation job to update daily budgets across 10 campaigns simultaneously."*

### `get_bulk_mutation_job_status`
- **What it does in simple words**: Checks if a background bulk job has completed and retrieves any errors.
- **Prompt Idea**:
  > *"Check the status of bulk job 'job_888' and report if any operations failed."*

---

## 10. Geo Location Discovery

### `search_geo_locations`
- **What it does in simple words**: Finds canonical location IDs (countries, states, DMAs, cities) needed for geographical ad targeting.
- **Prompt Idea**:
  > *"Search for location IDs for California, Florida, and New York in the United States."*

---

## 11. Tracking Intelligence, Performance & Guardrails

### `audit_conversion_tracking`
- **What it does in simple words**: Full automated diagnostic of your account: checks brand review status, brand favicon, active conversion settings, and pixel activity required for conversion bidding.
- **Prompt Idea**:
  > *"Run a full tracking audit on my OpenAI Ads account and tell me what is missing before I turn on oCPC campaigns."*

### `analyze_campaign_performance`
- **What it does in simple words**: Senior media buyer analysis: computes actual CPA vs target bids, CTR benchmarks, spend efficiency, and gives strategic growth recommendations.
- **Prompt Idea**:
  > *"Analyze campaign 'cmpn_101' performance over the last 30 days and provide optimization recommendations."*

### `detect_spend_anomalies`
- **What it does in simple words**: Budget protector guardrail: scans the last 7–14 days to catch runaway ad groups spending budget with 0 conversions, severe creative burnout, or abnormal CPA spikes.
- **Prompt Idea**:
  > *"Run detect_spend_anomalies across my account for the last 7 days and alert me if any campaigns are burning budget without getting sales."*
