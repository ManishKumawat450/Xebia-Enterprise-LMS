import React, { useState, useEffect, useRef } from "react";
import { AuthService } from "@/services/api";
import {
  Search,
  Menu,
  Settings,
  Sun,
  Moon,
  X,
  BookOpen,
} from "lucide-react";
import {
  studentProfile,
} from "@/features/student/mocks/dummy-data";
import { Link, useRouter } from "@tanstack/react-router";
import { useDarkMode } from "@/features/student/hooks/use-dark-mode";
import { useAppStore } from "@/admin/store/useAppStore";
import { CourseService, CategoryService } from "@/services/api";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function StudentNavbar({ isMobileOpen, setIsMobileOpen }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toggleSidebar, breadcrumbs, addToast } = useAppStore();
  const router = useRouter();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("lms_theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("lms_theme", "dark");
      setIsDark(true);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("lms_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  // Search Logic
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    courses: [],
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      CourseService.getCourses().then((courses) => {
        const lower = searchQuery.toLowerCase();
        setSearchResults({
          courses: (courses || [])
            .filter((c) => (c.title || "").toLowerCase().includes(lower))
            .slice(0, 5),
        });
      });
    } else {
      setSearchResults({ courses: [] });
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (type, slug) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    router.navigate({ to: `/student/course/${slug}` });
  };

  const handleSearchBtnClick = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    }
    if (searchQuery.trim().length >= 1 && searchResults.courses.length > 0) {
      handleResultClick("courses", searchResults.courses[0].id);
    }
  };

  // Settings Menu
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("profile");

  // Profile State
  const [tempProfile, setTempProfile] = useState(null);
  const fileInputRef = useRef(null);

  // Change Password State
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Initialize temp profile when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setTempProfile({
        name: studentProfile.name,
        email: "student@xebia.com",
        university: "Xebia University",
        image: null,
      });
      setSettingsTab("profile");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
  }, [isSettingsOpen]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile({ ...tempProfile, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) { addToast("Please fill in all fields", "warning"); return; }
    if (newPw !== confirmPw) { addToast("New passwords do not match!", "warning"); return; }
    if (newPw.length < 12 || newPw.length > 72) { addToast("Password must be 12–72 characters", "warning"); return; }
    setIsChangingPw(true);
    try {
      await AuthService.changePassword(currentPw, newPw);
      addToast("Password updated successfully!", "success");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setIsSettingsOpen(false);
    } catch (err) {
      addToast(err.message || "Failed to update password. Check your current password.", "error");
    } finally {
      setIsChangingPw(false);
    }
  };

  const saveSettings = () => {
    addToast("Settings saved successfully.", "success");
    setIsSettingsOpen(false);
  };

  const initials = tempProfile?.name
    ? tempProfile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "S";

  return (
    <>
      <header className="header relative z-40">
        <div className="header-left">
          <button onClick={() => {
            if (isMobile) {
              setIsMobileOpen(true);
            } else {
              setIsMobileOpen(false);
              toggleSidebar();
            }
          }} className="header-btn" aria-label="Toggle Sidebar">
            <Menu className="h-5 w-5" />
          </button>

          <div className="breadcrumb">
            {breadcrumbs?.map((crumb, index) => (
              <React.Fragment key={crumb.label}>
                {index > 0 && <span className="breadcrumb-sep">›</span>}
                <Link
                  to={crumb.href}
                  className={
                    index === breadcrumbs.length - 1
                      ? "breadcrumb-cur hover:underline"
                      : "hover:underline"
                  }
                  style={{ textDecoration: "none" }}
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Center: Search */}
        <div className="header-search" ref={searchRef}>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
          />
          <div className="search-controls">
            {searchQuery.length > 0 && (
              <button
                className="search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {searchQuery.length > 0 && <div className="search-divider"></div>}
            <button className="search-btn" onClick={handleSearchBtnClick}>
              <Search className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
          {/* Search Results Dropdown */}
          {isSearchOpen && searchQuery.trim().length >= 1 && (
            <div
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#15151f] border border-gray-200 dark:border-[#2e2e3e] rounded-xl shadow-xl overflow-hidden z-50 py-2 custom-scrollbar"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {searchResults.courses.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div className="mb-2">
                  <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Courses
                  </div>
                  {searchResults.courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => handleResultClick("courses", course.id)}
                      className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a24] cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#6C1D5F]/10 text-[#6C1D5F] dark:bg-[#84117C]/20 dark:text-[#84117C] flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {course.title}
                        </span>
                        <span className="text-xs text-gray-500 truncate">{course.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-actions">
          <button
            onClick={toggleDark}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1a1a24] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#252535] hover:text-[#6C1D5F] dark:hover:text-[#D3CCEC] transition-colors border border-gray-200 dark:border-[#2e2e3e]"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-[16px] h-[16px]" />
            ) : (
              <Moon className="w-[16px] h-[16px]" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1a1a24] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#252535] hover:text-[#6C1D5F] dark:hover:text-[#D3CCEC] transition-colors border border-gray-200 dark:border-[#2e2e3e]"
              title="Settings"
            >
              <Settings className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Account Settings Modal */}
      {isSettingsOpen && tempProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15151f] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-[#2e2e3e]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2e2e3e] flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl font-bold p-1">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-[#2e2e3e]">
              {[{ id: "profile", label: "Profile" }, { id: "password", label: "Change Password" }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id)}
                  className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                    settingsTab === tab.id
                      ? "text-[#6C1D5F] border-b-2 border-[#6C1D5F]"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {settingsTab === "profile" && (
              <>
                <div className="p-6 space-y-5">
                  <div className="flex flex-col items-center gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/png, image/jpeg" />
                    <div
                      className="w-20 h-20 rounded-full bg-[#6C1D5F] flex items-center justify-center text-3xl font-bold text-white cursor-pointer hover:bg-[#84117C] transition-colors relative group overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {tempProfile.image ? <img src={tempProfile.image} alt="Profile" className="w-full h-full object-cover" /> : initials}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold px-2 text-center">Change</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Max 2MB (JPG, PNG)</p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                      <input type="text" value={tempProfile.name} onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#6C1D5F]/20 focus:border-[#6C1D5F] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                      <input type="email" value={tempProfile.email} onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#6C1D5F]/20 focus:border-[#6C1D5F] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">University</label>
                      <input type="text" value={tempProfile.university} onChange={(e) => setTempProfile({ ...tempProfile, university: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#6C1D5F]/20 focus:border-[#6C1D5F] transition-all" />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2e2e3e] flex justify-end gap-3">
                  <button onClick={() => setIsSettingsOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 transition-colors">Cancel</button>
                  <button onClick={saveSettings} className="px-5 py-2 text-sm font-bold bg-[#6C1D5F] hover:bg-[#84117C] text-white rounded-xl shadow-lg transition-all">Save Changes</button>
                </div>
              </>
            )}

            {/* Change Password Tab */}
            {settingsTab === "password" && (
              <form onSubmit={handleChangePassword}>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">New password must be 12–72 characters.</p>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Current Password</label>
                    <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#6C1D5F]/20 focus:border-[#6C1D5F] transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">New Password</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#6C1D5F]/20 focus:border-[#6C1D5F] transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Confirm New Password</label>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#6C1D5F]/20 focus:border-[#6C1D5F] transition-all" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2e2e3e] flex justify-end gap-3">
                  <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 transition-colors">Cancel</button>
                  <button type="submit" disabled={isChangingPw} className="px-5 py-2 text-sm font-bold bg-[#6C1D5F] hover:bg-[#84117C] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl shadow-lg transition-all">
                    {isChangingPw ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
