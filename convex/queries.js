"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportByMessageId = exports.getTopSources = exports.getCompetitorStats = exports.getCompanyReports = exports.getFullReport = exports.getLatestReport = exports.getCompanyByUrl = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Get company by URL
exports.getCompanyByUrl = (0, server_1.query)({
    args: { url: values_1.v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("companies")
            .withIndex("by_url", (q) => q.eq("url", args.url))
            .first();
    },
});
// Get latest report for company
exports.getLatestReport = (0, server_1.query)({
    args: { companyId: values_1.v.id("companies") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("reports")
            .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
            .order("desc")
            .first();
    },
});
// Get full report with all related data
exports.getFullReport = (0, server_1.query)({
    args: { reportId: values_1.v.id("reports") },
    handler: async (ctx, args) => {
        const report = await ctx.db.get(args.reportId);
        if (!report)
            return null;
        const company = await ctx.db.get(report.companyId);
        const prompts = await ctx.db
            .query("prompts")
            .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
            .collect();
        const promptsWithRuns = await Promise.all(prompts.map(async (prompt) => {
            const runs = await ctx.db
                .query("promptRuns")
                .withIndex("by_prompt", (q) => q.eq("promptId", prompt._id))
                .collect();
            const runsWithDetails = await Promise.all(runs.map(async (run) => {
                const competitors = await ctx.db
                    .query("competitorMentions")
                    .withIndex("by_run", (q) => q.eq("promptRunId", run._id))
                    .collect();
                const sources = await ctx.db
                    .query("sourceCitations")
                    .withIndex("by_run", (q) => q.eq("promptRunId", run._id))
                    .collect();
                return { ...run, competitors, sources };
            }));
            return { ...prompt, runs: runsWithDetails };
        }));
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
exports.getCompanyReports = (0, server_1.query)({
    args: { companyId: values_1.v.id("companies") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("reports")
            .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
            .order("desc")
            .collect();
    },
});
// Get competitor stats for a report
exports.getCompetitorStats = (0, server_1.query)({
    args: { reportId: values_1.v.id("reports") },
    handler: async (ctx, args) => {
        const mentions = await ctx.db
            .query("competitorMentions")
            .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
            .collect();
        // Aggregate by competitor name
        const stats = {};
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
exports.getTopSources = (0, server_1.query)({
    args: {
        reportId: values_1.v.id("reports"),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: async (ctx, args) => {
        const sources = await ctx.db
            .query("sourceCitations")
            .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
            .collect();
        // Aggregate by domain
        const domainCounts = {};
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
exports.getReportByMessageId = (0, server_1.query)({
    args: { messageId: values_1.v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("reports")
            .withIndex("by_message_id", (q) => q.eq("messageId", args.messageId))
            .first();
    },
});
