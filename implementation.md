# Convex Integration Implementation Plan

## Overview

This document outlines the step-by-step plan to integrate Convex as the primary data persistence layer for the GPT Visibility Report Agent. Currently, all data is stored in files (JSON/HTML/TXT). We'll transition to Convex while maintaining file exports as optional downloads.

---

## Current Architecture Summary

### Data Flow
```
Email Request → Extract Business Info → Generate Prompts → Run Searches (4x per prompt)
→ Analyze Results → Generate Reddit Suggestions → Create Recommendations
→ Generate Reports → Save to FILES → Reply with Report
```

### Current Storage (File-Based)
- **Reports**: `reports/report-{slug}-{timestamp}.html` + `.txt`
- **Debug Logs**: `logs/debug-{slug}-{timestamp}.json` + `.txt`
- **No Database**: All data lives in files, no queries, no history tracking

### Key Files
- `src/dev.ts` - CLI entry point, main generation logic
- `src/agent.ts` - Email agent entry point
- `src/services/openai.ts` - GPT searches and analysis
- `src/services/browserUse.ts` - Business extraction & Reddit scraping
- `src/utils/debugLogger.ts` - Current file-based saving
- `src/utils/reportGenerator.ts` - HTML/text report generation
- `src/types/index.ts` - TypeScript data models

---

## Implementation Phases

## Phase 1: Convex Setup & Schema Definition

### 1.1 Install Convex

```bash
cd /Users/filippofacioni/hackathon
npm install convex
npx convex dev
```

This will:
- Install Convex client and server libraries
- Initialize `convex/` directory
- Create Convex project (requires login)
- Generate `.env.local` with `CONVEX_URL`

### 1.2 Define Schema (`convex/schema.ts`)

Create the complete Convex schema based on the specification in `aaa.txt`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  companies: defineTable({
    name: v.string(),
    description: v.string(),
    url: v.string(),
    industry: v.string(),
    productsServices: v.string(),
    targetCustomers: v.string(),
    location: v.optional(v.string()),
    additionalContext: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_url", ["url"])
    .index("by_creation", ["createdAt"]),

  reports: defineTable({
    companyId: v.id("companies"),
    generatedDate: v.number(),
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),

    // Email context (if from email agent)
    messageId: v.optional(v.string()),
    emailFrom: v.optional(v.string()),

    // Configuration
    totalPrompts: v.number(),
    runsPerPrompt: v.number(),

    // GPT Results Summary
    gptVisibilityScore: v.optional(v.number()),
    gptQueryCoverage: v.optional(v.number()),
    gptMentionRate: v.optional(v.number()),
    gptAverageRank: v.optional(v.number()),

    // Perplexity Results Summary (future)
    perplexityVisibilityScore: v.optional(v.number()),
    perplexityQueryCoverage: v.optional(v.number()),
    perplexityMentionRate: v.optional(v.number()),
    perplexityAverageRank: v.optional(v.number()),

    // Visibility Analysis
    visibilityLevel: v.optional(v.union(
      v.literal("High"),
      v.literal("Medium"),
      v.literal("Low")
    )),
    visibilityFactors: v.optional(v.array(v.string())),

    // Metadata
    executionTimeMs: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_date", ["companyId", "generatedDate"])
    .index("by_status", ["status"])
    .index("by_message_id", ["messageId"]),

  prompts: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),

    promptText: v.string(),
    category: v.string(),
    orderIndex: v.number(),

    // GPT Aggregated Results (from 4 runs)
    gptBusinessMentioned: v.boolean(),
    gptMentionProbability: v.number(),
    gptAverageRank: v.optional(v.number()),
    gptTotalSources: v.number(),

    // Perplexity Aggregated Results (future)
    perplexityBusinessMentioned: v.boolean(),
    perplexityMentionProbability: v.number(),
    perplexityAverageRank: v.optional(v.number()),
    perplexityTotalSources: v.number(),

    createdAt: v.number(),
  })
    .index("by_report", ["reportId"])
    .index("by_company", ["companyId"]),

  promptRuns: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptId: v.id("prompts"),

    aiService: v.union(
      v.literal("gpt"),
      v.literal("perplexity")
    ),
    runNumber: v.number(), // 1-4

    // Search Result
    responseText: v.string(),
    businessMentioned: v.boolean(),
    rank: v.optional(v.number()),
    mentionContext: v.optional(v.string()),

    // Metadata
    executionTimeMs: v.number(),
    tokensUsed: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_prompt", ["promptId"])
    .index("by_report", ["reportId"])
    .index("by_service", ["aiService", "promptId"]),

  competitorMentions: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptId: v.id("prompts"),
    promptRunId: v.id("promptRuns"),

    competitorName: v.string(),
    rank: v.number(),
    sourceUrl: v.optional(v.string()),
    mentionContext: v.optional(v.string()),

    aiService: v.union(
      v.literal("gpt"),
      v.literal("perplexity")
    ),

    createdAt: v.number(),
  })
    .index("by_run", ["promptRunId"])
    .index("by_prompt", ["promptId"])
    .index("by_report", ["reportId"])
    .index("by_competitor", ["reportId", "competitorName"]),

  sourceCitations: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptRunId: v.id("promptRuns"),

    sourceUrl: v.string(),
    sourceDomain: v.string(),
    sourceTitle: v.optional(v.string()),

    aiService: v.union(
      v.literal("gpt"),
      v.literal("perplexity")
    ),

    // Analysis
    mentionedOurCompany: v.boolean(),
    mentionedCompetitors: v.array(v.string()),

    createdAt: v.number(),
  })
    .index("by_run", ["promptRunId"])
    .index("by_report", ["reportId"])
    .index("by_domain", ["reportId", "sourceDomain"])
    .index("by_service", ["reportId", "aiService"]),

  redditSuggestions: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),

    redditUrl: v.string(),
    postTitle: v.string(),
    postContent: v.string(),
    suggestedComment: v.string(),
    relevanceScore: v.optional(v.number()),

    createdAt: v.number(),
  })
    .index("by_report", ["reportId"])
    .index("by_company", ["companyId"]),

  recommendations: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),

    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("High"),
      v.literal("Medium"),
      v.literal("Low")
    ),
    category: v.string(),
    orderIndex: v.number(),

    createdAt: v.number(),
  })
    .index("by_report", ["reportId"])
    .index("by_company", ["companyId"]),
});
```

**Key Design Decisions:**
- Added `messageId` and `emailFrom` to reports for email agent tracking
- Added `redditSuggestions` and `recommendations` tables (not in original spec but needed)
- All timestamps use `v.number()` (JavaScript timestamp)
- Proper indexes for common queries

### 1.3 Push Schema to Convex

```bash
npx convex dev
```

This deploys the schema to your Convex instance.

---

## Phase 2: Create Convex Mutations & Queries

### 2.1 Create Mutations (`convex/mutations.ts`)

These mutations will be called from your application to save data:

```typescript
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Create or get company by URL
export const upsertCompany = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    url: v.string(),
    industry: v.string(),
    productsServices: v.string(),
    targetCustomers: v.string(),
    location: v.optional(v.string()),
    additionalContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if company exists by URL
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();

    if (existing) {
      // Update existing company
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new company
    const companyId = await ctx.db.insert("companies", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return companyId;
  },
});

// Create new report
export const createReport = mutation({
  args: {
    companyId: v.id("companies"),
    totalPrompts: v.number(),
    runsPerPrompt: v.number(),
    messageId: v.optional(v.string()),
    emailFrom: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("reports", {
      companyId: args.companyId,
      generatedDate: Date.now(),
      status: "generating",
      totalPrompts: args.totalPrompts,
      runsPerPrompt: args.runsPerPrompt,
      messageId: args.messageId,
      emailFrom: args.emailFrom,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return reportId;
  },
});

// Create prompt
export const createPrompt = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptText: v.string(),
    category: v.string(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const promptId = await ctx.db.insert("prompts", {
      ...args,
      gptBusinessMentioned: false,
      gptMentionProbability: 0,
      gptTotalSources: 0,
      perplexityBusinessMentioned: false,
      perplexityMentionProbability: 0,
      perplexityTotalSources: 0,
      createdAt: Date.now(),
    });

    return promptId;
  },
});

// Update prompt with aggregated results
export const updatePromptResults = mutation({
  args: {
    promptId: v.id("prompts"),
    aiService: v.union(v.literal("gpt"), v.literal("perplexity")),
    businessMentioned: v.boolean(),
    mentionProbability: v.number(),
    averageRank: v.optional(v.number()),
    totalSources: v.number(),
  },
  handler: async (ctx, args) => {
    const { promptId, aiService, ...results } = args;

    const updates = aiService === "gpt" ? {
      gptBusinessMentioned: results.businessMentioned,
      gptMentionProbability: results.mentionProbability,
      gptAverageRank: results.averageRank,
      gptTotalSources: results.totalSources,
    } : {
      perplexityBusinessMentioned: results.businessMentioned,
      perplexityMentionProbability: results.mentionProbability,
      perplexityAverageRank: results.averageRank,
      perplexityTotalSources: results.totalSources,
    };

    await ctx.db.patch(promptId, updates);
  },
});

// Create prompt run
export const createPromptRun = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptId: v.id("prompts"),
    aiService: v.union(v.literal("gpt"), v.literal("perplexity")),
    runNumber: v.number(),
    responseText: v.string(),
    businessMentioned: v.boolean(),
    rank: v.optional(v.number()),
    mentionContext: v.optional(v.string()),
    executionTimeMs: v.number(),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const promptRunId = await ctx.db.insert("promptRuns", {
      ...args,
      createdAt: Date.now(),
    });

    return promptRunId;
  },
});

// Create competitor mention
export const createCompetitorMention = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptId: v.id("prompts"),
    promptRunId: v.id("promptRuns"),
    competitorName: v.string(),
    rank: v.number(),
    sourceUrl: v.optional(v.string()),
    mentionContext: v.optional(v.string()),
    aiService: v.union(v.literal("gpt"), v.literal("perplexity")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("competitorMentions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Create source citation
export const createSourceCitation = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptRunId: v.id("promptRuns"),
    sourceUrl: v.string(),
    sourceDomain: v.string(),
    sourceTitle: v.optional(v.string()),
    aiService: v.union(v.literal("gpt"), v.literal("perplexity")),
    mentionedOurCompany: v.boolean(),
    mentionedCompetitors: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sourceCitations", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Create Reddit suggestion
export const createRedditSuggestion = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    redditUrl: v.string(),
    postTitle: v.string(),
    postContent: v.string(),
    suggestedComment: v.string(),
    relevanceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("redditSuggestions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Create recommendation
export const createRecommendation = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("High"),
      v.literal("Medium"),
      v.literal("Low")
    ),
    category: v.string(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("recommendations", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Update report with final results
export const completeReport = mutation({
  args: {
    reportId: v.id("reports"),
    gptVisibilityScore: v.optional(v.number()),
    gptQueryCoverage: v.optional(v.number()),
    gptMentionRate: v.optional(v.number()),
    gptAverageRank: v.optional(v.number()),
    perplexityVisibilityScore: v.optional(v.number()),
    perplexityQueryCoverage: v.optional(v.number()),
    perplexityMentionRate: v.optional(v.number()),
    perplexityAverageRank: v.optional(v.number()),
    visibilityLevel: v.optional(v.union(
      v.literal("High"),
      v.literal("Medium"),
      v.literal("Low")
    )),
    visibilityFactors: v.optional(v.array(v.string())),
    executionTimeMs: v.number(),
  },
  handler: async (ctx, args) => {
    const { reportId, ...results } = args;

    await ctx.db.patch(reportId, {
      status: "completed",
      ...results,
      updatedAt: Date.now(),
    });
  },
});

// Mark report as failed
export const failReport = mutation({
  args: {
    reportId: v.id("reports"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "failed",
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});
```

### 2.2 Create Queries (`convex/queries.ts`)

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";

// Get company by URL
export const getCompanyByUrl = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
  },
});

// Get latest report for company
export const getLatestReport = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .first();
  },
});

// Get full report with all related data
export const getFullReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const company = await ctx.db.get(report.companyId);

    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    const promptsWithRuns = await Promise.all(
      prompts.map(async (prompt) => {
        const runs = await ctx.db
          .query("promptRuns")
          .withIndex("by_prompt", (q) => q.eq("promptId", prompt._id))
          .collect();

        const runsWithDetails = await Promise.all(
          runs.map(async (run) => {
            const competitors = await ctx.db
              .query("competitorMentions")
              .withIndex("by_run", (q) => q.eq("promptRunId", run._id))
              .collect();

            const sources = await ctx.db
              .query("sourceCitations")
              .withIndex("by_run", (q) => q.eq("promptRunId", run._id))
              .collect();

            return { ...run, competitors, sources };
          })
        );

        return { ...prompt, runs: runsWithDetails };
      })
    );

    const redditSuggestions = await ctx.db
      .query("redditSuggestions")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    return {
      report,
      company,
      prompts: promptsWithRuns,
      redditSuggestions,
      recommendations,
    };
  },
});

// Get all reports for a company
export const getCompanyReports = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();
  },
});

// Get competitor stats for a report
export const getCompetitorStats = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const mentions = await ctx.db
      .query("competitorMentions")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    // Aggregate by competitor name
    const stats: Record<string, {
      totalMentions: number;
      ranks: number[];
      averageRank: number;
    }> = {};

    for (const mention of mentions) {
      if (!stats[mention.competitorName]) {
        stats[mention.competitorName] = {
          totalMentions: 0,
          ranks: [],
          averageRank: 0,
        };
      }
      stats[mention.competitorName].totalMentions++;
      stats[mention.competitorName].ranks.push(mention.rank);
    }

    // Calculate average ranks
    Object.keys(stats).forEach((competitor) => {
      const ranks = stats[competitor].ranks;
      stats[competitor].averageRank =
        ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
    });

    return stats;
  },
});

// Get top sources for a report
export const getTopSources = query({
  args: {
    reportId: v.id("reports"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("sourceCitations")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    // Aggregate by domain
    const domainCounts: Record<string, number> = {};
    for (const source of sources) {
      domainCounts[source.sourceDomain] =
        (domainCounts[source.sourceDomain] || 0) + 1;
    }

    return Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, args.limit || 15)
      .map(([domain, count]) => ({ domain, count }));
  },
});

// Get report by message ID (for email agent)
export const getReportByMessageId = query({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_message_id", (q) => q.eq("messageId", args.messageId))
      .first();
  },
});
```

---

## Phase 3: Create Convex Service Wrapper

Create a new service to abstract Convex operations from your application logic.

### 3.1 Create `src/services/convex.ts`

```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type {
  BusinessInfo,
  CustomerPrompt,
  SingleRunResult,
  ChatGPTResponse,
  RedditSuggestion,
  Recommendation,
  VisibilityAnalysis,
} from "../types";

export class ConvexService {
  private client: ConvexHttpClient;

  constructor() {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      throw new Error("CONVEX_URL environment variable not set");
    }
    this.client = new ConvexHttpClient(convexUrl);
  }

  // Company operations
  async upsertCompany(businessInfo: BusinessInfo): Promise<Id<"companies">> {
    return await this.client.mutation(api.mutations.upsertCompany, {
      name: businessInfo.businessName,
      description: businessInfo.productsServices,
      url: businessInfo.website,
      industry: businessInfo.industry,
      productsServices: businessInfo.productsServices,
      targetCustomers: businessInfo.targetCustomers,
      location: businessInfo.location,
      additionalContext: businessInfo.additionalContext,
    });
  }

  // Report operations
  async createReport(
    companyId: Id<"companies">,
    totalPrompts: number,
    runsPerPrompt: number,
    messageId?: string,
    emailFrom?: string
  ): Promise<Id<"reports">> {
    return await this.client.mutation(api.mutations.createReport, {
      companyId,
      totalPrompts,
      runsPerPrompt,
      messageId,
      emailFrom,
    });
  }

  async completeReport(
    reportId: Id<"reports">,
    summary: {
      gptVisibilityScore?: number;
      gptQueryCoverage?: number;
      gptMentionRate?: number;
      gptAverageRank?: number;
      perplexityVisibilityScore?: number;
      perplexityQueryCoverage?: number;
      perplexityMentionRate?: number;
      perplexityAverageRank?: number;
      visibilityLevel?: "High" | "Medium" | "Low";
      visibilityFactors?: string[];
      executionTimeMs: number;
    }
  ): Promise<void> {
    await this.client.mutation(api.mutations.completeReport, {
      reportId,
      ...summary,
    });
  }

  async failReport(reportId: Id<"reports">, errorMessage: string): Promise<void> {
    await this.client.mutation(api.mutations.failReport, {
      reportId,
      errorMessage,
    });
  }

  // Prompt operations
  async createPrompt(
    companyId: Id<"companies">,
    reportId: Id<"reports">,
    customerPrompt: CustomerPrompt,
    orderIndex: number
  ): Promise<Id<"prompts">> {
    return await this.client.mutation(api.mutations.createPrompt, {
      companyId,
      reportId,
      promptText: customerPrompt.prompt,
      category: customerPrompt.category,
      orderIndex,
    });
  }

  async updatePromptResults(
    promptId: Id<"prompts">,
    aiService: "gpt" | "perplexity",
    results: ChatGPTResponse
  ): Promise<void> {
    await this.client.mutation(api.mutations.updatePromptResults, {
      promptId,
      aiService,
      businessMentioned: results.businessMentioned,
      mentionProbability: results.mentionProbability,
      averageRank: results.averageRank,
      totalSources: results.allSources.length,
    });
  }

  // Prompt run operations
  async createPromptRun(
    companyId: Id<"companies">,
    reportId: Id<"reports">,
    promptId: Id<"prompts">,
    aiService: "gpt" | "perplexity",
    run: SingleRunResult,
    runNumber: number
  ): Promise<Id<"promptRuns">> {
    return await this.client.mutation(api.mutations.createPromptRun, {
      companyId,
      reportId,
      promptId,
      aiService,
      runNumber,
      responseText: run.response,
      businessMentioned: run.businessMentioned,
      rank: run.rank,
      mentionContext: run.mentionContext,
      executionTimeMs: 0, // You may want to track this
      tokensUsed: undefined,
    });
  }

  // Competitor operations
  async createCompetitorMention(
    companyId: Id<"companies">,
    reportId: Id<"reports">,
    promptId: Id<"prompts">,
    promptRunId: Id<"promptRuns">,
    competitor: { name: string; rank: number },
    aiService: "gpt" | "perplexity"
  ): Promise<void> {
    await this.client.mutation(api.mutations.createCompetitorMention, {
      companyId,
      reportId,
      promptId,
      promptRunId,
      competitorName: competitor.name,
      rank: competitor.rank,
      aiService,
    });
  }

  // Source operations
  async createSourceCitation(
    companyId: Id<"companies">,
    reportId: Id<"reports">,
    promptRunId: Id<"promptRuns">,
    sourceUrl: string,
    aiService: "gpt" | "perplexity",
    mentionedOurCompany: boolean,
    mentionedCompetitors: string[]
  ): Promise<void> {
    const url = new URL(sourceUrl);
    const domain = url.hostname.replace(/^www\./, "");

    await this.client.mutation(api.mutations.createSourceCitation, {
      companyId,
      reportId,
      promptRunId,
      sourceUrl,
      sourceDomain: domain,
      aiService,
      mentionedOurCompany,
      mentionedCompetitors,
    });
  }

  // Reddit operations
  async createRedditSuggestion(
    companyId: Id<"companies">,
    reportId: Id<"reports">,
    suggestion: RedditSuggestion
  ): Promise<void> {
    await this.client.mutation(api.mutations.createRedditSuggestion, {
      companyId,
      reportId,
      redditUrl: suggestion.redditUrl,
      postTitle: suggestion.postTitle,
      postContent: suggestion.postContent,
      suggestedComment: suggestion.suggestedComment,
    });
  }

  // Recommendation operations
  async createRecommendation(
    companyId: Id<"companies">,
    reportId: Id<"reports">,
    recommendation: Recommendation,
    orderIndex: number
  ): Promise<void> {
    await this.client.mutation(api.mutations.createRecommendation, {
      companyId,
      reportId,
      title: recommendation.title,
      description: recommendation.description,
      priority: recommendation.priority as "High" | "Medium" | "Low",
      category: recommendation.category,
      orderIndex,
    });
  }

  // Query operations
  async getFullReport(reportId: Id<"reports">) {
    return await this.client.query(api.queries.getFullReport, { reportId });
  }

  async getCompanyByUrl(url: string) {
    return await this.client.query(api.queries.getCompanyByUrl, { url });
  }

  async getReportByMessageId(messageId: string) {
    return await this.client.query(api.queries.getReportByMessageId, { messageId });
  }
}
```

---

## Phase 4: Integration into Application

### 4.1 Update `src/dev.ts`

Add Convex saving after report generation:

**Location: After line 240 (after `saveDebugLog` calls)**

```typescript
// ... existing code ...
import { ConvexService } from "./services/convex";

async function main() {
  // ... existing business extraction and report generation ...

  // Save to files (existing)
  await saveDebugLog(report, customerPrompts, chatGPTResults);
  await saveDebugLogText(report, customerPrompts, chatGPTResults);

  // NEW: Save to Convex
  try {
    console.log("\n💾 Saving report to Convex...");
    const convex = new ConvexService();

    const reportId = await saveReportToConvex(
      convex,
      businessInfo,
      customerPrompts,
      chatGPTResults,
      visibilityAnalysis,
      redditSuggestions,
      recommendations,
      startTime
    );

    console.log(`✅ Report saved to Convex: ${reportId}`);
  } catch (error) {
    console.error("❌ Error saving to Convex:", error);
    // Don't fail the entire process if Convex fails
  }

  // ... rest of existing code ...
}
```

### 4.2 Update `src/agent.ts`

Add Convex saving in the email agent:

**Location: After line 240 (after `saveDebugLog` calls in `processMessageById`)**

```typescript
// ... existing code ...
import { ConvexService } from "./services/convex";

async function processMessageById(messageId: string) {
  // ... existing business extraction and report generation ...

  // Save to files (existing)
  await saveDebugLog(report, customerPrompts, chatGPTResults);
  await saveDebugLogText(report, customerPrompts, chatGPTResults);

  // NEW: Save to Convex with message context
  try {
    console.log("\n💾 Saving report to Convex...");
    const convex = new ConvexService();

    const reportId = await saveReportToConvex(
      convex,
      businessInfo,
      customerPrompts,
      chatGPTResults,
      visibilityAnalysis,
      redditSuggestions,
      recommendations,
      startTime,
      messageId,
      message.from
    );

    console.log(`✅ Report saved to Convex: ${reportId}`);
  } catch (error) {
    console.error("❌ Error saving to Convex:", error);
    // Don't fail the entire process if Convex fails
  }

  // ... rest of existing code ...
}
```

### 4.3 Create Helper Function `src/utils/convexSaver.ts`

Create a new utility to handle the complex saving logic:

```typescript
import type { ConvexService } from "../services/convex";
import type { Id } from "../../convex/_generated/dataModel";
import type {
  BusinessInfo,
  CustomerPrompt,
  ChatGPTResponse,
  VisibilityAnalysis,
  RedditSuggestion,
  Recommendation,
} from "../types";

export async function saveReportToConvex(
  convex: ConvexService,
  businessInfo: BusinessInfo,
  customerPrompts: CustomerPrompt[],
  chatGPTResults: ChatGPTResponse[],
  visibilityAnalysis: VisibilityAnalysis,
  redditSuggestions: RedditSuggestion[],
  recommendations: Recommendation[],
  startTime: number,
  messageId?: string,
  emailFrom?: string
): Promise<Id<"reports">> {
  // Step 1: Upsert company
  const companyId = await convex.upsertCompany(businessInfo);

  // Step 2: Create report
  const reportId = await convex.createReport(
    companyId,
    customerPrompts.length,
    4, // runsPerPrompt
    messageId,
    emailFrom
  );

  try {
    // Step 3: Save prompts and their runs
    for (let i = 0; i < customerPrompts.length; i++) {
      const customerPrompt = customerPrompts[i];
      const results = chatGPTResults[i];

      // Create prompt
      const promptId = await convex.createPrompt(
        companyId,
        reportId,
        customerPrompt,
        i
      );

      // Save each run
      for (let runIndex = 0; runIndex < results.runs.length; runIndex++) {
        const run = results.runs[runIndex];

        // Create prompt run
        const promptRunId = await convex.createPromptRun(
          companyId,
          reportId,
          promptId,
          "gpt",
          run,
          runIndex + 1
        );

        // Save competitors from this run
        for (const competitor of run.competitors) {
          await convex.createCompetitorMention(
            companyId,
            reportId,
            promptId,
            promptRunId,
            competitor,
            "gpt"
          );
        }

        // Save sources from this run
        for (const source of run.sources) {
          await convex.createSourceCitation(
            companyId,
            reportId,
            promptRunId,
            source,
            "gpt",
            run.businessMentioned,
            run.competitors.map((c) => c.name)
          );
        }
      }

      // Update prompt with aggregated results
      await convex.updatePromptResults(promptId, "gpt", results);
    }

    // Step 4: Save Reddit suggestions
    for (const suggestion of redditSuggestions) {
      await convex.createRedditSuggestion(companyId, reportId, suggestion);
    }

    // Step 5: Save recommendations
    for (let i = 0; i < recommendations.length; i++) {
      await convex.createRecommendation(companyId, reportId, recommendations[i], i);
    }

    // Step 6: Calculate summary statistics
    const totalRuns = chatGPTResults.reduce((sum, r) => sum + r.runs.length, 0);
    const mentionedRuns = chatGPTResults.reduce(
      (sum, r) => sum + r.runs.filter((run) => run.businessMentioned).length,
      0
    );
    const mentionRate = (mentionedRuns / totalRuns) * 100;

    const promptsCovered = chatGPTResults.filter((r) => r.businessMentioned).length;
    const queryCoverage = (promptsCovered / chatGPTResults.length) * 100;

    const ranksWhenMentioned = chatGPTResults.flatMap((r) =>
      r.runs.filter((run) => run.rank).map((run) => run.rank!)
    );
    const averageRank =
      ranksWhenMentioned.length > 0
        ? ranksWhenMentioned.reduce((sum, rank) => sum + rank, 0) /
          ranksWhenMentioned.length
        : undefined;

    // Simple visibility score: (queryCoverage + mentionRate) / 2
    const visibilityScore = (queryCoverage + mentionRate) / 2;

    // Step 7: Complete report
    const executionTimeMs = Date.now() - startTime;
    await convex.completeReport(reportId, {
      gptVisibilityScore: Math.round(visibilityScore),
      gptQueryCoverage: Math.round(queryCoverage),
      gptMentionRate: Math.round(mentionRate),
      gptAverageRank: averageRank,
      visibilityLevel: visibilityAnalysis.level,
      visibilityFactors: visibilityAnalysis.factors,
      executionTimeMs,
    });

    return reportId;
  } catch (error) {
    // If anything fails, mark report as failed
    await convex.failReport(reportId, String(error));
    throw error;
  }
}
```

### 4.4 Update Environment Variables

Add to `.env.local`:

```bash
CONVEX_URL=https://your-convex-url.convex.cloud
```

---

## Phase 5: Testing & Validation

### 5.1 Test with Dev CLI

```bash
npm run dev
# Enter a business URL and verify:
# 1. Files are still generated (backwards compatibility)
# 2. Convex save succeeds
# 3. Check Convex dashboard to see data
```

### 5.2 Test with Email Agent

```bash
npm run dev-agent
# Send test email and verify:
# 1. Report generates correctly
# 2. Data is saved to Convex with messageId
# 3. Can query report by messageId
```

### 5.3 Verify Data Integrity

Create a test script `scripts/verifyConvex.ts`:

```typescript
import { ConvexService } from "../src/services/convex";

async function verify() {
  const convex = new ConvexService();

  // Test: Get company by URL
  const company = await convex.getCompanyByUrl("https://example.com");
  console.log("Company:", company);

  // Test: Get full report
  if (company) {
    const report = await convex.getFullReport(company._id);
    console.log("Full report:", JSON.stringify(report, null, 2));
  }
}

verify();
```

---

## Phase 6: Frontend Integration (Future)

### 6.1 Next.js Dashboard Setup

```bash
npx create-next-app@latest visibility-dashboard
cd visibility-dashboard
npm install convex
npx convex dev
```

### 6.2 Key Pages to Build

1. **Dashboard** (`/`)
   - List all companies
   - Show latest report summary for each
   - Search/filter by name, industry, date

2. **Company View** (`/company/[id]`)
   - Company details
   - All reports timeline
   - Trend charts (visibility over time)

3. **Report View** (`/report/[id]`)
   - Full report with interactive charts
   - Query-by-query breakdown
   - Competitor comparison
   - Source analysis
   - Reddit suggestions
   - Recommendations

4. **Comparison View** (`/compare`)
   - Compare multiple reports
   - Side-by-side metrics
   - Historical trends

### 6.3 Key Components

- `ReportCard` - Summary card for dashboard
- `VisibilityChart` - Line chart showing trends
- `CompetitorTable` - Sortable competitor rankings
- `SourceDistribution` - Pie/bar chart of sources
- `QueryBreakdown` - Accordion with run details
- `RedditSection` - Reddit suggestions with copy buttons
- `RecommendationsList` - Prioritized action items

---

## Phase 7: Advanced Features (Optional)

### 7.1 Real-Time Progress Updates

Use Convex's real-time subscriptions to stream progress:

```typescript
// In report generation
await convex.updateReportProgress(reportId, {
  currentStep: "Generating prompts",
  progress: 25,
});

// In frontend
const report = useQuery(api.queries.getFullReport, { reportId });
// Automatically updates as backend saves
```

### 7.2 Scheduled Reports

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.weekly(
  "weekly-visibility-reports",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.reports.generateScheduledReports
);

export default crons;
```

### 7.3 Comparison & Trend Analysis

```typescript
// convex/queries.ts
export const getVisibilityTrend = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(12); // Last 12 reports

    return reports.map(r => ({
      date: r.generatedDate,
      visibilityScore: r.gptVisibilityScore,
      mentionRate: r.gptMentionRate,
      queryCoverage: r.gptQueryCoverage,
    }));
  },
});
```

---

## Summary: Key Changes

### Files to Create
1. `convex/schema.ts` - Database schema
2. `convex/mutations.ts` - Data modification functions
3. `convex/queries.ts` - Data retrieval functions
4. `src/services/convex.ts` - Convex client wrapper
5. `src/utils/convexSaver.ts` - Save logic helper

### Files to Modify
1. `src/dev.ts` - Add Convex save after file generation
2. `src/agent.ts` - Add Convex save with message context
3. `.env.local` - Add `CONVEX_URL`

### Dependencies to Add
```json
{
  "dependencies": {
    "convex": "^1.17.0"
  }
}
```

### Benefits Achieved
- ✅ **Queryable history** - Filter reports by date, business, metrics
- ✅ **Real-time updates** - Stream progress to users (future)
- ✅ **Trend analysis** - Track visibility changes over time
- ✅ **Shareable reports** - Multiple users can access same data
- ✅ **Advanced analytics** - Aggregate metrics across reports
- ✅ **Backwards compatible** - Files still generated as backup

---

## Migration Strategy

### Approach: Dual-Write (Recommended)

1. **Phase 1**: Add Convex saving alongside file saving
   - Both systems run in parallel
   - Files remain primary for immediate use
   - Convex builds up historical data

2. **Phase 2**: Build frontend consuming Convex
   - Users can view reports in web UI
   - Files still generated for email sending

3. **Phase 3**: Make Convex primary (optional)
   - Generate HTML/PDF from Convex data on-demand
   - Phase out file generation except for exports

### Rollback Plan

If Convex integration has issues:
1. Files continue working as before
2. Wrap Convex calls in try-catch
3. Log errors but don't block report generation
4. Can disable Convex with env var: `ENABLE_CONVEX=false`

---

## Next Steps

1. **Start Phase 1**: Set up Convex and define schema
2. **Implement mutations/queries**: Create Convex functions
3. **Create ConvexService**: Abstract Convex operations
4. **Integrate into dev.ts**: Add dual-write support
5. **Test thoroughly**: Verify data integrity
6. **Deploy**: Push to production with Convex enabled

This implementation preserves your existing file-based system while adding powerful database capabilities for future growth.
