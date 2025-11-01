import OpenAI from 'openai';
import { config } from '../config';
import { BusinessInfo, CustomerPrompt, VisibilityAnalysis, Recommendation, ChatGPTResponse } from '../types';
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
    const prompt = `Given the following business information, generate 7-10 realistic customer prompts that someone might use when asking ChatGPT for recommendations or information related to this TYPE of business.

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
  {"category": "Comparing options", "prompt": "How do specialty coffee roasters differ from regular ones?"}
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
      const response = await this.client.responses.create({
        model: 'gpt-4o',
        tools: [{ type: 'web_search' }],
        include: ['web_search_call.action.sources'],
        input: prompt,
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
        if (item.type === 'web_search_call' && item.action?.sources) {
          for (const source of item.action.sources) {
            if (source.url && !sources.includes(source.url)) {
              sources.push(source.url);
            }
          }
        }
      }

      return { text, sources };
    } catch (error) {
      console.error('Web search query failed:', error);
      return { text: '', sources: [] };
    }
  }

  /**
   * Analyze web search results with structured output
   */
  async analyzeWebSearchResults(
    prompt: string,
    webSearchText: string,
    businessInfo: BusinessInfo,
    sources: string[]
  ): Promise<ChatGPTResponse> {
    const analysisPrompt = `Analyze this web search result to determine if the business "${businessInfo.businessName}" was mentioned.

Original Query: ${prompt}

Web Search Response:
${webSearchText}

Business Information:
- Name: ${businessInfo.businessName}
- Website: ${businessInfo.website}
- Industry: ${businessInfo.industry}
- Products/Services: ${businessInfo.productsServices}

Task: Determine if this business was mentioned in the response, and if so, what rank/position it appeared at.

Return a JSON object with:
- businessMentioned (boolean): true if the business was explicitly mentioned or recommended
- rank (number or null): If mentioned, the position in the list (1 for first, 2 for second, etc.). null if not mentioned or not in a ranked list.

Only return the JSON object, no additional text.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing search results and determining business mentions and rankings. Be strict: only mark businessMentioned as true if the business is explicitly mentioned by name or clearly identifiable.',
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

      return {
        prompt,
        businessMentioned: parsed.businessMentioned || false,
        rank: parsed.rank || null,
        sources: sources, // Include ALL sources from web search
      };
    } catch (error) {
      console.error('Failed to analyze web search results:', error);
      return {
        prompt,
        businessMentioned: false,
        rank: null,
        sources: sources, // Include ALL sources even on error
      };
    }
  }

  /**
   * Process a single customer prompt with web search and analysis
   */
  async processCustomerPrompt(
    prompt: string,
    businessInfo: BusinessInfo
  ): Promise<ChatGPTResponse> {
    console.log(`  Running web search for: "${prompt.substring(0, 60)}..."`);

    // Run web search
    const { text, sources } = await this.runWebSearchQuery(prompt);

    if (!text) {
      console.log('    No results from web search');
      return {
        prompt,
        businessMentioned: false,
        rank: null,
        sources: [],
      };
    }

    console.log(`    Found ${sources.length} sources`);

    // Analyze the results
    const analysis = await this.analyzeWebSearchResults(prompt, text, businessInfo, sources);

    console.log(`    Analysis: ${analysis.businessMentioned ? `Mentioned (rank ${analysis.rank})` : 'Not mentioned'}`);

    return analysis;
  }
}
