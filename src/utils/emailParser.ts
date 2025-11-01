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
 * Extract Reddit URLs from an array of source URLs (up to maxCount)
 */
export function extractRedditUrls(sources: string[], maxCount: number = 3): string[] {
  const redditUrls: string[] = [];
  
  console.log(`[extractRedditUrls] Processing ${sources.length} sources, maxCount: ${maxCount}`);
  
  for (let i = 0; i < sources.length && redditUrls.length < maxCount; i++) {
    const source = sources[i];
    
    // Check if URL is a Reddit URL
    try {
      const url = new URL(source);
      const hostname = url.hostname.toLowerCase();
      
      console.log(`[extractRedditUrls] Checking source ${i + 1}: ${hostname}${url.pathname}`);
      
      if (hostname.includes('reddit.com') || hostname.includes('redd.it')) {
        console.log(`[extractRedditUrls]   → Reddit domain detected`);
        
        // Only include actual post URLs (not subreddit pages, user profiles, etc.)
        // Matches patterns like: /r/subreddit/comments/postid/title/
        // Handles double slashes and various path formats
        // Also matches redd.it short links that resolve to comment threads
        const normalizedPath = url.pathname.replace(/\/+/g, '/'); // Normalize multiple slashes
        const isPostUrl = normalizedPath.match(/^\/r\/[^\/]+\/comments\/[^\/]+/i);
        const isShortLink = hostname.includes('redd.it') && url.pathname.length > 0;
        
        if (isPostUrl || isShortLink) {
          console.log(`[extractRedditUrls]   → ✅ Valid Reddit post URL, adding to list`);
          // Normalize the URL by removing double slashes before storing
          const normalizedUrl = url.origin + normalizedPath + (url.search || '');
          redditUrls.push(normalizedUrl);
        } else {
          console.log(`[extractRedditUrls]   → ❌ Reddit URL but not a post (pathname: ${url.pathname}, normalized: ${normalizedPath})`);
        }
      }
    } catch (e) {
      // Invalid URL, skip
      console.log(`[extractRedditUrls]   → ❌ Invalid URL format: ${source}`);
      continue;
    }
  }
  
  console.log(`[extractRedditUrls] Final result: ${redditUrls.length} Reddit URLs found`);
  return redditUrls;
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
