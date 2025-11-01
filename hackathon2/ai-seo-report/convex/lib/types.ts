import { Id } from "../_generated/dataModel";

export interface BusinessInfo {
  businessName: string;
  industry: string;
  productsServices: string;
  targetCustomers: string;
  location: string;
  website?: string;
  additionalContext?: string;
}

export interface CustomerPrompt {
  category: string;
  prompt: string;
}

export interface CompetitorMention {
  name: string;
  rank: number;
  sourceUrl: string | null;
}

export interface SingleRunResult {
  businessMentioned: boolean;
  rank: number | null;
  sources: string[];
  competitors: CompetitorMention[];
  rawResponse: string;
}

export interface SearchResponse {
  prompt: string;
  businessMentioned: boolean;
  rank: number | null;
  sources: string[];
  mentionProbability: number;
  runs: SingleRunResult[];
  totalRuns: number;
}

export interface VisibilityAnalysis {
  overallAssessment: "High" | "Medium" | "Low";
  keyFactors: string[];
  strengths: string[];
  opportunities: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: number;
}
