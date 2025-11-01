import OpenAI from 'openai';
import { config } from '../config';
import { BusinessInfo, CustomerPrompt, VisibilityAnalysis, Recommendation, ChatGPTResponse, SingleRunResult, SEOContentIdea } from '../types';
import { formatBusinessInfoForPrompt } from '../utils/emailParser';

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: config.openai.apiKey });
    this.model = config.openai.model;
  }

  /**
   * Generate customer prompts that people might use when asking ChatGPT
   */
  async generateCustomerPrompts(businessInfo: BusinessInfo): Promise<CustomerPrompt[]> {
    const prompt = `Given the following business information, generate 5-7 realistic customer prompts that someone might use when asking ChatGPT for recommendations or information related to this TYPE of business.

Business Context (use this to understand what the business does):
${formatBusinessInfoForPrompt(businessInfo)}

CRITICAL: DO NOT mention the business name "${businessInfo.businessName}" in any of the generated prompts. These should be generic queries that a potential customer would ask when looking for this TYPE of service/product.

Generate prompts in different categories such as:
- Finding/discovering this type of business or service
- Comparing options in this industry
- Specific product/service needs that this business addresses
- Local recommendations (if location is relevant: ${businessInfo.location || 'general'})
- Quality and reputation inquiries
- Problem-solving queries related to what this business solves

Use the business description, products/services, and target market to create realistic queries that would naturally lead to this business being recommended.

Return the response as a JSON array with objects containing "category" and "prompt" fields.
Example format:
[
  {"category": "Finding a business", "prompt": "What are the best coffee roasters in Portland?"},
  {"category": "Comparing options", "prompt": "How do specialty coffee roasters differ from regular ones?"},
  {"category": "Product needs", "prompt": "Where can I find freshly roasted single-origin beans?"},
  {"category": "Quality inquiry", "prompt": "What makes a good specialty coffee roaster?"},
  {"category": "Local recommendations", "prompt": "Best places to buy artisan coffee in Portland?"}
]

Only return the JSON array, no additional text.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at understanding customer behavior and generating realistic search queries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '[]';

    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse customer prompts:', error);
      return [];
    }
  }

  /**
   * Analyze business visibility in AI conversations
   */
  async analyzeVisibility(businessInfo: BusinessInfo): Promise<VisibilityAnalysis> {
    const prompt = `Analyze the potential visibility of this business in AI assistant (like ChatGPT) conversations when users ask for recommendations.

${formatBusinessInfoForPrompt(businessInfo)}

Provide an analysis with:
1. Overall assessment (High/Medium/Low visibility)
2. Key factors affecting their visibility (size, reputation, online presence, niche specificity, location)
3. Current strengths that help visibility
4. Opportunities and gaps

Return the response as a JSON object with this structure:
{
  "overallAssessment": "High|Medium|Low",
  "keyFactors": ["factor 1", "factor 2", ...],
  "strengths": ["strength 1", "strength 2", ...],
  "opportunities": ["opportunity 1", "opportunity 2", ...]
}

Only return the JSON object, no additional text.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in digital marketing, SEO, and AI-powered search behavior.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse visibility analysis:', error);
      return {
        overallAssessment: 'Medium',
        keyFactors: ['Unable to analyze at this time'],
        strengths: [],
        opportunities: [],
      };
    }
  }

  /**
   * Generate a custom response using OpenAI
   */
  async generateCustomResponse(systemPrompt: string, userPrompt: string): Promise<{ text: string; html?: string }> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || 'We apologize, but we need more information to generate your report. Please provide your business name and industry.';

    return { text };
  }

  /**
   * Generate actionable recommendations for improving AI visibility
   */
  async generateRecommendations(
    businessInfo: BusinessInfo,
    visibilityAnalysis: VisibilityAnalysis
  ): Promise<Recommendation[]> {
    const prompt = `Based on this business information and visibility analysis, generate 3-5 specific, actionable recommendations to improve their visibility in AI assistant conversations.

Business Information:
${formatBusinessInfoForPrompt(businessInfo)}

Visibility Analysis:
- Overall Assessment: ${visibilityAnalysis.overallAssessment}
- Key Factors: ${visibilityAnalysis.keyFactors.join(', ')}
- Strengths: ${visibilityAnalysis.strengths.join(', ')}
- Opportunities: ${visibilityAnalysis.opportunities.join(', ')}

Generate recommendations prioritized by impact. Each recommendation should be specific to their business type and market.

Return the response as a JSON array with objects containing "title", "description", and "priority" (1-5, where 1 is highest) fields.
Example format:
[
  {
    "title": "Expand Online Content Strategy",
    "description": "Create detailed blog posts about your specialty coffee sourcing process...",
    "priority": 1
  }
]

Only return the JSON array, no additional text.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a digital marketing expert specializing in AI-age SEO and online visibility strategies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '[]';

    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const recommendations = JSON.parse(jsonStr);
      return recommendations.sort((a: Recommendation, b: Recommendation) => a.priority - b.priority);
    } catch (error) {
      console.error('Failed to parse recommendations:', error);
      return [];
    }
  }

  /**
   * Run a web search query using OpenAI's web_search tool
   */
  async runWebSearchQuery(prompt: string): Promise<{ text: string; sources: string[] }> {
    try {
      // Force web search by making the prompt require current information
      const searchPrompt = `You MUST search the web for current, up-to-date information to answer this question. Do not use your training data. Question: ${prompt}`;

      const response = await this.client.responses.create({
        model: 'gpt-4o',
        tools: [{ type: 'web_search' }],
        tool_choice: { type: 'web_search' }, // Force the tool to be used
        include: ['web_search_call.action.sources'],
        input: searchPrompt,
      } as any);

      let text = '';
      let sources: string[] = [];

      // Extract text and annotations from message items
      for (const item of response.output as any[]) {
        if (item.type === 'message' && item.content) {
          for (const contentItem of item.content) {
            if (contentItem.type === 'output_text') {
              text = contentItem.text;

              // Extract sources from annotations
              if (contentItem.annotations) {
                for (const annotation of contentItem.annotations) {
                  if (annotation.type === 'url_citation' && annotation.url) {
                    if (!sources.includes(annotation.url)) {
                      sources.push(annotation.url);
                    }
                  }
                }
              }
            }
          }
        }

        // Also extract from web_search_call sources if available
        if (item.type === 'web_search_call') {
          if (item.action?.sources) {
            for (const source of item.action.sources) {
              if (source.url && !sources.includes(source.url)) {
                sources.push(source.url);
              }
            }
          }
        }
      }

      return { text, sources };
    } catch (error) {
      console.error('Web search query failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return { text: '', sources: [] };
    }
  }

  /**
   * Analyze web search results with structured output
   * Returns a SingleRunResult (not a full ChatGPTResponse)
   */
  async analyzeWebSearchResults(
    prompt: string,
    webSearchText: string,
    businessInfo: BusinessInfo,
    sources: string[]
  ): Promise<SingleRunResult> {
    const analysisPrompt = `Analyze this web search result to determine if the business "${businessInfo.businessName}" was mentioned, and extract ALL competitors/alternatives mentioned.

Original Query: ${prompt}

Web Search Response:
${webSearchText}

Sources:
${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Business Information:
- Name: ${businessInfo.businessName}
- Website: ${businessInfo.website}
- Industry: ${businessInfo.industry}
- Products/Services: ${businessInfo.productsServices}

Task:
1. Determine if this business was mentioned in the response, and if so, what rank/position it appeared at.
2. Extract ALL other businesses/competitors mentioned in the response with their rank and which source URL they came from (match the source number to the list above).

Return a JSON object with:
- businessMentioned (boolean): true if the business was explicitly mentioned or recommended
- rank (number or null): If mentioned, the position in the list (1 for first, 2 for second, etc.). null if not mentioned or not in a ranked list.
- competitors (array): List of ALL other businesses mentioned. Each should have:
  - name (string): The competitor's name
  - rank (number): Their position in the recommendation (1 for first, 2 for second, etc.)
  - sourceIndex (number or null): The source number (1-based index) from the sources list above that this competitor came from, or null if unclear

Example format:
{
  "businessMentioned": false,
  "rank": null,
  "competitors": [
    {"name": "Competitor A", "rank": 1, "sourceIndex": 2},
    {"name": "Competitor B", "rank": 2, "sourceIndex": 2},
    {"name": "Competitor C", "rank": 3, "sourceIndex": 5}
  ]
}

Only return the JSON object, no additional text.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing search results and determining business mentions and rankings. Extract ALL businesses mentioned, not just the top ones. Be strict: only mark businessMentioned as true if the business is explicitly mentioned by name or clearly identifiable.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

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
        sources: sources, // Include ALL sources from web search
        competitors,
      };
    } catch (error) {
      console.error('Failed to analyze web search results:', error);
      return {
        businessMentioned: false,
        rank: null,
        sources: sources, // Include ALL sources even on error
        competitors: [],
      };
    }
  }

  /**
   * Process a single customer prompt with web search and analysis
   * Runs the prompt multiple times and calculates mention probability
   */
  async processCustomerPrompt(
    prompt: string,
    businessInfo: BusinessInfo,
    numRuns: number = 4
  ): Promise<ChatGPTResponse> {
    console.log(`  Running web search for: "${prompt.substring(0, 60)}..." (${numRuns} times in parallel)`);

    const allSources = new Set<string>();

    // Run all searches in parallel
    const runPromises = Array.from({ length: numRuns }, async (_, i) => {
      const runNumber = i + 1;
      console.log(`    Starting run ${runNumber}/${numRuns}...`);

      try {
        // Run web search
        const { text, sources } = await this.runWebSearchQuery(prompt);

        if (!text) {
          console.log(`      Run ${runNumber}: No results from web search`);
          return {
            businessMentioned: false,
            rank: null,
            sources: [],
            competitors: [],
          };
        }

        console.log(`      Run ${runNumber}: Found ${sources.length} sources`);

        // Analyze the results
        const analysis = await this.analyzeWebSearchResults(prompt, text, businessInfo, sources);

        console.log(`      Run ${runNumber}: ${analysis.businessMentioned ? `Mentioned (rank ${analysis.rank})` : 'Not mentioned'}`);

        return analysis;
      } catch (error) {
        console.error(`      Run ${runNumber}: Error occurred`, error);
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

    console.log(`  Overall: ${mentionCount}/${numRuns} mentions (${mentionProbability.toFixed(1)}%)`);

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

  /**
   * Generate a comment suggestion for a Reddit post based on the post title,
   * post content, and business information
   */
  async generateRedditCommentSuggestion(
    redditTitle: string,
    postContent: string,
    businessInfo: BusinessInfo
  ): Promise<string> {
    const prompt = `You are an expert at writing authentic Reddit comments that sound like a real Redditor wrote them - casual, low-key, and natural.

Reddit Post Title:
${redditTitle}

Reddit Post Content:
${postContent}

Business Information:
- Name: ${businessInfo.businessName}
- Products/Services: ${businessInfo.productsServices}
- Industry: ${businessInfo.industry}
- Target Customers: ${businessInfo.targetCustomers}

Your task: Write a comment that a real Redditor would post. The comment should:
1. Sound completely natural and human - like someone casually sharing their experience or knowledge
2. Be low-key and understated (Redditors don't like overly enthusiastic or salesy language)
3. Use casual language, maybe some internet slang or abbreviations (like "tbh", "imo", "fwiw", "imo" - but not overdoing it)
4. Naturally weave in the business without it feeling like an ad
5. Respond authentically to what the OP is asking about
6. Keep it short and conversational (2-4 sentences max)
7. Sound like you're genuinely helping, not selling

IMPORTANT: 
- Avoid corporate speak, marketing jargon, or promotional language
- Don't use phrases like "we offer", "our solution", "contact us" - those sound like ads
- Write like you're a person sharing something helpful, not a business promoting itself
- Use contractions, casual phrasing, maybe even some Reddit-style humor if appropriate
- The business mention should feel accidental or like a helpful recommendation, not intentional promotion

Write ONLY the comment text - no quotes, no explanations, nothing extra. Just the raw comment as if you're typing it on Reddit right now.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You write Reddit comments that sound exactly like a real Redditor - casual, low-key, using natural language with contractions and sometimes internet slang. You avoid corporate speak, marketing jargon, and anything that sounds promotional. Comments feel like someone casually sharing their experience, not a business trying to sell something.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      });

      const comment = response.choices[0]?.message?.content || '';
      return comment.trim();
    } catch (error) {
      console.error('Failed to generate Reddit comment suggestion:', error);
      return 'Could not generate comment suggestion.';
    }
  }

  /**
   * Extract business information from a website URL using web search
   */
  async extractBusinessInfoFromUrl(
    url: string,
    businessNameHint?: string
  ): Promise<{
    success: boolean;
    data?: {
      businessName: string;
      businessDescription: string;
      products: string[];
      services: string[];
      targetMarkets: string[];
      keyFeatures: string[];
      location: string;
    };
    error?: string;
  }> {
    try {
      console.log(`🌐 Extracting business info from ${url} using web search...`);

      // Use web search to get information about the website
      const searchQuery = `${url} business information products services target customers`;
      const searchResult = await this.runWebSearchQuery(searchQuery);

      if (!searchResult.text) {
        console.log(`  Could not fetch information from web search`);
        return {
          success: false,
          error: 'Could not fetch information via web search',
        };
      }

      console.log(`  Fetched content (${searchResult.text.length} chars)`);

      // Use OpenAI to extract structured business information
      const extractionPrompt = `Analyze the following information about the website ${url} and extract structured business information.

Website Content:
${searchResult.text}

Extract the following information:
1. Business Name: The name of the company/business
2. Business Description: A comprehensive description of what the business does
3. Products: List of main products they offer (as an array of strings)
4. Services: List of main services they provide (as an array of strings)
5. Target Markets: Who their target customers/audience are (as an array of strings)
6. Key Features: Main features or differentiators that make them unique (as an array of strings)
7. Location: Physical location or areas they serve

Return a JSON object with these fields:
{
  "businessName": "string",
  "businessDescription": "string",
  "products": ["string"],
  "services": ["string"],
  "targetMarkets": ["string"],
  "keyFeatures": ["string"],
  "location": "string"
}

If any information is not available, use empty strings or empty arrays.

Only return the JSON object, no additional text.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You extract structured business information from website content. Be thorough and accurate.',
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (!parsed.businessName && !parsed.businessDescription) {
        console.log(`  Could not extract business information`);
        return {
          success: false,
          error: 'Could not extract business information from content',
        };
      }

      // Use hint if business name is missing or generic
      if (businessNameHint && (!parsed.businessName || parsed.businessName === 'Unknown' || parsed.businessName.length < 3)) {
        parsed.businessName = businessNameHint;
      }

      console.log(`✓ Extracted business info successfully`);
      console.log(`  Business Name: ${parsed.businessName}`);
      console.log(`  Description: ${parsed.businessDescription.substring(0, 100)}...`);
      console.log(`  Products: ${parsed.products?.length || 0}`);
      console.log(`  Services: ${parsed.services?.length || 0}`);
      console.log(`  Target Markets: ${parsed.targetMarkets?.length || 0}`);
      console.log(`  Key Features: ${parsed.keyFeatures?.length || 0}`);
      console.log(`  Location: ${parsed.location}`);

      return {
        success: true,
        data: {
          businessName: parsed.businessName || businessNameHint || 'Unknown Business',
          businessDescription: parsed.businessDescription || '',
          products: Array.isArray(parsed.products) ? parsed.products : [],
          services: Array.isArray(parsed.services) ? parsed.services : [],
          targetMarkets: Array.isArray(parsed.targetMarkets) ? parsed.targetMarkets : [],
          keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : [],
          location: parsed.location || '',
        },
      };

    } catch (error) {
      console.error('Error extracting business info via web search:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract business information',
      };
    }
  }

  /**
   * Search for Reddit posts relevant to the business using web search
   * and generate comment suggestions (no Browser Use required)
   */
  async searchAndAnalyzeRedditPosts(
    businessInfo: BusinessInfo,
    maxPosts: number = 3
  ): Promise<{
    url: string;
    title: string;
    suggestedComment: string;
  }[]> {
    try {
      console.log(`\n🔍 Searching for relevant Reddit posts about ${businessInfo.industry}...`);

      // Construct a search query to find Reddit posts
      const searchQuery = `site:reddit.com ${businessInfo.industry} ${businessInfo.productsServices.substring(0, 100)} recommendations`;

      console.log(`  Search query: ${searchQuery}`);

      // Perform web search to find Reddit posts
      const searchResult = await this.runWebSearchQuery(searchQuery);

      if (!searchResult.text || searchResult.sources.length === 0) {
        console.log(`  No Reddit posts found in search results`);
        return [];
      }

      console.log(`  Found ${searchResult.sources.length} sources from web search`);

      // Filter for Reddit URLs
      const redditUrls = searchResult.sources
        .filter(url => url.includes('reddit.com/r/') && (url.includes('/comments/') || url.includes('/r/')))
        .slice(0, maxPosts);

      console.log(`  Filtered to ${redditUrls.length} Reddit URLs`);

      if (redditUrls.length === 0) {
        console.log(`  No valid Reddit post URLs found`);
        return [];
      }

      // For each Reddit URL, fetch its content and generate a comment
      const suggestions = [];

      for (const url of redditUrls) {
        try {
          console.log(`\n  Processing Reddit URL: ${url}`);

          // Use web search to get the content of this specific Reddit post
          const postQuery = `${url} post content`;
          const postResult = await this.runWebSearchQuery(postQuery);

          if (!postResult.text) {
            console.log(`    Could not fetch post content`);
            continue;
          }

          console.log(`    Fetched post content (${postResult.text.length} chars)`);

          // Use OpenAI to extract the title and content, then generate a comment
          const analysisPrompt = `Analyze this Reddit post and extract the title and main post content (not comments).

Reddit Post Data:
${postResult.text}

Return a JSON object with:
- title: The post title
- content: The main post content/body

Only return the JSON object, no additional text.`;

          const analysisResponse = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You extract structured data from Reddit posts.',
              },
              {
                role: 'user',
                content: analysisPrompt,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          });

          const parsed = JSON.parse(analysisResponse.choices[0]?.message?.content || '{}');

          if (!parsed.title || !parsed.content) {
            console.log(`    Could not extract title/content from post`);
            continue;
          }

          console.log(`    Extracted - Title: ${parsed.title}`);
          console.log(`    Extracted - Content: ${parsed.content.substring(0, 100)}...`);

          // Generate comment suggestion
          const commentSuggestion = await this.generateRedditCommentSuggestion(
            parsed.title,
            parsed.content,
            businessInfo
          );

          if (commentSuggestion && commentSuggestion.trim().length > 0) {
            suggestions.push({
              url,
              title: parsed.title,
              suggestedComment: commentSuggestion,
            });
            console.log(`    ✓ Generated comment suggestion (${commentSuggestion.length} chars)`);
          }

        } catch (error) {
          console.error(`    Error processing Reddit URL ${url}:`, error);
          continue;
        }
      }

      console.log(`\n✓ Generated ${suggestions.length} Reddit comment suggestion(s)`);
      return suggestions;

    } catch (error) {
      console.error('Error searching and analyzing Reddit posts:', error);
      return [];
    }
  }

  /**
   * Generate SEO content ideas based on sources that are being quoted
   */
  async generateSEOContentIdeas(
    sources: string[],
    businessInfo: BusinessInfo
  ): Promise<SEOContentIdea[]> {
    // Analyze the domains and topics from sources
    const domains = new Set<string>();
    sources.forEach((source) => {
      try {
        const url = new URL(source);
        const domain = url.hostname.replace(/^www\./, '');
        domains.add(domain);
      } catch (e) {
        // Skip invalid URLs
      }
    });

    const topDomains = Array.from(domains).slice(0, 10).join(', ');

    const prompt = `You are an SEO expert. Based on the sources that are being quoted and referenced for "${businessInfo.businessName}", generate 5 blog post ideas that would help improve their AI visibility.

Business Information:
- Name: ${businessInfo.businessName}
- Products/Services: ${businessInfo.productsServices}
- Industry: ${businessInfo.industry}
- Target Customers: ${businessInfo.targetCustomers}

Top Source Domains Being Referenced:
${topDomains}

Sources Being Quoted (sample):
${sources.slice(0, 20).map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate 5 SEO-optimized blog post ideas that:
1. Address topics similar to what the top sources cover
2. Would naturally be referenced by AI assistants when answering relevant queries
3. Are tailored to the business's industry and target customers
4. Are actionable and valuable content that would rank well

Return the response as a JSON array with objects containing "title" and "description" fields. Each description should be one sentence explaining what to include in the blog post.

Example format:
[
  {
    "title": "How to Choose the Right [Topic] for Your Business",
    "description": "Create a comprehensive guide covering [specific points] that addresses common questions your target audience has."
  }
]

Only return the JSON array, no additional text.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert specializing in content strategy that improves AI assistant visibility.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '[]';
      
      // Try to parse as JSON array
      let parsed: any;
      try {
        // First try direct parsing
        parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5);
        }
        // If wrapped in an object, extract the array
        if (parsed.ideas && Array.isArray(parsed.ideas)) {
          return parsed.ideas.slice(0, 5);
        }
        if (parsed.contentIdeas && Array.isArray(parsed.contentIdeas)) {
          return parsed.contentIdeas.slice(0, 5);
        }
      } catch (e) {
        // Try to extract JSON array from the response text
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
              return parsed.slice(0, 5);
            }
          } catch (parseError) {
            // Fall through to warning
          }
        }
      }

      // Fallback: return empty array if parsing fails
      console.warn('Failed to parse SEO content ideas, returning empty array');
      return [];
    } catch (error) {
      console.error('Failed to generate SEO content ideas:', error);
      return [];
    }
  }
}
