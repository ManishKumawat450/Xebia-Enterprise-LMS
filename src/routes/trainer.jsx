import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UnifiedLayout } from "@/components/layout/unified-layout";
import { useLMS } from "@/context/LMSContext";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/trainer")({
  component: TrainerLayout,
});

function TrainerLayout() {
  const { currentUser } = useLMS();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (currentUser?.mustChangePassword) {
      navigate({ to: "/change-password", replace: true });
    } else if (
      !currentUser ||
      currentUser.role !== "teacher" ||
      !localStorage.getItem("lms_token")
    ) {
      navigate({ to: "/", replace: true });
    }
  }, [mounted, currentUser, navigate]);

  if (
    !mounted ||
    !currentUser ||
    currentUser.role !== "teacher" ||
    currentUser.mustChangePassword ||
    (typeof window !== "undefined" && !window.localStorage.getItem("lms_token"))
  ) {
    return null; // Don't render layout while mounting or redirecting
  }

  return <UnifiedLayout portalType="trainer" />;
}
