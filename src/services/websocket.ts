import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { config } from '../config';

export interface WebSocketEvent {
  type: 'message_received' | 'message_sent' | 'message_delivered' | 'message_bounced' | 'message_complained' | 'message_rejected';
  inboxId: string;
  threadId?: string;
  messageId: string;
  timestamp: string;
  [key: string]: any;
}

export class AgentMailWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private inboxId: string;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // 5 seconds
  private isIntentionallyClosed = false;

  constructor(useProduction = true) {
    super();
    this.apiKey = config.agentmail.apiKey;
    this.inboxId = config.agentmail.inboxId;
    this.wsUrl = useProduction ? 'wss://ws.agentmail.to/v0' : 'wss://ws.agentmail.dev/v0';
  }

  /**
   * Connect to the AgentMail WebSocket
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    const url = `${this.wsUrl}?auth_token=${this.apiKey}`;

    console.log('Connecting to AgentMail WebSocket...');
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('✓ Connected to AgentMail WebSocket');
      this.reconnectAttempts = 0;
      this.subscribe();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error.message);
      this.emit('error', error);
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      console.log(`WebSocket closed (code: ${code}, reason: ${reason.toString() || 'none'})`);
      this.ws = null;

      // Attempt to reconnect unless intentionally closed
      if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reconnecting in ${this.reconnectDelay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), this.reconnectDelay);
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Please restart the agent.');
        this.emit('max_reconnect_reached');
      }
    });
  }

  /**
   * Subscribe to inbox events
   */
  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot subscribe: WebSocket not open');
      return;
    }

    const subscribeMessage = {
      type: 'subscribe',
      inbox_ids: [this.inboxId],
    };

    console.log(`Subscribing to inbox: ${this.inboxId}`);
    this.ws.send(JSON.stringify(subscribeMessage));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    if (message.type === 'subscribed') {
      console.log(`✓ Subscribed to inboxes: ${message.inbox_ids?.join(', ') || 'unknown'}`);
      this.emit('subscribed', message);
    } else if (message.type === 'message_received') {
      console.log(`📧 New message received: ${message.messageId || 'unknown'}`);
      this.emit('message_received', message as WebSocketEvent);
    } else if (message.type === 'message_sent') {
      console.log(`📤 Message sent: ${message.messageId || 'unknown'}`);
      this.emit('message_sent', message as WebSocketEvent);
    } else if (message.type === 'message_delivered') {
      console.log(`✓ Message delivered: ${message.messageId || 'unknown'}`);
      this.emit('message_delivered', message as WebSocketEvent);
    } else if (message.type === 'message_bounced') {
      console.log(`⚠️ Message bounced: ${message.messageId || 'unknown'}`);
      this.emit('message_bounced', message as WebSocketEvent);
    } else if (message.type === 'message_complained') {
      console.log(`🚫 Message complained: ${message.messageId || 'unknown'}`);
      this.emit('message_complained', message as WebSocketEvent);
    } else if (message.type === 'message_rejected') {
      console.log(`❌ Message rejected: ${message.messageId || 'unknown'}`);
      this.emit('message_rejected', message as WebSocketEvent);
    } else if (message.type === 'error') {
      console.error('WebSocket server error:', message.error || message.message);
      this.emit('server_error', message);
    } else if (message.type === 'event') {
      // AgentMail sends events with type "event" and nested event_type
      const eventType = message.event_type || message.eventType;
      console.log(`📬 Event received: ${eventType}`);

      // Handle based on nested event type (note: AgentMail uses dots, not underscores)
      if (eventType === 'message.received' || eventType === 'message_received') {
        const msg = message.message || message;
        const messageId = msg.message_id || message.messageId;
        console.log(`📧 New message received: ${messageId}`);

        const event: WebSocketEvent = {
          type: 'message_received',
          inboxId: msg.inbox_id || message.inbox_id || message.inboxId,
          threadId: msg.thread_id || message.thread_id || message.threadId,
          messageId: messageId,
          timestamp: msg.timestamp || message.timestamp || new Date().toISOString(),
          ...message
        };
        this.emit('message_received', event);
      } else {
        console.log('Unknown event_type:', eventType);
        console.log('Full event:', JSON.stringify(message, null, 2));
      }
    } else {
      console.log('Unknown message type:', message.type);
      console.log('Full message:', JSON.stringify(message, null, 2));
    }
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      console.log('Closing WebSocket connection...');
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
