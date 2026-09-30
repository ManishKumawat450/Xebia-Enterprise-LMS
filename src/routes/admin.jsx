import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UnifiedLayout } from "@/components/layout/unified-layout";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [authorizedForUi, setAuthorizedForUi] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem("lms_token");
      const user = JSON.parse(localStorage.getItem("session") || "null");
      if (!token || String(user?.role || "").toLowerCase() !== "admin") {
        navigate({ to: "/" });
        return;
      }
      if (user.mustChangePassword) {
        navigate({ to: "/change-password" });
        return;
      }
      setAuthorizedForUi(true);
    } catch {
      navigate({ to: "/" });
    }
  }, [navigate]);

  if (!authorizedForUi) return null;
  return <UnifiedLayout portalType="admin" />;
}
