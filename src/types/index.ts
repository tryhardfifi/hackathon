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

export interface VisibilityAnalysis {
  overallAssessment: 'High' | 'Medium' | 'Low';
  keyFactors: string[];
  strengths: string[];
  opportunities: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: number;
}

export interface SingleRunResult {
  businessMentioned: boolean;
  rank: number | null;
  sources: string[];
}

export interface ChatGPTResponse {
  prompt: string;
  businessMentioned: boolean; // Kept for backwards compatibility - true if mentioned at least once
  rank: number | null; // Average rank across runs where mentioned
  sources: string[]; // All unique sources from all runs
  mentionProbability: number; // Percentage (0-100) of runs where business was mentioned
  runs: SingleRunResult[]; // Individual run results
  totalRuns: number; // Number of times the prompt was run
}

export interface Report {
  businessName: string;
  generatedDate: string;
  customerPrompts: CustomerPrompt[];
  visibilityAnalysis: VisibilityAnalysis;
  chatGPTResponses: ChatGPTResponse[];
  recommendations: Recommendation[];
}

export interface EmailThread {
  id: string;
  subject: string;
  from: string;
  body: string;
  labels: string[];
}

export interface AgentMailMessage {
  id: string;
  thread_id: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  created_at: string;
}

export interface AgentMailThread {
  id: string;
  subject: string;
  messages: AgentMailMessage[];
  labels: string[];
}
