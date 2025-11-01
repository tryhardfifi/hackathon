import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { OpenAIService } from "./lib/openai_service";
import { PerplexityService } from "./lib/perplexity_service";
import { BusinessInfo } from "./lib/types";

/**
 * Generate a new report for a company from a URL
 */
export const generateReportFromURL = action({
  args: {
    url: v.string(),
    promptCount: v.optional(v.number()),
    runsPerPrompt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { url, promptCount = 5, runsPerPrompt = 4 } = args;

    console.log(`🚀 Starting report generation for: ${url}`);

    try {
      // Phase 1: Extract business information
      console.log("📝 Phase 1: Extracting business information...");
      const businessInfo = await OpenAIService.extractBusinessInfoFromURL(url);
      console.log(`✓ Extracted info for: ${businessInfo.businessName}`);

      // Create company in database
      const companyId = await ctx.runMutation(api.reportMutations.createCompany, {
        name: businessInfo.businessName,
        description: businessInfo.productsServices || businessInfo.industry,
        url: businessInfo.website || url,
        industry: businessInfo.industry,
      });

      // Create report
      const reportId = await ctx.runMutation(api.reportMutations.createReport, {
        companyId,
        totalPrompts: promptCount,
        runsPerPrompt,
      });

      // Phase 2: Generate customer prompts
      console.log("💭 Phase 2: Generating customer prompts...");
      const customerPrompts = await OpenAIService.generateCustomerPrompts(
        businessInfo,
        promptCount
      );
      console.log(`✓ Generated ${customerPrompts.length} prompts`);

      // Store prompts
      const promptIds = await Promise.all(
        customerPrompts.map((prompt, idx) =>
          ctx.runMutation(api.reportMutations.createPrompt, {
            companyId,
            reportId,
            promptText: prompt.prompt,
            promptType: "customer_query",
            category: prompt.category,
            orderIndex: idx + 1,
          })
        )
      );

      // Phase 3: Analyze visibility
      console.log("🔍 Phase 3: Analyzing visibility...");
      const visibilityAnalysis = await OpenAIService.analyzeVisibility(businessInfo);
      console.log(`✓ Overall assessment: ${visibilityAnalysis.overallAssessment}`);

      // Phase 4: Run web searches (GPT + Perplexity in parallel)
      console.log("🌐 Phase 4: Running web searches...");

      // Initialize Perplexity if API key available
      const perplexityEnabled = !!process.env.PERPLEXITY_API_KEY;
      const perplexityService = perplexityEnabled
        ? new PerplexityService(process.env.PERPLEXITY_API_KEY!)
        : null;

      let totalMentions = 0;
      let totalRuns = 0;

      // Process each prompt
      for (let i = 0; i < customerPrompts.length; i++) {
        const prompt = customerPrompts[i];
        const promptId = promptIds[i];

        console.log(`\n📊 Processing prompt ${i + 1}/${customerPrompts.length}: "${prompt.prompt.substring(0, 60)}..."`);

        // Run GPT and Perplexity searches in parallel
        const searches = [
          OpenAIService.processCustomerPrompt(
            prompt.prompt,
            businessInfo.businessName,
            runsPerPrompt
          ),
        ];

        if (perplexityService) {
          searches.push(
            perplexityService.processCustomerPrompt(
              prompt.prompt,
              businessInfo.businessName,
              runsPerPrompt
            )
          );
        }

        const [gptResults, perplexityResults] = await Promise.all(searches);

        // Store GPT runs
        for (let runIdx = 0; runIdx < gptResults.runs.length; runIdx++) {
          const run = gptResults.runs[runIdx];

          const promptRunId = await ctx.runMutation(
            api.reportMutations.createPromptRun,
            {
              companyId,
              reportId,
              promptId,
              runNumber: runIdx + 1,
              gptResponse: run.rawResponse,
              targetCompanyMentioned: run.businessMentioned,
              mentionContext: run.businessMentioned
                ? `Rank: ${run.rank}`
                : null,
              responseTokens: Math.floor(run.rawResponse.length / 4),
            }
          );

          // Store competitor mentions
          for (const competitor of run.competitors) {
            await ctx.runMutation(api.reportMutations.createCompetitorMention, {
              companyId,
              reportId,
              promptId,
              promptRunId,
              competitorName: competitor.name,
              mentionCount: 1,
              mentionContext: `Rank: ${competitor.rank}`,
              positionInResponse: competitor.rank,
            });
          }

          // Store source citations
          for (const source of run.sources) {
            try {
              const domain = new URL(source).hostname;
              await ctx.runMutation(api.reportMutations.createSourceCitation, {
                companyId,
                reportId,
                promptRunId,
                sourceUrl: source,
                sourceDomain: domain,
                sourceTitle: null,
                citationType: "direct_link",
                relevanceScore: null,
              });
            } catch (e) {
              // Skip invalid URLs
            }
          }

          if (run.businessMentioned) totalMentions++;
          totalRuns++;
        }

        console.log(
          `  GPT: ${gptResults.mentionProbability.toFixed(0)}% mention rate`
        );
        if (perplexityResults) {
          console.log(
            `  Perplexity: ${perplexityResults.mentionProbability.toFixed(0)}% mention rate`
          );
        }
      }

      // Calculate visibility score
      const mentionRate = (totalMentions / totalRuns) * 100;
      const queryCoverage = 50; // Simplified
      const avgRank = 2; // Simplified
      const visibilityScore = Math.round(
        (queryCoverage / 100) * (mentionRate / 100) * (1 / avgRank) * 100
      );

      // Phase 5: Generate recommendations
      console.log("💡 Phase 5: Generating recommendations...");
      const recommendations = await OpenAIService.generateRecommendations(
        businessInfo,
        visibilityAnalysis
      );
      console.log(`✓ Generated ${recommendations.length} recommendations`);

      // Update report with results
      await ctx.runMutation(api.reportMutations.completeReport, {
        reportId,
        visibilityScore,
      });

      console.log("✅ Report generation complete!");

      return {
        reportId,
        companyId,
        visibilityScore,
        mentionRate,
        promptsProcessed: customerPrompts.length,
      };
    } catch (error) {
      console.error("❌ Report generation failed:", error);

      throw error;
    }
  },
});

/**
 * Generate a report from business name (simplified version)
 */
export const generateReportFromName = action({
  args: {
    businessName: v.string(),
    industry: v.string(),
    description: v.string(),
    promptCount: v.optional(v.number()),
    runsPerPrompt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Similar to generateReportFromURL but starts with manual business info
    const businessInfo: BusinessInfo = {
      businessName: args.businessName,
      industry: args.industry,
      productsServices: args.description,
      targetCustomers: "General consumers",
      location: "United States",
    };

    // Continue with similar flow...
    return { message: "Not fully implemented yet" };
  },
});
