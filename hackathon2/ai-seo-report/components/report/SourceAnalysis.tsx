"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SourceAnalysisProps {
  sourceCitations: Doc<"sourceCitations">[];
}

export function SourceAnalysis({ sourceCitations }: SourceAnalysisProps) {
  // Count citations by domain
  const domainCounts: Record<string, number> = {};
  sourceCitations.forEach((citation) => {
    domainCounts[citation.sourceDomain] =
      (domainCounts[citation.sourceDomain] || 0) + 1;
  });

  // Sort by count and get top 5
  const topSources = Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([domain, count]) => ({
      domain,
      count,
    }));

  // Get the top source
  const topSource = topSources[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📚 Source Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Most Cited Sources:</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="domain" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" name="Citations" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-4">
              {topSources.map((source, idx) => (
                <div key={source.domain} className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-700">
                    {idx + 1}.
                  </span>
                  <span className="text-gray-900">{source.domain}</span>
                  <span className="text-sm text-gray-500">
                    - {source.count} citations
                  </span>
                </div>
              ))}
            </div>
          </div>

          {topSource && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900">
                💡 <span className="font-semibold">Insight:</span> Focus on getting
                featured on <span className="font-bold">{topSource.domain}</span>{" "}
                and other top-cited sources for better AI visibility.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
