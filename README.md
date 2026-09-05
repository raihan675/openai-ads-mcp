# OpenAI Ads & Conversion Intelligence MCP Server 🚀

An enterprise-grade **Model Context Protocol (MCP)** server connecting AI agents (Antigravity, Claude Desktop, Cursor, custom agents) directly to the **OpenAI Ads Advertiser API** and conversion measurement ecosystem.

Built with TypeScript and `@modelcontextprotocol/sdk`, this server provides complete campaign management, ad creation, measurement configuration, custom audiences, delta product feeds, bulk operations, and high-level tracking audit intelligence.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        MCP Host / Client                               │
│              (Claude Desktop, Cursor, Antigravity, AI Agents)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JSON-RPC 2.0 (stdio)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    OPENAI ADS MCP SERVER                               │
│                                                                        │
│  🛠️ Tool Layer (Zod Validated Inputs)                                   │
│  • Account & Brand       • Campaigns        • Ad Groups & Ads          │
│  • Delivery Insights     • Conversions      • Custom Audiences         │
│  • Product Feeds         • Bulk Mutations   • Tracking Audit ⭐         │
│                                                                        │
│  📦 Service Layer                                                      │
│  • AccountService        • CampaignService  • AdGroupService           │
│  • AdService             • InsightService   • ConversionService        │
│  • AudienceService       • FeedService      • BulkService              │
│  • GeoService            • AuditService ⭐                             │
│                                                                        │
│  🔐 Core Client (`OpenAIAdsClient`)                                    │
│  • Bearer token authentication via $OPENAI_ADS_API_KEY                 │
│  • Typed errors (`OpenAIAdsApiError`) and standard response parsing    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
                      OpenAI Ads Advertiser API (v1)
                       https://api.ads.openai.com/v1
```

---

## ⚡ Features & Capabilities

* **Full Campaign Lifecycle**: Create, list, retrieve, update, pause, activate, or archive campaigns. Supports **CPM** (`impressions`), **CPC** (`clicks`), and **oCPC** (`conversions`).
* **Context Hints**: Leverage conversational AI ad placement with free-form keywords and placement descriptions (`context_hints`).
* **Creative Asset Management**: Upload creative image cards (`chat_card`) or product catalog templates (`product_ad_template`). Generate 24-hour web preview links.
* **Conversion Tracking & oCPC**: Create web pixels (with automatic advanced matching), generate server-side CAPI keys, define conversion event settings, and stream live 15-minute browser events for testing.
* **Custom Audiences**: Upload first-party customer lists (email, phone, SHA256, GAID), perform incremental additions/removals, replace memberships with optimistic concurrency (`expected_revision`), and configure bid adjustments.
* **Delta Product Feeds**: Instantly update stock availability (`in_stock` / `out_of_stock`), price, and title for catalog variants without re-uploading entire feeds.
* **Bulk Mutations**: Asynchronously batch up to 1,000 operations across campaigns, ad groups, and ads.
* **Deep Performance Insights**: Query delivery metrics (impressions, clicks, spend, CTR, CPC, CPM) segmented by product, country, or device, plus attributed click-through and view-through conversions.
* **⭐ Tracking Audit & Intelligence**: Built-in automated audits checking brand review status, conversion event settings, recent pixel event streams, and campaign CPA/ROAS health.

---

## 🚀 Quickstart

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher (v20+ recommended).
* **OpenAI Ads Account**: An active ad account and an API key generated from the **Settings** tab in [OpenAI Ads Manager](https://ads.openai.com).

### 2. Installation & Build

```bash
# Clone or navigate to the project directory
cd openai-ads-mcp

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

### 3. Environment Configuration
Create a `.env` file in the project root:

```env
OPENAI_ADS_API_KEY=your_actual_ads_api_key_here
OPENAI_ADS_API_BASE_URL=https://api.ads.openai.com/v1
```

---

## 🔌 Host Configuration

### 🚀 Google Antigravity
Add to your global Antigravity MCP configuration file at `~/.gemini/config/mcp_config.json`:

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

---

### 💬 ChatGPT (Desktop / Developer Mode)
Add to your ChatGPT MCP configuration (`~/.chatgpt/mcp.json` or Developer Mode settings):

```json
{
  "mcpServers": {
    "openai-ads": {
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

---

### ⚡ OpenAI Codex / Codex CLI
Add to your Codex MCP configuration (`~/.codex/config.json` or `codex-mcp.json`):

```json
{
  "mcpServers": {
    "openai-ads": {
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

---

### 💻 Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "openai-ads": {
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

---

### 🟣 Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "openai-ads": {
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

---

## 🛠️ Tool Catalog Reference (43 Tools)

### 🏢 Account & Brand
| Tool | Description |
| :--- | :--- |
| `get_ad_account` | Retrieve account ID, name, timezone, currency, and brand review approval. |
| `update_ad_account_brand` | Update display name or assign a brand favicon `file_id` (min 128x128 px). |

### 📢 Campaigns
| Tool | Description |
| :--- | :--- |
| `list_campaigns` | List campaigns with pagination and sorting. |
| `get_campaign` | Fetch campaign metadata by ID. |
| `create_campaign` | Create a campaign (`impressions`, `clicks`, or `conversions` oCPC). |
| `update_campaign` | Update lifetime budget, schedule timestamps, status, or description. |
| `set_campaign_state` | Explicitly `activate`, `pause`, or `archive` a campaign. |
| `clone_campaign_structure` | Deep-copies an existing campaign, ad groups, and ads into a new campaign structure. |

### 👥 Ad Groups
| Tool | Description |
| :--- | :--- |
| `list_ad_groups` | List ad groups belonging to a campaign. |
| `get_ad_group` | Fetch ad group details by ID. |
| `create_ad_group` | Create an ad group with `billing_event_type`, `max_bid_micros`, and `context_hints`. |
| `update_ad_group` | Update ad group parameters, bids, or context hints. |
| `set_ad_group_state` | Explicitly `activate`, `pause`, or `archive` an ad group. |

### 📝 Ads & Creatives
| Tool | Description |
| :--- | :--- |
| `upload_creative_asset` | Upload a remote image URL to obtain a reusable `file_id`. |
| `list_ads` | List ads in an ad group. |
| `get_ad` | Fetch ad creative and `review_status` (`in_review`, `approved`, `rejected`). |
| `create_ad` | Create a `chat_card` (image card) or `product_ad_template` ad with intent prompts. |
| `preview_ad` | Generate a 24-hour web preview URL for an ad. |
| `set_ad_state` | Explicitly `activate`, `pause`, or `archive` an ad. |
| `generate_ad_intent_queries` | AI brainstorming tool generating realistic ChatGPT user prompt queries & conversational copy. |

### 📊 Insights & Reporting
| Tool | Description |
| :--- | :--- |
| `get_delivery_insights` | Query impressions, clicks, spend, CTR, CPC, CPM across account, campaign, ad group, or ad scopes. |
| `get_conversion_insights` | Query attributed click-through and view-through conversions and revenue. |

### 🎯 Measurement & Conversions
| Tool | Description |
| :--- | :--- |
| `create_web_pixel` | Create a web pixel with automatic advanced matching. |
| `inspect_recent_pixel_events` | Inspect up to 50 events received in the last 15 minutes for live testing. |
| `create_conversions_api_key` | Generate a server-side Conversions API key (CAPI). |
| `create_conversion_event_setting` | Define conversion goals (`order_created`, `lead_created`, etc.). |
| `list_conversion_event_settings` | List all configured conversion definitions in the account. |
| `send_test_conversion_event` | Dispatch test or live server-side conversion events via CAPI with automatic hashing. |

### 👥 Custom Audiences
| Tool | Description |
| :--- | :--- |
| `list_custom_audiences` | List audiences filtered by eligibility (`inclusion`, `exclusion`, `bid_multiplier`). |
| `get_custom_audience` | Retrieve audience status, privacy size range, and revision. |
| `create_custom_audience` | Create an audience from a file or initialize an empty list. |
| `mutate_audience_membership` | Add or remove members inline or via delta file with optimistic revision check. |
| `merge_custom_audiences` | Union 2 to 64 existing audiences into a new independent audience. |
| `archive_custom_audience` | Permanently archive a custom audience. |
| `get_audience_operation_status` | Poll status of asynchronous membership mutations. |
| `prepare_custom_audience_payload` | Validates, normalizes, and SHA-256 hashes raw customer emails/phones with auto-upload. |

### 🛍️ Product Feeds & Delta Updates
| Tool | Description |
| :--- | :--- |
| `update_feed_product_variants` | Delta update prices, titles, or availability (`in_stock` / `out_of_stock`) for feed items. |

### 📦 Bulk Operations
| Tool | Description |
| :--- | :--- |
| `submit_bulk_mutation_job` | Batch up to 1,000 create/update operations in an asynchronous job. |
| `get_bulk_mutation_job_status` | Poll bulk job execution and fetch per-operation results. |

### 🌍 Targeting
| Tool | Description |
| :--- | :--- |
| `search_geo_locations` | Search DMAs, regions, and countries for location IDs. |

### ⭐ Tracking Intelligence & Anomaly Guardrails
| Tool | Description |
| :--- | :--- |
| `audit_conversion_tracking` | Deep diagnostic of brand approval, configured event settings, and real-time pixel health. |
| `analyze_campaign_performance` | Evaluates spend, CTR, CPC, conversions, CPA, and provides actionable recommendations. |
| `detect_spend_anomalies` | Budget protector guardrail detecting zero-conversion spend drain and CPA runaway. |

---

## 💬 Example AI Interactions

### 1. Audit Conversion Setup
> *"Run an audit on my OpenAI Ads conversion tracking. Are my pixels receiving events, and are my event settings properly configured for conversion campaigns?"*

### 2. Launch an oCPC Campaign
> *"Create an oCPC campaign named 'Spring Launch' optimizing for purchases with a $50 daily budget. Target the San Francisco DMA and create an ad group with a $25 CPA bid."*

### 3. Performance Review
> *"Analyze the performance of my top campaigns over the last 14 days. Show me clicks, spend, CTR, and CPA, and recommend optimizations."*

### 4. Audience Management
> *"Create a new custom audience of high-value purchasers and exclude them from my prospecting campaign."*

---

## 📄 License
MIT
