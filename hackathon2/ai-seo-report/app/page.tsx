"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CompanyCardWrapper } from "@/components/company/CompanyCardWrapper";
import { GenerateReportForm } from "@/components/company/GenerateReportForm";
import { useState } from "react";
import { Building2, Plus } from "lucide-react";

export default function Home() {
  // Get all companies
  const companies = useQuery(api.companies.list);

  // Seed mutation
  const seedData = useMutation(api.seed.seedAcmeInc);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedData();
    } catch (error) {
      console.error("Error seeding data:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  // Loading state
  if (companies === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No companies yet - show seed button
  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI SEO Report
          </h1>
          <p className="text-gray-600 mb-8">
            No companies found. Click the button below to seed the database with
            sample data for Acme Inc.
          </p>
          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isSeeding ? "Seeding Data..." : "Seed Sample Data"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Building2 className="w-10 h-10 text-blue-600" />
            AI SEO Reports
          </h1>
          <p className="text-gray-600">
            Monitor your company's visibility in AI-generated responses
          </p>
        </div>

        {/* Generate Report Form */}
        <div className="mb-8">
          <GenerateReportForm />
        </div>

        {/* Companies List */}
        <div className="space-y-6">
          {companies.map((company) => (
            <CompanyCardWrapper key={company._id} company={company} />
          ))}
        </div>

        {/* Add Sample Data Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="px-6 py-3 bg-white border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-lg hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isSeeding ? "Adding..." : "Add Sample Company"}
          </button>
        </div>
      </div>
    </div>
  );
}
