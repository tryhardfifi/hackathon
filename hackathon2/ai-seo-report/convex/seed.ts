import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const seedAcmeInc = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create Acme Inc company
    const companyId = await ctx.db.insert("companies", {
      name: "Acme Inc",
      description:
        "Enterprise project management and collaboration software for remote teams",
      url: "https://acme-inc.com",
      industry: "SaaS",
      createdAt: Date.now(),
    });

    // 2. Create competitors
    const competitors = [
      { name: "Asana", url: "https://asana.com" },
      { name: "Monday.com", url: "https://monday.com" },
      { name: "Trello", url: "https://trello.com" },
      { name: "Basecamp", url: "https://basecamp.com" },
    ];

    const competitorIds: Record<string, Id<"competitors">> = {};
    for (const comp of competitors) {
      const id = await ctx.db.insert("competitors", {
        companyId,
        competitorName: comp.name,
        competitorUrl: comp.url,
        isActive: true,
        addedDate: Date.now(),
      });
      competitorIds[comp.name] = id;
    }

    // 3. Create a sample report
    const reportId = await ctx.db.insert("reports", {
      companyId,
      reportDate: Date.now(),
      status: "completed",
      totalPrompts: 15,
      runsPerPrompt: 4,
      overallVisibilityScore: 67,
      createdAt: Date.now(),
    });

    // 4. Create sample prompts
    const prompts = [
      {
        text: "What are the best project management tools for remote teams?",
        type: "competitor_comparison",
        category: "Product Comparison",
        order: 1,
      },
      {
        text: "Compare top enterprise project management software",
        type: "competitor_comparison",
        category: "Product Comparison",
        order: 2,
      },
      {
        text: "Alternatives to Asana for large teams",
        type: "competitor_comparison",
        category: "Product Comparison",
        order: 3,
      },
      {
        text: "Project management tools with gantt chart features",
        type: "feature_search",
        category: "Feature Queries",
        order: 4,
      },
      {
        text: "Software with real-time collaboration for project tracking",
        type: "feature_search",
        category: "Feature Queries",
        order: 5,
      },
      {
        text: "Tools that integrate with Slack and Microsoft Teams",
        type: "feature_search",
        category: "Feature Queries",
        order: 6,
      },
      {
        text: "Best PM tools for software development teams",
        type: "use_case",
        category: "Use Case Specific",
        order: 7,
      },
      {
        text: "Project management for marketing agencies",
        type: "use_case",
        category: "Use Case Specific",
        order: 8,
      },
      {
        text: "Tools for managing cross-functional projects",
        type: "use_case",
        category: "Use Case Specific",
        order: 9,
      },
      {
        text: "Affordable project management software for startups",
        type: "pricing",
        category: "Pricing",
        order: 10,
      },
      {
        text: "Enterprise project management with flexible pricing",
        type: "pricing",
        category: "Pricing",
        order: 11,
      },
      {
        text: "How to improve team collaboration on projects",
        type: "problem_solving",
        category: "Problem Solving",
        order: 12,
      },
      {
        text: "Solutions for tracking multiple projects simultaneously",
        type: "problem_solving",
        category: "Problem Solving",
        order: 13,
      },
      {
        text: "Tools to reduce project management overhead",
        type: "problem_solving",
        category: "Problem Solving",
        order: 14,
      },
      {
        text: "Is Acme Inc better than Monday.com for enterprise teams?",
        type: "direct_comparison",
        category: "Direct Comparison",
        order: 15,
      },
    ];

    const promptIds: Id<"prompts">[] = [];
    for (const prompt of prompts) {
      const id = await ctx.db.insert("prompts", {
        companyId,
        reportId,
        promptText: prompt.text,
        promptType: prompt.type,
        category: prompt.category,
        orderIndex: prompt.order,
      });
      promptIds.push(id);
    }

    // 5. Create sample prompt runs with realistic data
    const sampleResponses = [
      {
        promptIdx: 0,
        runs: [
          {
            mentioned: true,
            response:
              "For remote teams, I'd recommend considering Asana, Monday.com, and Acme Inc. Asana offers excellent task management with timeline views...",
            competitors: [
              { name: "Asana", count: 2, position: 1 },
              { name: "Monday.com", count: 1, position: 2 },
            ],
          },
          {
            mentioned: false,
            response:
              "The best tools for remote teams include Asana, Trello, and Monday.com. Asana provides comprehensive features...",
            competitors: [
              { name: "Asana", count: 2, position: 1 },
              { name: "Trello", count: 1, position: 2 },
              { name: "Monday.com", count: 1, position: 3 },
            ],
          },
          {
            mentioned: true,
            response:
              "Popular choices include Monday.com, Acme Inc, and Basecamp. Monday.com has a visual interface...",
            competitors: [
              { name: "Monday.com", count: 1, position: 1 },
              { name: "Basecamp", count: 1, position: 3 },
            ],
          },
          {
            mentioned: true,
            response:
              "Consider Asana, Acme Inc, or Trello for remote collaboration. These platforms offer...",
            competitors: [
              { name: "Asana", count: 1, position: 1 },
              { name: "Trello", count: 1, position: 3 },
            ],
          },
        ],
      },
      {
        promptIdx: 3,
        runs: [
          {
            mentioned: true,
            response:
              "For Gantt chart features, Acme Inc and Asana are excellent choices. Both provide interactive timelines...",
            competitors: [{ name: "Asana", count: 1, position: 2 }],
          },
          {
            mentioned: false,
            response:
              "Asana, Monday.com, and MS Project all offer Gantt chart functionality...",
            competitors: [
              { name: "Asana", count: 1, position: 1 },
              { name: "Monday.com", count: 1, position: 2 },
            ],
          },
          {
            mentioned: true,
            response:
              "Tools like Acme Inc, Asana, and Monday.com include Gantt chart features...",
            competitors: [
              { name: "Asana", count: 1, position: 2 },
              { name: "Monday.com", count: 1, position: 3 },
            ],
          },
          {
            mentioned: false,
            response:
              "Consider Asana or Monday.com for built-in Gantt charts...",
            competitors: [
              { name: "Asana", count: 1, position: 1 },
              { name: "Monday.com", count: 1, position: 2 },
            ],
          },
        ],
      },
    ];

    // Create runs for the first two prompts with detailed data
    for (const promptData of sampleResponses) {
      const promptId = promptIds[promptData.promptIdx];

      for (let runIdx = 0; runIdx < promptData.runs.length; runIdx++) {
        const run = promptData.runs[runIdx];
        const runId = await ctx.db.insert("promptRuns", {
          companyId,
          reportId,
          promptId,
          runNumber: runIdx + 1,
          gptResponse: run.response,
          targetCompanyMentioned: run.mentioned,
          mentionContext: run.mentioned ? "Acme Inc" : null,
          responseTokens: Math.floor(run.response.length / 4),
          executedAt: Date.now() - 1000 * 60 * runIdx,
        });

        // Add competitor mentions
        for (const comp of run.competitors) {
          await ctx.db.insert("competitorMentions", {
            companyId,
            reportId,
            promptId,
            promptRunId: runId,
            competitorId: competitorIds[comp.name] || null,
            competitorName: comp.name,
            mentionCount: comp.count,
            mentionContext: `Mentioned ${comp.count} times in response`,
            positionInResponse: comp.position,
          });
        }

        // Add sample source citations
        const sources = [
          { domain: "g2.com", title: "Best Project Management Software 2025" },
          {
            domain: "capterra.com",
            title: "Top PM Tools Compared",
          },
        ];

        for (const source of sources) {
          await ctx.db.insert("sourceCitations", {
            companyId,
            reportId,
            promptRunId: runId,
            sourceUrl: `https://${source.domain}/article`,
            sourceDomain: source.domain,
            sourceTitle: source.title,
            citationType: "direct_link",
            relevanceScore: 8,
          });
        }
      }
    }

    // Create placeholder runs for remaining prompts
    for (let i = 1; i < promptIds.length; i++) {
      if (i === 3) continue; // Skip prompt 3, already created
      const promptId = promptIds[i];

      for (let runNum = 1; runNum <= 4; runNum++) {
        const mentioned = Math.random() > 0.5;
        await ctx.db.insert("promptRuns", {
          companyId,
          reportId,
          promptId,
          runNumber: runNum,
          gptResponse: `Sample response for prompt ${i + 1}, run ${runNum}. ${mentioned ? "Acme Inc is mentioned here." : "Other tools are discussed."}`,
          targetCompanyMentioned: mentioned,
          mentionContext: mentioned ? "Acme Inc" : null,
          responseTokens: 150,
          executedAt: Date.now() - 1000 * 60 * runNum,
        });
      }
    }

    // 6. Create Reddit opportunities
    const redditOpportunities = [
      {
        subreddit: "r/projectmanagement",
        postTitle: "What PM tool works best for remote teams?",
        postUrl: "https://reddit.com/r/projectmanagement/sample1",
        postSnippet:
          "Looking for recommendations on project management tools that work well for distributed teams...",
        relevanceScore: 95,
        estimatedReach: 234,
        suggestedComment:
          "Have you considered Acme Inc? We've been using it for our remote team of 50+ and the real-time collaboration features are game-changing. The gantt charts integrate seamlessly with our workflow...",
        keywords: ["project management", "remote teams", "collaboration"],
        postedDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        opportunityType: "question" as const,
      },
      {
        subreddit: "r/SaaS",
        postTitle: "Asana alternatives that don't break the bank?",
        postUrl: "https://reddit.com/r/SaaS/sample2",
        postSnippet:
          "Looking for more affordable alternatives to Asana for my growing team...",
        relevanceScore: 88,
        estimatedReach: 89,
        suggestedComment:
          "Acme Inc offers similar features at 40% lower cost compared to Asana. We switched 6 months ago and haven't looked back. The migration was smooth and we're saving significantly on our monthly spend.",
        keywords: ["Asana alternative", "affordable", "project management"],
        postedDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
        opportunityType: "comparison" as const,
      },
      {
        subreddit: "r/startups",
        postTitle: "Best project management tools for tech startups?",
        postUrl: "https://reddit.com/r/startups/sample3",
        postSnippet:
          "Our startup is scaling fast and we need better project management...",
        relevanceScore: 82,
        estimatedReach: 156,
        suggestedComment:
          "Acme Inc has been perfect for our startup journey. It scales well as you grow and the pricing is startup-friendly. The integrations with GitHub and Slack have been particularly valuable for our tech team.",
        keywords: ["startup", "project management", "scaling"],
        postedDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        opportunityType: "recommendation" as const,
      },
    ];

    for (const reddit of redditOpportunities) {
      await ctx.db.insert("redditOpportunities", {
        companyId,
        reportId,
        subreddit: reddit.subreddit,
        postTitle: reddit.postTitle,
        postUrl: reddit.postUrl,
        postSnippet: reddit.postSnippet,
        relevanceScore: reddit.relevanceScore,
        estimatedReach: reddit.estimatedReach,
        suggestedComment: reddit.suggestedComment,
        keywords: reddit.keywords,
        postedDate: reddit.postedDate,
        opportunityType: reddit.opportunityType,
      });
    }

    return { companyId, reportId };
  },
});
