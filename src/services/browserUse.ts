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
}
