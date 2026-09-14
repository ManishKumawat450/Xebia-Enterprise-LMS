import { useEffect, useState } from "react";
import { Pencil, Lock, User, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLMS } from "@/context/LMSContext";

/**
 * Profile hero card with avatar, name, role badges, and action buttons.
 * Reads the real logged-in user from LMSContext; "Edit Profile" opens a
 * dialog whose Save persists name/email to the users table via the backend
 * (LMSContext.updateProfile -> PUT /api/v1/users/{id}).
 */
export function ProfileHeader() {
  const { currentUser, batches, updateProfile } = useLMS();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");

  // Sync the form whenever the dialog is opened with the latest profile.
  useEffect(() => {
    if (isEditOpen && currentUser) {
      setFormName(currentUser.name || "");
      setFormEmail(currentUser.email || "");
    }
  }, [isEditOpen, currentUser]);

  if (!currentUser) return null;

  const displayName = currentUser.name || "Student";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const myBatchNames = (currentUser.batches || [])
    .map((id) => (batches || []).find((b) => b.id === id)?.name)
    .filter(Boolean);

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.warning("Name cannot be blank");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ name: formName.trim(), email: formEmail.trim() });
      toast.success("Profile updated", {
        description: "Your changes have been saved.",
      });
      setIsEditOpen(false);
    } catch (err) {
      toast.error("Could not save profile", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    toast.info("Change Password", {
      description:
        "Password change will be available after backend integration.",
    });
  };

  return (
    <Card className="glass relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
      <CardContent className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 h-24 w-24 rounded-full bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center text-3xl font-bold text-primary overflow-hidden">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : initials ? (
              initials
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>

          {/* Name & Role */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
            <p className="text-muted-foreground mt-1 capitalize">{currentUser.role}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {myBatchNames.length > 0 ? (
                myBatchNames.map((name) => (
                  <Badge
                    key={name}
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  >
                    {name}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  No batch assigned yet
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Button
              onClick={() => setIsEditOpen(true)}
              className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={handleChangePassword}
              className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Edit Profile Dialog */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Edit Profile</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email Address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Changes are saved to your account and stay in sync with the
                trainer and admin views.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </Card>
  );
}
