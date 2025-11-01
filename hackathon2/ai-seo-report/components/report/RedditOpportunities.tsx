"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";
import { formatRelativeDate } from "@/lib/utils";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

interface RedditOpportunitiesProps {
  redditOpportunities: Doc<"redditOpportunities">[];
}

export function RedditOpportunities({
  redditOpportunities,
}: RedditOpportunitiesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyComment = (id: string, comment: string) => {
    navigator.clipboard.writeText(comment);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case "question":
        return "🔥";
      case "comparison":
        return "📊";
      case "recommendation":
        return "💡";
      case "complaint":
        return "⚠️";
      default:
        return "💬";
    }
  };

  // Sort by relevance score
  const sortedOpportunities = [...redditOpportunities].sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💬 Reddit Opportunities
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Found {redditOpportunities.length} high-value engagement opportunities
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedOpportunities.map((opportunity) => (
          <div
            key={opportunity._id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {getOpportunityIcon(opportunity.opportunityType)}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {opportunity.subreddit}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {formatRelativeDate(opportunity.postedDate)}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {opportunity.estimatedReach} upvotes
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {opportunity.postTitle}
                </h4>
              </div>
              <a
                href={opportunity.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex-shrink-0"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {opportunity.postSnippet}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-700">
                Relevance:
              </span>
              <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${opportunity.relevanceScore}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {opportunity.relevanceScore}/100
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                💬 Suggested Comment:
              </p>
              <p className="text-sm text-gray-700 italic">
                "{opportunity.suggestedComment}"
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleCopyComment(opportunity._id, opportunity.suggestedComment)
                }
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              >
                {copiedId === opportunity._id ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Comment
                  </>
                )}
              </button>
              <a
                href={opportunity.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                View Thread →
              </a>
            </div>

            {opportunity.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {opportunity.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
