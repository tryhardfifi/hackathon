import { config, validateConfig } from "../config";
import { AgentMailService } from "../services/agentmail";
import {
  generateHTMLReport,
  generateTextReport,
} from "../utils/reportGenerator";
import { generateMockChatGPTResponses } from "../utils/mockDataGenerator";
import {
  Report,
  BusinessInfo,
  CustomerPrompt,
  VisibilityAnalysis,
  Recommendation,
} from "../types";
import * as fs from "fs";
import * as path from "path";

/**
 * Script to generate and send a mocked visibility report
 * Usage: npm run send-mock-report
 */
async function sendMockReport() {
  try {
    console.log("Generating mock visibility report...\n");

    // Validate configuration
    validateConfig();

    // Create sample business info
    const businessInfo: BusinessInfo = {
      businessName: "Acme Coffee Roasters",
      industry: "Coffee roasting and retail",
      productsServices:
        "Specialty coffee beans, wholesale and retail, coffee brewing equipment",
      targetCustomers: "Coffee enthusiasts, cafes, restaurants",
      location: "Portland, Oregon",
      website: "https://www.acmecoffee.example.com",
      additionalContext:
        "Family-owned business since 2015, focus on sustainable, direct-trade beans",
    };

    // Create sample customer prompts
    const customerPrompts: CustomerPrompt[] = [
      {
        category: "Finding a business",
        prompt: "What are the best coffee roasters in Portland?",
      },
      {
        category: "Finding a business",
        prompt: "Recommend specialty coffee roasters in Oregon",
      },
      {
        category: "Comparing options",
        prompt: "How do specialty coffee roasters differ from regular ones?",
      },
      {
        category: "Comparing options",
        prompt: "What makes a coffee roaster sustainable?",
      },
      {
        category: "Specific needs",
        prompt: "Where can I find direct-trade coffee beans in Portland?",
      },
      {
        category: "Specific needs",
        prompt: "Looking for coffee roasters with subscription services",
      },
      {
        category: "Quality and reputation",
        prompt: "Which Portland coffee roasters have the best reputation?",
      },
      {
        category: "Local recommendations",
        prompt: "Best local coffee roasters near downtown Portland",
      },
    ];

    // Generate mock ChatGPT responses
    const chatGPTResponses = generateMockChatGPTResponses(
      businessInfo,
      customerPrompts
    );

    // Create sample visibility analysis
    const visibilityAnalysis: VisibilityAnalysis = {
      overallAssessment: "Medium",
      keyFactors: [
        "Established presence in Portland coffee scene since 2015",
        "Focus on sustainable and direct-trade sourcing",
        "Limited online content and SEO presence",
        "Niche specialty market positioning",
      ],
      strengths: [
        "Strong local reputation in specialty coffee community",
        "Unique value proposition with direct-trade focus",
        "Located in coffee-friendly market (Portland)",
      ],
      opportunities: [
        "Increase online content creation (blog posts, guides)",
        "Improve SEO and local search optimization",
        "Build more reviews and testimonials online",
        "Partner with coffee influencers and bloggers",
      ],
    };

    // Create sample recommendations
    const recommendations: Recommendation[] = [
      {
        title: "Expand Online Content Strategy",
        description:
          "Create detailed blog posts about your specialty coffee sourcing process, brewing guides, and stories about your direct-trade partners. This content will help ChatGPT find and recommend your business.",
        priority: 1,
      },
      {
        title: "Improve SEO and Local Search Presence",
        description:
          "Optimize your website with relevant keywords, create a Google Business Profile, and ensure your business information is consistent across all online directories.",
        priority: 2,
      },
      {
        title: "Build Online Reviews and Social Proof",
        description:
          "Encourage satisfied customers to leave reviews on platforms like Yelp, Google, and coffee-specific review sites. Positive reviews increase visibility in AI recommendations.",
        priority: 3,
      },
    ];

    // Create report
    const report: Report = {
      businessName: businessInfo.businessName,
      generatedDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      customerPrompts,
      visibilityAnalysis,
      chatGPTResponses,
      recommendations,
    };

    // Generate HTML and text versions
    console.log("Generating report HTML and text...");
    const htmlReport = generateHTMLReport(report);
    const textReport = generateTextReport(report);

    console.log(`HTML Report length: ${htmlReport.length} characters`);
    console.log(`Text Report length: ${textReport.length} characters\n`);

    // Display summary
    const mentionedCount = chatGPTResponses.filter(
      (r) => r.businessMentioned
    ).length;
    const mentionPercentage = Math.round(
      (mentionedCount / chatGPTResponses.length) * 100
    );
    console.log("📊 Mock Report Summary:");
    console.log(`   Business: ${businessInfo.businessName}`);
    console.log(
      `   Mention Rate: ${mentionPercentage}% (${mentionedCount}/${chatGPTResponses.length})`
    );
    console.log(`   Customer Prompts: ${customerPrompts.length}`);
    console.log(`   Recommendations: ${recommendations.length}\n`);

    // Optionally save to file for preview
    if (process.env.SAVE_HTML === "true") {
      const outputPath = path.join(process.cwd(), "mock-report.html");
      fs.writeFileSync(outputPath, htmlReport);
      console.log(`💾 HTML report saved to: ${outputPath}`);
      console.log("   Open this file in your browser to preview the report.\n");
    } else {
      console.log(
        "💡 Tip: Set SAVE_HTML=true to save the HTML report to a file for preview.\n"
      );
    }

    // Check if we should send the email
    const shouldSendEmail = process.env.SEND_EMAIL === "true";
    const recipientEmail = process.env.RECIPIENT_EMAIL;

    if (shouldSendEmail && recipientEmail) {
      console.log(`📧 Sending report to ${recipientEmail}...`);
      const agentMailService = new AgentMailService();
      const subject = `Presence Report: ${businessInfo.businessName}`;
      await agentMailService.sendEmail(
        recipientEmail,
        subject,
        htmlReport,
        textReport
      );
      console.log("✓ Email sent successfully!\n");
    } else if (shouldSendEmail) {
      console.log(
        "⚠️  RECIPIENT_EMAIL environment variable is required to send email."
      );
      console.log(
        "   Set: SEND_EMAIL=true RECIPIENT_EMAIL=<email-address> npm run send-mock-report\n"
      );
    } else {
      console.log(
        "ℹ️  To send this report via email, set the following environment variables:"
      );
      console.log(
        "   SEND_EMAIL=true RECIPIENT_EMAIL=<email-address> npm run send-mock-report\n"
      );
    }

    console.log("✓ Mock report generated successfully!");

    return { report, htmlReport, textReport };
  } catch (error) {
    console.error("Error generating mock report:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  sendMockReport()
    .then(() => {
      console.log("\n✓ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Error:", error);
      process.exit(1);
    });
}

export { sendMockReport };
