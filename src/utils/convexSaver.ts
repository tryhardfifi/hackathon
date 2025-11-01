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
    const mentionRate = totalRuns > 0 ? (mentionedRuns / totalRuns) * 100 : 0;

    const promptsCovered = chatGPTResults.filter((r) => r.businessMentioned).length;
    const queryCoverage = chatGPTResults.length > 0
      ? (promptsCovered / chatGPTResults.length) * 100
      : 0;

    const ranksWhenMentioned = chatGPTResults.flatMap((r) =>
      r.runs.filter((run) => run.rank !== null).map((run) => run.rank!)
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
      visibilityLevel: visibilityAnalysis.overallAssessment,
      visibilityFactors: visibilityAnalysis.keyFactors,
      executionTimeMs,
    });

    return reportId;
  } catch (error) {
    // If anything fails, mark report as failed
    await convex.failReport(reportId, String(error));
    throw error;
  }
}
