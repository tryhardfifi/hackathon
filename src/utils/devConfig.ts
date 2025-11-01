import * as fs from 'fs';
import * as path from 'path';

interface DevConfig {
  lastEmail?: string;
  lastUrl?: string;
  lastMode?: '1' | '2'; // 1 = GPT, 2 = Browser Use
}

const CONFIG_FILE = path.join(process.cwd(), '.dev-config.json');

/**
 * Load saved dev configuration
 */
export function loadDevConfig(): DevConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Could not load dev config (non-fatal):', error);
  }
  return {};
}

/**
 * Save dev configuration
 */
export function saveDevConfig(config: DevConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Could not save dev config (non-fatal):', error);
  }
}

/**
 * Format a prompt with a default value
 */
export function formatPromptWithDefault(prompt: string, defaultValue?: string): string {
  if (defaultValue) {
    return `${prompt} [${defaultValue}]: `;
  }
  return `${prompt}: `;
}
