import { validateConfig } from './config';
import { WebhookServer } from './webhookServer';

async function main() {
  try {
    // Validate configuration
    console.log('🔧 Validating configuration...');
    validateConfig();
    console.log('✓ Configuration valid\n');

    console.log('🤖 Starting GPT Visibility Report Agent (Webhook Mode)\n');

    // Create and start webhook server
    const webhookServer = new WebhookServer(3000);
    await webhookServer.start();
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
