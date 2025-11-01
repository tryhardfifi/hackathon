import OpenAI from "openai";
import {
  BusinessInfo,
  SearchResponse,
  SingleRunResult,
  CompetitorMention,
} from "../types";

export class PerplexityService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    // Perplexity uses an OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.perplexity.ai",
    });
    this.model = "llama-3.1-sonar-small-128k-online";
  }

  /**
   * Run a search query using Perplexity
   */
  async runSearchQuery(
    prompt: string
  ): Promise<{ response: string; sources: string[] }> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides accurate, up-to-date information from the web. Always cite your sources.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const response = completion.choices[0]?.message?.content || "";

      // Extract citations from the response
      const sources: string[] = [];
      if ((completion as any).citations) {
        sources.push(...(completion as any).citations);
      }

      return { response, sources };
    } catch (error) {
      console.error("Perplexity search query failed:", error);
      return { response: "", sources: [] };
    }
  }

  /**
   * Analyze search results using OpenAI (more reliable than Perplexity for analysis)
   */
  async analyzeSearchResults(
    prompt: string,
    searchResponse: string,
    businessName: string,
    sources: string[]
  ): Promise<Omit<SingleRunResult, "sources" | "rawResponse">> {
    // Use OpenAI for analysis (more reliable)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are analyzing search results to determine business mentions and competitors.

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

Response: "${searchResponse}"

Sources:
${sources.map((s, i) => `${i + 1}. ${s}`).join("\n")}

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
  async processCustomerPrompt(
    prompt: string,
    businessName: string,
    runs: number = 4
  ): Promise<SearchResponse> {
    console.log(`Processing Perplexity prompt: "${prompt}" with ${runs} runs...`);

    // Run searches in parallel
    const runResults = await Promise.all(
      Array.from({ length: runs }, async (_, i) => {
        try {
          console.log(`  Perplexity Run ${i + 1}/${runs}...`);

          // Run Perplexity search
          const { response, sources } = await this.runSearchQuery(prompt);

          if (!response) {
            return {
              businessMentioned: false,
              rank: null,
              sources: [],
              competitors: [],
              rawResponse: "",
            };
          }

          // Analyze response
          const analysis = await this.analyzeSearchResults(
            prompt,
            response,
            businessName,
            sources
          );

          const result: SingleRunResult = {
            ...analysis,
            sources,
            rawResponse: response,
          };

          console.log(
            `  Perplexity Run ${i + 1}: ${result.businessMentioned ? "✓ Mentioned" : "✗ Not mentioned"}`
          );

          return result;
        } catch (error) {
          console.error(`  Perplexity Run ${i + 1} failed:`, error);
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
}
