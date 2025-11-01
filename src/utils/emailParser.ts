import OpenAI from 'openai';
import { config } from '../config';
import { BusinessInfo } from '../types';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Parse email body to extract URL using OpenAI
 */
export async function parseEmailForURL(emailBody: string): Promise<{ url: string; businessName?: string } | null> {
  try {
    const prompt = `Extract the URL from this email. Return a JSON object with:
- url: The website URL mentioned in the email (add https:// if not present)
- businessName: The business name if explicitly mentioned (optional)

IMPORTANT: Just extract the URL from the email. We'll use it to visit the website and get all the business information from there.

Email content:
${emailBody}

Return ONLY valid JSON, no other text.`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You extract URLs from emails. Always return valid JSON.',
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

      if (!parsed.url) {
        console.log('No URL found in email');
        return null;
      }

      // Ensure URL has protocol
      let url = parsed.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      return {
        url,
        businessName: parsed.businessName,
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error parsing email with OpenAI:', error);
    return null;
  }
}

/**
 * Legacy function - kept for compatibility but now just extracts URL
 */
export async function parseBusinessInfo(emailBody: string): Promise<(BusinessInfo & { url?: string }) | null> {
  const result = await parseEmailForURL(emailBody);

  if (!result) {
    return null;
  }

  // Return minimal info - Browser Use will fill in the rest
  return {
    businessName: result.businessName || 'Unknown',
    industry: 'Will be extracted from website',
    productsServices: '',
    targetCustomers: '',
    location: '',
    website: result.url,
    url: result.url,
    additionalContext: '',
  };
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
