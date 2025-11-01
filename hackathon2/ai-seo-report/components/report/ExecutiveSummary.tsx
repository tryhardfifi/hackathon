import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";

interface ExecutiveSummaryProps {
  report: Doc<"reports">;
  company: Doc<"companies">;
  promptRuns: Doc<"promptRuns">[];
  competitorMentions: Doc<"competitorMentions">[];
}

export function ExecutiveSummary({
  report,
  company,
  promptRuns,
  competitorMentions,
}: ExecutiveSummaryProps) {
  // Calculate mention rate
  const totalRuns = promptRuns.length;
  const mentionedRuns = promptRuns.filter((run) => run.targetCompanyMentioned).length;
  const mentionRate = totalRuns > 0 ? Math.round((mentionedRuns / totalRuns) * 100) : 0;

  // Find top competitor
  const competitorCounts: Record<string, number> = {};
  competitorMentions.forEach((mention) => {
    competitorCounts[mention.competitorName] =
      (competitorCounts[mention.competitorName] || 0) + mention.mentionCount;
  });

  const topCompetitor = Object.entries(competitorCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Overall Visibility Score</p>
            <p className="text-3xl font-bold">{report.overallVisibilityScore}/100</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Total Prompts Tested</p>
            <p className="text-3xl font-bold">{report.totalPrompts}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Mention Rate</p>
            <p className="text-3xl font-bold">
              {mentionRate}%
              <span className="text-sm text-gray-500 ml-2">
                ({mentionedRuns}/{totalRuns} runs)
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Top Competitor</p>
            <p className="text-2xl font-bold">
              {topCompetitor ? topCompetitor[0] : "N/A"}
              {topCompetitor && (
                <span className="text-sm text-gray-500 ml-2">
                  ({topCompetitor[1]} mentions)
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
