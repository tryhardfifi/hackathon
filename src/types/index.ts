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

export interface Report {
  businessName: string;
  generatedDate: string;
  customerPrompts: CustomerPrompt[];
  visibilityAnalysis: VisibilityAnalysis;
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
