

# Presence Report Generation Workflow

## Overview

This document explains the complete workflow for generating an AI visibility report from a business URL or name. The system analyzes how visible a business is when users ask AI assistants (GPT and Perplexity) for recommendations.

---

## High-Level Flow

```
URL/Business Name
    ↓
Business Information Extraction
    ↓
Customer Prompt Generation
    ↓
Visibility Analysis
    ↓
Parallel Web Search Execution (GPT + Perplexity)
    ↓
Results Analysis & Aggregation
    ↓
Recommendations Generation
    ↓
Report Generation (HTML + Text)
    ↓
Delivery (Email or File)
```

---

## Detailed Step-by-Step Process

### Phase 1: Business Information Extraction

**Input**: Business website URL

**Goal**: Extract structured business information to understand what the company does

**Two Modes Available**:

#### Mode 1: GPT Fast Mode (Default)
- **Service**: `GPTBusinessExtractor`
- **Process**:
  1. Fetch the website HTML content
  2. Clean and extract text from HTML (remove scripts, styles, etc.)
  3. Truncate to manageable size (~50k characters)
  4. Send to GPT-4 with extraction prompt
  5. Parse structured JSON response

- **Extracted Data**:
  ```typescript
  {
    businessName: string
    businessDescription: string
    targetMarket: string
    location: string
    additionalInfo: string
  }
  ```

#### Mode 2: Browser Use (More Accurate)
- **Service**: `BrowserUseService`
- **Process**:
  1. Launches an AI-controlled browser
  2. Navigates to the website
  3. Intelligently explores the site (About page, Services, etc.)
  4. Extracts information through interactive browsing
  5. Returns more detailed business context

- **Trade-off**: More accurate but slower (~30-60 seconds vs ~5-10 seconds)

**Output**: `BusinessInfo` object containing all extracted details

---

### Phase 2: Customer Prompt Generation

**Goal**: Generate realistic search queries that potential customers would use

**Service**: `OpenAIService.generateCustomerPrompts()`

**Process**:
1. Takes the `BusinessInfo` object
2. Creates a detailed prompt for GPT explaining the business
3. **Critical Rule**: Generated prompts must NOT mention the business name
   - This ensures we're testing generic queries, not brand searches
   - Simulates how new customers discover businesses
4. Requests prompts across different categories:
   - Finding/discovering this type of business
   - Comparing options in the industry
   - Specific product/service needs
   - Local recommendations
   - Quality and reputation inquiries
   - Problem-solving queries

**Output**: Array of `CustomerPrompt` objects
```typescript
[
  {
    category: "Finding a business",
    prompt: "What are the best coffee roasters in Portland?"
  },
  {
    category: "Comparing options",
    prompt: "How do specialty coffee roasters differ from regular ones?"
  }
]
```

**Example**: For a Portland coffee roaster, generates queries like:
- "Best specialty coffee roasters in Portland"
- "Where to buy freshly roasted coffee beans"
- NOT: "Tell me about [Business Name]" ❌

---

### Phase 3: Initial Visibility Analysis

**Goal**: Assess the business's potential visibility in AI conversations

**Service**: `OpenAIService.analyzeVisibility()`

**Process**:
1. Sends business information to GPT-4
2. Requests analysis of visibility factors:
   - Company size and reputation
   - Online presence strength
   - Niche specificity
   - Location relevance
3. Categorizes as High/Medium/Low visibility

**Output**: `VisibilityAnalysis` object
```typescript
{
  overallAssessment: "High" | "Medium" | "Low"
  keyFactors: string[]
  strengths: string[]
  opportunities: string[]
}
```

---

### Phase 4: Parallel Web Search Execution

**Goal**: Test each customer prompt through both GPT and Perplexity to see if the business gets mentioned

**This is the most critical and resource-intensive phase**

#### 4.1: GPT Search Execution

**Service**: `OpenAIService.processCustomerPrompt()`

**For EACH customer prompt**:

1. **Run 4 parallel searches** (for statistical significance)
   ```typescript
   const runs = await Promise.all([
     runSearch(prompt), // Run 1
     runSearch(prompt), // Run 2
     runSearch(prompt), // Run 3
     runSearch(prompt)  // Run 4
   ]);
   ```

2. **Each search does**:
   - Force web search using GPT-4's `web_search` tool
   - Extract the AI's response text
   - Collect all source URLs/citations

3. **Analyze each search result**:
   - Send to GPT for structured analysis
   - Extract:
     - Was our business mentioned? (boolean)
     - What rank/position? (1-10 or null)
     - All competitor names mentioned
     - Competitor ranks
     - Which sources mention which companies

**Single Run Result Structure**:
```typescript
{
  businessMentioned: boolean
  rank: number | null  // 1 = first recommendation
  sources: string[]    // All URLs cited
  competitors: [
    {
      name: "Competitor Name"
      rank: number
      sourceUrl: string | null
    }
  ]
}
```

4. **Aggregate across 4 runs**:
   ```typescript
   {
     prompt: "original search query"
     businessMentioned: boolean  // true if mentioned in ANY run
     rank: number | null         // average rank across mentioned runs
     sources: string[]           // all unique sources from all runs
     mentionProbability: number  // percentage (0-100)
     runs: SingleRunResult[]     // all 4 individual results
     totalRuns: 4
   }
   ```

**Example Calculation**:
- Run 1: Not mentioned → 0%
- Run 2: Mentioned at rank 3 → 100%
- Run 3: Not mentioned → 0%
- Run 4: Mentioned at rank 2 → 100%
- **Result**: 50% mention probability, average rank 2.5

#### 4.2: Perplexity Search Execution

**Service**: `PerplexityService.processCustomerPrompt()`

**Same process as GPT but using Perplexity's API**:
- Uses `llama-3.1-sonar-small-128k-online` model
- Perplexity has built-in web search capabilities
- Extracts citations from responses
- Runs 4 times per prompt
- Aggregates results identically to GPT

#### 4.3: Parallelization Strategy

**Both services run simultaneously for maximum speed**:

```typescript
const [gptResults, perplexityResults] = await Promise.all([
  // All GPT prompts in parallel
  Promise.all(prompts.map(p => gptService.process(p))),
  // All Perplexity prompts in parallel
  Promise.all(prompts.map(p => perplexityService.process(p)))
]);
```

**Example Timeline**:
- 2 customer prompts
- Each run 4 times
- Total: 16 API calls (8 GPT + 8 Perplexity)
- **Sequential**: ~160 seconds (10s per call)
- **Our Parallel Approach**: ~20-30 seconds ⚡

---

### Phase 5: Results Analysis & Aggregation

**Goal**: Transform raw search results into actionable insights

**Key Metrics Calculated**:

1. **Visibility Score**: Combined metric (0-100)
   ```
   visibility_score = (query_coverage / 100)
                    × (mention_rate / 100)
                    × (1 / avg_rank)
                    × 100
   ```

   Example: 50% coverage, 60% mention rate, avg rank #2
   ```
   = (50/100) × (60/100) × (1/2) × 100
   = 0.5 × 0.6 × 0.5 × 100
   = 15 points
   ```

2. **Query Coverage**: % of prompts where business was mentioned
   ```
   coverage = (prompts_with_mention / total_prompts) × 100
   ```

3. **Mention Rate**: Average probability across all prompts
   ```
   mention_rate = avg(all_mention_probabilities)
   ```

4. **Average Position**: Mean rank when mentioned
   ```
   avg_rank = sum(ranks_when_mentioned) / count(mentions)
   ```

**Competitor Analysis**:
- Aggregate all competitor mentions across all runs
- Calculate each competitor's:
  - Total mention count
  - Average rank
  - Source URLs where they appear
- Sort by mentions (descending), then by rank (ascending)
- Highlight user's business in comparison

**Top Performing Content**:
- Identify which of YOUR pages led to mentions
- Count frequency of each source URL
- Rank by "conversion" (mentions per appearance)

**Source Distribution**:
- Extract domains from all source URLs
- Count mentions per domain
- Identify which sites influence AI recommendations most

---

### Phase 6: Recommendations Generation

**Goal**: Provide actionable advice for improving AI visibility

**Service**: `OpenAIService.generateRecommendations()`

**Input**:
- Business information
- Visibility analysis
- Search results (implicitly, through visibility analysis)

**Process**:
1. GPT-4 analyzes the business's current state
2. Considers:
   - Visibility assessment (High/Medium/Low)
   - Identified strengths
   - Discovered opportunities
   - Competitive landscape
3. Generates 3-5 specific, actionable recommendations
4. Each includes:
   - Clear title
   - Detailed description
   - Priority level (1-5, where 1 is highest)

**Output**: Prioritized list of `Recommendation` objects
```typescript
[
  {
    title: "Expand Online Content Strategy"
    description: "Create detailed blog posts about your specialty coffee sourcing..."
    priority: 1
  },
  {
    title: "Optimize for Local Search"
    description: "Ensure your business appears in local directories..."
    priority: 2
  }
]
```

---

### Phase 7: Report Generation

**Goal**: Transform all data into readable HTML and text reports

**Service**: `generateHTMLReport()` and `generateTextReport()`

#### HTML Report Structure

1. **Header Section**
   - Business name
   - Generation date
   - Overall visibility assessment

2. **For GPT Results**:
   - Summary statistics (4-box grid)
     - Visibility Score
     - Query Coverage
     - Mention Rate
     - Average Position

   - Competitor Performance Chart
     - Bar chart showing mentions per competitor
     - User's company highlighted
     - Average rank displayed

   - Top Performing Content
     - URLs that led to business mentions
     - Frequency count

   - Content Sources Distribution
     - Domain-level aggregation
     - Bar chart visualization

   - Detailed Query Analysis
     - Card for each customer prompt
     - Individual run results (4 chips: ✓ or ✗)
     - Mention probability
     - Average rank
     - Competitors mentioned in responses
     - Source citations

3. **For Perplexity Results**:
   - Same structure as GPT
   - Clearly separated section
   - Enables side-by-side comparison

4. **Recommendations Section**
   - Prioritized action items
   - Detailed descriptions

5. **Footer**
   - Disclaimer
   - Branding

**Styling Philosophy**:
- Clean, minimal design
- Black and white color scheme
- Monospace font for data
- High-contrast for emphasis
- Print-friendly

#### Text Report Structure

Plain text version for email clients that don't render HTML:
- Similar structure to HTML
- ASCII art for visual separation
- Bullet points and indentation for hierarchy
- Truncated URLs for readability

---

### Phase 8: Report Delivery

**Two Delivery Methods**:

#### Method 1: File System (Always)
- Saves to `./reports/` directory
- Filename format: `report-{business-slug}-{timestamp}.html`
- Also saves `.txt` version
- Creates debug logs in `./debug-logs/`

#### Method 2: Email (Optional)
- **Service**: `AgentMailService`
- Sends both HTML and text versions
- HTML as primary content
- Text as fallback
- Subject: "Presence Report: {Business Name}"

---

## Data Flow Diagram

```
┌─────────────────┐
│  URL Input      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Business Info Extraction       │
│  • GPT Fast Mode (10s)          │
│  • Browser Use (60s)            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Prompt Generation (2 prompts)  │
│  • GPT-4 generates realistic    │
│    customer queries             │
└────────┬────────────────────────┘
         │
         ├─────────────┬───────────────┐
         ▼             ▼               ▼
    ┌────────┐  ┌──────────┐  ┌──────────────┐
    │Prompt 1│  │ Prompt 2 │  │Visibility    │
    └───┬────┘  └────┬─────┘  │Analysis      │
        │            │         └──────────────┘
        │            │
        ├─────┬──────┼──────┬─────┐
        ▼     ▼      ▼      ▼     ▼
    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
    │ GPT │ │ GPT │ │Perp │ │Perp │
    │ x4  │ │ x4  │ │ x4  │ │ x4  │
    └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
       │       │       │       │
       └───────┴───────┴───────┘
                │
                ▼
    ┌─────────────────────────┐
    │  Results Aggregation    │
    │  • Calculate metrics    │
    │  • Analyze competitors  │
    │  • Identify patterns    │
    └────────┬────────────────┘
             │
             ▼
    ┌─────────────────────────┐
    │  Report Generation      │
    │  • HTML with charts     │
    │  • Plain text version   │
    └────────┬────────────────┘
             │
             ├──────┬──────┐
             ▼      ▼      ▼
         ┌────┐ ┌─────┐ ┌─────┐
         │File│ │Email│ │Debug│
         │Save│ │Send │ │ Log │
         └────┘ └─────┘ └─────┘
```

---

## Technical Architecture

### Service Layer

```
OpenAIService
  ├── generateCustomerPrompts()
  ├── analyzeVisibility()
  ├── generateRecommendations()
  └── processCustomerPrompt()
      ├── runWebSearchQuery() × 4
      └── analyzeWebSearchResults() × 4

PerplexityService
  └── processCustomerPrompt()
      ├── runSearchQuery() × 4
      └── analyzeSearchResults() × 4

GPTBusinessExtractor
  └── extractBusinessInfo()

BrowserUseService
  └── extractBusinessInfo()

AgentMailService
  └── sendEmail()
```

### Data Models

```typescript
BusinessInfo {
  businessName: string
  industry: string
  productsServices: string
  targetCustomers: string
  location: string
  website?: string
  additionalContext?: string
}

CustomerPrompt {
  category: string
  prompt: string
}

SingleRunResult {
  businessMentioned: boolean
  rank: number | null
  sources: string[]
  competitors: CompetitorMention[]
}

ChatGPTResponse / PerplexityResponse {
  prompt: string
  businessMentioned: boolean
  rank: number | null
  sources: string[]
  mentionProbability: number
  runs: SingleRunResult[]
  totalRuns: number
}

Report {
  businessName: string
  generatedDate: string
  customerPrompts: CustomerPrompt[]
  visibilityAnalysis: VisibilityAnalysis
  chatGPTResponses: ChatGPTResponse[]
  perplexityResponses?: PerplexityResponse[]
  recommendations: Recommendation[]
}
```

---

## Performance Characteristics

### Typical Execution Time
- **Fast Mode**: 30-40 seconds total
  - Business extraction: 5-10s
  - Prompt generation: 3-5s
  - Visibility analysis: 2-3s
  - Web searches: 20-30s (parallelized)
  - Report generation: <1s

- **Browser Use Mode**: 60-90 seconds total
  - Business extraction: 30-60s
  - Rest: same as fast mode

### API Call Count (for 2 prompts)
- Business extraction: 1 call
- Prompt generation: 1 call
- Visibility analysis: 1 call
- Web searches: 8 calls (4 GPT + 4 Perplexity)
- Search analysis: 8 calls (analyzing each result)
- Recommendations: 1 call
- **Total: ~20 API calls**

### Cost Estimate (approximate)
- Using GPT-4o-mini: ~$0.50-1.00 per report
- Using GPT-4o: ~$2.00-4.00 per report
- Perplexity: ~$0.20-0.40 per report

---

## Error Handling & Resilience

1. **Web Search Failures**
   - Individual run failures don't crash the system
   - Missing runs simply reduce sample size
   - Minimum 1 successful run required per prompt

2. **Analysis Failures**
   - Falls back to "not mentioned" if analysis fails
   - Preserves source URLs even on analysis error
   - Continues with remaining prompts

3. **Report Generation**
   - Optional sections (if no data, section is omitted)
   - Always generates both HTML and text
   - Debug logs saved separately (non-fatal if fails)

4. **Email Delivery**
   - Optional feature
   - Failure doesn't affect file generation
   - Reports always saved locally as backup

---

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
BROWSER_USE_API_KEY=...
AGENTMAIL_API_KEY=...
INBOX_ID=...
```

### Tunable Parameters
- Number of runs per prompt (default: 4)
- AI models used (configurable)
- Number of customer prompts generated (default: 2)
- Timeout values for API calls

---

## Future Enhancements

### Potential Improvements
1. **More AI Platforms**: Add Claude, Gemini searches
2. **Historical Tracking**: Compare reports over time
3. **Competitive Intelligence**: Deep-dive on specific competitors
4. **SEO Recommendations**: Specific content optimization tips
5. **Citation Analysis**: Which content types get cited most
6. **Temporal Analysis**: Best times/contexts for mentions
7. **Sentiment Analysis**: How business is described when mentioned
8. **Multi-language Support**: Test prompts in different languages
9. **Industry Benchmarking**: Compare against similar businesses
10. **Automated Monitoring**: Regular report generation & alerts

---

## Key Design Decisions

### Why 4 Runs Per Prompt?
- Balances statistical significance with API costs
- Captures variability in AI responses
- 4 runs allows 25% increments in probability
- More runs = diminishing returns on accuracy

### Why Parallel Execution?
- Sequential would take 5-10 minutes
- User experience: <1 minute is acceptable
- Cost: same regardless of parallelization
- Risk: manageable (independent operations)

### Why Both GPT and Perplexity?
- Different AI systems have different training data
- Users may prefer different AI assistants
- Competitive analysis: compare performance
- Comprehensive view of AI visibility landscape

### Why Generic Prompts (No Business Name)?
- Tests discoverability, not brand awareness
- Simulates new customer behavior
- More actionable insights (how to get discovered)
- Harder test = more meaningful results

### Why HTML + Text Reports?
- HTML: rich visualization, professional look
- Text: email compatibility, accessibility
- Both: maximum reach and usability

---

## Appendix: Example Report Sections

### Example: Visibility Score Calculation
```
Business: Portland Coffee Roasters
Query Coverage: 50% (mentioned in 1 of 2 prompts)
Mention Rate: 25% (mentioned in 1 of 4 runs for that prompt)
Average Rank: #2 (when mentioned)

Visibility Score = (50/100) × (25/100) × (1/2) × 100
                 = 0.5 × 0.25 × 0.5 × 100
                 = 6.25 points

Interpretation: Low visibility (0-20 range)
```

### Example: Competitor Comparison
```
Rank | Company              | Mentions | Avg Rank
-----|---------------------|----------|----------
  1  | Blue Bottle Coffee  |    8     |   1.2
  2  | Stumptown Coffee    |    7     |   1.8
  3  | YOUR COMPANY        |    1     |   2.0
  4  | Coava Coffee        |    5     |   2.4
```

### Example: Top Performing Content
```
Your URLs that generated mentions:

1. yoursite.com/about          → 3 mentions
2. yoursite.com/blog/roasting  → 2 mentions
3. yoursite.com/products       → 1 mention
```

---

## Conclusion

This workflow transforms a simple URL into a comprehensive AI visibility analysis by:

1. ✅ **Understanding the business** through intelligent extraction
2. ✅ **Simulating real user behavior** with generic prompts
3. ✅ **Testing multiple AI platforms** (GPT + Perplexity)
4. ✅ **Running statistical sampling** (4 runs per prompt)
5. ✅ **Analyzing competition** across all results
6. ✅ **Providing actionable insights** through recommendations
7. ✅ **Delivering professionally** via HTML email & files

The entire process is **optimized for speed** (parallel execution), **resilient to failures** (graceful degradation), and **cost-effective** (mini models where possible).
