import fs from 'fs';
import path from 'path';
import { Report, ChatGPTResponse, SingleRunResult } from '../types';

/**
 * Save detailed debug information about all prompts and results
 */
export function saveDebugLog(
  report: Report,
  businessInfo: any,
  messageId?: string
): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const businessSlug = report.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const filename = `debug-${businessSlug}-${timestamp}.json`;
  const logsDir = path.join(process.cwd(), 'logs');

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const filepath = path.join(logsDir, filename);

  // Build comprehensive debug data
  const debugData = {
    metadata: {
      timestamp: new Date().toISOString(),
      messageId: messageId || 'N/A',
      businessName: report.businessName,
      generatedDate: report.generatedDate,
    },
    businessInfo: {
      businessName: businessInfo.businessName,
      industry: businessInfo.industry,
      productsServices: businessInfo.productsServices,
      targetCustomers: businessInfo.targetCustomers,
      location: businessInfo.location,
      website: businessInfo.website,
      url: businessInfo.url,
      additionalContext: businessInfo.additionalContext,
    },
    summary: {
      totalPrompts: report.chatGPTResponses?.length || 0,
      totalRuns: report.chatGPTResponses?.reduce((sum, r) => sum + (r.totalRuns || 0), 0) || 0,
      promptsWithMentions: report.chatGPTResponses?.filter(r => r.businessMentioned).length || 0,
      averageMentionProbability: calculateAverageProbability(report.chatGPTResponses || []),
      totalUniqueSources: countUniqueSources(report.chatGPTResponses || []),
    },
    prompts: report.chatGPTResponses?.map((response, index) => ({
      promptNumber: index + 1,
      prompt: response.prompt,
      summary: {
        businessMentioned: response.businessMentioned,
        mentionProbability: `${response.mentionProbability.toFixed(1)}%`,
        averageRank: response.rank,
        totalRuns: response.totalRuns,
        mentionsCount: response.runs.filter(r => r.businessMentioned).length,
      },
      runs: response.runs.map((run, runIndex) => ({
        runNumber: runIndex + 1,
        businessMentioned: run.businessMentioned,
        rank: run.rank,
        sourcesCount: run.sources.length,
        sources: run.sources,
      })),
      allUniqueSources: response.sources,
      allUniqueSourcesCount: response.sources.length,
    })) || [],
    visibilityAnalysis: {
      overallAssessment: report.visibilityAnalysis.overallAssessment,
      keyFactors: report.visibilityAnalysis.keyFactors,
      strengths: report.visibilityAnalysis.strengths,
      opportunities: report.visibilityAnalysis.opportunities,
    },
    recommendations: report.recommendations.map((rec, index) => ({
      number: index + 1,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
    })),
  };

  // Save to file with pretty printing
  fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2), 'utf-8');

  console.log(`\n📝 Debug log saved to: ${filepath}`);

  return filepath;
}

/**
 * Calculate average mention probability across all prompts
 */
function calculateAverageProbability(responses: ChatGPTResponse[]): string {
  if (responses.length === 0) return '0.0%';

  const avg = responses.reduce((sum, r) => sum + (r.mentionProbability || 0), 0) / responses.length;
  return `${avg.toFixed(1)}%`;
}

/**
 * Count total unique sources across all responses
 */
function countUniqueSources(responses: ChatGPTResponse[]): number {
  const allSources = new Set<string>();

  responses.forEach(response => {
    response.sources.forEach(source => allSources.add(source));
  });

  return allSources.size;
}

/**
 * Save a simplified text version of the debug log for quick reading
 */
export function saveDebugLogText(
  report: Report,
  businessInfo: any,
  messageId?: string
): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const businessSlug = report.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const filename = `debug-${businessSlug}-${timestamp}.txt`;
  const logsDir = path.join(process.cwd(), 'logs');

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const filepath = path.join(logsDir, filename);

  let content = `GPT VISIBILITY REPORT - DEBUG LOG
${'='.repeat(80)}

Generated: ${new Date().toISOString()}
Message ID: ${messageId || 'N/A'}
Business: ${report.businessName}

BUSINESS INFORMATION
${'-'.repeat(80)}
Name: ${businessInfo.businessName}
Industry: ${businessInfo.industry}
Website: ${businessInfo.website}
Location: ${businessInfo.location}
Products/Services: ${businessInfo.productsServices}
Target Customers: ${businessInfo.targetCustomers}

SUMMARY STATISTICS
${'-'.repeat(80)}
Total Prompts: ${report.chatGPTResponses?.length || 0}
Total Runs: ${report.chatGPTResponses?.reduce((sum, r) => sum + (r.totalRuns || 0), 0) || 0}
Prompts with Mentions: ${report.chatGPTResponses?.filter(r => r.businessMentioned).length || 0}
Average Mention Probability: ${calculateAverageProbability(report.chatGPTResponses || [])}
Total Unique Sources: ${countUniqueSources(report.chatGPTResponses || [])}

DETAILED RESULTS BY PROMPT
${'-'.repeat(80)}

`;

  report.chatGPTResponses?.forEach((response, index) => {
    content += `
PROMPT ${index + 1}/${report.chatGPTResponses.length}
${'-'.repeat(80)}
Prompt: ${response.prompt}

Summary:
  - Business Mentioned: ${response.businessMentioned ? 'YES' : 'NO'}
  - Mention Probability: ${response.mentionProbability.toFixed(1)}%
  - Average Rank: ${response.rank !== null ? `#${response.rank.toFixed(1)}` : 'N/A'}
  - Total Runs: ${response.totalRuns}
  - Mentions Count: ${response.runs.filter(r => r.businessMentioned).length}/${response.totalRuns}

Individual Runs:
`;

    response.runs.forEach((run, runIndex) => {
      content += `  Run ${runIndex + 1}:
    - Mentioned: ${run.businessMentioned ? 'YES' : 'NO'}
    - Rank: ${run.rank !== null ? `#${run.rank}` : 'N/A'}
    - Sources Found: ${run.sources.length}
`;
      if (run.sources.length > 0) {
        run.sources.forEach(source => {
          content += `      • ${source}\n`;
        });
      }
    });

    content += `
All Unique Sources (${response.sources.length} total):
`;
    response.sources.forEach(source => {
      content += `  • ${source}\n`;
    });
    content += '\n';
  });

  content += `
${'='.repeat(80)}
END OF DEBUG LOG
`;

  fs.writeFileSync(filepath, content, 'utf-8');

  console.log(`📝 Debug log (text) saved to: ${filepath}`);

  return filepath;
}
