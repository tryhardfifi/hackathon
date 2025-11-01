import OpenAI from 'openai';
import { config } from '../config';
import { BusinessInfo, CustomerPrompt, VisibilityAnalysis, Recommendation } from '../types';
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
    const prompt = `Given the following business information, generate 7-10 realistic customer prompts that someone might use when asking ChatGPT for recommendations or information related to this business.

${formatBusinessInfoForPrompt(businessInfo)}

Generate prompts in different categories such as:
- Finding/discovering this type of business
- Comparing options in this industry
- Specific product/service needs
- Local recommendations
- Quality and reputation inquiries

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
}
