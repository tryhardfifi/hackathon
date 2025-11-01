import { AgentMailService } from "./services/agentmail";
import {
  AgentMailWebSocketService,
  WebSocketEvent,
} from "./services/websocket";
import { OpenAIService } from "./services/openai";
import { BrowserUseService } from "./services/browserUse";
import { parseBusinessInfo } from "./utils/emailParser";
import {
  generateHTMLReport,
  generateTextReport,
} from "./utils/reportGenerator";
import { generateMockChatGPTResponses } from "./utils/mockDataGenerator";
import { Report } from "./types";

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

      // Get the full message details
      const message = await this.agentMailService.getMessage(messageId);
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
        `🌐 Using Browser Use to extract ALL business information from website...`
      );

      // Use Browser Use to extract ALL business information
      const websiteExtraction =
        await this.browserUseService.extractBusinessInfo(
          url,
          businessNameHint || "the business"
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

      // Build business info from Browser Use extraction
      const businessInfo = {
        businessName:
          businessNameHint ||
          websiteExtraction.data.businessDescription?.split(" ")[0] ||
          "Unknown Business",
        industry: "Technology / Software", // Will be inferred by OpenAI in the report
        productsServices: websiteExtraction.data.businessDescription || "",
        targetCustomers: websiteExtraction.data.targetMarket || "",
        location: websiteExtraction.data.location || "",
        website: url,
        url: url,
        additionalContext: websiteExtraction.data.additionalInfo || "",
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

      // Generate mock ChatGPT response data
      const chatGPTResponses = generateMockChatGPTResponses(
        businessInfo,
        customerPrompts
      );

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
      console.log("Generating report...");
      const htmlReport = generateHTMLReport(report);
      const textReport = generateTextReport(report);

      // Send reply
      console.log("Sending reply...");
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
