import { Report, CustomerPrompt } from '../types';

/**
 * Generate HTML report
 */
export function generateHTMLReport(report: Report): string {
  const visibilityClass = report.visibilityAnalysis.overallAssessment.toLowerCase();

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
      width: 25%;
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
  </style>
</head>
<body>
  <div class="container">
    <h1>GPT Visibility Report</h1>
    <div class="meta">
      <strong>${escapeHTML(report.businessName)}</strong><br>
      Generated: ${report.generatedDate}
    </div>

    ${report.chatGPTResponses && report.chatGPTResponses.length > 0 ? generateResponseSummary(report.chatGPTResponses) : ''}

    ${report.chatGPTResponses && report.chatGPTResponses.length > 0 ? `
    <h2>🎯 ChatGPT Response Analysis</h2>
    <p>Here's how ChatGPT responds to these prompts and whether your business is mentioned:</p>
    
    <div class="section">
      ${report.chatGPTResponses.map((response, idx) => generateResponseCard(response, idx)).join('\n')}
    </div>
    ` : ''}

    <h2>🔍 Visibility Analysis</h2>
    <div class="section">
      <p><strong>Overall Assessment:</strong></p>
      <div class="assessment ${visibilityClass}">
        ${report.visibilityAnalysis.overallAssessment} Visibility
      </div>

      <h3>Key Factors</h3>
      <ul>
        ${report.visibilityAnalysis.keyFactors.map((f) => `<li>${escapeHTML(f)}</li>`).join('\n')}
      </ul>

      <h3>Current Strengths</h3>
      <ul>
        ${report.visibilityAnalysis.strengths.map((s) => `<li>${escapeHTML(s)}</li>`).join('\n')}
      </ul>

      <h3>Opportunities for Improvement</h3>
      <ul>
        ${report.visibilityAnalysis.opportunities.map((o) => `<li>${escapeHTML(o)}</li>`).join('\n')}
      </ul>
    </div>

    <h2>💡 Recommendations</h2>
    <p>Actionable steps to improve your visibility in AI assistant conversations:</p>
    ${report.recommendations
      .map(
        (rec, idx) => `
      <div class="recommendation">
        <h3>
          ${idx + 1}. ${escapeHTML(rec.title)}
          <span class="priority-badge">Priority ${rec.priority}</span>
        </h3>
        <p>${escapeHTML(rec.description)}</p>
      </div>
    `
      )
      .join('\n')}

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
${'='.repeat(60)}

Business: ${report.businessName}
Generated: ${report.generatedDate}

`;

  text += `CUSTOMER PROMPT EXAMPLES
${'-'.repeat(60)}

Here are realistic prompts that potential customers might use when
asking ChatGPT for recommendations:

`;

  const promptsByCategory = groupPromptsByCategory(report.customerPrompts);
  for (const [category, prompts] of Object.entries(promptsByCategory)) {
    text += `${category}:\n`;
    prompts.forEach((p) => {
      text += `  • ${p.prompt}\n`;
    });
    text += '\n';
  }

  if (report.chatGPTResponses && report.chatGPTResponses.length > 0) {
    text += `
CHATGPT RESPONSE ANALYSIS
${'-'.repeat(60)}

`;
    const mentionedCount = report.chatGPTResponses.filter(r => r.businessMentioned).length;
    text += `Mention Rate: ${mentionedCount}/${report.chatGPTResponses.length} (${Math.round((mentionedCount / report.chatGPTResponses.length) * 100)}%)\n\n`;

    report.chatGPTResponses.forEach((response, idx) => {
      text += `${idx + 1}. ${response.prompt}\n`;
      text += `   Status: ${response.businessMentioned ? '✓ Mentioned' : '✗ Not Mentioned'}\n`;
      if (response.businessMentioned && response.rank) {
        text += `   Rank: #${response.rank}\n`;
      }
      if (response.sources && response.sources.length > 0) {
        text += `   Sources:\n`;
        response.sources.forEach((source: string) => {
          text += `     • ${source}\n`;
        });
      }
      text += '\n';
    });
  }

  text += `
VISIBILITY ANALYSIS
${'-'.repeat(60)}

Overall Assessment: ${report.visibilityAnalysis.overallAssessment} Visibility

Key Factors:
${report.visibilityAnalysis.keyFactors.map((f) => `  • ${f}`).join('\n')}

Current Strengths:
${report.visibilityAnalysis.strengths.map((s) => `  • ${s}`).join('\n')}

Opportunities for Improvement:
${report.visibilityAnalysis.opportunities.map((o) => `  • ${o}`).join('\n')}

`;

  text += `
RECOMMENDATIONS
${'-'.repeat(60)}

Actionable steps to improve your visibility in AI assistant conversations:

`;

  report.recommendations.forEach((rec, idx) => {
    text += `${idx + 1}. ${rec.title} (Priority ${rec.priority})
${rec.description}

`;
  });

  text += `
${'-'.repeat(60)}

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
function groupPromptsByCategory(prompts: CustomerPrompt[]): Record<string, CustomerPrompt[]> {
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
  const mentionedCount = responses.filter(r => r.businessMentioned).length;
  const totalResponses = responses.length;
  const mentionPercentage = totalResponses > 0 ? Math.round((mentionedCount / totalResponses) * 100) : 0;
  
  const mentionedResponses = responses.filter(r => r.businessMentioned);
  const avgRank = mentionedResponses.length > 0
    ? Math.round(mentionedResponses.reduce((sum, r) => sum + (r.rank || 0), 0) / mentionedResponses.length * 10) / 10
    : null;
  
  const topRankCount = mentionedResponses.filter(r => r.rank === 1).length;

  return `
    <table class="stats-summary" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="stat-item">
          <span class="stat-emoji">📊</span>
          <div class="stat-value">${mentionPercentage}%</div>
          <div class="stat-label">Mention Rate</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">✅</span>
          <div class="stat-value">${mentionedCount}/${totalResponses}</div>
          <div class="stat-label">Times Mentioned</div>
        </td>
        <td class="stat-item">
          <span class="stat-emoji">🏆</span>
          <div class="stat-value">${avgRank !== null ? `#${avgRank}` : 'N/A'}</div>
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
 * Generate a single response card
 */
function generateResponseCard(response: any, index: number): string {
  const isMentioned = response.businessMentioned;
  const cardClass = isMentioned ? 'mentioned' : 'not-mentioned';
  const statusClass = isMentioned ? 'mentioned' : 'not-mentioned';
  const statusText = isMentioned ? '✓ Mentioned' : '✗ Not Mentioned';
  
  let rankHTML = '';
  if (isMentioned && response.rank !== null) {
    rankHTML = `<span class="rank-badge">Rank #${response.rank}</span>`;
  }

  let sourcesHTML = '';
  if (response.sources && response.sources.length > 0) {
    sourcesHTML = `
      <div class="sources">
        <div class="sources-label">Sources Used:</div>
        ${response.sources.map((source: string) => 
          `<a href="${escapeHTML(source)}" class="source-link" target="_blank">${escapeHTML(source)}</a>`
        ).join('')}
      </div>
    `;
  }

  return `
    <div class="response-card ${cardClass}">
      <div class="response-prompt">${escapeHTML(response.prompt)}</div>
      <div>
        <span class="response-status ${statusClass}">${statusText}</span>
        ${rankHTML}
      </div>
      ${sourcesHTML}
    </div>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
