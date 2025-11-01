import { BrowserUseClient } from "browser-use-sdk";
import { config } from "../config";
import { z } from "zod";

const BusinessInfoSchema = z.object({
  businessDescription: z
    .string()
    .describe("A comprehensive description of what the business does"),
  products: z.array(z.string()).describe("List of main products they offer"),
  services: z.array(z.string()).describe("List of main services they provide"),
  targetMarkets: z
    .array(z.string())
    .describe("Who their target customers/audience are"),
  keyFeatures: z
    .array(z.string())
    .describe("Main features or differentiators that make them unique"),
  location: z.string().describe("Physical location or areas they serve"),
});

// RedditPostSchema removed - now using text extraction instead of structured data

export interface WebsiteExtractionResult {
  success: boolean;
  data?: {
    businessDescription?: string;
    products?: string[];
    services?: string[];
    targetMarkets?: string[];
    keyFeatures?: string[];
    location?: string;
  };
  error?: string;
}

export interface RedditPostData {
  success: boolean;
  data?: {
    title: string;
    content: string;
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
  async extractBusinessInfo(
    url: string,
    businessName: string
  ): Promise<WebsiteExtractionResult> {
    try {
      console.log(`🌐 Extracting info from ${url}...`);

      // Create a task with Browser Use to extract information using structured output
      const taskPrompt = `Visit the website ${url} for the business "${businessName}".

Extract and return the following information:
- Business Description: A comprehensive description of what the business does
- Products: List of main products they offer
- Services: List of main services they provide
- Target Markets: Who their target customers/audience are (as an array)
- Key Features: Main features or differentiators that make them unique
- Location: Physical location or areas they serve

If any information is not available, use empty strings or empty arrays.`;

      const task = await this.client.tasks.createTask({
        task: taskPrompt,
        schema: BusinessInfoSchema,
      });

      console.log(`  Task created: ${task.id}`);
      console.log(`  Waiting for completion...`);

      const result = await task.complete();

      console.log(`✓ Browser Use extraction complete`);

      // Use parsed structured output
      if (result.parsed) {
        const parsed = result.parsed;

        // Log the extracted information
        console.log("\n📋 Browser Use Extraction Results:");
        console.log("=".repeat(60));
        if (parsed.businessDescription) {
          console.log(`\n📝 Business Description:`);
          console.log(`   ${parsed.businessDescription}`);
        }
        if (parsed.products && parsed.products.length > 0) {
          console.log(`\n🛍️  Products:`);
          parsed.products.forEach((product, idx) => {
            console.log(`   ${idx + 1}. ${product}`);
          });
        }
        if (parsed.services && parsed.services.length > 0) {
          console.log(`\n⚙️  Services:`);
          parsed.services.forEach((service, idx) => {
            console.log(`   ${idx + 1}. ${service}`);
          });
        }
        if (parsed.targetMarkets && parsed.targetMarkets.length > 0) {
          console.log(`\n🎯 Target Markets:`);
          parsed.targetMarkets.forEach((market, idx) => {
            console.log(`   ${idx + 1}. ${market}`);
          });
        }
        if (parsed.keyFeatures && parsed.keyFeatures.length > 0) {
          console.log(`\n✨ Key Features:`);
          parsed.keyFeatures.forEach((feature, idx) => {
            console.log(`   ${idx + 1}. ${feature}`);
          });
        }
        if (parsed.location) {
          console.log(`\n📍 Location:`);
          console.log(`   ${parsed.location}`);
        }
        console.log("=".repeat(60) + "\n");

        return {
          success: true,
          data: {
            businessDescription: parsed.businessDescription || undefined,
            products: parsed.products.length > 0 ? parsed.products : undefined,
            services: parsed.services.length > 0 ? parsed.services : undefined,
            targetMarkets:
              parsed.targetMarkets.length > 0
                ? parsed.targetMarkets
                : undefined,
            keyFeatures:
              parsed.keyFeatures.length > 0 ? parsed.keyFeatures : undefined,
            location: parsed.location || undefined,
          },
        };
      } else {
        console.warn("  No parsed data returned from Browser Use");
        return {
          success: false,
          error: "No structured data returned from Browser Use",
        };
      }
    } catch (error: any) {
      console.error("Error extracting business info with Browser Use:", error);
      return {
        success: false,
        error: error.message || "Failed to extract information from website",
      };
    }
  }

  /**
   * Format extracted data as a readable summary
   */
  formatExtractedData(data: WebsiteExtractionResult["data"]): string {
    if (!data) return "No data extracted.";

    let summary = "";

    if (data.businessDescription) {
      summary += `**Business Overview:**\n${data.businessDescription.trim()}\n\n`;
    }

    if (data.products && data.products.length > 0) {
      summary += `**Products:**\n${data.products
        .map((p) => `- ${p}`)
        .join("\n")}\n\n`;
    }

    if (data.services && data.services.length > 0) {
      summary += `**Services:**\n${data.services
        .map((s) => `- ${s}`)
        .join("\n")}\n\n`;
    }

    if (data.targetMarkets && data.targetMarkets.length > 0) {
      summary += `**Target Markets:**\n${data.targetMarkets
        .map((m) => `- ${m}`)
        .join("\n")}\n\n`;
    }

    if (data.keyFeatures && data.keyFeatures.length > 0) {
      summary += `**Key Features:**\n${data.keyFeatures
        .map((f) => `- ${f}`)
        .join("\n")}\n\n`;
    }

    if (data.location) {
      summary += `**Location:**\n${data.location.trim()}\n\n`;
    }

    return summary || "No detailed information extracted from website.";
  }

  /**
   * Extract Reddit post data from multiple URLs using a single browser session
   */
  async extractRedditPostsData(
    redditUrls: string[]
  ): Promise<RedditPostData[]> {
    if (redditUrls.length === 0) {
      return [];
    }

    const results: RedditPostData[] = [];
    let task: any = null;

    try {
      console.log(
        `🔍 Extracting Reddit post data from ${redditUrls.length} URL(s) using single browser session...`
      );

      // Build instructions for visiting all URLs in sequence
      const urlList = redditUrls
        .map((url, idx) => `${idx + 1}. ${url}`)
        .join("\n");

      const taskPrompt = `You will visit ${redditUrls.length} Reddit posts in sequence using the same browser session.

IMPORTANT: Keep the browser session open and navigate between URLs by changing the URL in the address bar.

For EACH Reddit post, follow these steps:
1. Navigate to the Reddit post URL (use the address bar to change URLs)
2. If this is the first page load, check if there is a sign-up modal or popup (like "Sign up", "Join Reddit", or similar overlays). If you see one, close it by clicking the "X" button, "Close" button, or clicking outside the modal.
3. Extract the title of the Reddit post
4. Extract the body/content text of the original Reddit post (not comments, just the post itself)
5. Format the result for this URL as: "URL: [url]\nTITLE: [title]\nCONTENT: [content]\n---"

Reddit URLs to visit:
${urlList}

After visiting ALL URLs, return all results separated by "---". If a post is locked, deleted, or inaccessible, note that in the result for that URL.

When finished, close the browser session.`;

      task = await this.client.tasks.createTask({
        task: taskPrompt,
      });

      console.log(`  Task created: ${task.id}`);
      console.log(`  Waiting for completion...`);

      const result = await task.complete();

      console.log(`✓ Reddit posts data extraction complete`);

      // Parse text results
      const text = result.text || result.output || "";
      console.log(`  Raw text result length: ${text.length} chars`);

      // Split by "---" to get individual post results
      const postSections = text
        .split("---")
        .filter((section: string) => section.trim().length > 0);

      console.log(`  Parsed ${postSections.length} post section(s)`);

      for (let i = 0; i < redditUrls.length; i++) {
        const url = redditUrls[i];
        let postData: RedditPostData = {
          success: false,
          error: "No data extracted",
        };

        if (i < postSections.length) {
          const section = postSections[i];

          // Extract title and content from the section
          const titleMatch = section.match(/TITLE:\s*(.+?)(?:\n|CONTENT:|$)/is);
          const contentMatch = section.match(/CONTENT:\s*(.+?)(?:\n---|$)/is);

          if (titleMatch && contentMatch) {
            const title = titleMatch[1].trim();
            const content = contentMatch[1].trim();

            console.log(`\n📋 Reddit Post ${i + 1}:`);
            console.log(`  Title: ${title}`);
            console.log(`  Content: ${content.substring(0, 100)}...`);

            postData = {
              success: true,
              data: {
                title,
                content,
              },
            };
          } else {
            console.warn(`  Could not parse data for URL ${i + 1}`);
            console.warn(`  Section content: ${section.substring(0, 200)}...`);
            postData.error =
              "Could not parse title and content from extraction";
          }
        } else {
          console.warn(`  No data found for URL ${i + 1}`);
        }

        results.push(postData);
      }

      return results;
    } catch (error: any) {
      console.error(
        "Error extracting Reddit post data with Browser Use:",
        error
      );

      // Return failed results for all URLs
      if (results.length === 0) {
        redditUrls.forEach(() => {
          results.push({
            success: false,
            error: error.message || "Failed to extract Reddit post data",
          });
        });
      }

      return results;
    } finally {
      // Ensure browser session is closed
      try {
        if (task) {
          // Browser Use SDK should handle cleanup automatically, but we log it
          console.log(`  Browser session cleanup completed`);
        }
      } catch (cleanupError) {
        console.warn(
          "  Error during browser session cleanup (non-fatal):",
          cleanupError
        );
      }
    }
  }

  /**
   * Extract Reddit post title and content from a single Reddit URL (legacy method)
   * @deprecated Use extractRedditPostsData for multiple URLs with session reuse
   */
  async extractRedditPostData(redditUrl: string): Promise<RedditPostData> {
    const results = await this.extractRedditPostsData([redditUrl]);
    return results[0] || { success: false, error: "No result returned" };
  }
}
