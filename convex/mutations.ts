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
