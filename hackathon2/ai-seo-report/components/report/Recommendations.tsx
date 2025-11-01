import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";

interface RecommendationsProps {
  company: Doc<"companies">;
  report: Doc<"reports">;
  promptRuns: Doc<"promptRuns">[];
  competitorMentions: Doc<"competitorMentions">[];
  sourceCitations: Doc<"sourceCitations">[];
  redditOpportunities: Doc<"redditOpportunities">[];
}

export function Recommendations({
  company,
  report,
  promptRuns,
  competitorMentions,
  sourceCitations,
  redditOpportunities,
}: RecommendationsProps) {
  // Calculate insights for recommendations
  const topSourceDomain = sourceCitations.length > 0
    ? sourceCitations
        .reduce((acc: Record<string, number>, citation) => {
          acc[citation.sourceDomain] = (acc[citation.sourceDomain] || 0) + 1;
          return acc;
        }, {})
    : {};

  const topSource = Object.entries(topSourceDomain).sort(([, a], [, b]) => b - a)[0];

  const competitorCounts: Record<string, number> = {};
  competitorMentions.forEach((mention) => {
    competitorCounts[mention.competitorName] =
      (competitorCounts[mention.competitorName] || 0) + mention.mentionCount;
  });

  const topCompetitor = Object.entries(competitorCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  const companyMentions = promptRuns.filter((run) => run.targetCompanyMentioned).length;
  const topCompetitorMentions = topCompetitor ? topCompetitor[1] : 0;
  const mentionDifference = topCompetitorMentions > 0
    ? Math.round(((topCompetitorMentions - companyMentions) / companyMentions) * 100)
    : 0;

  const recommendations = [
    {
      icon: "⚠️",
      title: topSource
        ? `Increase presence on ${topSource[0]} and similar review sites`
        : "Increase presence on review sites",
      description: topSource
        ? `${topSource[0]} is the most cited source in AI responses. Getting featured here will significantly improve your visibility.`
        : "Review sites are frequently cited in AI responses.",
    },
    {
      icon: "🎯",
      title: "Target specific keyword gaps",
      description:
        "Analyze prompts where you weren't mentioned and create targeted content around those topics.",
    },
    {
      icon: "💬",
      title: `Engage in ${redditOpportunities.length} Reddit threads this week`,
      description:
        "Use the provided suggested comments to authentically participate in relevant discussions.",
    },
    {
      icon: "📈",
      title: topCompetitor
        ? `${topCompetitor[0]} appears ${mentionDifference}% more than ${company.name}`
        : "Study your top competitors",
      description: topCompetitor
        ? `Study ${topCompetitor[0]}'s content strategy and identify opportunities to differentiate.`
        : "Analyze what makes your competitors more visible in AI responses.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💡 Recommendations
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Based on this analysis:
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-2xl flex-shrink-0">{rec.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {idx + 1}. {rec.title}
                </h4>
                <p className="text-sm text-gray-600">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Next Steps:</span> Implement these
            recommendations over the next 30 days and run another report to track
            your progress. Focus on high-impact activities first: review site
            presence and Reddit engagement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
