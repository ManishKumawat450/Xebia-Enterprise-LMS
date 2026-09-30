import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthService } from "@/services/api";
import { useLMS } from "@/context/LMSContext";
import { toast } from "@/components/Toast";

export const Route = createFileRoute("/change-password")({ component: ChangePasswordPage });

function ChangePasswordPage() {
  const { currentUser, logout } = useLMS();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("lms_token") || !currentUser) navigate({ to: "/" });
  }, [currentUser, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword.length < 12 || newPassword.length > 72) {
      toast.add("Your new password must be 12–72 characters.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.add("The new passwords do not match.", "warning");
      return;
    }

    setSaving(true);
    try {
      await AuthService.changePassword(currentPassword, newPassword);
      logout();
      toast.add("Password changed. Sign in with your new password.", "success");
      navigate({ to: "/" });
    } catch (error) {
      toast.add(error?.message || "Could not change password.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (typeof window === "undefined" || !currentUser || !window.localStorage.getItem("lms_token"))
    return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8f9fb] dark:bg-[#0a0510] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white dark:bg-[#15151f] border border-gray-200 dark:border-[#2e2e3e] p-7 shadow-xl"
      >
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
            Change your password
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Set a new password before continuing to your portal.
          </p>
        </div>
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Current password
          <input
            className="mt-2 w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 dark:border-neutral-700"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          New password (12–72 characters)
          <input
            className="mt-2 w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 dark:border-neutral-700"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Confirm new password
          <input
            className="mt-2 w-full rounded-xl border border-neutral-300 bg-transparent px-4 py-3 dark:border-neutral-700"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <button
          disabled={saving}
          className="w-full rounded-xl bg-[#6C1D5F] px-4 py-3 font-bold text-white disabled:opacity-60"
          type="submit"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
