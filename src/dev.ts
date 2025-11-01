import * as readline from 'readline';
import { validateConfig } from './config';
import { OpenAIService } from './services/openai';
import { GPTBusinessExtractor } from './services/gptBusinessExtractor';
import { BrowserUseService } from './services/browserUse';
import { AgentMailService } from './services/agentmail';
import { generateHTMLReport, generateTextReport } from './utils/reportGenerator';
import { saveDebugLog, saveDebugLogText } from './utils/debugLogger';
import { loadDevConfig, saveDevConfig, formatPromptWithDefault } from './utils/devConfig';
import { Report, RedditSuggestion, SEOContentIdea } from './types';
import { extractRedditUrls } from './utils/emailParser';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🚀 Presence Report - Development Mode\n');

  // Validate config
  try {
    validateConfig();
  } catch (error) {
    console.error('❌ Configuration error:', error);
    process.exit(1);
  }

  // Load saved config
  const savedConfig = loadDevConfig();

  // Ask for mode
  console.log('Choose extraction mode:');
  console.log('1. Fast Mode (GPT only - faster)');
  console.log('2. Browser Use (More accurate but slower)');
  if (savedConfig.lastMode) {
    const modeName = savedConfig.lastMode === '1' ? 'Fast Mode' : 'Browser Use';
    console.log(`\n(Last used: ${modeName})`);
  }
  console.log();

  const modeInput = await question(formatPromptWithDefault('Enter mode (1 or 2)', savedConfig.lastMode));
  const mode = modeInput.trim() || savedConfig.lastMode || '1';
  const useBrowserUse = mode === '2';

  // Ask for URL
  const urlInput = await question(formatPromptWithDefault('\nEnter the business website URL', savedConfig.lastUrl));
  const url = urlInput.trim() || savedConfig.lastUrl || '';

  if (!url || !url.startsWith('http')) {
    console.error('❌ Invalid URL provided');
    rl.close();
    process.exit(1);
  }

  // Ask for email (optional)
  const emailInput = await question(formatPromptWithDefault('\nEnter email to send report to (or press Enter to skip)', savedConfig.lastEmail));
  const email = emailInput.trim() || savedConfig.lastEmail || '';
  const sendEmail = email && email.includes('@');

  if (sendEmail) {
    console.log(`   Will send report to: ${email}`);
  } else {
    console.log('   Report will only be saved to files');
  }

  // Save config for next time
  saveDevConfig({
    lastMode: mode as '1' | '2',
    lastUrl: url,
    lastEmail: email || undefined,
  });

  console.log(`\n📊 Generating visibility report for: ${url}`);
  console.log(`   Using: ${useBrowserUse ? 'Browser Use' : 'GPT Fast Mode'}\n`);

  const openAIService = new OpenAIService();
  let businessInfo: any;

  try {
    if (useBrowserUse) {
      // Use Browser Use for extraction
      console.log('🌐 Using Browser Use to extract business information...');
      const browserUseService = new BrowserUseService();
      const websiteExtraction = await browserUseService.extractBusinessInfo(url, 'the business');

      if (!websiteExtraction.success || !websiteExtraction.data) {
        console.error('⚠️  Could not extract information from website:', websiteExtraction.error);
        rl.close();
        process.exit(1);
      }

      console.log('✓ Website information extracted successfully\n');

      businessInfo = {
        businessName: websiteExtraction.data.businessDescription?.split(' ')[0] || 'Unknown Business',
        industry: 'Technology / Software',
        productsServices: websiteExtraction.data.businessDescription || '',
        targetCustomers: websiteExtraction.data.targetMarkets?.join(", ") || '',
        location: websiteExtraction.data.location || '',
        website: url,
        url: url,
        additionalContext: '',
      };
    } else {
      // Use GPT for extraction (faster)
      console.log('⚡ Using GPT to extract business information...');
      const gptExtractor = new GPTBusinessExtractor();
      const extraction = await gptExtractor.extractBusinessInfo(url);

      if (!extraction.success || !extraction.data) {
        console.error('⚠️  Could not extract information from website:', extraction.error);
        rl.close();
        process.exit(1);
      }

      console.log('✓ Business information extracted successfully\n');

      businessInfo = {
        businessName: extraction.data.businessName,
        industry: 'Technology / Software', // Could be extracted too
        productsServices: extraction.data.businessDescription,
        targetCustomers: extraction.data.targetMarket,
        location: extraction.data.location,
        website: url,
        url: url,
        additionalContext: extraction.data.additionalInfo,
      };
    }

    console.log(`Processing report for: ${businessInfo.businessName}\n`);

    // Generate customer prompts
    console.log('Generating customer prompts...');
    const customerPrompts = await openAIService.generateCustomerPrompts(businessInfo);
    console.log(`✓ Generated ${customerPrompts.length} prompts\n`);

    // Analyze visibility
    console.log('Analyzing visibility...');
    const visibilityAnalysis = await openAIService.analyzeVisibility(businessInfo);
    console.log('✓ Visibility analysis complete\n');

    // Generate recommendations
    console.log('Creating recommendations...');
    const recommendations = await openAIService.generateRecommendations(businessInfo, visibilityAnalysis);
    console.log('✓ Recommendations created\n');

    // Process all customer prompts with real web search in parallel for maximum speed
    console.log(`Processing ${customerPrompts.length} prompts with web search (4 runs each) - all in parallel...\n`);
    const chatGPTResponses = await Promise.all(
      customerPrompts.map((customerPrompt, i) => {
        console.log(`Starting prompt ${i + 1}/${customerPrompts.length}: "${customerPrompt.prompt.substring(0, 60)}..."`);
        return openAIService.processCustomerPrompt(
          customerPrompt.prompt,
          businessInfo
        );
      })
    );
    console.log('\n✓ All prompts processed');

    // Generate Reddit suggestions (requires Browser Use for scraping Reddit)
    console.log("\n🔍 Generating Reddit comment suggestions...");
    const browserUseService = new BrowserUseService(); // Always create for Reddit extraction
    const redditSuggestions = await generateRedditSuggestions(
      chatGPTResponses,
      businessInfo,
      browserUseService
    );
    console.log(`✓ Reddit suggestions result: ${redditSuggestions.length} suggestion(s)`);
    
    if (redditSuggestions.length > 0) {
      console.log("  Reddit suggestions details:");
      redditSuggestions.forEach((suggestion, idx) => {
        console.log(`    ${idx + 1}. ${suggestion.title}`);
        console.log(`       URL: ${suggestion.url}`);
      });
    }

    // Generate SEO content ideas
    console.log("\n📝 Generating SEO content ideas based on sources...");
    const seoContentIdeas = await generateSEOContentIdeas(
      chatGPTResponses,
      businessInfo,
      openAIService
    );
    console.log(`✓ Generated ${seoContentIdeas.length} SEO content idea(s)`);

    // Create report
    const report: Report = {
      businessName: businessInfo.businessName,
      generatedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      customerPrompts,
      visibilityAnalysis,
      chatGPTResponses,
      recommendations,
      redditSuggestions: redditSuggestions.length > 0 ? redditSuggestions : undefined,
      seoContentIdeas: seoContentIdeas.length > 0 ? seoContentIdeas : undefined,
    };

    // Generate reports
    console.log('\n📝 Generating reports...');
    const htmlReport = generateHTMLReport(report);
    const textReport = generateTextReport(report);

    // Save reports to files
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const businessSlug = businessInfo.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const htmlPath = path.join(reportsDir, `report-${businessSlug}-${timestamp}.html`);
    const textPath = path.join(reportsDir, `report-${businessSlug}-${timestamp}.txt`);

    fs.writeFileSync(htmlPath, htmlReport, 'utf-8');
    fs.writeFileSync(textPath, textReport, 'utf-8');

    console.log(`✓ HTML report saved: ${htmlPath}`);
    console.log(`✓ Text report saved: ${textPath}`);

    // Save debug logs
    console.log('\n📊 Saving debug logs...');
    try {
      saveDebugLog(report, businessInfo);
      saveDebugLogText(report, businessInfo);
    } catch (error) {
      console.error('Failed to save debug logs (non-fatal):', error);
    }

    // Send email if requested
    if (sendEmail) {
      console.log(`\n📧 Sending report to ${email}...`);
      try {
        const agentMailService = new AgentMailService();
        await agentMailService.sendEmail(
          email,
          `Presence Report: ${businessInfo.businessName}`,
          htmlReport,
          textReport
        );
        console.log('✓ Email sent successfully!');
      } catch (error) {
        console.error('❌ Failed to send email:', error);
        console.log('   The report has been saved to files instead.');
      }
    }

    console.log('\n✅ Report generation complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Generate Reddit comment suggestions based on Reddit URLs found in sources
 */
async function generateRedditSuggestions(
  chatGPTResponses: any[],
  businessInfo: any,
  browserUseService: BrowserUseService
): Promise<RedditSuggestion[]> {
  console.log("\n🔍 Starting Reddit suggestions generation...");
  console.log(`  Total chatGPTResponses: ${chatGPTResponses.length}`);

  // Collect all unique sources from all responses
  const allSources = new Set<string>();
  chatGPTResponses.forEach((response, idx) => {
    if (response.sources && Array.isArray(response.sources)) {
      console.log(`  Response ${idx + 1}: ${response.sources.length} sources`);
      response.sources.forEach((source: string) => {
        if (source) {
          allSources.add(source);
        }
      });
    } else {
      console.log(`  Response ${idx + 1}: No sources array found`);
    }
  });

  console.log(`  Total unique sources collected: ${allSources.size}`);
  if (allSources.size > 0) {
    console.log(`  Sample sources (first 5):`);
    Array.from(allSources).slice(0, 5).forEach((source, idx) => {
      console.log(`    ${idx + 1}. ${source}`);
    });
  }

  // Extract up to 3 Reddit URLs
  const redditUrls = extractRedditUrls(Array.from(allSources), 3);

  console.log(`\n  Reddit URL extraction result: ${redditUrls.length} URLs found`);
  if (redditUrls.length > 0) {
    redditUrls.forEach((url, idx) => {
      console.log(`    ${idx + 1}. ${url}`);
    });
  } else {
    console.log("  No Reddit URLs found. Checking all sources for Reddit patterns...");
    Array.from(allSources).forEach((source) => {
      if (source.includes('reddit') || source.includes('redd.it')) {
        console.log(`    Found potential Reddit source (but didn't match pattern): ${source}`);
      }
    });
  }

  if (redditUrls.length === 0) {
    console.log("  ❌ No Reddit URLs found in sources - skipping Reddit suggestions");
    return [];
  }

  // Process all Reddit URLs in a single browser session
  const suggestions: RedditSuggestion[] = [];

  try {
    console.log(`\n  Processing ${redditUrls.length} Reddit URL(s) in a single browser session...`);

    // Fetch all Reddit post data using Browser Use in one session
    console.log(`    Step 1: Fetching Reddit post data with Browser Use (single session)...`);
    const redditDataResults = await browserUseService.extractRedditPostsData(redditUrls);

    // Process each result
    for (let i = 0; i < redditUrls.length; i++) {
      const redditUrl = redditUrls[i];
      const redditData = redditDataResults[i];

      if (!redditData || !redditData.success || !redditData.data) {
        console.log(`    ❌ Failed to extract Reddit data for URL ${i + 1}: ${redditData?.error || 'Unknown error'}`);
        continue;
      }

      console.log(`    ✓ Extracted Reddit data for URL ${i + 1}:`);
      console.log(`      Title: ${redditData.data.title}`);
      console.log(`      Content: ${redditData.data.content.substring(0, 100)}...`);

      try {
        // Generate comment suggestion using GPT
        console.log(`    Step 2: Generating comment suggestion with GPT for URL ${i + 1}...`);
        const openAIService = new OpenAIService();
        const suggestedComment = await openAIService.generateRedditCommentSuggestion(
          redditData.data.title,
          redditData.data.content,
          businessInfo
        );

        if (!suggestedComment || suggestedComment.trim().length === 0) {
          console.log(`    ❌ Generated empty comment suggestion for URL ${i + 1}`);
          continue;
        }

        console.log(`    ✓ Generated comment suggestion (${suggestedComment.length} chars)`);
        console.log(`      Preview: ${suggestedComment.substring(0, 100)}...`);

        suggestions.push({
          url: redditUrl,
          title: redditData.data.title,
          suggestedComment,
        });

        console.log(`    ✅ Successfully created suggestion ${suggestions.length}/${redditUrls.length}`);
      } catch (error) {
        console.error(`    ❌ Error generating comment suggestion for URL ${i + 1}:`, error);
        if (error instanceof Error) {
          console.error(`      Error message: ${error.message}`);
        }
        // Continue with other URLs even if one fails
        continue;
      }
    }
  } catch (error) {
    console.error(`    ❌ Error processing Reddit URLs:`, error);
    if (error instanceof Error) {
      console.error(`      Error message: ${error.message}`);
      console.error(`      Error stack: ${error.stack}`);
    }
  }

  console.log(`\n✓ Reddit suggestions generation complete: ${suggestions.length} suggestion(s) created`);
  return suggestions;
}

/**
 * Generate SEO content ideas based on sources that are being quoted
 */
async function generateSEOContentIdeas(
  chatGPTResponses: any[],
  businessInfo: any,
  openAIService: OpenAIService
): Promise<SEOContentIdea[]> {
  // Collect all unique sources from all responses
  const allSources = new Set<string>();
  chatGPTResponses.forEach((response) => {
    if (response.sources && Array.isArray(response.sources)) {
      response.sources.forEach((source: string) => {
        if (source) {
          allSources.add(source);
        }
      });
    }
  });

  if (allSources.size === 0) {
    console.log("  No sources found - skipping SEO content ideas");
    return [];
  }

  console.log(`  Found ${allSources.size} unique sources`);
  
  try {
    const seoIdeas = await openAIService.generateSEOContentIdeas(
      Array.from(allSources),
      businessInfo
    );
    return seoIdeas;
  } catch (error) {
    console.error(`  Error generating SEO content ideas:`, error);
    return [];
  }
}

main();
