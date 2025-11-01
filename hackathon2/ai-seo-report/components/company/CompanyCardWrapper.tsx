"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { CompanyCard } from "./CompanyCard";

interface CompanyCardWrapperProps {
  company: Doc<"companies">;
}

export function CompanyCardWrapper({ company }: CompanyCardWrapperProps) {
  // Get reports for this company
  const companyReports = useQuery(api.reports.getCompanyReports, {
    companyId: company._id,
  });

  return <CompanyCard company={company} reports={companyReports || []} />;
}
