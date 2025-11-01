import OpenAI from 'openai';
import { config } from '../config';
import { BusinessInfo } from '../types';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Parse email body to extract business information using OpenAI
 */
export async function parseBusinessInfo(emailBody: string): Promise<BusinessInfo | null> {
  try {
    const prompt = `Extract business information from this email. Return a JSON object with these fields:
- businessName (required): The name of the business/company
- industry (required): The industry or sector
- productsServices: What products or services they offer
- targetCustomers: Who their target customers are
- location: Geographic location
- website: Website URL if mentioned
- additionalContext: Any other relevant details

If the email doesn't contain enough information to identify a business name and industry, return null.

Email content:
${emailBody}

Return ONLY valid JSON, no other text.`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured business information from emails. Always return valid JSON or the word "null" if information is insufficient.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(content);

      // Validate required fields
      if (!parsed.businessName || !parsed.industry) {
        console.log('OpenAI could not extract required fields (businessName, industry)');
        return null;
      }

      // Return structured business info
      return {
        businessName: parsed.businessName,
        industry: parsed.industry,
        productsServices: parsed.productsServices || '',
        targetCustomers: parsed.targetCustomers || '',
        location: parsed.location || '',
        website: parsed.website,
        additionalContext: parsed.additionalContext,
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error parsing business info with OpenAI:', error);
    return null;
  }
}

/**
 * Format business info as a string for use in AI prompts
 */
export function formatBusinessInfoForPrompt(info: BusinessInfo): string {
  let formatted = `Business Name: ${info.businessName}\n`;
  formatted += `Industry: ${info.industry}\n`;

  if (info.productsServices) {
    formatted += `Products/Services: ${info.productsServices}\n`;
  }

  if (info.targetCustomers) {
    formatted += `Target Customers: ${info.targetCustomers}\n`;
  }

  if (info.location) {
    formatted += `Location: ${info.location}\n`;
  }

  if (info.website) {
    formatted += `Website: ${info.website}\n`;
  }

  if (info.additionalContext) {
    formatted += `Additional Context: ${info.additionalContext}\n`;
  }

  return formatted;
}
