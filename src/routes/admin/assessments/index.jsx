import { createFileRoute } from "@tanstack/react-router";
import AssessmentsOverview from "@/admin/pages/Assessments/Overview";

export const Route = createFileRoute("/admin/assessments/")({
  component: AssessmentsOverview,
});
