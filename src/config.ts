import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  agentmail: {
    apiKey: process.env.AGENTMAIL_API_KEY || '',
    inboxId: process.env.INBOX_ID || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  browserUse: {
    apiKey: process.env.BROWSER_USE_API_KEY || '',
  },
};

export function validateConfig(): void {
  const required = [
    { key: 'AGENTMAIL_API_KEY', value: config.agentmail.apiKey },
    { key: 'OPENAI_API_KEY', value: config.openai.apiKey },
    { key: 'INBOX_ID', value: config.agentmail.inboxId },
    { key: 'BROWSER_USE_API_KEY', value: config.browserUse.apiKey },
  ];

  const missing = required.filter((r) => !r.value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map((m) => m.key).join(', ')}`
    );
  }
}
