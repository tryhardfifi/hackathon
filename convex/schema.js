"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("convex/server");
const values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    companies: (0, server_1.defineTable)({
        name: values_1.v.string(),
        description: values_1.v.string(),
        url: values_1.v.string(),
        industry: values_1.v.string(),
        productsServices: values_1.v.string(),
        targetCustomers: values_1.v.string(),
        location: values_1.v.optional(values_1.v.string()),
        additionalContext: values_1.v.optional(values_1.v.string()),
        createdAt: values_1.v.number(),
        updatedAt: values_1.v.number(),
    })
        .index("by_url", ["url"])
        .index("by_creation", ["createdAt"]),
    reports: (0, server_1.defineTable)({
        companyId: values_1.v.id("companies"),
        generatedDate: values_1.v.number(),
        status: values_1.v.union(values_1.v.literal("generating"), values_1.v.literal("completed"), values_1.v.literal("failed")),
        // Email context (if from email agent)
        messageId: values_1.v.optional(values_1.v.string()),
        emailFrom: values_1.v.optional(values_1.v.string()),
        // Configuration
        totalPrompts: values_1.v.number(),
        runsPerPrompt: values_1.v.number(),
        // GPT Results Summary
        gptVisibilityScore: values_1.v.optional(values_1.v.number()),
        gptQueryCoverage: values_1.v.optional(values_1.v.number()),
        gptMentionRate: values_1.v.optional(values_1.v.number()),
        gptAverageRank: values_1.v.optional(values_1.v.number()),
        // Perplexity Results Summary (future)
        perplexityVisibilityScore: values_1.v.optional(values_1.v.number()),
        perplexityQueryCoverage: values_1.v.optional(values_1.v.number()),
        perplexityMentionRate: values_1.v.optional(values_1.v.number()),
        perplexityAverageRank: values_1.v.optional(values_1.v.number()),
        // Visibility Analysis
        visibilityLevel: values_1.v.optional(values_1.v.union(values_1.v.literal("High"), values_1.v.literal("Medium"), values_1.v.literal("Low"))),
        visibilityFactors: values_1.v.optional(values_1.v.array(values_1.v.string())),
        // Metadata
        executionTimeMs: values_1.v.optional(values_1.v.number()),
        errorMessage: values_1.v.optional(values_1.v.string()),
        createdAt: values_1.v.number(),
        updatedAt: values_1.v.number(),
    })
        .index("by_company", ["companyId"])
        .index("by_date", ["companyId", "generatedDate"])
        .index("by_status", ["status"])
        .index("by_message_id", ["messageId"]),
    prompts: (0, server_1.defineTable)({
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        promptText: values_1.v.string(),
        category: values_1.v.string(),
        orderIndex: values_1.v.number(),
        // GPT Aggregated Results (from 4 runs)
        gptBusinessMentioned: values_1.v.boolean(),
        gptMentionProbability: values_1.v.number(),
        gptAverageRank: values_1.v.optional(values_1.v.number()),
        gptTotalSources: values_1.v.number(),
        // Perplexity Aggregated Results (future)
        perplexityBusinessMentioned: values_1.v.boolean(),
        perplexityMentionProbability: values_1.v.number(),
        perplexityAverageRank: values_1.v.optional(values_1.v.number()),
        perplexityTotalSources: values_1.v.number(),
        createdAt: values_1.v.number(),
    })
        .index("by_report", ["reportId"])
        .index("by_company", ["companyId"]),
    promptRuns: (0, server_1.defineTable)({
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        promptId: values_1.v.id("prompts"),
        aiService: values_1.v.union(values_1.v.literal("gpt"), values_1.v.literal("perplexity")),
        runNumber: values_1.v.number(), // 1-4
        // Search Result
        responseText: values_1.v.string(),
        businessMentioned: values_1.v.boolean(),
        rank: values_1.v.optional(values_1.v.number()),
        mentionContext: values_1.v.optional(values_1.v.string()),
        // Metadata
        executionTimeMs: values_1.v.number(),
        tokensUsed: values_1.v.optional(values_1.v.number()),
        createdAt: values_1.v.number(),
    })
        .index("by_prompt", ["promptId"])
        .index("by_report", ["reportId"])
        .index("by_service", ["aiService", "promptId"]),
    competitorMentions: (0, server_1.defineTable)({
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        promptId: values_1.v.id("prompts"),
        promptRunId: values_1.v.id("promptRuns"),
        competitorName: values_1.v.string(),
        rank: values_1.v.number(),
        sourceUrl: values_1.v.optional(values_1.v.string()),
        mentionContext: values_1.v.optional(values_1.v.string()),
        aiService: values_1.v.union(values_1.v.literal("gpt"), values_1.v.literal("perplexity")),
        createdAt: values_1.v.number(),
    })
        .index("by_run", ["promptRunId"])
        .index("by_prompt", ["promptId"])
        .index("by_report", ["reportId"])
        .index("by_competitor", ["reportId", "competitorName"]),
    sourceCitations: (0, server_1.defineTable)({
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        promptRunId: values_1.v.id("promptRuns"),
        sourceUrl: values_1.v.string(),
        sourceDomain: values_1.v.string(),
        sourceTitle: values_1.v.optional(values_1.v.string()),
        aiService: values_1.v.union(values_1.v.literal("gpt"), values_1.v.literal("perplexity")),
        // Analysis
        mentionedOurCompany: values_1.v.boolean(),
        mentionedCompetitors: values_1.v.array(values_1.v.string()),
        createdAt: values_1.v.number(),
    })
        .index("by_run", ["promptRunId"])
        .index("by_report", ["reportId"])
        .index("by_domain", ["reportId", "sourceDomain"])
        .index("by_service", ["reportId", "aiService"]),
    redditSuggestions: (0, server_1.defineTable)({
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        redditUrl: values_1.v.string(),
        postTitle: values_1.v.string(),
        postContent: values_1.v.string(),
        suggestedComment: values_1.v.string(),
        relevanceScore: values_1.v.optional(values_1.v.number()),
        createdAt: values_1.v.number(),
    })
        .index("by_report", ["reportId"])
        .index("by_company", ["companyId"]),
    recommendations: (0, server_1.defineTable)({
        companyId: values_1.v.id("companies"),
        reportId: values_1.v.id("reports"),
        title: values_1.v.string(),
        description: values_1.v.string(),
        priority: values_1.v.union(values_1.v.literal("High"), values_1.v.literal("Medium"), values_1.v.literal("Low")),
        category: values_1.v.string(),
        orderIndex: values_1.v.number(),
        createdAt: values_1.v.number(),
    })
        .index("by_report", ["reportId"])
        .index("by_company", ["companyId"]),
});
