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
