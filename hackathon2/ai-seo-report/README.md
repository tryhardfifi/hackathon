# AI SEO Report - Acme Inc

A React application with Convex backend that generates and displays AI SEO reports for companies. The system evaluates how well a company appears in AI-generated responses (ChatGPT) compared to competitors.

## Features

### Real Report Generation
- **Business Info Extraction**: Automatically extracts business information from any website URL
- **Customer Prompt Generation**: AI generates realistic search queries customers would use
- **Parallel Search Execution**: Tests prompts through GPT-4o with web search (4 runs each)
- **Optional Perplexity Integration**: Add Perplexity API key for additional search results
- **Statistical Analysis**: Calculates mention probability and visibility scores
- **Competitor Detection**: Automatically identifies and tracks competitors mentioned in responses

### Report Visualization
- **Executive Summary**: Overview of visibility scores, mention rates, and top competitors
- **Visibility Analysis**: Visual comparison of company vs competitor mention rates
- **Prompt Performance**: Detailed breakdown of how the company performed across different prompts
- **Competitor Intelligence**: Comprehensive table showing all competitors and their metrics
- **Source Analysis**: Charts showing the most frequently cited sources in AI responses
- **Reddit Opportunities**: Actionable engagement opportunities with suggested comments (sample data)
- **Recommendations**: AI-generated recommendations for improving visibility

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Backend**: Convex (serverless backend with real-time subscriptions)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Add your API keys to `.env.local`:

```bash
# Required for real report generation
OPENAI_API_KEY=sk-...  # Get from https://platform.openai.com/api-keys

# Optional for additional search results
PERPLEXITY_API_KEY=pplx-...  # Get from https://www.perplexity.ai/settings/api
```

### 3. Set Up Convex

Initialize Convex and create a deployment:

```bash
npx convex dev
```

This will:
- Prompt you to log in with GitHub
- Create a new Convex project
- Add `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to your `.env.local`
- Start the Convex dev server to sync your schema and functions

### 4. Start the Development Server

In a new terminal, start the Next.js development server:

```bash
npm run dev
```

### 5. Generate Reports

Open http://localhost:3000 in your browser and:

**Option A: Generate Real Report**
1. Enter a company website URL in the form
2. Configure number of prompts and runs per prompt
3. Click "Generate Report"
4. Wait for the report to complete (~2-5 minutes depending on settings)

**Option B: Use Sample Data**
1. Click "Seed Sample Data" button
2. The app will populate the database with sample data for Acme Inc

## Project Structure

```
ai-seo-report/
├── app/
│   ├── layout.tsx           # Root layout with Convex provider
│   └── page.tsx             # Main report page
├── components/
│   ├── report/              # Report-specific components
│   │   ├── ExecutiveSummary.tsx
│   │   ├── VisibilityChart.tsx
│   │   ├── PromptPerformance.tsx
│   │   ├── CompetitorTable.tsx
│   │   ├── SourceAnalysis.tsx
│   │   ├── RedditOpportunities.tsx
│   │   └── Recommendations.tsx
│   └── ui/                  # Reusable UI components
│       └── card.tsx
├── convex/
│   ├── schema.ts            # Convex schema (8 tables)
│   ├── companies.ts         # Company queries
│   ├── reports.ts           # Report queries
│   └── seed.ts              # Seed data mutation
└── lib/
    ├── convex-provider.tsx  # Convex React provider
    └── utils.ts             # Utility functions
```

## Database Schema

The application uses 8 interconnected Convex tables:

1. **Companies**: Main entity for tracking companies
2. **Competitors**: Competitors tracked for each company
3. **Reports**: Generated reports over time
4. **Prompts**: Test prompts used in reports
5. **Prompt Runs**: Individual runs of each prompt (4x per prompt)
6. **Competitor Mentions**: Tracking competitor appearances
7. **Source Citations**: Sources cited in GPT responses
8. **Reddit Opportunities**: Engagement opportunities

## Sample Data

The seed includes:
- **Company**: Acme Inc (enterprise project management SaaS)
- **Competitors**: Asana, Monday.com, Trello, Basecamp
- **Report**: 15 prompts across 5 categories, 60 total runs
- **Reddit Opportunities**: 3 high-value threads with suggested comments

## Development

### Run Convex Dev Server

```bash
npx convex dev
```

### Run Next.js Dev Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Report Generation Workflow

1. **Business Info Extraction** (~10s)
   - Fetches and analyzes company website
   - Extracts name, industry, products/services, target market

2. **Prompt Generation** (~5s)
   - AI generates customer search queries
   - Ensures prompts don't mention business name (tests discoverability)
   - Categories: finding, comparing, specific needs, local search

3. **Visibility Analysis** (~3s)
   - Assesses potential AI visibility
   - Identifies strengths and opportunities

4. **Web Search Execution** (~2-4 minutes for 5 prompts)
   - Runs each prompt 4 times through GPT-4o web search
   - Optional: Parallel Perplexity searches
   - Extracts mentions, rankings, competitors, sources

5. **Results Aggregation** (~1s)
   - Calculates visibility scores
   - Aggregates competitor mentions
   - Analyzes source patterns

6. **Recommendations** (~5s)
   - AI generates actionable improvement suggestions
   - Prioritized by impact

**Total Time**: ~3-5 minutes for a 5-prompt report

## Cost Estimates

Using GPT-4o-mini (default):
- 5 prompts × 4 runs = ~$0.50-1.00 per report
- 10 prompts × 4 runs = ~$1.00-2.00 per report

Adding Perplexity:
- Additional ~$0.20-0.40 per report

## Future Enhancements

- ✅ Real ChatGPT API integration (DONE)
- Historical tracking (track scores over time)
- Automated weekly reports
- Email notifications
- Export to PDF
- Reddit opportunity detection (currently sample data)
- Custom prompt builder
- Multi-language support
- Sentiment analysis

## License

MIT
