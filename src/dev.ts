import * as readline from 'readline';
import { validateConfig } from './config';
import { OpenAIService } from './services/openai';
import { GPTBusinessExtractor } from './services/gptBusinessExtractor';
import { BrowserUseService } from './services/browserUse';
import { generateHTMLReport, generateTextReport } from './utils/reportGenerator';
import { saveDebugLog, saveDebugLogText } from './utils/debugLogger';
import { Report } from './types';
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
  console.log('🚀 GPT Visibility Report - Development Mode\n');

  // Validate config
  try {
    validateConfig();
  } catch (error) {
    console.error('❌ Configuration error:', error);
    process.exit(1);
  }

  // Ask for mode
  console.log('Choose extraction mode:');
  console.log('1. Fast Mode (GPT only - faster)');
  console.log('2. Browser Use (More accurate but slower)\n');

  const mode = await question('Enter mode (1 or 2): ');
  const useBrowserUse = mode.trim() === '2';

  // Ask for URL
  const url = await question('\nEnter the business website URL: ');

  if (!url || !url.startsWith('http')) {
    console.error('❌ Invalid URL provided');
    rl.close();
    process.exit(1);
  }

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
        targetCustomers: websiteExtraction.data.targetMarket || '',
        location: websiteExtraction.data.location || '',
        website: url,
        url: url,
        additionalContext: websiteExtraction.data.additionalInfo || '',
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

    // Process all customer prompts with real web search
    console.log(`Processing ${customerPrompts.length} prompts with web search (4 runs each)...\n`);
    const chatGPTResponses = [];
    for (let i = 0; i < customerPrompts.length; i++) {
      console.log(`Prompt ${i + 1}/${customerPrompts.length}:`);
      const response = await openAIService.processCustomerPrompt(
        customerPrompts[i].prompt,
        businessInfo
      );
      chatGPTResponses.push(response);

      // Small delay between prompts
      if (i < customerPrompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

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

    console.log('\n✅ Report generation complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
