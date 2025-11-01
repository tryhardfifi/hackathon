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
