"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.failReport = exports.completeReport = exports.createRecommendation = exports.createRedditSuggestion = exports.createSourceCitation = exports.createCompetitorMention = exports.createPromptRun = exports.updatePromptResults = exports.createPrompt = exports.createReport = exports.upsertCompany = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Create or get company by URL
exports.upsertCompany = (0, server_1.mutation)({
    args: {
        name: values_1.v.string(),
        description: values_1.v.string(),
        url: values_1.v.string(),
        industry: values_1.v.string(),
        productsServices: values_1.v.string(),
        targetCustomers: values_1.v.string(),
        location: values_1.v.optional(values_1.v.string()),
        additionalContext: values_1.v.optional(values_1.v.string()),
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
exports.createReport = (0, server_1.mutation)({
    args: {
        companyId: values_1.v.id("companies"),
        totalPrompts: values_1.v.number(),
        runsPerPrompt: values_1.v.number(),
        messageId: values_1.v.optional(values_1.v.string()),
        emailFrom: values_1.v.optional(values_1.v.string()),
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
exports.createPrompt = (0, server_1.mutation)({
    args: {
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        promptText: values_1.v.string(),
        category: values_1.v.string(),
        orderIndex: values_1.v.number(),
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
exports.updatePromptResults = (0, server_1.mutation)({
    args: {
        promptId: values_1.v.id("prompts"),
        aiService: values_1.v.union(values_1.v.literal("gpt"), values_1.v.literal("perplexity")),
        businessMentioned: values_1.v.boolean(),
        mentionProbability: values_1.v.number(),
        averageRank: values_1.v.optional(values_1.v.number()),
        totalSources: values_1.v.number(),
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
exports.createPromptRun = (0, server_1.mutation)({
    args: {
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        promptId: values_1.v.id("prompts"),
        aiService: values_1.v.union(values_1.v.literal("gpt"), values_1.v.literal("perplexity")),
        runNumber: values_1.v.number(),
        responseText: values_1.v.string(),
        businessMentioned: values_1.v.boolean(),
        rank: values_1.v.optional(values_1.v.number()),
        mentionContext: values_1.v.optional(values_1.v.string()),
        executionTimeMs: values_1.v.number(),
        tokensUsed: values_1.v.optional(values_1.v.number()),
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
exports.createCompetitorMention = (0, server_1.mutation)({
    args: {
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        promptId: values_1.v.id("prompts"),
        promptRunId: values_1.v.id("promptRuns"),
        competitorName: values_1.v.string(),
        rank: values_1.v.number(),
        sourceUrl: values_1.v.optional(values_1.v.string()),
        mentionContext: values_1.v.optional(values_1.v.string()),
        aiService: values_1.v.union(values_1.v.literal("gpt"), values_1.v.literal("perplexity")),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("competitorMentions", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
// Create source citation
exports.createSourceCitation = (0, server_1.mutation)({
    args: {
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        promptRunId: values_1.v.id("promptRuns"),
        sourceUrl: values_1.v.string(),
        sourceDomain: values_1.v.string(),
        sourceTitle: values_1.v.optional(values_1.v.string()),
        aiService: values_1.v.union(values_1.v.literal("gpt"), values_1.v.literal("perplexity")),
        mentionedOurCompany: values_1.v.boolean(),
        mentionedCompetitors: values_1.v.array(values_1.v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("sourceCitations", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
// Create Reddit suggestion
exports.createRedditSuggestion = (0, server_1.mutation)({
    args: {
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        redditUrl: values_1.v.string(),
        postTitle: values_1.v.string(),
        postContent: values_1.v.string(),
        suggestedComment: values_1.v.string(),
        relevanceScore: values_1.v.optional(values_1.v.number()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("redditSuggestions", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
// Create recommendation
exports.createRecommendation = (0, server_1.mutation)({
    args: {
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        title: values_1.v.string(),
        description: values_1.v.string(),
        priority: values_1.v.union(values_1.v.literal("High"), values_1.v.literal("Medium"), values_1.v.literal("Low")),
        category: values_1.v.string(),
        orderIndex: values_1.v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("recommendations", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
// Update report with final results
exports.completeReport = (0, server_1.mutation)({
    args: {
        reportId: values_1.v.id("reports"),
        gptVisibilityScore: values_1.v.optional(values_1.v.number()),
        gptQueryCoverage: values_1.v.optional(values_1.v.number()),
        gptMentionRate: values_1.v.optional(values_1.v.number()),
        gptAverageRank: values_1.v.optional(values_1.v.number()),
        perplexityVisibilityScore: values_1.v.optional(values_1.v.number()),
        perplexityQueryCoverage: values_1.v.optional(values_1.v.number()),
        perplexityMentionRate: values_1.v.optional(values_1.v.number()),
        perplexityAverageRank: values_1.v.optional(values_1.v.number()),
        visibilityLevel: values_1.v.optional(values_1.v.union(values_1.v.literal("High"), values_1.v.literal("Medium"), values_1.v.literal("Low"))),
        visibilityFactors: values_1.v.optional(values_1.v.array(values_1.v.string())),
        executionTimeMs: values_1.v.number(),
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
exports.failReport = (0, server_1.mutation)({
    args: {
        reportId: values_1.v.id("reports"),
        errorMessage: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.reportId, {
            status: "failed",
            errorMessage: args.errorMessage,
            updatedAt: Date.now(),
        });
    },
});
