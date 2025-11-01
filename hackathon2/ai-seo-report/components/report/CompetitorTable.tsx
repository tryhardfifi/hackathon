import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";

interface CompetitorTableProps {
  company: Doc<"companies">;
  promptRuns: Doc<"promptRuns">[];
  competitorMentions: Doc<"competitorMentions">[];
}

interface CompetitorStats {
  name: string;
  totalMentions: number;
  avgPosition: number;
  mentionRate: number;
}

export function CompetitorTable({
  company,
  promptRuns,
  competitorMentions,
}: CompetitorTableProps) {
  const totalRuns = promptRuns.length;

  // Calculate company stats
  const companyMentionedRuns = promptRuns.filter(
    (run) => run.targetCompanyMentioned
  ).length;
  const companyStats: CompetitorStats = {
    name: company.name,
    totalMentions: companyMentionedRuns,
    avgPosition: 0, // We don't track position for the target company
    mentionRate: totalRuns > 0 ? (companyMentionedRuns / totalRuns) * 100 : 0,
  };

  // Calculate competitor stats
  const competitorStatsMap: Record<string, {
    totalMentions: number;
    positions: number[];
    runIds: Set<string>;
  }> = {};

  competitorMentions.forEach((mention) => {
    if (!competitorStatsMap[mention.competitorName]) {
      competitorStatsMap[mention.competitorName] = {
        totalMentions: 0,
        positions: [],
        runIds: new Set(),
      };
    }
    competitorStatsMap[mention.competitorName].totalMentions +=
      mention.mentionCount;
    competitorStatsMap[mention.competitorName].positions.push(
      mention.positionInResponse
    );
    competitorStatsMap[mention.competitorName].runIds.add(mention.promptRunId);
  });

  const competitorStatsList: CompetitorStats[] = Object.entries(
    competitorStatsMap
  ).map(([name, stats]) => ({
    name,
    totalMentions: stats.totalMentions,
    avgPosition:
      stats.positions.length > 0
        ? stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length
        : 0,
    mentionRate: totalRuns > 0 ? (stats.runIds.size / totalRuns) * 100 : 0,
  }));

  // Combine and sort all stats
  const allStats = [companyStats, ...competitorStatsList].sort(
    (a, b) => b.mentionRate - a.mentionRate
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Competitor Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Competitor
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Total Mentions
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Avg Position
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Mention Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {allStats.map((stat, idx) => (
                <tr
                  key={stat.name}
                  className={`border-b border-gray-100 ${
                    stat.name === company.name ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-4">
                    <span
                      className={`font-medium ${
                        stat.name === company.name
                          ? "text-blue-900"
                          : "text-gray-900"
                      }`}
                    >
                      {stat.name}
                      {stat.name === company.name && (
                        <span className="ml-2 text-xs text-blue-600">
                          (Your Company)
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {stat.totalMentions}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">
                    {stat.avgPosition > 0 ? stat.avgPosition.toFixed(1) : "—"}
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stat.name === company.name
                              ? "bg-blue-600"
                              : "bg-gray-600"
                          }`}
                          style={{ width: `${Math.min(stat.mentionRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {Math.round(stat.mentionRate)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
