import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/assessments")({
  component: () => <Outlet />,
});
