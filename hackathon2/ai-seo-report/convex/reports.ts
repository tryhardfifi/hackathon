import { query } from "./_generated/server";
import { v } from "convex/values";

// Get a specific report with all related data
export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const company = await ctx.db.get(report.companyId);

    // Get all prompts for this report
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    // Get all prompt runs
    const promptRuns = await ctx.db
      .query("promptRuns")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    // Get all competitor mentions
    const competitorMentions = await ctx.db
      .query("competitorMentions")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    // Get all source citations
    const sourceCitations = await ctx.db
      .query("sourceCitations")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    // Get reddit opportunities
    const redditOpportunities = await ctx.db
      .query("redditOpportunities")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    // Get competitors
    const competitors = await ctx.db
      .query("competitors")
      .withIndex("by_company", (q) => q.eq("companyId", report.companyId))
      .collect();

    return {
      report,
      company,
      prompts,
      promptRuns,
      competitorMentions,
      sourceCitations,
      redditOpportunities,
      competitors,
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
      .collect();
  },
});

// Get latest report for a company
export const getLatestReport = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    if (reports.length === 0) return null;

    // Sort by reportDate descending
    reports.sort((a, b) => b.reportDate - a.reportDate);
    return reports[0];
  },
});
