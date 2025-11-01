import { BrowserUseClient } from 'browser-use-sdk';
import { config } from '../config';

export interface WebsiteExtractionResult {
  success: boolean;
  data?: {
    businessDescription?: string;
    products?: string[];
    services?: string[];
    targetMarket?: string;
    keyFeatures?: string[];
    pricing?: string;
    location?: string;
    contact?: string;
    additionalInfo?: string;
  };
  error?: string;
}

export class BrowserUseService {
  private client: BrowserUseClient;

  constructor() {
    this.client = new BrowserUseClient({
      apiKey: config.browserUse.apiKey,
    });
  }

  /**
   * Extract detailed business information from a website URL
   */
  async extractBusinessInfo(url: string, businessName: string): Promise<WebsiteExtractionResult> {
    try {
      console.log(`🌐 Extracting info from ${url}...`);

      // Create a task with Browser Use to extract information
      const taskPrompt = `Visit the website ${url} for the business "${businessName}".

Extract and return the following information in a structured format:
1. Business Description: A comprehensive description of what the business does
2. Products: List of main products they offer
3. Services: List of main services they provide
4. Target Market: Who their target customers/audience are
5. Key Features: Main features or differentiators that make them unique
6. Pricing: Any pricing information mentioned (plans, tiers, etc.)
7. Location: Physical location or areas they serve
8. Contact: Contact information if available
9. Additional Info: Any other relevant business information

Return the data in a clear, structured format. If any information is not available, indicate that.`;

      const task = await this.client.tasks.createTask({
        task: taskPrompt,
      });

      console.log(`  Task created: ${task.id}`);
      console.log(`  Waiting for completion...`);

      const result = await task.complete();

      console.log(`✓ Browser Use extraction complete`);

      // Parse the output
      const output = result.output || '';

      return {
        success: true,
        data: this.parseExtractedData(output),
      };
    } catch (error: any) {
      console.error('Error extracting business info with Browser Use:', error);
      return {
        success: false,
        error: error.message || 'Failed to extract information from website',
      };
    }
  }

  /**
   * Parse the extracted data from Browser Use output
   */
  private parseExtractedData(output: string): WebsiteExtractionResult['data'] {
    // This is a simple parser - Browser Use returns structured data
    // We'll try to extract key information from the output
    const data: WebsiteExtractionResult['data'] = {};

    try {
      // Look for key sections in the output
      const lines = output.split('\n');
      let currentSection = '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.toLowerCase().includes('business description')) {
          currentSection = 'description';
        } else if (trimmed.toLowerCase().includes('products')) {
          currentSection = 'products';
        } else if (trimmed.toLowerCase().includes('services')) {
          currentSection = 'services';
        } else if (trimmed.toLowerCase().includes('target market')) {
          currentSection = 'target';
        } else if (trimmed.toLowerCase().includes('key features')) {
          currentSection = 'features';
        } else if (trimmed.toLowerCase().includes('pricing')) {
          currentSection = 'pricing';
        } else if (trimmed.toLowerCase().includes('location')) {
          currentSection = 'location';
        } else if (trimmed.toLowerCase().includes('contact')) {
          currentSection = 'contact';
        } else if (trimmed && !trimmed.match(/^[0-9]+\./)) {
          // Add content to current section
          switch (currentSection) {
            case 'description':
              data.businessDescription = (data.businessDescription || '') + trimmed + ' ';
              break;
            case 'target':
              data.targetMarket = (data.targetMarket || '') + trimmed + ' ';
              break;
            case 'pricing':
              data.pricing = (data.pricing || '') + trimmed + ' ';
              break;
            case 'location':
              data.location = (data.location || '') + trimmed + ' ';
              break;
            case 'contact':
              data.contact = (data.contact || '') + trimmed + ' ';
              break;
          }
        }
      }

      // Store the full output as additional info
      data.additionalInfo = output;

    } catch (error) {
      console.error('Error parsing extracted data:', error);
      data.additionalInfo = output;
    }

    return data;
  }

  /**
   * Format extracted data as a readable summary
   */
  formatExtractedData(data: WebsiteExtractionResult['data']): string {
    if (!data) return 'No data extracted.';

    let summary = '';

    if (data.businessDescription) {
      summary += `**Business Overview:**\n${data.businessDescription.trim()}\n\n`;
    }

    if (data.products && data.products.length > 0) {
      summary += `**Products:**\n${data.products.map(p => `- ${p}`).join('\n')}\n\n`;
    }

    if (data.services && data.services.length > 0) {
      summary += `**Services:**\n${data.services.map(s => `- ${s}`).join('\n')}\n\n`;
    }

    if (data.targetMarket) {
      summary += `**Target Market:**\n${data.targetMarket.trim()}\n\n`;
    }

    if (data.keyFeatures && data.keyFeatures.length > 0) {
      summary += `**Key Features:**\n${data.keyFeatures.map(f => `- ${f}`).join('\n')}\n\n`;
    }

    if (data.pricing) {
      summary += `**Pricing:**\n${data.pricing.trim()}\n\n`;
    }

    if (data.location) {
      summary += `**Location:**\n${data.location.trim()}\n\n`;
    }

    if (data.contact) {
      summary += `**Contact:**\n${data.contact.trim()}\n\n`;
    }

    // If we have additionalInfo and nothing else, use that
    if (!summary && data.additionalInfo) {
      summary = data.additionalInfo;
    }

    return summary || 'No detailed information extracted from website.';
  }
}
