import { Report, CustomerPrompt } from "../types";

/**
 * Generate HTML report
 */
export function generateHTMLReport(report: Report): string {
  const visibilityClass =
    report.visibilityAnalysis.overallAssessment.toLowerCase();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presence Report: ${escapeHTML(report.businessName)}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
    }
    .container {
      background-color: white;
      padding: 60px 40px;
    }
    .header {
      margin-bottom: 60px;
      border-bottom: 2px solid #000;
      padding-bottom: 30px;
    }
    .brand {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #000;
      margin-bottom: 8px;
    }
    .tagline {
      font-size: 13px;
      color: #666;
      font-weight: 400;
      letter-spacing: 0.3px;
      text-transform: lowercase;
    }
    h1 {
      color: #000;
      font-size: 24px;
      font-weight: 600;
      margin-top: 40px;
      margin-bottom: 10px;
      letter-spacing: -0.3px;
    }
    .meta {
      color: #666;
      font-size: 13px;
      margin-bottom: 40px;
      font-weight: 400;
    }
    h2 {
      color: #000;
      margin-top: 40px;
      margin-bottom: 20px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.3px;
    }
    h3 {
      color: #000;
      font-size: 16px;
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 10px;
      letter-spacing: -0.2px;
    }
    .category {
      margin-bottom: 25px;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
      line-height: 1.5;
    }
    .assessment {
      display: inline-block;
      padding: 8px 16px;
      border: 1px solid #000;
      font-weight: 500;
      margin: 10px 0;
      font-size: 13px;
    }
    .assessment.high {
      background-color: #000;
      color: #fff;
    }
    .assessment.medium {
      background-color: #fff;
      color: #000;
      border: 1px solid #000;
    }
    .assessment.low {
      background-color: #f5f5f5;
      color: #000;
      border: 1px solid #ccc;
    }
    .section {
      background-color: #fafafa;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid #e0e0e0;
    }
    .recommendation {
      background-color: #fff;
      padding: 20px;
      margin: 15px 0;
      border-left: 3px solid #000;
    }
    .recommendation h3 {
      margin-top: 0;
      color: #000;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #000;
      font-size: 11px;
      color: #666;
    }
    .priority-badge {
      display: inline-block;
      background-color: #000;
      color: white;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 600;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .response-card {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      padding: 25px;
      margin: 15px 0;
    }
    .response-card.mentioned {
      border-left: 3px solid #000;
    }
    .response-card.not-mentioned {
      border-left: 3px solid #ccc;
    }
    .response-prompt {
      font-weight: 500;
      color: #000;
      margin-bottom: 12px;
      font-size: 14px;
      line-height: 1.5;
    }
    .response-status {
      display: inline-block;
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .response-status.mentioned {
      background-color: #000;
      color: #fff;
    }
    .response-status.not-mentioned {
      background-color: #fff;
      color: #000;
      border: 1px solid #000;
    }
    .probability-badge {
      display: inline-block;
      background: #000;
      color: white;
      padding: 5px 12px;
      font-weight: 600;
      font-size: 11px;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .runs-details {
      margin-top: 15px;
      padding: 15px;
      background-color: #fafafa;
      border: 1px solid #e0e0e0;
      font-size: 12px;
    }
    .run-item {
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .run-item:last-child {
      border-bottom: none;
    }
    .run-item:first-child {
      padding-top: 0;
    }
    .run-label {
      font-weight: 600;
      color: #000;
      display: inline-block;
      min-width: 70px;
      font-size: 11px;
    }
    .run-result {
      display: inline-block;
      margin-left: 10px;
      font-size: 11px;
    }
    .run-result.mentioned {
      color: #000;
      font-weight: 600;
    }
    .run-result.not-mentioned {
      color: #666;
    }
    .rank-badge {
      display: inline-block;
      background: #000;
      color: white;
      padding: 5px 12px;
      font-weight: 600;
      font-size: 11px;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sources {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
    }
    .sources-label {
      font-size: 10px;
      color: #000;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .source-link {
      display: inline-block;
      color: #000;
      text-decoration: underline;
      font-size: 11px;
      margin: 4px 8px 4px 0;
      padding: 4px 0;
      transition: opacity 0.2s;
    }
    .source-link:hover {
      opacity: 0.6;
    }
    .stats-summary {
      width: 100%;
      margin: 40px 0;
      border-collapse: separate;
      border-spacing: 10px;
    }
    .stat-item {
      background-color: #fff;
      border: 2px solid #000;
      color: #000;
      padding: 25px 20px;
      text-align: center;
      width: 25%;
    }
    .stat-emoji {
      display: none;
    }
    .stat-value {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: -1px;
    }
    .stat-label {
      font-size: 10px;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
    }
    .source-chart {
      margin: 40px 0;
      background-color: #ffffff;
      border: 2px solid #000;
      padding: 30px;
    }
    .source-chart h2 {
      margin-top: 0;
      margin-bottom: 25px;
      color: #000;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.3px;
    }
    .source-chart-row {
      margin-bottom: 12px;
      display: table;
      width: 100%;
    }
    .source-chart-label {
      display: table-cell;
      vertical-align: middle;
      width: 40%;
      font-size: 11px;
      color: #000;
      padding-right: 15px;
      word-break: break-word;
      font-weight: 500;
    }
    .source-chart-bar-container {
      display: table-cell;
      vertical-align: middle;
      width: 50%;
      padding-right: 10px;
    }
    .source-chart-bar-container-inner {
      width: 100%;
      background-color: #f5f5f5;
      height: 20px;
      position: relative;
    }
    .source-chart-bar {
      height: 20px;
      background-color: #000;
      min-width: 2px;
    }
    .source-chart-value {
      display: table-cell;
      vertical-align: middle;
      width: 10%;
      text-align: right;
      font-size: 12px;
      font-weight: 700;
      color: #000;
    }
    .source-chart-empty {
      color: #666;
      font-style: italic;
      padding: 20px;
      text-align: center;
      font-size: 13px;
    }
    .pie-chart-container {
      margin: 40px 0;
      background-color: #ffffff;
      border: 2px solid #000;
      padding: 30px;
    }
    .pie-chart-container h2 {
      margin-top: 0;
      margin-bottom: 25px;
      color: #000;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.3px;
    }
    .pie-chart-visual {
      display: table;
      width: 100%;
      margin: 20px 0;
      height: 120px;
    }
    .pie-segment {
      display: table-cell;
      vertical-align: bottom;
      text-align: center;
      padding: 5px;
      width: 12.5%;
      height: 120px;
    }
    .pie-segment-box-container {
      height: 100px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 5px;
      position: relative;
    }
    .pie-segment-box {
      width: 35px;
      margin: 0 auto;
      min-height: 10px;
      position: relative;
      bottom: 0;
    }
    .pie-segment-label {
      font-size: 10px;
      color: #000;
      word-break: break-word;
      max-width: 80px;
      margin: 0 auto;
      font-weight: 500;
    }
    .pie-segment-value {
      font-size: 11px;
      font-weight: 700;
      color: #000;
      margin-top: 3px;
    }
    .pie-legend {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 2px solid #000;
    }
    .pie-legend-item {
      display: table;
      width: 100%;
      margin-bottom: 10px;
      padding: 10px;
      background-color: #fafafa;
      border: 1px solid #e0e0e0;
    }
    .pie-legend-color {
      display: table-cell;
      width: 16px;
      height: 16px;
      vertical-align: middle;
      border: 1px solid #000;
    }
    .pie-legend-label {
      display: table-cell;
      vertical-align: middle;
      padding-left: 12px;
      font-size: 11px;
      color: #000;
      font-weight: 500;
    }
    .pie-legend-value {
      display: table-cell;
      vertical-align: middle;
      text-align: right;
      font-size: 12px;
      font-weight: 700;
      color: #000;
    }
    .pie-legend-percentage {
      display: table-cell;
      vertical-align: middle;
      text-align: right;
      padding-left: 10px;
      font-size: 11px;
      color: #666;
      width: 60px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Presence</div>
      <div class="tagline">dominate AI recommendations</div>
    </div>

    <h1>${escapeHTML(report.businessName)}</h1>
    <div class="meta">
      Report generated ${report.generatedDate}
    </div>

    ${
      report.chatGPTResponses && report.chatGPTResponses.length > 0
        ? generateResponseSummary(report.chatGPTResponses)
        : ""
    }

    ${
      report.chatGPTResponses && report.chatGPTResponses.length > 0
        ? `
    ${generateCompetitorAnalysis(report.chatGPTResponses)}

    ${generateSourceDomainBarChart(report.chatGPTResponses)}

    <h2>Detailed Analysis</h2>
    <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Performance breakdown across individual search queries</p>

    <div class="section">
      ${report.chatGPTResponses
        .map((response, idx) => generateResponseCard(response, idx))
        .join("\n")}
    </div>
    `
        : ""
    }

    ${(() => {
      const hasRedditSuggestions =
        report.redditSuggestions && report.redditSuggestions.length > 0;
      console.log(
        `[generateHTMLReport] Reddit suggestions check: ${hasRedditSuggestions}, count: ${
          report.redditSuggestions?.length || 0
        }`
      );
      return hasRedditSuggestions
        ? generateRedditSuggestionsSection(report.redditSuggestions!)
        : "";
    })()}

    ${(() => {
      const hasSEOIdeas =
        report.seoContentIdeas && report.seoContentIdeas.length > 0;
      console.log(
        `[generateHTMLReport] SEO content ideas check: ${hasSEOIdeas}, count: ${
          report.seoContentIdeas?.length || 0
        }`
      );
      return hasSEOIdeas
        ? generateSEOContentIdeasSection(report.seoContentIdeas!)
        : "";
    })()}

    <div class="footer">
      <p style="margin-bottom: 8px;"><strong>Disclaimer:</strong> This report is AI-generated and provides estimates based on available information. Actual visibility may vary.</p>
      <p style="margin: 0;">Presence &copy; ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text report
 */
export function generateTextReport(report: Report): string {
  let text = `PRESENCE REPORT
${"=".repeat(60)}

Business: ${report.businessName}
Generated: ${report.generatedDate}

`;

  text += `CUSTOMER PROMPT EXAMPLES
${"-".repeat(60)}

Here are realistic prompts that potential customers might use when
asking ChatGPT for recommendations:

`;

  const promptsByCategory = groupPromptsByCategory(report.customerPrompts);
  for (const [category, prompts] of Object.entries(promptsByCategory)) {
    text += `${category}:\n`;
    prompts.forEach((p) => {
      text += `  • ${p.prompt}\n`;
    });
    text += "\n";
  }

  if (report.chatGPTResponses && report.chatGPTResponses.length > 0) {
    text += `
CHATGPT RESPONSE ANALYSIS
${"-".repeat(60)}

`;
    const mentionedCount = report.chatGPTResponses.filter(
      (r) => r.businessMentioned
    ).length;
    const avgProbability =
      report.chatGPTResponses.length > 0
        ? Math.round(
            report.chatGPTResponses.reduce(
              (sum, r) => sum + (r.mentionProbability || 0),
              0
            ) / report.chatGPTResponses.length
          )
        : 0;
    const totalRuns = report.chatGPTResponses.reduce(
      (sum, r) => sum + (r.totalRuns || 1),
      0
    );

    text += `Prompt Coverage: ${mentionedCount}/${
      report.chatGPTResponses.length
    } (${Math.round(
      (mentionedCount / report.chatGPTResponses.length) * 100
    )}%)\n`;
    text += `Average Probability: ${avgProbability}%\n`;
    text += `Total Runs: ${totalRuns}\n\n`;

    report.chatGPTResponses.forEach((response, idx) => {
      text += `${idx + 1}. ${response.prompt}\n`;
      text += `   Status: ${
        response.businessMentioned ? "✓ Mentioned" : "✗ Not Mentioned"
      }\n`;
      text += `   Probability: ${(response.mentionProbability || 0).toFixed(
        1
      )}%\n`;
      if (response.businessMentioned && response.rank) {
        text += `   Average Rank: #${response.rank.toFixed(1)}\n`;
      }

      // Add individual runs
      if (response.runs && response.runs.length > 0) {
        text += `   Individual Runs:\n`;
        response.runs.forEach((run: any, runIdx: number) => {
          const runStatus = run.businessMentioned
            ? `✓ Mentioned${run.rank ? ` (Rank #${run.rank})` : ""}`
            : "✗ Not Mentioned";
          text += `     Run ${runIdx + 1}: ${runStatus}\n`;
        });
      }

      if (response.sources && response.sources.length > 0) {
        const topSources = response.sources.slice(0, 5);
        const remainingCount = response.sources.length - 5;
        text += `   Top Sources:\n`;
        topSources.forEach((source: string) => {
          text += `     • ${source}\n`;
        });
        if (remainingCount > 0) {
          text += `     + ${remainingCount} more source${
            remainingCount > 1 ? "s" : ""
          }\n`;
        }
      }
      text += "\n";
    });
  }

  if (report.redditSuggestions && report.redditSuggestions.length > 0) {
    console.log(
      `[generateTextReport] Including ${report.redditSuggestions.length} Reddit suggestions`
    );
    text += `
REDDIT COMMENT SUGGESTIONS
${"-".repeat(60)}

Here are suggestions for comments you could post on relevant Reddit threads:

`;
    report.redditSuggestions.forEach((suggestion, idx) => {
      text += `${idx + 1}. ${suggestion.title}\n`;
      text += `   URL: ${suggestion.url}\n`;
      text += `   Suggested Comment:\n`;
      text += `   ${suggestion.suggestedComment.split("\n").join("\n   ")}\n\n`;
    });
  } else {
    console.log(`[generateTextReport] No Reddit suggestions to include`);
  }

  if (report.seoContentIdeas && report.seoContentIdeas.length > 0) {
    console.log(
      `[generateTextReport] Including ${report.seoContentIdeas.length} SEO content ideas`
    );
    text += `
SEO CONTENT IDEAS
${"-".repeat(60)}

Blog post ideas optimized based on sources being quoted by AI:

`;
    report.seoContentIdeas.forEach((idea, idx) => {
      text += `${idx + 1}. ${idea.title}\n`;
      text += `   ${idea.description}\n\n`;
    });
  } else {
    console.log(`[generateTextReport] No SEO content ideas to include`);
  }

  text += `
${"-".repeat(60)}

DISCLAIMER: This report is AI-generated and provides estimates based on
available information. Actual visibility may vary based on many factors
including content quality, user queries, and AI model training data.

Generated by Presence
`;

  return text;
}

/**
 * Group prompts by category for better organization
 */
function groupPromptsByCategory(
  prompts: CustomerPrompt[]
): Record<string, CustomerPrompt[]> {
  const grouped: Record<string, CustomerPrompt[]> = {};

  for (const prompt of prompts) {
    if (!grouped[prompt.category]) {
      grouped[prompt.category] = [];
    }
    grouped[prompt.category].push(prompt);
  }

  return grouped;
}

/**
 * Generate response summary statistics
 */
function generateResponseSummary(responses: any[]): string {
  const mentionedCount = responses.filter((r) => r.businessMentioned).length;
  const totalResponses = responses.length;
  const promptCoverage =
    totalResponses > 0
      ? Math.round((mentionedCount / totalResponses) * 100)
      : 0;

  const mentionedResponses = responses.filter((r) => r.businessMentioned);
  const avgRank =
    mentionedResponses.length > 0
      ? Math.round(
          (mentionedResponses.reduce((sum, r) => sum + (r.rank || 0), 0) /
            mentionedResponses.length) *
            10
        ) / 10
      : null;

  // Calculate average mention probability across all prompts
  const avgProbability =
    responses.length > 0
      ? Math.round(
          responses.reduce((sum, r) => sum + (r.mentionProbability || 0), 0) /
            responses.length
        )
      : 0;

  // Calculate visibility score: prompt coverage × avg probability × (1/avg rank)
  // Convert rank to a score where #1 = 1.0, #2 = 0.5, #3 = 0.33, etc.
  let visibilityScore = 0;
  if (avgRank && avgRank > 0) {
    const rankScore = 1 / avgRank;
    visibilityScore = Math.round(
      (promptCoverage / 100) * (avgProbability / 100) * rankScore * 100
    );
  }

  return `
    <table class="stats-summary" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="stat-item">
          <span class="stat-emoji">⭐</span>
          <div class="stat-value">${visibilityScore}</div>
          <div class="stat-label">Visibility Score</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">📊</span>
          <div class="stat-value">${promptCoverage}%</div>
          <div class="stat-label">Query Coverage</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">🎲</span>
          <div class="stat-value">${avgProbability}%</div>
          <div class="stat-label">Mention Rate</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">🏆</span>
          <div class="stat-value">${
            avgRank !== null ? `#${avgRank}` : "N/A"
          }</div>
          <div class="stat-label">Average Position</div>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate source mentions bar chart
 */
function generateSourceMentionsChart(
  responses: any[],
  businessName: string
): string {
  // Extract all sources and count mentions
  const sourceCounts: Record<string, number> = {};

  // Count all sources
  responses.forEach((response) => {
    if (response.sources && Array.isArray(response.sources)) {
      response.sources.forEach((source: string) => {
        if (source) {
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        }
      });
    }
  });

  // Get all sources sorted by count
  const allSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // Top 15 sources

  if (allSources.length === 0) {
    return `
    <div class="source-chart">
      <h2>Top Mentioned Sources</h2>
      <div class="source-chart-empty">No sources found in ChatGPT responses</div>
    </div>
    `;
  }

  const maxCount = allSources[0][1];

  const chartRows = allSources
    .map(([source, count]) => {
      // Calculate percentage based on the maximum count (so bars are proportional)
      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
      const displaySource =
        source.length > 60 ? source.substring(0, 57) + "..." : source;

      // Ensure minimum width for visibility if count > 0
      const barWidth = Math.max(percentage, count > 0 ? 2 : 0);

      return `
      <div class="source-chart-row">
        <div class="source-chart-label">
          <a href="${escapeHTML(
            source
          )}" style="color: #000; text-decoration: underline;" target="_blank">${escapeHTML(
        displaySource
      )}</a>
        </div>
        <div class="source-chart-bar-container">
          <div class="source-chart-bar-container-inner">
            <div class="source-chart-bar" style="width: ${barWidth}%;"></div>
          </div>
        </div>
        <div class="source-chart-value">${count}</div>
      </div>
    `;
    })
    .join("");

  return `
    <div class="source-chart">
      <h2>Top Mentioned Sources</h2>
      <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Most referenced sources in ChatGPT responses</p>
      ${chartRows}
    </div>
  `;
}

/**
 * Generate competitor analysis showing who's winning at AI SEO
 */
function generateCompetitorAnalysis(responses: any[]): string {
  // Collect all competitors across all runs
  const competitorStats: Record<
    string,
    {
      mentions: number;
      avgRank: number;
      totalRank: number;
      sources: Set<string>;
    }
  > = {};

  responses.forEach((response) => {
    if (response.runs && Array.isArray(response.runs)) {
      response.runs.forEach((run: any) => {
        if (run.competitors && Array.isArray(run.competitors)) {
          run.competitors.forEach((comp: any) => {
            if (!competitorStats[comp.name]) {
              competitorStats[comp.name] = {
                mentions: 0,
                avgRank: 0,
                totalRank: 0,
                sources: new Set(),
              };
            }
            competitorStats[comp.name].mentions++;
            competitorStats[comp.name].totalRank += comp.rank || 0;
            if (comp.sourceUrl) {
              competitorStats[comp.name].sources.add(comp.sourceUrl);
            }
          });
        }
      });
    }
  });

  // Calculate average ranks
  Object.keys(competitorStats).forEach((name) => {
    const stats = competitorStats[name];
    stats.avgRank = stats.totalRank / stats.mentions;
  });

  // Sort by mentions (descending), then by average rank (ascending)
  const sortedCompetitors = Object.entries(competitorStats)
    .sort((a, b) => {
      if (b[1].mentions !== a[1].mentions) {
        return b[1].mentions - a[1].mentions;
      }
      return a[1].avgRank - b[1].avgRank;
    })
    .slice(0, 10); // Top 10 competitors

  if (sortedCompetitors.length === 0) {
    return "";
  }

  const maxMentions = sortedCompetitors[0][1].mentions;

  const competitorRows = sortedCompetitors
    .map(([name, stats]) => {
      const percentage =
        maxMentions > 0 ? (stats.mentions / maxMentions) * 100 : 0;
      const barWidth = Math.max(percentage, stats.mentions > 0 ? 2 : 0);
      const displayName =
        name.length > 40 ? name.substring(0, 37) + "..." : name;

      return `
      <div class="source-chart-row">
        <div class="source-chart-label">
          ${escapeHTML(displayName)}
          <div style="font-size: 9px; color: #999; margin-top: 2px;">Avg rank: #${stats.avgRank.toFixed(
            1
          )}</div>
        </div>
        <div class="source-chart-bar-container">
          <div class="source-chart-bar-container-inner">
            <div class="source-chart-bar" style="width: ${barWidth}%;"></div>
          </div>
        </div>
        <div class="source-chart-value">${stats.mentions}</div>
      </div>
    `;
    })
    .join("");

  return `
    <div class="source-chart">
      <h2>Competitive Landscape</h2>
      <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Companies dominating AI search results in your category</p>
      ${competitorRows}
    </div>
  `;
}

/**
 * Generate source domain bar chart
 */
function generateSourceDomainBarChart(responses: any[]): string {
  // Extract all sources and group by top-level domain
  const domainCounts: Record<string, number> = {};

  responses.forEach((response) => {
    if (response.sources && Array.isArray(response.sources)) {
      response.sources.forEach((source: string) => {
        if (source) {
          try {
            const url = new URL(source);
            const domain = url.hostname.replace(/^www\./, ""); // Remove www prefix
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          } catch (e) {
            // If URL parsing fails, try manual extraction
            const match = source.match(/https?:\/\/(?:www\.)?([^\/]+)/);
            if (match) {
              const domain = match[1];
              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            }
          }
        }
      });
    }
  });

  if (Object.keys(domainCounts).length === 0) {
    return `
    <div class="source-chart">
      <h2>Source Distribution by Domain</h2>
      <div class="source-chart-empty">No sources found in ChatGPT responses</div>
    </div>
    `;
  }

  // Sort by count and take top domains
  const sortedDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // Top 15 domains

  const maxCount = sortedDomains[0][1];

  const chartRows = sortedDomains
    .map(([domain, count]) => {
      // Calculate percentage based on the maximum count (so bars are proportional)
      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
      const displayDomain =
        domain.length > 40 ? domain.substring(0, 37) + "..." : domain;

      // Ensure minimum width for visibility if count > 0
      const barWidth = Math.max(percentage, count > 0 ? 2 : 0);

      return `
      <div class="source-chart-row">
        <div class="source-chart-label">
          ${escapeHTML(displayDomain)}
        </div>
        <div class="source-chart-bar-container">
          <div class="source-chart-bar-container-inner">
            <div class="source-chart-bar" style="width: ${barWidth}%;"></div>
          </div>
        </div>
        <div class="source-chart-value">${count}</div>
      </div>
    `;
    })
    .join("");

  return `
    <div class="source-chart">
      <h2>Content Sources</h2>
      <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Most referenced domains in AI recommendations</p>
      ${chartRows}
    </div>
  `;
}

/**
 * Generate a single response card
 */
function generateResponseCard(response: any, index: number): string {
  const isMentioned = response.businessMentioned;
  const cardClass = isMentioned ? "mentioned" : "not-mentioned";
  const statusClass = isMentioned ? "mentioned" : "not-mentioned";
  const statusText = isMentioned ? "Mentioned" : "Not Mentioned";

  const probability = response.mentionProbability || 0;
  const probabilityText = `${probability.toFixed(1)}%`;

  let rankHTML = "";
  if (isMentioned && response.rank !== null) {
    rankHTML = `<span class="rank-badge">Avg Rank #${response.rank.toFixed(
      1
    )}</span>`;
  }

  // Generate individual runs details
  let runsHTML = "";
  if (response.runs && response.runs.length > 0) {
    const runsDetails = response.runs
      .map((run: any, idx: number) => {
        const runClass = run.businessMentioned ? "mentioned" : "not-mentioned";
        const runText = run.businessMentioned
          ? `Mentioned${run.rank ? ` (Rank #${run.rank})` : ""}`
          : "Not Mentioned";

        // Generate competitor list for this run
        let competitorsHTML = "";
        if (run.competitors && run.competitors.length > 0) {
          const topCompetitors = run.competitors
            .slice(0, 5)
            .sort((a: any, b: any) => a.rank - b.rank);
          competitorsHTML = `
            <div style="margin-top: 8px; padding-left: 20px; border-left: 2px solid #e0e0e0;">
              <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Also Ranked</div>
              ${topCompetitors
                .map(
                  (comp: any) => `
                <div style="font-size: 11px; margin: 4px 0; color: #333;">
                  <span style="font-weight: 600;">#${
                    comp.rank
                  }</span> ${escapeHTML(comp.name)}
                  ${
                    comp.sourceUrl
                      ? `<a href="${escapeHTML(
                          comp.sourceUrl
                        )}" style="color: #666; text-decoration: underline; margin-left: 6px; font-size: 10px;" target="_blank">view source</a>`
                      : ""
                  }
                </div>
              `
                )
                .join("")}
              ${
                run.competitors.length > 5
                  ? `<div style="font-size: 10px; color: #999; margin-top: 4px;">+ ${
                      run.competitors.length - 5
                    } more</div>`
                  : ""
              }
            </div>
          `;
        }

        return `
        <div class="run-item">
          <span class="run-label">Run ${idx + 1}:</span>
          <span class="run-result ${runClass}">${runText}</span>
          ${competitorsHTML}
        </div>
      `;
      })
      .join("");

    runsHTML = `
      <div class="runs-details">
        <strong style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Test Results (${response.totalRuns} queries)</strong>
        ${runsDetails}
      </div>
    `;
  }

  let sourcesHTML = "";
  if (response.sources && response.sources.length > 0) {
    const topSources = response.sources.slice(0, 5);
    const remainingCount = response.sources.length - 5;

    sourcesHTML = `
      <div class="sources">
        <div class="sources-label">References</div>
        ${topSources
          .map(
            (source: string) =>
              `<a href="${escapeHTML(
                source
              )}" class="source-link" target="_blank">${escapeHTML(source)}</a>`
          )
          .join("")}
        ${
          remainingCount > 0
            ? `<div style="color: #666; font-size: 12px; margin-top: 8px;">+ ${remainingCount} more</div>`
            : ""
        }
      </div>
    `;
  }

  return `
    <div class="response-card ${cardClass}">
      <div class="response-prompt">${escapeHTML(response.prompt)}</div>
      <div>
        <span class="response-status ${statusClass}">${statusText}</span>
        <span class="probability-badge">${probabilityText} probability</span>
        ${rankHTML}
      </div>
      ${runsHTML}
      ${sourcesHTML}
    </div>
  `;
}

/**
 * Generate Reddit suggestions section
 */
function generateRedditSuggestionsSection(suggestions: any[]): string {
  return `
    <h2>Reddit Comment Suggestions</h2>
    <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Engage with relevant Reddit discussions to increase your visibility</p>

    ${suggestions
      .map(
        (suggestion) => `
    <div class="response-card" style="margin-bottom: 30px;">
      <h3 style="margin-top: 0; margin-bottom: 12px;">
        <a href="${escapeHTML(
          suggestion.url
        )}" target="_blank" style="color: #000; text-decoration: underline;">
          ${escapeHTML(suggestion.title)}
        </a>
      </h3>
      <div style="font-size: 11px; color: #666; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
        <a href="${escapeHTML(
          suggestion.url
        )}" target="_blank" style="color: #666; text-decoration: underline;">
          ${escapeHTML(suggestion.url)}
        </a>
      </div>
      <div style="background-color: #fafafa; padding: 15px; border-left: 3px solid #000; margin-top: 12px;">
        <div style="font-size: 11px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
          Suggested Comment
        </div>
        <div style="color: #000; line-height: 1.6; white-space: pre-wrap;">${escapeHTML(
          suggestion.suggestedComment
        )}</div>
      </div>
    </div>
    `
      )
      .join("")}
  `;
}

/**
 * Generate SEO content ideas section
 */
function generateSEOContentIdeasSection(ideas: any[]): string {
  return `
    <h2>SEO Content Ideas</h2>
    <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Blog post ideas optimized based on sources being quoted by AI</p>

    ${ideas
      .map(
        (idea, idx) => `
    <div class="response-card" style="margin-bottom: 25px;">
      <h3 style="margin-top: 0; margin-bottom: 12px; color: #000;">
        ${idx + 1}. ${escapeHTML(idea.title)}
      </h3>
      <div style="color: #666; line-height: 1.6; font-size: 14px;">
        ${escapeHTML(idea.description)}
      </div>
    </div>
    `
      )
      .join("")}
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
