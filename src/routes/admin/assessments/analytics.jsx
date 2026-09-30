import { createFileRoute } from "@tanstack/react-router";
import AssessmentsAnalytics from "@/admin/pages/Assessments/Analytics";

export const Route = createFileRoute("/admin/assessments/analytics")({
  component: AssessmentsAnalytics,
});
