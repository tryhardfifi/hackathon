import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createCompany = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    url: v.string(),
    industry: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("companies", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const createReport = mutation({
  args: {
    companyId: v.id("companies"),
    totalPrompts: v.number(),
    runsPerPrompt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      companyId: args.companyId,
      reportDate: Date.now(),
      status: "generating",
      totalPrompts: args.totalPrompts,
      runsPerPrompt: args.runsPerPrompt,
      overallVisibilityScore: 0,
      createdAt: Date.now(),
    });
  },
});

export const createPrompt = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptText: v.string(),
    promptType: v.string(),
    category: v.string(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("prompts", args);
  },
});

export const createPromptRun = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptId: v.id("prompts"),
    runNumber: v.number(),
    gptResponse: v.string(),
    targetCompanyMentioned: v.boolean(),
    mentionContext: v.union(v.string(), v.null()),
    responseTokens: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("promptRuns", {
      ...args,
      executedAt: Date.now(),
    });
  },
});

export const createCompetitorMention = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptId: v.id("prompts"),
    promptRunId: v.id("promptRuns"),
    competitorName: v.string(),
    mentionCount: v.number(),
    mentionContext: v.string(),
    positionInResponse: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("competitorMentions", {
      ...args,
      competitorId: null, // Could link to competitors table later
    });
  },
});

export const createSourceCitation = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptRunId: v.id("promptRuns"),
    sourceUrl: v.string(),
    sourceDomain: v.string(),
    sourceTitle: v.union(v.string(), v.null()),
    citationType: v.union(
      v.literal("direct_link"),
      v.literal("mentioned"),
      v.literal("referenced")
    ),
    relevanceScore: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sourceCitations", args);
  },
});

export const completeReport = mutation({
  args: {
    reportId: v.id("reports"),
    visibilityScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "completed",
      overallVisibilityScore: args.visibilityScore,
    });
  },
});

export const failReport = mutation({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "failed",
    });
  },
});
