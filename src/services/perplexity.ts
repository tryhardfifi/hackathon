import OpenAI from 'openai';
import { BusinessInfo, SingleRunResult, ChatGPTResponse } from '../types';

export class PerplexityService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    // Perplexity uses an OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.perplexity.ai',
    });
    this.model = 'llama-3.1-sonar-small-128k-online'; // Perplexity's online search model
  }

  /**
   * Run a search query using Perplexity
   */
  async runSearchQuery(prompt: string): Promise<{ text: string; sources: string[] }> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate, up-to-date information from the web. Always cite your sources.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const text = response.choices[0]?.message?.content || '';

      // Extract citations from the response
      const sources: string[] = [];

      // Perplexity includes citations in the response
      // They're typically returned in a specific format
      // For now, we'll extract URLs from the text or use metadata if available
      if ((response as any).citations) {
        sources.push(...(response as any).citations);
      }

      return { text, sources };
    } catch (error) {
      console.error('Perplexity search query failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return { text: '', sources: [] };
    }
  }

  /**
   * Analyze search results to determine business mentions
   */
  async analyzeSearchResults(
    prompt: string,
    searchText: string,
    businessInfo: BusinessInfo,
    sources: string[]
  ): Promise<SingleRunResult> {
    const analysisPrompt = `Analyze this search result to determine if the business "${businessInfo.businessName}" was mentioned, and extract ALL competitors/alternatives mentioned.

Original Query: ${prompt}

Search Response:
${searchText}

Sources:
${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Business Information:
- Name: ${businessInfo.businessName}
- Website: ${businessInfo.website}
- Industry: ${businessInfo.industry}
- Products/Services: ${businessInfo.productsServices}

Task:
1. Determine if this business was mentioned in the response, and if so, what rank/position it appeared at.
2. Extract ALL other businesses/competitors mentioned in the response with their rank and which source URL they came from.

Return a JSON object with:
- businessMentioned (boolean): true if the business was explicitly mentioned or recommended
- rank (number or null): If mentioned, the position in the list (1 for first, 2 for second, etc.). null if not mentioned or not in a ranked list.
- competitors (array): List of ALL other businesses mentioned. Each should have:
  - name (string): The competitor's name
  - rank (number): Their position in the recommendation
  - sourceIndex (number or null): The source number from the sources list above

Example format:
{
  "businessMentioned": false,
  "rank": null,
  "competitors": [
    {"name": "Competitor A", "rank": 1, "sourceIndex": 2},
    {"name": "Competitor B", "rank": 2, "sourceIndex": 2}
  ]
}

Only return the JSON object, no additional text.`;

    try {
      // Use a standard GPT model for analysis (Perplexity's API compatible with OpenAI)
      const response = await this.client.chat.completions.create({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing search results. Extract ALL businesses mentioned. Be strict: only mark businessMentioned as true if explicitly mentioned.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '{}';

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);

      // Map sourceIndex to actual source URLs
      const competitors = (parsed.competitors || []).map((comp: any) => ({
        name: comp.name,
        rank: comp.rank,
        sourceUrl: comp.sourceIndex && comp.sourceIndex >= 1 && comp.sourceIndex <= sources.length
          ? sources[comp.sourceIndex - 1]
          : null,
      }));

      return {
        businessMentioned: parsed.businessMentioned || false,
        rank: parsed.rank || null,
        sources: sources,
        competitors,
      };
    } catch (error) {
      console.error('Failed to analyze Perplexity search results:', error);
      return {
        businessMentioned: false,
        rank: null,
        sources: sources,
        competitors: [],
      };
    }
  }

  /**
   * Process a single customer prompt with Perplexity search and analysis
   * Runs the prompt multiple times and calculates mention probability
   */
  async processCustomerPrompt(
    prompt: string,
    businessInfo: BusinessInfo,
    numRuns: number = 4
  ): Promise<ChatGPTResponse> {
    console.log(`  Running Perplexity search for: "${prompt.substring(0, 60)}..." (${numRuns} times in parallel)`);

    const allSources = new Set<string>();

    // Run all searches in parallel
    const runPromises = Array.from({ length: numRuns }, async (_, i) => {
      const runNumber = i + 1;
      console.log(`    Starting Perplexity run ${runNumber}/${numRuns}...`);

      try {
        // Run Perplexity search
        const { text, sources } = await this.runSearchQuery(prompt);

        if (!text) {
          console.log(`      Perplexity run ${runNumber}: No results from search`);
          return {
            businessMentioned: false,
            rank: null,
            sources: [],
            competitors: [],
          };
        }

        console.log(`      Perplexity run ${runNumber}: Found ${sources.length} sources`);

        // Analyze the results
        const analysis = await this.analyzeSearchResults(prompt, text, businessInfo, sources);

        console.log(`      Perplexity run ${runNumber}: ${analysis.businessMentioned ? `Mentioned (rank ${analysis.rank})` : 'Not mentioned'}`);

        return analysis;
      } catch (error) {
        console.error(`      Perplexity run ${runNumber}: Error occurred`, error);
        return {
          businessMentioned: false,
          rank: null,
          sources: [],
          competitors: [],
        };
      }
    });

    // Wait for all runs to complete
    const runs = await Promise.all(runPromises);

    // Collect all unique sources
    runs.forEach(run => {
      run.sources.forEach(source => allSources.add(source));
    });

    // Calculate statistics
    const mentionCount = runs.filter(run => run.businessMentioned).length;
    const mentionProbability = (mentionCount / numRuns) * 100;

    // Calculate average rank (only for runs where mentioned)
    const mentionedRuns = runs.filter(run => run.businessMentioned && run.rank !== null);
    const avgRank = mentionedRuns.length > 0
      ? mentionedRuns.reduce((sum, run) => sum + (run.rank || 0), 0) / mentionedRuns.length
      : null;

    console.log(`  Perplexity Overall: ${mentionCount}/${numRuns} mentions (${mentionProbability.toFixed(1)}%)`);

    return {
      prompt,
      businessMentioned: mentionCount > 0,
      rank: avgRank,
      sources: Array.from(allSources),
      mentionProbability,
      runs,
      totalRuns: numRuns,
    };
  }
}
