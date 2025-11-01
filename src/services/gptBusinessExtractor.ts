import OpenAI from 'openai';
import { config } from '../config';

export interface ExtractedBusinessInfo {
  businessName: string;
  businessDescription: string;
  targetMarket: string;
  location: string;
  additionalInfo: string;
}

/**
 * Extract business information using GPT (faster alternative to Browser Use)
 */
export class GPTBusinessExtractor {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.openai.apiKey });
  }

  /**
   * Extract business information from a URL using GPT with web search
   */
  async extractBusinessInfo(url: string): Promise<{ success: boolean; data?: ExtractedBusinessInfo; error?: string }> {
    try {
      console.log(`🔍 Using GPT with web search to extract business info from: ${url}`);

      const prompt = `Visit and analyze the website at ${url}. Extract the following information about this business:

1. Business Name: The official name of the company/business
2. Business Description: What products or services they offer (2-3 sentences)
3. Target Market: Who are their target customers/audience
4. Location: Where they are based (city, country, or "Online/Global" if not specific)
5. Additional Information: Any other relevant details about the business (unique features, specialties, etc.)

Provide accurate, current information based on what you find on their website.

Return your response as a JSON object with these exact fields:
{
  "businessName": "...",
  "businessDescription": "...",
  "targetMarket": "...",
  "location": "...",
  "additionalInfo": "..."
}`;

      const response = await this.client.responses.create({
        model: 'gpt-4o',
        tools: [{ type: 'web_search' }],
        tool_choice: { type: 'web_search' },
        include: ['web_search_call.action.sources'],
        input: prompt,
      } as any);

      // Extract text from response
      let text = '';
      for (const item of response.output as any[]) {
        if (item.type === 'message' && item.content) {
          for (const contentItem of item.content) {
            if (contentItem.type === 'output_text') {
              text = contentItem.text;
              break;
            }
          }
        }
      }

      if (!text) {
        return {
          success: false,
          error: 'No response text received from GPT'
        };
      }

      console.log('📄 GPT response received, parsing...');

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, try to parse the whole text
        console.warn('No JSON found in response, attempting to parse entire text');

        // Fallback: create structured data from text
        return {
          success: true,
          data: {
            businessName: this.extractField(text, 'business name', url),
            businessDescription: this.extractField(text, 'business description', 'Business information extracted'),
            targetMarket: this.extractField(text, 'target market', 'General audience'),
            location: this.extractField(text, 'location', 'Not specified'),
            additionalInfo: text.substring(0, 500), // First 500 chars as additional info
          }
        };
      }

      const data = JSON.parse(jsonMatch[0]);

      // Validate we have at least the business name
      if (!data.businessName || data.businessName.length < 2) {
        return {
          success: false,
          error: 'Could not extract business name from the website'
        };
      }

      console.log('✅ Business info extracted successfully');
      console.log(`   Business: ${data.businessName}`);

      return {
        success: true,
        data: {
          businessName: data.businessName,
          businessDescription: data.businessDescription || 'No description available',
          targetMarket: data.targetMarket || 'General audience',
          location: data.location || 'Not specified',
          additionalInfo: data.additionalInfo || '',
        }
      };

    } catch (error) {
      console.error('Error extracting business info with GPT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Helper to extract a field from unstructured text
   */
  private extractField(text: string, fieldName: string, defaultValue: string): string {
    const regex = new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : defaultValue;
  }
}
