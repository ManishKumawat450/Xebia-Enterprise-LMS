import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLMS } from "@/context/LMSContext";

/**
 * Welcome banner displayed at the top of the student dashboard.
 */
export function WelcomeBanner() {
  const { currentUser } = useLMS();

  const name = currentUser?.name || "Student";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4A1E47] via-[#6C1D5F] to-[#84117C] p-5 sm:p-6 text-white shadow-lg">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          Welcome back, <span className="text-[#D3CCEC]">{name}</span>
        </h1>
        <p className="mt-1.5 text-white/80 text-xs sm:text-sm font-medium">
          Continue your learning journey and track your progress.
        </p>
      </div>
    </div>
  );
}
