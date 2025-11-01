import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Companies Table - Main entity
  companies: defineTable({
    name: v.string(),
    description: v.string(),
    url: v.string(),
    industry: v.string(),
    createdAt: v.number(),
  }),

  // 2. Competitors Table - Tracked competitors for each company
  competitors: defineTable({
    companyId: v.id("companies"),
    competitorName: v.string(),
    competitorUrl: v.union(v.string(), v.null()),
    isActive: v.boolean(),
    addedDate: v.number(),
  }).index("by_company", ["companyId"]),

  // 3. Reports Table - Reports belong to a company
  reports: defineTable({
    companyId: v.id("companies"),
    reportDate: v.number(),
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    totalPrompts: v.number(),
    runsPerPrompt: v.number(),
    overallVisibilityScore: v.number(),
    createdAt: v.number(),
  }).index("by_company", ["companyId"]),

  // 4. Prompts Table - Prompts belong to a report
  prompts: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptText: v.string(),
    promptType: v.string(),
    category: v.string(),
    orderIndex: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_report", ["reportId"]),

  // 5. Prompt Runs Table - Each prompt is run 4 times
  promptRuns: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptId: v.id("prompts"),
    runNumber: v.number(),
    gptResponse: v.string(),
    targetCompanyMentioned: v.boolean(),
    mentionContext: v.union(v.string(), v.null()),
    responseTokens: v.number(),
    executedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_report", ["reportId"])
    .index("by_prompt", ["promptId"]),

  // 6. Competitor Mentions Table - Tracks competitor appearances
  competitorMentions: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    promptId: v.id("prompts"),
    promptRunId: v.id("promptRuns"),
    competitorId: v.union(v.id("competitors"), v.null()),
    competitorName: v.string(),
    mentionCount: v.number(),
    mentionContext: v.string(),
    positionInResponse: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_report", ["reportId"])
    .index("by_prompt_run", ["promptRunId"]),

  // 7. Source Citations Table - Sources cited in GPT responses
  sourceCitations: defineTable({
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
  })
    .index("by_company", ["companyId"])
    .index("by_report", ["reportId"])
    .index("by_prompt_run", ["promptRunId"]),

  // 8. Reddit Opportunities Table - Reddit threads for engagement
  redditOpportunities: defineTable({
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    subreddit: v.string(),
    postTitle: v.string(),
    postUrl: v.string(),
    postSnippet: v.string(),
    relevanceScore: v.number(),
    estimatedReach: v.number(),
    suggestedComment: v.string(),
    keywords: v.array(v.string()),
    postedDate: v.number(),
    opportunityType: v.union(
      v.literal("question"),
      v.literal("comparison"),
      v.literal("recommendation"),
      v.literal("complaint")
    ),
  })
    .index("by_company", ["companyId"])
    .index("by_report", ["reportId"]),
});
