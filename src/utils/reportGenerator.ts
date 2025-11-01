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
  <title>GPT Visibility Report - ${escapeHTML(report.businessName)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
    }
    h2 {
      color: #2c3e50;
      margin-top: 40px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    h3 {
      color: #34495e;
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 10px;
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
      border-radius: 4px;
      font-weight: bold;
      margin: 10px 0;
    }
    .assessment.high {
      background-color: #d4edda;
      color: #155724;
    }
    .assessment.medium {
      background-color: #fff3cd;
      color: #856404;
    }
    .assessment.low {
      background-color: #f8d7da;
      color: #721c24;
    }
    .section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .recommendation {
      background-color: #e8f5e9;
      padding: 20px;
      border-radius: 6px;
      margin: 15px 0;
      border-left: 4px solid #4CAF50;
    }
    .recommendation h3 {
      margin-top: 0;
      color: #2e7d32;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
    .priority-badge {
      display: inline-block;
      background-color: #2196F3;
      color: white;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
      margin-left: 8px;
    }
    .response-card {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 20px;
      margin: 15px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .response-card.mentioned {
      border-left: 4px solid #4CAF50;
    }
    .response-card.not-mentioned {
      border-left: 4px solid #e0e0e0;
    }
    .response-prompt {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 12px;
      font-size: 15px;
    }
    .response-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .response-status.mentioned {
      background-color: #d4edda;
      color: #155724;
    }
    .response-status.not-mentioned {
      background-color: #f8d7da;
      color: #721c24;
    }
    .probability-badge {
      display: inline-block;
      background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 13px;
      margin-left: 8px;
    }
    .runs-details {
      margin-top: 15px;
      padding: 12px;
      background-color: #f8f9fa;
      border-radius: 6px;
      font-size: 13px;
    }
    .run-item {
      padding: 6px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .run-item:last-child {
      border-bottom: none;
    }
    .run-label {
      font-weight: 600;
      color: #555;
      display: inline-block;
      min-width: 70px;
    }
    .run-result {
      display: inline-block;
      margin-left: 10px;
    }
    .run-result.mentioned {
      color: #155724;
    }
    .run-result.not-mentioned {
      color: #721c24;
    }
    .rank-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 13px;
      margin-left: 8px;
    }
    .sources {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }
    .sources-label {
      font-size: 12px;
      color: #666;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .source-link {
      display: inline-block;
      color: #2196F3;
      text-decoration: none;
      font-size: 13px;
      margin: 4px 8px 4px 0;
      padding: 4px 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .source-link:hover {
      background-color: #e8f5e9;
      text-decoration: underline;
    }
    .stats-summary {
      width: 100%;
      margin: 30px 0;
      border-collapse: separate;
      border-spacing: 15px;
    }
    .stat-item {
      background-color: #f8f9fa;
      border: 2px solid #e0e0e0;
      color: #333;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      width: 20%;
    }
    .stat-emoji {
      font-size: 32px;
      margin-bottom: 10px;
      display: block;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 12px;
      opacity: 0.95;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }
    .source-chart {
      margin: 40px 0;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 25px;
    }
    .source-chart h2 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #2c3e50;
      font-size: 20px;
    }
    .source-chart-row {
      margin-bottom: 15px;
      display: table;
      width: 100%;
    }
    .source-chart-label {
      display: table-cell;
      vertical-align: middle;
      width: 40%;
      font-size: 13px;
      color: #333;
      padding-right: 15px;
      word-break: break-word;
    }
    .source-chart-bar-container {
      display: table-cell;
      vertical-align: middle;
      width: 50%;
      padding-right: 10px;
    }
    .source-chart-bar-container-inner {
      width: 100%;
      background-color: #f0f0f0;
      border-radius: 4px;
      height: 24px;
      position: relative;
    }
    .source-chart-bar {
      height: 24px;
      background-color: #4285f4;
      border-radius: 4px;
      min-width: 2px;
    }
    .source-chart-value {
      display: table-cell;
      vertical-align: middle;
      width: 10%;
      text-align: right;
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }
    .source-chart-empty {
      color: #999;
      font-style: italic;
      padding: 20px;
      text-align: center;
    }
    .pie-chart-container {
      margin: 40px 0;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 25px;
    }
    .pie-chart-container h2 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #2c3e50;
      font-size: 20px;
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
      border-radius: 4px 4px 0 0;
      margin: 0 auto;
      min-height: 10px;
      position: relative;
      bottom: 0;
    }
    .pie-segment-label {
      font-size: 11px;
      color: #666;
      word-break: break-word;
      max-width: 80px;
      margin: 0 auto;
    }
    .pie-segment-value {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      margin-top: 3px;
    }
    .pie-legend {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .pie-legend-item {
      display: table;
      width: 100%;
      margin-bottom: 12px;
      padding: 8px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }
    .pie-legend-color {
      display: table-cell;
      width: 20px;
      height: 20px;
      border-radius: 3px;
      vertical-align: middle;
    }
    .pie-legend-label {
      display: table-cell;
      vertical-align: middle;
      padding-left: 10px;
      font-size: 13px;
      color: #333;
    }
    .pie-legend-value {
      display: table-cell;
      vertical-align: middle;
      text-align: right;
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }
    .pie-legend-percentage {
      display: table-cell;
      vertical-align: middle;
      text-align: right;
      padding-left: 10px;
      font-size: 12px;
      color: #666;
      width: 60px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>GPT Visibility Report</h1>
    <div class="meta">
      <strong>${escapeHTML(report.businessName)}</strong><br>
      Generated: ${report.generatedDate}
    </div>

    ${
      report.chatGPTResponses && report.chatGPTResponses.length > 0
        ? generateResponseSummary(report.chatGPTResponses)
        : ""
    }

    ${
      report.chatGPTResponses && report.chatGPTResponses.length > 0
        ? `
    ${generateSourceDomainBarChart(report.chatGPTResponses)}

    <h2>🎯 ChatGPT Response Analysis</h2>
    <p>Here's how ChatGPT responds to these prompts and whether your business is mentioned:</p>

    <div class="section">
      ${report.chatGPTResponses
        .map((response, idx) => generateResponseCard(response, idx))
        .join("\n")}
    </div>
    `
        : ""
    }

    <div class="footer">
      <p><strong>Disclaimer:</strong> This report is AI-generated and provides estimates based on available information. Actual visibility may vary based on many factors including content quality, user queries, and AI model training data.</p>
      <p>Generated by GPT Visibility Report Agent</p>
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
  let text = `GPT VISIBILITY REPORT
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
    const avgProbability = report.chatGPTResponses.length > 0
      ? Math.round(report.chatGPTResponses.reduce((sum, r) => sum + (r.mentionProbability || 0), 0) / report.chatGPTResponses.length)
      : 0;
    const totalRuns = report.chatGPTResponses.reduce((sum, r) => sum + (r.totalRuns || 1), 0);

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
      text += `   Probability: ${(response.mentionProbability || 0).toFixed(1)}%\n`;
      if (response.businessMentioned && response.rank) {
        text += `   Average Rank: #${response.rank.toFixed(1)}\n`;
      }

      // Add individual runs
      if (response.runs && response.runs.length > 0) {
        text += `   Individual Runs:\n`;
        response.runs.forEach((run: any, runIdx: number) => {
          const runStatus = run.businessMentioned ? `✓ Mentioned${run.rank ? ` (Rank #${run.rank})` : ''}` : '✗ Not Mentioned';
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
          text += `     + ${remainingCount} more source${remainingCount > 1 ? 's' : ''}\n`;
        }
      }
      text += "\n";
    });
  }

  text += `
${"-".repeat(60)}

DISCLAIMER: This report is AI-generated and provides estimates based on
available information. Actual visibility may vary based on many factors
including content quality, user queries, and AI model training data.

Generated by GPT Visibility Report Agent
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
  const mentionPercentage =
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

  const topRankCount = mentionedResponses.filter((r) => r.rank === 1).length;

  // Calculate average mention probability across all prompts
  const avgProbability = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + (r.mentionProbability || 0), 0) / responses.length)
    : 0;

  // Calculate total runs
  const totalRuns = responses.reduce((sum, r) => sum + (r.totalRuns || 1), 0);

  return `
    <table class="stats-summary" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="stat-item">
          <span class="stat-emoji">📊</span>
          <div class="stat-value">${mentionPercentage}%</div>
          <div class="stat-label">Prompt Coverage</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">🎲</span>
          <div class="stat-value">${avgProbability}%</div>
          <div class="stat-label">Avg Probability</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">🔄</span>
          <div class="stat-value">${totalRuns}</div>
          <div class="stat-label">Total Runs</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">🏆</span>
          <div class="stat-value">${
            avgRank !== null ? `#${avgRank}` : "N/A"
          }</div>
          <div class="stat-label">Avg Rank</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">⭐</span>
          <div class="stat-value">${topRankCount}</div>
          <div class="stat-label">Top Rank (#1)</div>
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
      <h2>📈 Top Mentioned Sources</h2>
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
          )}" style="color: #4285f4; text-decoration: none;" target="_blank">${escapeHTML(
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
      <h2>📈 Top Mentioned Sources</h2>
      <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Most referenced sources in ChatGPT responses:</p>
      ${chartRows}
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
      <h2>📊 Source Distribution by Domain</h2>
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
      <h2>📊 Source Distribution by Domain</h2>
      <p style="color: #666; font-size: 13px; margin-bottom: 20px;">Top domains referenced across all ChatGPT responses:</p>
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
  const statusText = isMentioned ? "✓ Mentioned" : "✗ Not Mentioned";

  const probability = response.mentionProbability || 0;
  const probabilityText = `${probability.toFixed(1)}%`;

  let rankHTML = "";
  if (isMentioned && response.rank !== null) {
    rankHTML = `<span class="rank-badge">Avg Rank #${response.rank.toFixed(1)}</span>`;
  }

  // Generate individual runs details
  let runsHTML = "";
  if (response.runs && response.runs.length > 0) {
    const runsDetails = response.runs
      .map((run: any, idx: number) => {
        const runClass = run.businessMentioned ? "mentioned" : "not-mentioned";
        const runText = run.businessMentioned
          ? `✓ Mentioned${run.rank ? ` (Rank #${run.rank})` : ""}`
          : "✗ Not Mentioned";
        return `
        <div class="run-item">
          <span class="run-label">Run ${idx + 1}:</span>
          <span class="run-result ${runClass}">${runText}</span>
        </div>
      `;
      })
      .join("");

    runsHTML = `
      <div class="runs-details">
        <strong>Individual Runs (${response.totalRuns} total):</strong>
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
        <div class="sources-label">Top Sources Used:</div>
        ${topSources
          .map(
            (source: string) =>
              `<a href="${escapeHTML(
                source
              )}" class="source-link" target="_blank">${escapeHTML(source)}</a>`
          )
          .join("")}
        ${remainingCount > 0 ? `<div style="color: #666; font-size: 12px; margin-top: 8px;">+ ${remainingCount} more source${remainingCount > 1 ? 's' : ''}</div>` : ''}
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
