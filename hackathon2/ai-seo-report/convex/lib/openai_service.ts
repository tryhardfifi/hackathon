import OpenAI from "openai";
import {
  BusinessInfo,
  CustomerPrompt,
  VisibilityAnalysis,
  Recommendation,
  SingleRunResult,
  SearchResponse,
  CompetitorMention,
} from "./types";

export class OpenAIService {
  /**
   * Get OpenAI client (initialized lazily)
   */
  private static getClient(): OpenAI {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Extract business information from a URL
   */
  static async extractBusinessInfoFromURL(url: string): Promise<BusinessInfo> {
    const openai = this.getClient();
    // Fetch the webpage
    const response = await fetch(url);
    const html = await response.text();

    // Clean HTML and extract text (basic implementation)
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50000); // Truncate to manageable size

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a business analyst. Extract structured business information from website content. Return a JSON object with these fields:
- businessName: The company name
- industry: The industry/sector
- productsServices: What they offer
- targetCustomers: Who they serve
- location: Where they operate
- additionalContext: Any other relevant info`,
        },
        {
          role: "user",
          content: `Extract business information from this website (${url}):\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      ...result,
      website: url,
    };
  }

  /**
   * Generate customer prompts based on business info
   */
  static async generateCustomerPrompts(
    businessInfo: BusinessInfo,
    count: number = 10
  ): Promise<CustomerPrompt[]> {
    const openai = this.getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a marketing expert. Generate realistic search queries that potential customers would use to find businesses like this one.

CRITICAL RULES:
1. Do NOT mention the business name in the prompts
2. Focus on generic queries about the products/services/needs
3. Simulate how NEW customers discover businesses
4. Include different query types: discovery, comparison, problem-solving, local search

Generate prompts across these categories:
- Finding/discovering this type of business
- Comparing options in the industry
- Specific product/service needs
- Local recommendations
- Quality and reputation inquiries
- Problem-solving queries

Return a JSON array of objects with: category (string) and prompt (string)`,
        },
        {
          role: "user",
          content: `Generate ${count} search queries for a business with these characteristics:
- Name: ${businessInfo.businessName} (DO NOT USE THIS IN PROMPTS)
- Industry: ${businessInfo.industry}
- Products/Services: ${businessInfo.productsServices}
- Target Customers: ${businessInfo.targetCustomers}
- Location: ${businessInfo.location}
- Additional Context: ${businessInfo.additionalContext || "None"}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result.prompts || [];
  }

  /**
   * Analyze business visibility potential
   */
  static async analyzeVisibility(
    businessInfo: BusinessInfo
  ): Promise<VisibilityAnalysis> {
    const openai = this.getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI visibility expert. Analyze how likely a business is to be mentioned in AI assistant responses.

Consider:
- Company size and reputation
- Online presence strength
- Niche specificity
- Location relevance
- Industry competitiveness

Categorize as High/Medium/Low visibility and provide specific factors.

Return JSON with:
- overallAssessment: "High" | "Medium" | "Low"
- keyFactors: string[] (3-5 factors affecting visibility)
- strengths: string[] (3-5 existing strengths)
- opportunities: string[] (3-5 opportunities for improvement)`,
        },
        {
          role: "user",
          content: `Analyze visibility potential for:
${JSON.stringify(businessInfo, null, 2)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  }

  /**
   * Run a single web search query and get response
   */
  static async runWebSearchQuery(
    prompt: string,
    businessName: string
  ): Promise<{ response: string; sources: string[] }> {
    const openai = this.getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      tools: [
        {
          type: "web_search",
        },
      ],
    });

    const message = completion.choices[0].message;
    const response = message.content || "";

    // Extract sources from tool calls or response
    const sources: string[] = [];
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === "web_search" && toolCall.web_search) {
          sources.push(...toolCall.web_search.results.map((r: any) => r.url));
        }
      }
    }

    return { response, sources };
  }

  /**
   * Analyze a search response to extract mentions and competitors
   */
  static async analyzeSearchResponse(
    prompt: string,
    response: string,
    businessName: string
  ): Promise<Omit<SingleRunResult, "sources" | "rawResponse">> {
    const openai = this.getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are analyzing AI assistant responses to determine business mentions and competitors.

Analyze if "${businessName}" is mentioned and extract competitor information.

Return JSON with:
- businessMentioned: boolean (true if ${businessName} is mentioned)
- rank: number | null (1-10, position in recommendation list, null if not mentioned)
- competitors: array of { name: string, rank: number, sourceUrl: string | null }

Rules:
- Only mark businessMentioned=true if "${businessName}" is explicitly mentioned
- rank=1 means first/top recommendation
- Include all competitor businesses mentioned
- Be strict about business name matching`,
        },
        {
          role: "user",
          content: `Query: "${prompt}"

Response: "${response}"

Extract mentions of "${businessName}" and all competitors.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  }

  /**
   * Process a customer prompt with multiple runs
   */
  static async processCustomerPrompt(
    prompt: string,
    businessName: string,
    runs: number = 4
  ): Promise<SearchResponse> {
    console.log(`Processing prompt: "${prompt}" with ${runs} runs...`);

    // Run searches in parallel
    const runResults = await Promise.all(
      Array.from({ length: runs }, async (_, i) => {
        try {
          console.log(`  Run ${i + 1}/${runs}...`);

          // Run web search
          const { response, sources } = await this.runWebSearchQuery(
            prompt,
            businessName
          );

          // Analyze response
          const analysis = await this.analyzeSearchResponse(
            prompt,
            response,
            businessName
          );

          const result: SingleRunResult = {
            ...analysis,
            sources,
            rawResponse: response,
          };

          console.log(
            `  Run ${i + 1}: ${result.businessMentioned ? "✓ Mentioned" : "✗ Not mentioned"}`
          );

          return result;
        } catch (error) {
          console.error(`  Run ${i + 1} failed:`, error);
          // Return empty result on failure
          return {
            businessMentioned: false,
            rank: null,
            sources: [],
            competitors: [],
            rawResponse: "",
          };
        }
      })
    );

    // Aggregate results
    const mentionedRuns = runResults.filter((r) => r.businessMentioned);
    const businessMentioned = mentionedRuns.length > 0;
    const mentionProbability = (mentionedRuns.length / runs) * 100;

    const avgRank =
      mentionedRuns.length > 0
        ? mentionedRuns.reduce((sum, r) => sum + (r.rank || 0), 0) /
          mentionedRuns.length
        : null;

    // Collect all unique sources
    const allSources = Array.from(
      new Set(runResults.flatMap((r) => r.sources))
    );

    return {
      prompt,
      businessMentioned,
      rank: avgRank,
      sources: allSources,
      mentionProbability,
      runs: runResults,
      totalRuns: runs,
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  static async generateRecommendations(
    businessInfo: BusinessInfo,
    visibilityAnalysis: VisibilityAnalysis
  ): Promise<Recommendation[]> {
    const openai = this.getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI visibility consultant. Generate specific, actionable recommendations to improve a business's visibility in AI assistant responses.

Return JSON with array of recommendations, each with:
- title: string (clear, action-oriented title)
- description: string (detailed explanation with specific steps)
- priority: number (1-5, where 1 is highest priority)

Focus on:
- Content strategy
- Online presence optimization
- Source site appearances
- Local SEO
- Authority building`,
        },
        {
          role: "user",
          content: `Generate 3-5 recommendations for:

Business Info:
${JSON.stringify(businessInfo, null, 2)}

Visibility Analysis:
${JSON.stringify(visibilityAnalysis, null, 2)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result.recommendations || [];
  }
}
