"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface PromptPerformanceProps {
  prompts: Doc<"prompts">[];
  promptRuns: Doc<"promptRuns">[];
  competitorMentions: Doc<"competitorMentions">[];
}

export function PromptPerformance({
  prompts,
  promptRuns,
  competitorMentions,
}: PromptPerformanceProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  const togglePrompt = (promptId: string) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(promptId)) {
      newExpanded.delete(promptId);
    } else {
      newExpanded.add(promptId);
    }
    setExpandedPrompts(newExpanded);
  };

  // Group prompts by category
  const promptsByCategory: Record<string, Doc<"prompts">[]> = {};
  prompts.forEach((prompt) => {
    if (!promptsByCategory[prompt.category]) {
      promptsByCategory[prompt.category] = [];
    }
    promptsByCategory[prompt.category].push(prompt);
  });

  // Sort each category by order index
  Object.keys(promptsByCategory).forEach((category) => {
    promptsByCategory[category].sort((a, b) => a.orderIndex - b.orderIndex);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📝 Prompt Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(promptsByCategory).map(([category, categoryPrompts]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Category: {category}
            </h3>
            {categoryPrompts.map((prompt) => {
              const runs = promptRuns.filter((r) => r.promptId === prompt._id);
              const mentionedRuns = runs.filter((r) => r.targetCompanyMentioned);
              const mentionRate = runs.length > 0
                ? Math.round((mentionedRuns.length / runs.length) * 100)
                : 0;

              const promptCompetitors = competitorMentions.filter((m) =>
                runs.some((r) => r._id === m.promptRunId)
              );

              const competitorCounts: Record<string, number> = {};
              promptCompetitors.forEach((mention) => {
                competitorCounts[mention.competitorName] =
                  (competitorCounts[mention.competitorName] || 0) +
                  mention.mentionCount;
              });

              const topCompetitors = Object.entries(competitorCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);

              const isExpanded = expandedPrompts.has(prompt._id);

              return (
                <div
                  key={prompt._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <button
                    onClick={() => togglePrompt(prompt._id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          Prompt {prompt.orderIndex}: "{prompt.promptText}"
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>
                            Mention Rate:{" "}
                            <span className="font-semibold">
                              {mentionedRuns.length}/{runs.length} ({mentionRate}%)
                            </span>
                          </span>
                          {topCompetitors.length > 0 && (
                            <span>
                              Competitors:{" "}
                              {topCompetitors
                                .map(([name, count]) => `${name} (${count})`)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      {runs.map((run, idx) => (
                        <div
                          key={run._id}
                          className="text-sm bg-gray-50 p-3 rounded"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Run {run.runNumber}</span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                run.targetCompanyMentioned
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {run.targetCompanyMentioned
                                ? "Mentioned"
                                : "Not Mentioned"}
                            </span>
                          </div>
                          <p className="text-gray-700 line-clamp-3">
                            {run.gptResponse}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
