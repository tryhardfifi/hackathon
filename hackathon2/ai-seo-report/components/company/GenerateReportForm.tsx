"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

export function GenerateReportForm() {
  const [url, setUrl] = useState("");
  const [promptCount, setPromptCount] = useState(5);
  const [runsPerPrompt, setRunsPerPrompt] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const generateReport = useAction(api.actions.generateReportFromURL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);
    setProgress("Starting report generation...");

    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new Error("Please enter a valid URL");
      }

      setProgress("Analyzing business website...");

      const result = await generateReport({
        url,
        promptCount,
        runsPerPrompt,
      });

      setProgress("Report generated successfully!");
      console.log("Report generated:", result);

      // Refresh the page to show the new report
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate report. Please try again."
      );
      setProgress("");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Sparkles className="w-6 h-6" />
          Generate New AI Visibility Report
        </CardTitle>
        <p className="text-sm text-blue-700">
          Enter a company website URL to analyze its visibility in AI-generated
          responses
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Website URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="promptCount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Number of Prompts
              </label>
              <select
                id="promptCount"
                value={promptCount}
                onChange={(e) => setPromptCount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                <option value={2}>2 prompts (Quick)</option>
                <option value={5}>5 prompts (Recommended)</option>
                <option value={10}>10 prompts (Comprehensive)</option>
                <option value={15}>15 prompts (Detailed)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="runsPerPrompt"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Runs per Prompt
              </label>
              <select
                id="runsPerPrompt"
                value={runsPerPrompt}
                onChange={(e) => setRunsPerPrompt(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                <option value={2}>2 runs</option>
                <option value={4}>4 runs (Recommended)</option>
                <option value={6}>6 runs</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 text-sm text-gray-600">
            <p className="font-medium mb-1">Estimated time:</p>
            <p>
              ~{Math.ceil((promptCount * runsPerPrompt * 8) / 60)} minutes for{" "}
              {promptCount * runsPerPrompt} total API calls
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {progress && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-start gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
              <div className="text-sm text-blue-800">{progress}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Report generation uses OpenAI and Perplexity
            APIs to analyze your business visibility. Make sure your API keys are
            configured in environment variables.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
