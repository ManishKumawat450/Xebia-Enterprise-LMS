import React, { useState } from "react";
import { useLMS } from "../context/LMSContext";
import { toast } from "../components/Toast";
import {
  User,
  Lock,
  Bell,
  Sliders,
  Save,
  Check,
  Globe,
  Monitor,
  Volume2,
  UploadCloud,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Settings = () => {
  const { currentUser, updateProfile, theme, toggleTheme } = useLMS();

  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form States
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState("+1 (555) 482-1928");
  const [bio, setBio] = useState(
    "Academic enthusiast exploring state managers, compilers, and microservice architectures.",
  );
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);
  const [isDragging, setIsDragging] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications toggles
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyGraded, setNotifyGraded] = useState(true);
  const [notifyDeadline, setNotifyDeadline] = useState(true);

  // Preferences States
  const [selectedLang, setSelectedLang] = useState("English");
  const [soundEffects, setSoundEffects] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
  ];

  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const size = Math.min(img.width, img.height);
          canvas.width = 200;
          canvas.height = 200;

          // Crop to center and resize
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;

          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 200, 200);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setSelectedAvatar(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      toast.add("Please upload a valid image file", "warning");
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.add("Name cannot be blank", "warning");
      return;
    }

    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        avatar: selectedAvatar,
      });
      toast.add("Profile details updated successfully!", "success");
    } catch (err) {
      toast.add(err.message || "Failed to update profile", "error");
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.add("Please populate all password parameters", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.add("New passwords do not match!", "warning");
      return;
    }

    toast.add("Password updated securely!", "success");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    toast.add("Notification preferences synchronized", "success");
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    toast.add("System preferences updated successfully!", "success");
  };

  const tabItems = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "security", label: "Security & Password", icon: Lock },
    { id: "notifications", label: "Notification alerts", icon: Bell },
  ];

  return (
    <div className="flex flex-col gap-6 items-start w-full">
      {/* Settings Navigation Top Tabs */}
      <div className="w-full bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-2 rounded-2xl flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex flex-1 flex-wrap gap-2">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${isActive ? "bg-[#6C1D5F] text-white shadow-md" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-neutral-700 dark:hover:text-neutral-200"}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Area */}
      <div className="w-full bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-6 rounded-2xl min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.form
              key="profile"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleSaveProfile}
              className="space-y-6 text-xs"
            >
              <div>
                <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">
                  My Profile Details
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Customize your general institutional profile metadata and account picture
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-neutral-500 uppercase tracking-wider text-[10px]">
                  Select Profile Picture
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Drag and Drop Zone */}
                  <label
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-200 shrink-0
                      ${isDragging ? "border-brand-velvet bg-[#6C1D5F]/10 scale-105" : "border-neutral-300 dark:border-neutral-700 hover:border-[#6C1D5F] hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                  >
                    {selectedAvatar ? (
                      <img
                        src={selectedAvatar}
                        alt="Current"
                        className="w-full h-full object-cover bg-neutral-100"
                      />
                    ) : (
                      <div className="flex flex-col items-center p-4 text-center">
                        <UploadCloud className="w-6 h-6 text-neutral-400 mb-1" />
                        <span className="text-[9px] font-bold text-neutral-500">Upload Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] font-bold">Change</span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>

                  {/* Presets */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Or choose a preset:
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {avatarPresets.map((av, index) => {
                        const isSelected = selectedAvatar === av;
                        return (
                          <button
                            type="button"
                            key={index}
                            onClick={() => setSelectedAvatar(av)}
                            className={`relative w-10 h-10 rounded-full border overflow-hidden cursor-pointer transition-all ${isSelected ? "ring-2 ring-[#01AC9F] scale-105" : "opacity-70 hover:opacity-100"}`}
                          >
                            <img src={av} alt="" className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#01AC9F]/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-neutral-500">Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-velvet dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-neutral-500">Contact Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-velvet dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-neutral-500">
                    Phone Number (SMS Alert Gateway)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl focus:outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-neutral-500">System Role Level</label>
                  <input
                    type="text"
                    disabled
                    value={
                      currentUser.role === "teacher"
                        ? "Faculty Trainer (Admin)"
                        : "Enrolled Student Account"
                    }
                    className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-2xl font-bold uppercase tracking-wider text-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-500">Biographical Description</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl text-xs focus:outline-none dark:text-white"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 bg-[#6C1D5F] hover:bg-[#84117C] text-white rounded-2xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile details</span>
              </button>
            </motion.form>
          )}

          {activeTab === "security" && (
            <motion.form
              key="security"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleUpdatePassword}
              className="space-y-6 text-xs"
            >
              <div>
                <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">
                  Account Security
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Revise your current password credentials and secure access tokens
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="block font-bold text-neutral-500">
                    Current Security Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-neutral-500">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-neutral-500">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Verify new strong password..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 bg-[#6C1D5F] hover:bg-[#84117C] text-white rounded-2xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Update Password Credentials</span>
              </button>
            </motion.form>
          )}

          {activeTab === "notifications" && (
            <motion.form
              key="notifications"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleSaveNotifications}
              className="space-y-6 text-xs"
            >
              <div>
                <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">
                  Alert Gateways
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Control where and how you receive alerts, grading outcomes, and deadlines
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3.5 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border/80 dark:border-neutral-700/80 dark:border-neutral-800/80 rounded-2xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyPush}
                    onChange={(e) => setNotifyPush(e.target.checked)}
                    className="w-4.5 h-4.5 text-brand-velvet"
                  />

                  <div>
                    <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
                      Browser Audio Alerts
                    </h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Enable interactive, immediate desktop audible indicators upon new submissions
                      or marks
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3.5 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border/80 dark:border-neutral-700/80 dark:border-neutral-800/80 rounded-2xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyGraded}
                    onChange={(e) => setNotifyGraded(e.target.checked)}
                    className="w-4.5 h-4.5 text-brand-velvet"
                  />

                  <div>
                    <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
                      Assessment Evaluation Releases
                    </h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Notify instantly as soon as a teacher publishes a graded descriptive essay or
                      short answer marks
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3.5 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border/80 dark:border-neutral-700/80 dark:border-neutral-800/80 rounded-2xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyDeadline}
                    onChange={(e) => setNotifyDeadline(e.target.checked)}
                    className="w-4.5 h-4.5 text-brand-velvet"
                  />

                  <div>
                    <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
                      Deadline Reminders
                    </h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Push active automated checks 24 hours prior to final closing date of an
                      assessment
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 bg-[#6C1D5F] hover:bg-[#84117C] text-white rounded-2xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Notifications Configuration</span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
