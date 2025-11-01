"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { FileText, TrendingUp, Calendar } from "lucide-react";

interface CompanyCardProps {
  company: Doc<"companies">;
  reports: Doc<"reports">[];
}

export function CompanyCard({ company, reports }: CompanyCardProps) {
  // Sort reports by date, newest first
  const sortedReports = [...reports].sort((a, b) => b.reportDate - a.reportDate);
  const latestReport = sortedReports[0];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{company.name}</CardTitle>
            <p className="text-sm text-gray-600 mb-2">{company.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {company.industry}
              </span>
              <a
                href={company.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                {company.url}
              </a>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports ({reports.length})
            </h3>
            {latestReport && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Score: {latestReport.overallVisibilityScore}/100
              </div>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="text-sm text-gray-500 italic py-4 text-center">
              No reports yet
            </div>
          ) : (
            <div className="space-y-2">
              {sortedReports.map((report) => (
                <Link
                  key={report._id}
                  href={`/reports/${report._id}`}
                  className="block p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs rounded font-medium ${
                            report.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : report.status === "generating"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeDate(report.reportDate)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {report.totalPrompts} prompts • {report.runsPerPrompt}x runs
                        each
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {report.overallVisibilityScore}
                      </div>
                      <div className="text-xs text-gray-500">score</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
