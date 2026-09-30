import { createFileRoute } from "@tanstack/react-router";
import AssessmentDetailAdmin from "@/admin/pages/Assessments/AssessmentDetailAdmin";

export const Route = createFileRoute("/admin/assessments/$assessmentId")({
  component: AssessmentDetailAdmin,
});
