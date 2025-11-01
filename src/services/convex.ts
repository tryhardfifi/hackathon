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
      url: businessInfo.website || "",
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
      averageRank: results.rank ?? undefined,
      totalSources: results.sources.length,
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
      responseText: "", // Not tracked in SingleRunResult
      businessMentioned: run.businessMentioned,
      rank: run.rank ?? undefined,
      mentionContext: undefined,
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
    competitor: { name: string; rank: number; sourceUrl: string | null },
    aiService: "gpt" | "perplexity"
  ): Promise<void> {
    await this.client.mutation(api.mutations.createCompetitorMention, {
      companyId,
      reportId,
      promptId,
      promptRunId,
      competitorName: competitor.name,
      rank: competitor.rank,
      sourceUrl: competitor.sourceUrl ?? undefined,
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
    try {
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
    } catch (error) {
      // Skip invalid URLs
      console.warn(`Invalid source URL: ${sourceUrl}`);
    }
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
      redditUrl: suggestion.url,
      postTitle: suggestion.title,
      postContent: "", // Not in current RedditSuggestion type
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
    // Map priority number to string
    let priority: "High" | "Medium" | "Low";
    if (recommendation.priority >= 8) {
      priority = "High";
    } else if (recommendation.priority >= 5) {
      priority = "Medium";
    } else {
      priority = "Low";
    }

    await this.client.mutation(api.mutations.createRecommendation, {
      companyId,
      reportId,
      title: recommendation.title,
      description: recommendation.description,
      priority,
      category: "general", // Default category
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
