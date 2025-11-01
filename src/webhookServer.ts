import './config'; // Load environment variables first
import express, { Request, Response } from 'express';
import { AgentMailService } from './services/agentmail';
import { VisibilityReportAgent } from './agent';

interface WebhookPayload {
  event: string;
  data: {
    messageId?: string;
    inboxId?: string;
    threadId?: string;
    [key: string]: any;
  };
}

export class WebhookServer {
  private app: express.Application;
  private agentMailService: AgentMailService;
  private agent: VisibilityReportAgent;
  private webhookSecret: string | null = null;
  private webhookId: string | null = null;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.agentMailService = new AgentMailService();
    this.agent = new VisibilityReportAgent();
    this.port = port;

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Parse JSON payloads
    this.app.use(express.json());

    // Log all requests
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Webhook endpoint
    this.app.post('/webhook', async (req: Request, res: Response) => {
      try {
        // Skip signature verification for demo purposes
        const signature = req.headers['x-agentmail-signature'] || req.headers['svix-signature'];
        if (!signature) {
          console.warn('⚠️  Webhook request missing signature (continuing anyway for local dev)');
        }

        const webhookPayload: any = req.body;

        // Support both event and event_type fields
        const eventType = webhookPayload.event_type || webhookPayload.event;
        const messageData = webhookPayload.message || webhookPayload.data;

        console.log('\n📨 Webhook received:');
        console.log(`  Event: ${eventType}`);
        if (messageData?.message_id) {
          console.log(`  Message ID: ${messageData.message_id}`);
        }
        if (messageData?.from) {
          console.log(`  From: ${messageData.from}`);
        }

        // Handle different event types
        switch (eventType) {
          case 'message.received':
          case 'message.created':
            await this.handleMessageReceived(messageData);
            break;

          default:
            console.log(`  Unhandled event type: ${eventType}`);
        }

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        // Still return 200 to prevent retries
        res.status(200).json({ success: false, error: String(error) });
      }
    });
  }

  private async handleMessageReceived(data: any): Promise<void> {
    const messageId = data.messageId || data.message_id;

    if (!messageId) {
      console.warn('⚠️  Message received event missing messageId');
      return;
    }

    console.log(`\n🔔 New message received: ${messageId}`);
    console.log('   Processing message...');

    try {
      await this.agent.processMessageById(messageId);
      console.log('✓ Message processed successfully');
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  }

  async start(): Promise<void> {
    try {
      // Start Express server
      const server = this.app.listen(this.port, () => {
        console.log(`\n✓ Webhook server started on port ${this.port}`);
      });

      // Get public URL for webhook
      let publicUrl: string;

      // Check if user provided a public URL (for manual ngrok or deployed server)
      if (process.env.WEBHOOK_PUBLIC_URL) {
        publicUrl = process.env.WEBHOOK_PUBLIC_URL;
        console.log(`\n✓ Using provided public URL: ${publicUrl}`);
      } else {
        console.log(`\n⚠️  No WEBHOOK_PUBLIC_URL provided.`);
        console.log(`\n📝 To register webhook, run this in another terminal:`);
        console.log(`   ngrok http ${this.port}`);
        console.log(`\n   Then set the URL in .env.local:`);
        console.log(`   WEBHOOK_PUBLIC_URL=https://your-ngrok-url.ngrok.io\n`);
        console.log(`   Or set it now and restart this server.\n`);
        console.log(`✓ Webhook server is running on http://localhost:${this.port}`);
        console.log(`  Waiting for WEBHOOK_PUBLIC_URL to register webhook with AgentMail...`);
        console.log(`  (Server will continue running but won't register webhook yet)\n`);

        // Keep server running but don't register webhook
        return;
      }

      const webhookUrl = `${publicUrl}/webhook`;
      console.log(`✓ Webhook endpoint: ${webhookUrl}`);

      // Clean up any existing webhooks
      console.log('\n🧹 Checking for existing webhooks...');
      const existingWebhooks = await this.agentMailService.listWebhooks();
      console.log(`  Found ${existingWebhooks.length} existing webhook(s)`);

      for (const webhook of existingWebhooks) {
        console.log(`  Deleting webhook ${webhook.webhookId}...`);
        await this.agentMailService.deleteWebhook(webhook.webhookId);
      }

      // Create webhook with AgentMail
      console.log('\n📝 Registering webhook with AgentMail...');
      const webhook = await this.agentMailService.createWebhook(webhookUrl, [
        'message.received',
      ]);

      this.webhookSecret = webhook.secret;
      this.webhookId = webhook.webhookId;

      console.log('\n✅ Webhook server is ready!');
      console.log('   Listening for incoming emails...');
      console.log('   Send an email to your AgentMail inbox to test\n');

      // Skip existing unread messages - only process new webhook events
      console.log('⏸️  Skipping existing messages - waiting for webhook events only...');

      // Handle graceful shutdown
      const cleanup = async () => {
        console.log('\n\n🛑 Shutting down...');

        if (this.webhookId) {
          console.log('   Deleting webhook...');
          try {
            await this.agentMailService.deleteWebhook(this.webhookId);
            console.log('   ✓ Webhook deleted');
          } catch (error) {
            console.error('   Failed to delete webhook:', error);
          }
        }

        server.close(() => {
          console.log('   ✓ Server closed');
          process.exit(0);
        });
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    } catch (error) {
      console.error('\n❌ Failed to start webhook server:', error);
      throw error;
    }
  }
}
