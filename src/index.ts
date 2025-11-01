import { config, validateConfig } from './config';
import { VisibilityReportAgent } from './agent';

async function main() {
  try {
    // Validate configuration
    console.log('Validating configuration...');
    validateConfig();
    console.log('✓ Configuration valid\n');

    // Create and start agent
    const agent = new VisibilityReportAgent();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nReceived SIGINT signal');
      agent.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\nReceived SIGTERM signal');
      agent.stop();
      process.exit(0);
    });

    await agent.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
