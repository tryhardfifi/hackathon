"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VisibilityChartProps {
  company: Doc<"companies">;
  promptRuns: Doc<"promptRuns">[];
  competitorMentions: Doc<"competitorMentions">[];
}

export function VisibilityChart({
  company,
  promptRuns,
  competitorMentions,
}: VisibilityChartProps) {
  // Calculate company mention rate
  const totalRuns = promptRuns.length;
  const companyMentions = promptRuns.filter((run) => run.targetCompanyMentioned).length;
  const companyRate = totalRuns > 0 ? (companyMentions / totalRuns) * 100 : 0;

  // Calculate competitor mention rates
  const competitorStats: Record<string, { total: number; mentions: number }> = {};

  promptRuns.forEach((run) => {
    const runCompetitors = competitorMentions.filter(
      (m) => m.promptRunId === run._id
    );

    runCompetitors.forEach((comp) => {
      if (!competitorStats[comp.competitorName]) {
        competitorStats[comp.competitorName] = { total: 0, mentions: 0 };
      }
      competitorStats[comp.competitorName].mentions += 1;
    });
  });

  // Count total runs for each competitor
  Object.keys(competitorStats).forEach((compName) => {
    competitorStats[compName].total = totalRuns;
  });

  // Prepare chart data
  const chartData = [
    {
      name: company.name,
      rate: Math.round(companyRate),
      fill: "#3b82f6", // blue
    },
    ...Object.entries(competitorStats)
      .map(([name, stats]) => ({
        name,
        rate: Math.round((stats.mentions / stats.total) * 100),
        fill: "#94a3b8", // gray
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 4), // Top 4 competitors
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Visibility Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="rate" name="Mention Rate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
