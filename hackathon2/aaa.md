# AI SEO Report Specification

## Overview
A React application with Convex backend that generates and displays AI SEO reports for companies. The system evaluates how well a company appears in AI-generated responses (ChatGPT) compared to competitors.

## Sample Company
**Acme Inc** - A sample company used for demonstration and initial implementation.

---

Skip to main content
Convex

Search docs and more...
⌘K

Ask AI
Dashboard
Blog
GitHub
Discord

Convex
Home
Get Started
Tutorial

Quickstarts

React
Next.js
Remix
TanStack Start
React Native
Nuxt
Vue
Svelte
Node.js
Bun
Script Tag
Python
Android Kotlin
iOS Swift
Rust
Understand Convex

Platform
Functions

Database

Realtime
Authentication

Scheduling

File Storage

Search

Components

Guides
AI Code Gen

Agents

Chef
Testing

Production

Self Hosting
Platform APIs

Client Libraries
React

Next.js

TanStack

React Native
JavaScript

Vue

Svelte
Python
Swift

Android Kotlin

Rust
OpenAPI
Tools
Dashboard

CLI

API Reference
Convex API

Generated Code

Deployment API

Management API

Errors
ESLint
HomeQuickstartsReact
React Quickstart

To get setup quickly with Convex and React run

npm create convex@latest


or follow the guide below.

Learn how to query data from Convex in a React app using Vite and
TypeScript

Create a React app
Create a React app using the create vite command.

npm create vite@latest my-app -- --template react-ts

Install the Convex client and server library
To get started, install the convex package which provides a convenient interface for working with Convex from a React app.

Navigate to your app directory and install convex.

cd my-app && npm install convex

Set up a Convex dev deployment
Next, run npx convex dev. This will prompt you to log in with GitHub, create a project, and save your production and deployment URLs.

It will also create a convex/ folder for you to write your backend API functions in. The dev command will then continue running to sync your functions with your dev deployment in the cloud.

npx convex dev

Create sample data for your database
In a new terminal window, create a sampleData.jsonl file with some sample data.

sampleData.jsonl
{"text": "Buy groceries", "isCompleted": true}
{"text": "Go for a swim", "isCompleted": true}
{"text": "Integrate Convex", "isCompleted": false}

Add the sample data to your database
Now that your project is ready, add a tasks table with the sample data into your Convex database with the import command.

npx convex import --table tasks sampleData.jsonl

(optional) Define a schema
Add a new file schema.ts in the convex/ folder with a description of your data.

This will declare the types of your data for optional typechecking with TypeScript, and it will be also enforced at runtime.

Alternatively remove the line 'plugin:@typescript-eslint/recommended-requiring-type-checking', from the .eslintrc.cjs file to lower the type checking strictness.

convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
});

Expose a database query
Add a new file tasks.ts in the convex/ folder with a query function that loads the data.

Exporting a query function from this file declares an API function named after the file and the export name, api.tasks.get.

convex/tasks.ts
TS
import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

Connect the app to your backend
In src/main.tsx, create a ConvexReactClient and pass it to a ConvexProvider wrapping your app.

src/main.tsx
TS
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>,
);


Display the data in your app
In src/App.tsx, use the useQuery hook to fetch from your api.tasks.get API function and display the data.

src/App.tsx
TS
import "./App.css";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const tasks = useQuery(api.tasks.get);
  return (
    <div className="App">
      {tasks?.map(({ _id, text }) => <div key={_id}>{text}</div>)}
    </div>
  );
}

export default App;



Start the app
Start the app, open http://localhost:5173/ in a browser, and see the list of tasks.

npm run dev

See the complete React documentation.

Previous
Quickstarts
Next
Next.js
## Data Models (Convex Schema)

### Company-First Data Structure

All data is organized hierarchically under the company:
```
Company
├── Competitors (tracked competitors for this company)
└── Reports (multiple reports over time)
    ├── Prompts (questions tested in this report)
    │   └── Prompt Runs (4 runs per prompt)
    │       ├── Competitor Mentions
    │       └── Source Citations
    └── Reddit Opportunities (engagement opportunities)
```

### 1. Companies Table
Main entity - everything is organized under the company.

```typescript
{
  _id: Id<"companies">,
  _creationTime: number,
  name: string,              // "Acme Inc"
  description: string,       // "Enterprise project management software"
  url: string,              // "https://acme-inc.com"
  industry: string,         // "SaaS", "E-commerce", etc.
  createdAt: number,        // timestamp
}
```

### 2. Competitors Table
Competitors tracked for each company (company-specific).

```typescript
{
  _id: Id<"competitors">,
  _creationTime: number,
  companyId: Id<"companies">,     // Parent company
  competitorName: string,          // "Asana", "Monday.com", etc.
  competitorUrl: string | null,    // "https://asana.com"
  isActive: boolean,               // Still tracking this competitor?
  addedDate: number,               // timestamp
}
```

### 3. Reports Table
Reports belong to a company - tracks visibility over time.

```typescript
{
  _id: Id<"reports">,
  _creationTime: number,
  companyId: Id<"companies">,           // Parent company
  reportDate: number,                    // timestamp of report generation
  status: "generating" | "completed" | "failed",
  totalPrompts: number,                  // 10-20
  runsPerPrompt: number,                 // 4 (default)
  overallVisibilityScore: number,        // 0-100 percentage
  createdAt: number,
}
```

### 4. Prompts Table
Prompts belong to a specific report (and by extension, a company).

```typescript
{
  _id: Id<"prompts">,
  _creationTime: number,
  companyId: Id<"companies">,        // Parent company
  reportId: Id<"reports">,           // Parent report
  promptText: string,                 // "What are the best project management tools?"
  promptType: string,                 // "competitor_comparison", "service_search", etc.
  category: string,                   // "Product", "Service", "Features", "Pricing"
  orderIndex: number,                 // 1-20
}
```

### 5. Prompt Runs Table
Each prompt is run 4 times - belongs to a prompt (and report, and company).

```typescript
{
  _id: Id<"promptRuns">,
  _creationTime: number,
  companyId: Id<"companies">,            // Parent company
  reportId: Id<"reports">,               // Parent report
  promptId: Id<"prompts">,               // Parent prompt
  runNumber: number,                      // 1-4
  gptResponse: string,                    // Full response text
  targetCompanyMentioned: boolean,        // Was the company mentioned?
  mentionContext: string | null,          // Text snippet where company was mentioned
  responseTokens: number,
  executedAt: number,
}
```

### 6. Competitor Mentions Table
Tracks competitor appearances in each prompt run.

```typescript
{
  _id: Id<"competitorMentions">,
  _creationTime: number,
  companyId: Id<"companies">,            // Parent company
  reportId: Id<"reports">,               // Parent report
  promptId: Id<"prompts">,               // Parent prompt
  promptRunId: Id<"promptRuns">,         // Parent prompt run
  competitorId: Id<"competitors"> | null, // Link to competitor (if tracked)
  competitorName: string,                 // "Asana", "Monday.com", etc.
  mentionCount: number,                   // How many times mentioned in this run
  mentionContext: string,                 // Text snippet of mention
  positionInResponse: number,             // 1st, 2nd, 3rd mention
}
```

### 7. Source Citations Table
Sources cited in GPT responses.

```typescript
{
  _id: Id<"sourceCitations">,
  _creationTime: number,
  companyId: Id<"companies">,            // Parent company
  reportId: Id<"reports">,               // Parent report
  promptRunId: Id<"promptRuns">,         // Parent prompt run
  sourceUrl: string,                      // "https://example.com/article"
  sourceDomain: string,                   // "example.com"
  sourceTitle: string | null,
  citationType: "direct_link" | "mentioned" | "referenced",
  relevanceScore: number | null,          // 0-10 (how relevant to query)
}
```

### 8. Reddit Opportunities Table
Reddit threads for company engagement - belongs to a report.

```typescript
{
  _id: Id<"redditOpportunities">,
  _creationTime: number,
  companyId: Id<"companies">,            // Parent company
  reportId: Id<"reports">,               // Parent report
  subreddit: string,                      // "r/projectmanagement"
  postTitle: string,
  postUrl: string,                        // "https://reddit.com/r/..."
  postSnippet: string,                    // First 200 chars
  relevanceScore: number,                 // 0-100
  estimatedReach: number,                 // upvotes/views estimate
  suggestedComment: string,               // AI-generated suggested response
  keywords: string[],                     // ["project management", "enterprise"]
  postedDate: number,                     // timestamp
  opportunityType: "question" | "comparison" | "recommendation" | "complaint",
}
                                                                                                                                ```

                                                                                                                                ---

                                                                                                                                ## Frontend Report Structure

                                                                                                                                ### Report Page Layout

                                                                                                                                ```
                                                                                                                                ┌─────────────────────────────────────────────────────────────┐
                                                                                                                                │  AI SEO Report - Acme Inc                                   │
                                                                                                                                │  Generated: January 1, 2025                                 │
                                                                                                                                └─────────────────────────────────────────────────────────────┘

                                                                                                                                ┌─────────────────────────────────────────────────────────────┐
                                                                                                                                │  📊 EXECUTIVE SUMMARY                                       │
                                                                                                                                ├─────────────────────────────────────────────────────────────┤
                                                                                                                                │  Overall Visibility Score:  67/100                          │
                                                                                                                                │  Total Prompts Tested:      15                              │
                                                                                                                                │  Mention Rate:              45% (27/60 runs)                │
                                                                                                                                │  Top Competitor:            Asana (mentioned 52 times)      │
                                                                                                                                └─────────────────────────────────────────────────────────────┘

                                                                                                                                ┌─────────────────────────────────────────────────────────────┐
                                                                                                                                │  🎯 VISIBILITY ANALYSIS                                     │
                                                                                                                                ├─────────────────────────────────────────────────────────────┤
                                                                                                                                │  [BAR CHART]                                                │
                                                                                                                                │  Acme Inc:     ████████████████░░░░░ 45%                   │
                                                                                                                                │  Asana:        ████████████████████░ 78%                   │
                                                                                                                                │  Monday.com:   ███████████████░░░░░░ 62%                   │
                                                                                                                                │  Trello:       ██████████░░░░░░░░░░░ 43%                   │
                                                                                                                                └─────────────────────────────────────────────────────────────┘

                                                                                                                                ┌─────────────────────────────────────────────────────────────┐
                                                                                                                                │  📝 PROMPT PERFORMANCE                                      │
                                                                                                                                ├─────────────────────────────────────────────────────────────┤
                                                                                                                                │  Category: Product Comparison                               │
                                                                                                                                │  ┌───────────────────────────────────────────────────────┐ │
                                                                                                                                │  │ Prompt 1: "Best project management tools for teams"  │ │
                                                                                                                                │  │ Mention Rate: 3/4 (75%)                              │ │
                                                                                                                                │  │ Competitors: Asana (4), Monday.com (3), Trello (2)  │ │
                                                                                                                                │  │ [View Details ↓]                                     │ │
                                                                                                                                │  └───────────────────────────────────────────────────────┘ │
                                                                                                                                │                                                             │
                                                                                                                                │  Category: Feature Queries                                  │
                                                                                                                                │  ┌───────────────────────────────────────────────────────┐ │
                                                                                                                                │  │ Prompt 2: "Tools with gantt chart features"         │ │
                                                                                                                                │  │ Mention Rate: 2/4 (50%)                              │ │
                                                                                                                                │  │ Competitors: Asana (4), MS Project (3)              │ │
                                                                                                                                │  └───────────────────────────────────────────────────────┘ │
                                                                                                                                └─────────────────────────────────────────────────────────────┘

                                                                                                                                ┌─────────────────────────────────────────────────────────────┐
                                                                                                                                │  🏆 COMPETITOR INTELLIGENCE                                 │
                                                                                                                                ├─────────────────────────────────────────────────────────────┤
                                                                                                                                │  [TABLE]                                                    │
                                                                                                                                │  ┌──────────────┬───────────┬──────────┬─────────────────┐ │
                                                                                                                                │  │ Competitor   │ Mentions  │ Avg Pos  │ Mention Rate    │ │
                                                                                                                                │  ├──────────────┼───────────┼──────────┼─────────────────┤ │
                                                                                                                                │  │ Asana        │ 52        │ 1.8      │ 78%             │ │
                                                                                                                                │  │ Monday.com   │ 41        │ 2.3      │ 62%             │ │
                                                                                                                                │  │ Trello       │ 28        │ 3.1      │ 43%             │ │
                                                                                                                                │  │ Acme Inc     │ 27        │ 2.8      │ 45%             │ │
                                                                                                                                │  │ Basecamp     │ 19        │ 4.2      │ 28%             │ │
                                                                                                                                │  └──────────────┴───────────┴──────────┴─────────────────┘ │
                                                                                                                                └─────────────────────────────────────────────────────────────┘

                                                                                                                                ┌─────────────────────────────────────────────────────────────┐
                                                                                                                                │  📚 SOURCE ANALYSIS                                         │
                                                                                                                                ├─────────────────────────────────────────────────────────────┤
                                                                                                                                │  Most Cited Sources:                                        │
                                                                                                                                │                                                             │
                                                                                                                                │  [PIE CHART or BAR CHART]                                   │
                                                                                                                                │  1. g2.com                    - 23 citations               │
                                                                                                                                │  2. capterra.com              - 18 citations               │
                                                                                                                                │  3. techcrunch.com            - 12 citations               │
                                                                                                                                │  4. producthunt.com           - 9 citations                │
                                                                                                                                │  5. forbes.com                - 7 citations                │
                                                                                                                                │                                                             │
                                                                                                                                │  💡 Insight: Focus on getting featured on g2.com and       │
                                                                                                                                │     Capterra for better AI visibility                      │
                                                                                                                                └─────────────────────────────────────────────────────────────┘

                                                                                                                                ┌─────────────────────────────────────────────────────────────┐
                                                                                                                                │  💬 REDDIT OPPORTUNITIES                                    │
                                                                                                                                ├─────────────────────────────────────────────────────────────┤
                                                                                                                                │  Found 8 high-value engagement opportunities                │
                                                                                                                                │                                                             │
                                                                                                                                │  ┌───────────────────────────────────────────────────────┐ │
                                                                                                                                │  │ 🔥 r/projectmanagement • 2 days ago • 234 upvotes    │ │
                                                                                                                                │  │ "What PM tool works best for remote teams?"          │ │
                                                                                                                                │  │                                                       │ │
                                                                                                                                │  │ Relevance: 95/100                                    │ │
                                                                                                                                │  │                                                       │ │
                                                                                                                                │  │ 💬 Suggested Comment:                                │ │
                                                                                                                                │  │ "Have you considered Acme Inc? We've been using it   │ │
                                                                                                                                │  │ for our remote team of 50+ and the real-time         │ │
                                                                                                                                │  │ collaboration features are game-changing. The gantt  │ │
                                                                                                                                │  │ charts integrate seamlessly with our workflow..."    │ │
                                                                                                                                │  │                                                       │ │
                                                                                                                                │  │ [Copy Comment] [View Thread →]                       │ │
                                                                                                                                │  └───────────────────────────────────────────────────────┘ │
                                                                                                                                │                                                             │
                                                                                                                                │  ┌───────────────────────────────────────────────────────┐ │
                                                                                                                                │  │ 📊 r/SaaS • 5 days ago • 89 upvotes                  │ │
                                                                                                                                │  │ "Asana alternatives that don't break the bank?"     │ │
                                                                                                                                │  │                                                       │ │
                                                                                                                                │  │ Relevance: 88/100                                    │ │
                                                                                                                                │  │                                                       │ │
                                                                                                                                │  │ 💬 Suggested Comment:                                │ │
                                                                                                                                │  │ "Acme Inc offers similar features at 40% lower cost │ │
                                                                                                                                │  │ compared to Asana. We switched 6 months ago..."      │ │
                                                                                                                                │  │                                                       │ │
                                                                                                                                │  │ [Copy Comment] [View Thread →]                       │ │
                                                                                                                                │  └───────────────────────────────────────────────────────┘ │
                                                                                                                                │                                                             │
                                                                                                                                │  [View All 8 Opportunities →]                               │
                                                                                                                                └─────────────────────────────────────────────────────────────┘

                                                                                                                                ┌─────────────────────────────────────────────────────────────┐
                                                                                                                                │  💡 RECOMMENDATIONS                                         │
                                                                                                                                ├─────────────────────────────────────────────────────────────┤
                                                                                                                                │  Based on this analysis:                                    │
                                                                                                                                │                                                             │
                                                                                                                                │  1. ⚠️  Increase presence on g2.com and Capterra           │
                                                                                                                                │     (most cited sources)                                    │
                                                                                                                                │                                                             │
                                                                                                                                │  2. 🎯 Target "remote team" and "enterprise" keywords       │
                                                                                                                                │     (low visibility in these queries)                       │
                                                                                                                                │                                                             │
                                                                                                                                │  3. 💬 Engage in 8 Reddit threads this week                 │
                                                                                                                                │                                                             │
                                                                                                                                │  4. 📈 Asana appears 93% more than Acme Inc - study        │
                                                                                                                                │     their content strategy                                  │
                                                                                                                                └─────────────────────────────────────────────────────────────┘
                                                                                                                                ```

                                                                                                                                ---

                                                                                                                                ## Placeholder Data for Acme Inc

                                                                                                                                ### Company
                                                                                                                                - **Name:** Acme Inc
                                                                                                                                - - **Description:** Enterprise project management and collaboration software for remote teams
                                                                                                                                - - **URL:** https://acme-inc.com
                                                                                                                                - - **Industry:** SaaS
                                                                                                                                -
                                                                                                                                - ### Sample Prompts (15 total)
                                                                                                                                -
                                                                                                                                - **Category: Product Comparison**
                                                                                                                                - 1. "What are the best project management tools for remote teams?"
                                                                                                                                - 2. "Compare top enterprise project management software"
                                                                                                                                - 3. "Alternatives to Asana for large teams"
                                                                                                                                -
                                                                                                                                - **Category: Feature Queries**
                                                                                                                                - 4. "Project management tools with gantt chart features"
                                                                                                                                - 5. "Software with real-time collaboration for project tracking"
                                                                                                                                - 6. "Tools that integrate with Slack and Microsoft Teams"
                                                                                                                                -
                                                                                                                                - **Category: Use Case Specific**
                                                                                                                                - 7. "Best PM tools for software development teams"
                                                                                                                                - 8. "Project management for marketing agencies"
                                                                                                                                - 9. "Tools for managing cross-functional projects"
                                                                                                                                -
                                                                                                                                - **Category: Pricing**
                                                                                                                                - 10. "Affordable project management software for startups"
                                                                                                                                - 11. "Enterprise project management with flexible pricing"
                                                                                                                                -
                                                                                                                                - **Category: Problem Solving**
                                                                                                                                - 12. "How to improve team collaboration on projects"
                                                                                                                                - 13. "Solutions for tracking multiple projects simultaneously"
                                                                                                                                - 14. "Tools to reduce project management overhead"
                                                                                                                                -
                                                                                                                                - **Category: Direct Comparison**
                                                                                                                                - 15. "Is Acme Inc better than Monday.com for enterprise teams?"
                                                                                                                                -
                                                                                                                                - ### Placeholder Statistics
                                                                                                                                - - **Overall Visibility Score:** 67/100
                                                                                                                                - - **Mention Rate:** 45% (27 out of 60 total runs)
                                                                                                                                - - **Top Competitors:** Asana (78%), Monday.com (62%), Trello (43%)
                                                                                                                                - - **Most Cited Source:** g2.com (23 citations)
                                                                                                                                - - **Reddit Opportunities:** 8 high-value threads
                                                                                                                                -
                                                                                                                                - ---
                                                                                                                                -
                                                                                                                                - ## Component Structure
                                                                                                                                -
                                                                                                                                - ```
                                                                                                                                - src/
                                                                                                                                - ├── app/
                                                                                                                                - │   ├── page.tsx                          # Home page (company list)
                                                                                                                                - │   ├── company/[companyId]/
                                                                                                                                - │   │   ├── page.tsx                      # Company dashboard
                                                                                                                                - │   │   ├── competitors/
                                                                                                                                - │   │   │   └── page.tsx                  # Manage competitors
                                                                                                                                - │   │   └── reports/
                                                                                                                                - │   │       ├── page.tsx                  # Reports list for company
                                                                                                                                - │   │       └── [reportId]/
                                                                                                                                - │   │           └── page.tsx              # Individual report view
                                                                                                                                - ├── components/
                                                                                                                                - │   ├── company/
                                                                                                                                - │   │   ├── CompanyCard.tsx
                                                                                                                                - │   │   ├── CompanyHeader.tsx
                                                                                                                                - │   │   └── CompetitorList.tsx
                                                                                                                                - │   ├── report/
                                                                                                                                - │   │   ├── ExecutiveSummary.tsx
                                                                                                                                - │   │   ├── VisibilityChart.tsx
                                                                                                                                - │   │   ├── PromptPerformance.tsx
                                                                                                                                - │   │   ├── CompetitorTable.tsx
                                                                                                                                - │   │   ├── SourceAnalysis.tsx
                                                                                                                                - │   │   ├── RedditOpportunities.tsx
                                                                                                                                - │   │   └── Recommendations.tsx
                                                                                                                                - │   └── ui/                               # shadcn components
                                                                                                                                - └── convex/
                                                                                                                                -     ├── schema.ts                         # Convex schema definitions
                                                                                                                                -     ├── companies.ts                      # Company queries and mutations
                                                                                                                                -     ├── competitors.ts                    # Competitor queries
                                                                                                                                -     ├── reports.ts                        # Report queries and mutations
                                                                                                                                -     ├── prompts.ts                        # Prompt queries
                                                                                                                                -     └── seed.ts                           # Seed data for Acme Inc
                                                                                                                                -                 ```
                                                                                                                                -
                                                                                                                                -                 ---
                                                                                                                                -
                                                                                                                                -                 ## Implementation Phases
                                                                                                                                -
                                                                                                                                -                 ### Phase 1: Setup & Placeholder (Current)
                                                                                                                                -                 - [ ] Initialize Next.js + Convex + shadcn
                                                                                                                                -                 - [ ] Define Convex schema
                                                                                                                                -                 - [ ] Create seed data for Acme Inc
                                                                                                                                -                 - [ ] Build report UI with placeholder data
                                                                                                                                -
                                                                                                                                -                 ### Phase 2: Prompt Generation
                                                                                                                                -                 - [ ] Build prompt generation system
                                                                                                                                -                 - [ ] Create prompt templates by category
                                                                                                                                -                 - [ ] Store prompts in Convex
                                                                                                                                -
                                                                                                                                -                 ### Phase 3: ChatGPT Integration
                                                                                                                                -                 - [ ] Integrate OpenAI API
                                                                                                                                -                 - [ ] Run prompts 4 times each
                                                                                                                                -                 - [ ] Parse responses for company mentions
                                                                                                                                -                 - [ ] Extract competitor mentions
                                                                                                                                -                 - [ ] Extract source citations
                                                                                                                                -
                                                                                                                                -                 ### Phase 4: Reddit Analysis
                                                                                                                                -                 - [ ] Reddit API integration
                                                                                                                                -                 - [ ] Search relevant subreddits
                                                                                                                                -                 - [ ] Generate suggested comments with AI
                                                                                                                                -                 - [ ] Calculate relevance scores
                                                                                                                                -
                                                                                                                                -                 ### Phase 5: Analytics & Insights
                                                                                                                                -                 - [ ] Calculate visibility scores
                                                                                                                                -                 - [ ] Generate recommendations
                                                                                                                                -                 - [ ] Create comparison charts
                                                                                                                                -                 - [ ] Build export functionality
                                                                                                                                -
                                                                                                                                -                 ---
                                                                                                                                -
                                                                                                                                -                 ## UI Technology Stack
                                                                                                                                -
                                                                                                                                -                 - **Framework:** Next.js 14 (App Router)
                                                                                                                                -                 - **Styling:** Tailwind CSS + shadcn/ui
                                                                                                                                -                 - **Backend:** Convex
                                                                                                                                -                 - **Charts:** Recharts or Chart.js
                                                                                                                                -                 - **Icons:** Lucide React
                                                                                                                                -                 - **Deployment:** Vercel
                                                                                                                                -
                                                                                                                                -                 ---
                                                                                                                                -
                                                                                                                                -                 ## Key Features for V1
                                                                                                                                -
                                                                                                                                -                 1. Single report view for Acme Inc
                                                                                                                                -                 2. Clean, professional dashboard design
                                                                                                                                -                 3. Interactive charts (bar, pie)
                                                                                                                                -                 4. Expandable prompt details
                                                                                                                                -                 5. Copyable Reddit comments
                                                                                                                                -                 6. Responsive design
                                                                                                                                -                 7. Dark mode support (via shadcn)
                                                                                                                                -
                                                                                                                                -                 ---
                                                                                                                                -
                                                                                                                                -                 ## Future Enhancements
                                                                                                                                -
                                                                                                                                -                 - Multi-company support
                                                                                                                                -                 - Historical tracking (track scores over time)
                                                                                                                                -                 - Automated weekly reports
                                                                                                                                -                 - Email notifications
                                                                                                                                -                 - Export to PDF
                                                                                                                                -                 - AI-powered insights
                                                                                                                                -                 - Competitive benchmarking
                                                                                                                                -                 - Custom prompt builder
                                                                                                                                -
