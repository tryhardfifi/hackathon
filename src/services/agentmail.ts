import { AgentMailClient, AgentMail } from 'agentmail';
import { config } from '../config';

export class AgentMailService {
  private client: AgentMailClient;
  private inboxId: string;

  constructor() {
    this.client = new AgentMailClient({ apiKey: config.agentmail.apiKey });
    this.inboxId = config.agentmail.inboxId;
  }

  /**
   * Fetch messages with a specific label for the inbox
   */
  async getMessagesWithLabel(label: string): Promise<any[]> {
    try {
      // List messages for the inbox with the specified label
      const response = await this.client.inboxes.messages.list(this.inboxId, {
        labels: [label],
      });

      return response.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<any> {
    return await this.client.inboxes.messages.get(this.inboxId, messageId);
  }

  /**
   * Send a reply to a message (automatically replies in the same thread)
   */
  async replyToMessage(
    messageId: string,
    htmlContent: string,
    textContent: string
  ): Promise<void> {
    try {
      // Get the original message to log thread info
      const originalMessage = await this.getMessage(messageId);
      const threadId = originalMessage.thread_id;

      console.log(`📧 Sending reply to message ${messageId.substring(0, 30)}...`);
      console.log(`  Thread ID: ${threadId}`);
      console.log(`  Original From: ${originalMessage.from || originalMessage.from_}`);
      console.log(`  Original Subject: ${originalMessage.subject}`);
      console.log(`  Inbox: ${this.inboxId}`);
      console.log(`  HTML length: ${htmlContent.length} chars`);
      console.log(`  Text length: ${textContent.length} chars`);

      // The .reply() method automatically sends to the same thread as the original message
      const response = await this.client.inboxes.messages.reply(this.inboxId, messageId, {
        html: htmlContent,
        text: textContent,
      });

      console.log(`✓ Reply sent successfully in thread ${threadId}`);
      console.log(`  Response:`, JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  }

  /**
   * Send a new email to a recipient
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<void> {
    try {
      console.log(`Sending email to ${to}...`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Inbox: ${this.inboxId}`);
      console.log(`  HTML length: ${htmlContent.length} chars`);
      console.log(`  Text length: ${textContent.length} chars`);

      const response = await this.client.inboxes.messages.send(this.inboxId, {
        to,
        subject,
        html: htmlContent,
        text: textContent,
      });

      console.log(`✓ Email sent successfully`);
      console.log(`  Response:`, JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Update message labels
   */
  async updateMessageLabels(
    messageId: string,
    addLabels: string[],
    removeLabels: string[]
  ): Promise<void> {
    try {
      console.log(`Updating labels for message ${messageId.substring(0, 20)}...`);
      console.log(`  Adding: [${addLabels.join(', ')}]`);
      console.log(`  Removing: [${removeLabels.join(', ')}]`);

      if (!messageId) {
        throw new Error('Message ID is required to update labels');
      }

      await this.client.inboxes.messages.update(this.inboxId, messageId, {
        addLabels,
        removeLabels,
      });

      console.log(`✓ Labels updated successfully`);
    } catch (error) {
      console.error('Error updating labels:', error);
      throw error;
    }
  }

  /**
   * Get the sender email from a message
   */
  getMessageFrom(message: any): string {
    return message.from || message.from_ || '';
  }

  /**
   * Get the text content from a message
   */
  getMessageText(message: any): string {
    return message.text || message.body || '';
  }

  /**
   * Get the message ID
   */
  getMessageId(message: any): string {
    return message.message_id || message.messageId || message.id || '';
  }

  /**
   * Create a webhook for this inbox
   */
  async createWebhook(url: string, eventTypes?: string[]): Promise<any> {
    try {
      console.log(`Creating webhook for inbox ${this.inboxId}...`);
      console.log(`  URL: ${url}`);
      console.log(`  Event types: ${eventTypes?.join(', ') || 'all'}`);

      const webhook = await this.client.webhooks.create({
        url,
        inboxIds: [this.inboxId],
        eventTypes: eventTypes as any,
      });

      console.log(`✓ Webhook created successfully`);
      console.log(`  Webhook ID: ${webhook.webhookId}`);
      console.log(`  Secret: ${webhook.secret}`);

      return webhook;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<any[]> {
    try {
      const response = await this.client.webhooks.list();
      return response.webhooks || [];
    } catch (error) {
      console.error('Error listing webhooks:', error);
      throw error;
    }
  }

  /**
   * Delete a webhook by ID
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      console.log(`Deleting webhook ${webhookId}...`);
      await this.client.webhooks.delete(webhookId);
      console.log(`✓ Webhook deleted successfully`);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
