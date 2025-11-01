import { AgentMailService } from "./services/agentmail";
import {
  AgentMailWebSocketService,
  WebSocketEvent,
} from "./services/websocket";
import { OpenAIService } from "./services/openai";
import { BrowserUseService } from "./services/browserUse";
import { parseBusinessInfo, extractRedditUrls } from "./utils/emailParser";
import {
  generateHTMLReport,
  generateTextReport,
} from "./utils/reportGenerator";
import { saveDebugLog, saveDebugLogText } from "./utils/debugLogger";
import { Report, RedditSuggestion } from "./types";

export class VisibilityReportAgent {
  private agentMailService: AgentMailService;
  private websocketService: AgentMailWebSocketService;
  private openAIService: OpenAIService;
  private browserUseService: BrowserUseService;
  private processingMessages: Set<string> = new Set();

  constructor() {
    this.agentMailService = new AgentMailService();
    this.websocketService = new AgentMailWebSocketService();
    this.openAIService = new OpenAIService();
    this.browserUseService = new BrowserUseService();
  }

  /**
   * Get message with retry logic to handle race conditions
   */
  private async getMessageWithRetry(
    messageId: string,
    maxRetries: number
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait before attempting
        if (attempt === 1) {
          // Small initial delay to let the API index the message
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          // Exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, attempt - 2), 5000);
          console.log(`  Retry ${attempt}/${maxRetries} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const message = await this.agentMailService.getMessage(messageId);
        return message;
      } catch (error: any) {
        lastError = error;

        // If it's a 404, the message might not be indexed yet - retry
        if (error.statusCode === 404 && attempt < maxRetries) {
          console.log(
            `  Message not found yet (attempt ${attempt}/${maxRetries}), will retry...`
          );
          continue;
        }

        // For other errors or last attempt, throw
        throw error;
      }
    }

    throw lastError || new Error("Failed to get message after retries");
  }

  /**
   * Process a single message by ID
   */
  async processMessageById(messageId: string): Promise<boolean> {
    // Prevent duplicate processing
    if (this.processingMessages.has(messageId)) {
      console.log(`Message ${messageId} is already being processed`);
      return false;
    }

    this.processingMessages.add(messageId);

    try {
      console.log(`Processing message ${messageId}...`);

      // Get the full message details with retry logic (for race conditions)
      const message = await this.getMessageWithRetry(messageId, 3);
      console.log(`  Thread ID: ${message.thread_id}`);
      console.log(`  From: ${message.from}`);
      console.log(`  Subject: ${message.subject}`);

      // Check if it has the unread label and NOT the replied label
      const hasUnread = message.labels && message.labels.includes("unread");
      const hasReplied = message.labels && message.labels.includes("replied");

      if (!hasUnread || hasReplied) {
        console.log(
          `Message ${messageId} already processed (unread: ${hasUnread}, replied: ${hasReplied}), skipping`
        );
        this.processingMessages.delete(messageId);
        return false;
      }

      // Extract URL from email
      const emailBody = this.agentMailService.getMessageText(message);
      console.log("Extracting URL from email...");
      const emailData = await parseBusinessInfo(emailBody);

      if (!emailData || !emailData.url) {
        console.log("No URL found in email, sending error response");
        const fromEmail = this.agentMailService.getMessageFrom(message);
        await this.sendErrorResponse(messageId, fromEmail, emailBody);
        this.processingMessages.delete(messageId);
        return false;
      }

      const url = emailData.url;
      const businessNameHint =
        emailData.businessName !== "Unknown"
          ? emailData.businessName
          : undefined;

      console.log(`📊 URL found: ${url}`);
      console.log(
        `🌐 Using OpenAI web search to extract business information from website...`
      );

      // Use OpenAI web search to extract ALL business information
      const websiteExtraction =
        await this.openAIService.extractBusinessInfoFromUrl(
          url,
          businessNameHint
        );

      if (!websiteExtraction.success || !websiteExtraction.data) {
        console.log(
          "⚠️  Could not extract information from website:",
          websiteExtraction.error
        );
        const fromEmail = this.agentMailService.getMessageFrom(message);
        await this.sendErrorResponse(messageId, fromEmail, emailBody);
        this.processingMessages.delete(messageId);
        return false;
      }

      console.log("✓ Website information extracted successfully");

      // Build business info from web search extraction
      const extractedData = websiteExtraction.data;
      const businessInfo = {
        businessName: extractedData.businessName,
        industry: "Technology / Software", // Will be inferred by OpenAI in the report
        productsServices: extractedData.businessDescription ||
          [...extractedData.products, ...extractedData.services].join(", "),
        targetCustomers: extractedData.targetMarkets?.join(", ") || "",
        location: extractedData.location || "",
        website: url,
        url: url,
        additionalContext: extractedData.keyFeatures?.join(", ") || "",
      };

      console.log(`Processing report for: ${businessInfo.businessName}`);

      // Generate report using OpenAI
      console.log("Generating customer prompts...");
      const customerPrompts = await this.openAIService.generateCustomerPrompts(
        businessInfo
      );

      console.log("Analyzing visibility...");
      const visibilityAnalysis = await this.openAIService.analyzeVisibility(
        businessInfo
      );

      console.log("Creating recommendations...");
      const recommendations = await this.openAIService.generateRecommendations(
        businessInfo,
        visibilityAnalysis
      );

      // Process all customer prompts with real web search in parallel for maximum speed
      console.log(
        `Processing ${customerPrompts.length} prompts with web search (4 runs each) - all in parallel...`
      );
      const chatGPTResponses = await Promise.all(
        customerPrompts.map((customerPrompt, i) => {
          console.log(`Starting prompt ${i + 1}/${customerPrompts.length}: "${customerPrompt.prompt.substring(0, 60)}..."`);
          return this.openAIService.processCustomerPrompt(
            customerPrompt.prompt,
            businessInfo
          );
        })
      );
      console.log('\n✓ All prompts processed');

      // Generate Reddit suggestions using Browser Use
      console.log("\n🔍 Generating Reddit comment suggestions...");
      const redditSuggestions = await this.generateRedditSuggestions(
        chatGPTResponses,
        businessInfo
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
      const seoContentIdeas = await this.generateSEOContentIdeas(
        chatGPTResponses,
        businessInfo
      );
      console.log(`✓ Generated ${seoContentIdeas.length} SEO content idea(s)`);

      // Create report
      console.log(`\n📋 Creating report...`);
      console.log(`  Reddit suggestions to include: ${redditSuggestions.length}`);
      console.log(`  SEO content ideas to include: ${seoContentIdeas.length}`);
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
        redditSuggestions: redditSuggestions.length > 0 ? redditSuggestions : undefined,
        seoContentIdeas: seoContentIdeas.length > 0 ? seoContentIdeas : undefined,
      };
      
      console.log(`  Report created with redditSuggestions: ${report.redditSuggestions ? report.redditSuggestions.length : 0}`);
      console.log(`  Report created with seoContentIdeas: ${report.seoContentIdeas ? report.seoContentIdeas.length : 0}`);

      // Generate HTML and text versions
      console.log("Generating report...");
      const htmlReport = generateHTMLReport(report);
      const textReport = generateTextReport(report);

      // Save debug logs before sending
      console.log("\nSaving debug logs...");
      try {
        saveDebugLog(report, businessInfo, messageId);
        saveDebugLogText(report, businessInfo, messageId);
      } catch (error) {
        console.error("Failed to save debug logs (non-fatal):", error);
      }

      // Send reply
      console.log("\nSending reply...");
      await this.agentMailService.replyToMessage(
        messageId,
        htmlReport,
        textReport
      );

      // Wait a moment before updating labels (gives AgentMail time to process)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update labels
      console.log("Updating labels...");
      await this.agentMailService.updateMessageLabels(
        messageId,
        ["replied"],
        ["unread"]
      );

      console.log(`✓ Successfully processed message ${messageId}`);
      this.processingMessages.delete(messageId);
      return true;
    } catch (error) {
      console.error(`Error processing message ${messageId}:`, error);

      // Try to label as error (non-fatal if it fails)
      try {
        await this.agentMailService.updateMessageLabels(
          messageId,
          ["error"],
          ["unread"]
        );
      } catch (labelError: any) {
        console.warn(
          "⚠️  Could not add error label (non-fatal):",
          labelError?.message || labelError
        );
      }

      this.processingMessages.delete(messageId);
      return false;
    }
  }

  /**
   * Generate Reddit comment suggestions based on Reddit URLs found in sources
   */
  private async generateRedditSuggestions(
    chatGPTResponses: any[],
    businessInfo: any
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
      const redditDataResults = await this.browserUseService.extractRedditPostsData(redditUrls);

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
          const suggestedComment = await this.openAIService.generateRedditCommentSuggestion(
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
  private async generateSEOContentIdeas(
    chatGPTResponses: any[],
    businessInfo: any
  ): Promise<any[]> {
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
      const seoIdeas = await this.openAIService.generateSEOContentIdeas(
        Array.from(allSources),
        businessInfo
      );
      return seoIdeas;
    } catch (error) {
      console.error(`  Error generating SEO content ideas:`, error);
      return [];
    }
  }

  /**
   * Send an error response when parsing fails
   */
  private async sendErrorResponse(
    messageId: string,
    fromEmail: string,
    emailBody: string
  ): Promise<void> {
    // Use OpenAI to generate a helpful, contextual error response
    const systemPrompt = `You are a helpful assistant for the GPT Visibility Report service. Generate a friendly error message explaining that we need more information to create their report.

Required information:
- Business Name (required)
- Industry (required)

Optional but helpful:
- Products/Services
- Target Customers
- Location
- Website

Based on what they sent, acknowledge what you received and politely ask for the missing required information. Be warm and encouraging.`;

    const userPrompt = `The user sent this email but it's missing required information:

${emailBody}

Generate a helpful HTML and plain text error response.`;

    try {
      const response = await this.openAIService.generateCustomResponse(
        systemPrompt,
        userPrompt
      );

      const htmlError = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background-color: #f8f9fa; padding: 30px; border-radius: 8px; }
    h2 { color: #2196F3; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Thanks for reaching out!</h2>
    ${response.html || "<p>" + response.text.replace(/\n/g, "</p><p>") + "</p>"}
    <hr>
    <p><small>Reply to this email with your business information and we'll generate your GPT Visibility Report!</small></p>
  </div>
</body>
</html>
      `.trim();

      const textError =
        response.text +
        "\n\nReply to this email with your business information and we'll generate your GPT Visibility Report!";

      await this.agentMailService.replyToMessage(
        messageId,
        htmlError,
        textError
      );
    } catch (error) {
      // Fallback to simple error message if OpenAI fails
      console.error("Error generating custom error response:", error);

      const htmlError = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background-color: #f8f9fa; padding: 30px; border-radius: 8px; }
    h2 { color: #d32f2f; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Unable to Process Your Request</h2>
    <p>Thank you for your interest in the GPT Visibility Report!</p>
    <p>We need a bit more information. Please include:</p>
    <ul>
      <li><strong>Business Name:</strong> Your company name</li>
      <li><strong>Industry:</strong> The industry you operate in</li>
    </ul>
    <p>Reply with this information and we'll generate your report!</p>
  </div>
</body>
</html>
      `.trim();

      const textError = `Unable to Process Your Request

Thank you for your interest in the GPT Visibility Report!

We need a bit more information. Please include:
- Business Name: Your company name
- Industry: The industry you operate in

Reply with this information and we'll generate your report!`;

      await this.agentMailService.replyToMessage(
        messageId,
        htmlError,
        textError
      );
    }

    // Wait a moment before updating labels
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      await this.agentMailService.updateMessageLabels(
        messageId,
        ["replied", "error"],
        ["unread"]
      );
    } catch (error: any) {
      console.warn(
        "⚠️  Could not update labels after error response:",
        error?.message || error
      );
    }
  }

  /**
   * Handle incoming message events from WebSocket
   */
  private async handleMessageReceived(event: WebSocketEvent): Promise<void> {
    console.log(`\n📨 Incoming message event:`, event);

    // Process the message
    if (event.messageId) {
      await this.processMessageById(event.messageId);
    } else {
      console.error("Message event missing messageId");
    }
  }

  /**
   * Process any existing unread messages (on startup)
   */
  async processExistingUnrepliedMessages(): Promise<void> {
    try {
      console.log("Checking for existing unread messages...");

      const messages = await this.agentMailService.getMessagesWithLabel(
        "unread"
      );

      if (messages.length === 0) {
        console.log("No existing unread messages found");
        return;
      }

      console.log(`Found ${messages.length} existing unread message(s)`);

      for (const message of messages) {
        const messageId = this.agentMailService.getMessageId(message);
        await this.processMessageById(messageId);
        // Add a small delay between processing messages
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Error processing existing messages:", error);
    }
  }

  /**
   * Start the agent with WebSocket connection
   */
  async start(): Promise<void> {
    console.log("🤖 GPT Visibility Report Agent started");
    console.log("Using WebSocket for real-time notifications\n");

    // Set up WebSocket event handlers
    this.websocketService.on("message_received", (event: WebSocketEvent) => {
      this.handleMessageReceived(event);
    });

    this.websocketService.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
    });

    this.websocketService.on("server_error", (error: any) => {
      console.error("Server error:", error);
    });

    this.websocketService.on("max_reconnect_reached", () => {
      console.error("Maximum reconnection attempts reached. Exiting...");
      process.exit(1);
    });

    // Connect to WebSocket
    this.websocketService.connect();

    // Process any existing unreplied messages
    // Wait a bit for WebSocket to connect first
    setTimeout(() => {
      this.processExistingUnrepliedMessages();
    }, 2000);

    // Keep the process running
    console.log("\n✓ Agent is running and listening for new messages...");
    console.log("Press Ctrl+C to stop\n");
  }

  /**
   * Stop the agent and clean up
   */
  stop(): void {
    console.log("\nStopping agent...");
    this.websocketService.close();
  }
}
