import { ChatGPTResponse, CustomerPrompt, BusinessInfo, SingleRunResult } from '../types';

/**
 * Generate mocked ChatGPT response data
 * This simulates what ChatGPT might return for different customer prompts
 */
export function generateMockChatGPTResponses(
  businessInfo: BusinessInfo,
  customerPrompts: CustomerPrompt[]
): ChatGPTResponse[] {
  const businessName = businessInfo.businessName.toLowerCase();
  const industry = businessInfo.industry.toLowerCase();

  // Common source URLs based on industry
  const industrySources: Record<string, string[]> = {
    'coffee': [
      'https://www.coffeegeek.com',
      'https://www.perfectdailygrind.com',
      'https://www.sprudge.com',
      'https://www.coffeeandcocoa.net',
      'https://www.homegrounds.co',
    ],
    'restaurant': [
      'https://www.yelp.com',
      'https://www.tripadvisor.com',
      'https://www.zomato.com',
      'https://www.opentable.com',
      'https://www.timeout.com',
    ],
    'technology': [
      'https://www.techcrunch.com',
      'https://www.venturebeat.com',
      'https://www.producthunt.com',
      'https://www.crunchbase.com',
      'https://www.g2.com',
    ],
    'retail': [
      'https://www.amazon.com',
      'https://www.etsy.com',
      'https://www.shopify.com',
      'https://www.buzzfeed.com',
      'https://www.goodhousekeeping.com',
    ],
  };

  // Get sources for this industry, or use generic ones
  const defaultSources = industrySources[industry] || [
    'https://www.google.com',
    'https://www.industryweek.com',
    'https://www.inc.com',
    'https://www.forbes.com',
    'https://www.businessinsider.com',
  ];

  return customerPrompts.map((promptObj, index) => {
    const prompt = promptObj.prompt.toLowerCase();
    const category = promptObj.category.toLowerCase();

    // Determine if business should be mentioned based on category and prompt content
    let businessMentioned = false;
    let rank: number | null = null;

    // Higher chance of mention for certain categories
    const baseMentionChance =
      category.includes('finding') || category.includes('recommend') ? 0.6 :
      category.includes('compar') ? 0.4 :
      category.includes('specific') ? 0.5 :
      0.3;

    // Check if prompt mentions business name or industry keywords
    const mentionsBusinessName = prompt.includes(businessName) ||
                                 prompt.includes(businessInfo.businessName.toLowerCase().split(' ')[0]);
    const mentionsIndustry = prompt.includes(industry) ||
                            industry.split(' ').some(word => prompt.includes(word));

    if (mentionsBusinessName) {
      businessMentioned = true;
      rank = 1; // Top result if explicitly mentioned
    } else if (Math.random() < baseMentionChance && mentionsIndustry) {
      businessMentioned = true;
      // Rank between 1-5 if mentioned (with higher chance of lower ranks)
      rank = Math.random() < 0.4 ? 1 :
             Math.random() < 0.6 ? 2 :
             Math.random() < 0.8 ? 3 :
             Math.random() < 0.9 ? 4 : 5;
    }

    // Generate business-specific sources (blog posts, pages, etc.)
    const businessSources: string[] = [];
    if (businessInfo.website) {
      const baseUrl = businessInfo.website.replace(/\/$/, ''); // Remove trailing slash
      // Create some realistic blog post URLs based on industry
      if (industry.includes('coffee')) {
        businessSources.push(
          `${baseUrl}/blog/top-10-coffee-roasters-in-portland`,
          `${baseUrl}/guide/sustainable-coffee-sourcing`,
          `${baseUrl}/blog/best-direct-trade-beans`,
          `${baseUrl}/about/our-roasting-process`,
          `${baseUrl}/blog/how-to-brew-specialty-coffee`
        );
      } else if (industry.includes('restaurant')) {
        businessSources.push(
          `${baseUrl}/menu`,
          `${baseUrl}/blog/restaurant-reviews`,
          `${baseUrl}/about/chef-story`,
          `${baseUrl}/events`
        );
      } else {
        // Generic business pages
        businessSources.push(
          `${baseUrl}/blog`,
          `${baseUrl}/about`,
          `${baseUrl}/services`,
          `${baseUrl}/resources/guide`
        );
      }
    }

    // Select 2-4 random sources for each response
    const numSources = Math.floor(Math.random() * 3) + 2; // 2-4 sources
    const allSources = [...defaultSources, ...businessSources];
    const shuffled = [...allSources].sort(() => 0.5 - Math.random());
    let sources = shuffled.slice(0, numSources);

    // If business is mentioned, increase chance of including business sources
    if (businessMentioned && businessSources.length > 0) {
      // Replace one random source with a business source 70% of the time
      if (Math.random() < 0.7) {
        const randomBusinessSource = businessSources[Math.floor(Math.random() * businessSources.length)];
        sources[Math.floor(Math.random() * sources.length)] = randomBusinessSource;
      }
    }

    // Generate 4 mock runs with some variability
    const numRuns = 4;
    const runs: SingleRunResult[] = [];
    let mentionCount = 0;
    let totalRank = 0;
    const allRunSources = new Set<string>();

    for (let i = 0; i < numRuns; i++) {
      // Add some randomness to each run
      const runMentioned = businessMentioned && Math.random() < 0.8; // 80% chance if business would be mentioned
      const runRank = runMentioned ? (rank || Math.floor(Math.random() * 3) + 1) : null;

      // Select sources for this run
      const runSourceCount = Math.floor(Math.random() * 2) + 2; // 2-3 sources per run
      const shuffled = [...allSources].sort(() => 0.5 - Math.random());
      const runSources = shuffled.slice(0, runSourceCount);

      runSources.forEach(s => allRunSources.add(s));

      runs.push({
        businessMentioned: runMentioned,
        rank: runRank,
        sources: runSources,
      });

      if (runMentioned) {
        mentionCount++;
        if (runRank) totalRank += runRank;
      }
    }

    const mentionProbability = (mentionCount / numRuns) * 100;
    const avgRank = mentionCount > 0 ? totalRank / mentionCount : null;
    const anyMentioned = mentionCount > 0;

    return {
      prompt: promptObj.prompt,
      businessMentioned: anyMentioned,
      rank: avgRank,
      sources: Array.from(allRunSources),
      mentionProbability,
      runs,
      totalRuns: numRuns,
    };
  });
}

