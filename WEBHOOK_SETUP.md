# Webhook Mode Setup Guide

The GPT Visibility Report Agent now supports **webhook mode** - a more reliable and efficient way to receive and process emails using webhooks instead of polling or WebSocket connections.

## How It Works

1. **Express Server**: Runs a local HTTP server to receive webhook events
2. **Ngrok Tunnel**: Exposes your local server to the internet securely
3. **AgentMail Webhook**: Registers the public URL with AgentMail to receive notifications
4. **Event Processing**: When an email arrives, AgentMail sends a webhook event instantly

## Prerequisites

### 1. Ngrok Account & Auth Token

1. Sign up for a free account at [ngrok.com](https://ngrok.com)
2. Get your auth token from [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Add it to your `.env.local` file:

```bash
NGROK_AUTHTOKEN=your_ngrok_token_here
```

### 2. Required Environment Variables

Make sure your `.env` or `.env.local` has:

```bash
# AgentMail Configuration
AGENTMAIL_API_KEY=your_agentmail_api_key
INBOX_ID=your_inbox_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Browser Use Configuration
BROWSER_USE_API_KEY=your_browser_use_api_key

# Ngrok Configuration (for webhook mode)
NGROK_AUTHTOKEN=your_ngrok_token

# Convex Configuration
CONVEX_URL=http://127.0.0.1:3210
```

## Usage

### Start Webhook Mode

```bash
npm run dev-webhook
```

This will:
1. Start an Express server on port 3000
2. Create an ngrok tunnel to expose it publicly
3. Register the webhook URL with AgentMail
4. Process any existing unread messages
5. Listen for new incoming emails

### Expected Output

```
🔧 Validating configuration...
✓ Configuration valid

🤖 Starting GPT Visibility Report Agent (Webhook Mode)

✓ Webhook server started on port 3000

🌐 Setting up ngrok tunnel...
✓ Public webhook URL: https://abc123.ngrok.io
✓ Webhook endpoint: https://abc123.ngrok.io/webhook

🧹 Checking for existing webhooks...
  Found 1 existing webhook(s)
  Deleting webhook wh_xyz...

📝 Registering webhook with AgentMail...
Creating webhook for inbox inb_123...
  URL: https://abc123.ngrok.io/webhook
  Event types: message.received
✓ Webhook created successfully
  Webhook ID: wh_abc123
  Secret: sec_xyz...

✅ Webhook server is ready!
   Listening for incoming emails...
   Send an email to your AgentMail inbox to test

📬 Checking for existing unread messages...
```

### When an Email Arrives

```
📨 Webhook received:
  Event: message.received
  Data: {
    "messageId": "msg_abc123",
    "inboxId": "inb_456",
    "threadId": "thd_789"
  }

🔔 New message received: msg_abc123
   Processing message...

Processing message msg_abc123...
  Thread ID: thd_789
  From: user@example.com
  Subject: Generate report for MyCompany.com

[... processing output ...]

✓ Message processed successfully
```

## Comparison: Webhook vs WebSocket vs CLI

### Webhook Mode (Recommended for Production)
- ✅ Most reliable - doesn't miss emails
- ✅ Instant notifications
- ✅ No constant connection needed
- ✅ Automatic reconnection handled by HTTP
- ✅ Easy to deploy (just needs public URL)
- ⚠️ Requires ngrok or public domain

### WebSocket Mode (dev-agent)
- ✅ Real-time notifications
- ✅ No public URL needed
- ⚠️ Connection can drop
- ⚠️ Requires reconnection logic
- ⚠️ More complex error handling

### CLI Mode (dev)
- ✅ Simple testing
- ✅ Manual control
- ❌ No automatic email processing
- ❌ Manual input required

## Troubleshooting

### "NGROK_AUTHTOKEN not set"

Add your ngrok auth token to `.env.local`:
```bash
NGROK_AUTHTOKEN=your_token_here
```

### "Port 3000 already in use"

Change the port in `src/webhook.ts`:
```typescript
const webhookServer = new WebhookServer(3001); // Use different port
```

### Webhook Not Receiving Events

1. Check ngrok tunnel is active
2. Verify webhook is registered: The startup output shows the webhook ID
3. Test the endpoint manually:
   ```bash
   curl https://your-ngrok-url.ngrok.io/health
   ```
4. Check AgentMail webhook logs in their dashboard

### "Invalid webhook signature"

The webhook automatically verifies signatures. If this error occurs:
1. Make sure you're not modifying the request body
2. Check that AgentMail is sending the `x-agentmail-signature` header
3. Verify the webhook secret matches

## Deployment

### For Production

Replace ngrok with a real public server:

1. Deploy to a cloud service (Railway, Render, Fly.io, etc.)
2. Get your public URL (e.g., `https://your-app.railway.app`)
3. Update `src/webhook.ts` to skip ngrok in production:

```typescript
// In production, use your public URL directly
const publicUrl = process.env.NODE_ENV === 'production'
  ? process.env.PUBLIC_URL
  : await setupNgrok();
```

4. Set environment variable:
```bash
PUBLIC_URL=https://your-app.railway.app
```

### Security Considerations

- ✅ Webhook signatures are automatically verified
- ✅ Only AgentMail events are processed
- ⚠️ Add rate limiting for production
- ⚠️ Add IP whitelisting if needed
- ⚠️ Use HTTPS in production (handled by ngrok/cloud platforms)

## Testing

Send a test email to your AgentMail inbox with a business URL:

```
To: your-agentmail-inbox@agent-mail.com
Subject: Test Report

Please generate a visibility report for https://example.com
```

Watch the console for the webhook event and processing output.

## Cleanup

Press `Ctrl+C` to stop the webhook server. It will automatically:
1. Delete the registered webhook
2. Close the ngrok tunnel
3. Stop the Express server

```
🛑 Shutting down...
   Deleting webhook...
Deleting webhook wh_abc123...
✓ Webhook deleted successfully
   ✓ Webhook deleted
   ✓ Server closed
```
