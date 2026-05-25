import { AnalyticsPage } from "@/features/analytics/components/AnalyticsPage";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const Analytics = () => {
  // SEO Optimization
  useSeoMeta(
    "Analytics | BachatKaro",
    "Analyze your spending patterns, view monthly comparisons, and get AI-powered financial insights."
  );

  return <AnalyticsPage />;
};

export default Analytics;
