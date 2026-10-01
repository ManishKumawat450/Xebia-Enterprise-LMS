import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import { AuthService } from "@/services/api";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { IconSearch, IconProfile } from "../Icons";
import {
  Sun,
  Moon,
  Settings,
  ChevronDown,
  BookOpen,
  Tag as TagIcon,
  Menu,
  BarChart2,
  Search,
  X,
} from "lucide-react";
import { CourseService, CategoryService } from "@/services/api";
import { useRouter, Link } from "@tanstack/react-router";
import { clsx } from "clsx";

export function Header({ setIsMobileOpen }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { breadcrumbs, addToast, toggleSidebar, isSidebarCollapsed } = useAppStore();
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
    categories: [],
    analytics: [],
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const ANALYTICS_PAGES = [
    { id: "executive", title: "Executive Overview", slug: "executive" },
    { id: "learner", title: "Learner Engagement", slug: "learner" },
    { id: "course", title: "Course Performance", slug: "course" },
    { id: "revenue", title: "Revenue & ROI", slug: "revenue" },
    { id: "content", title: "Content Effectiveness", slug: "content" },
    { id: "skill-gap", title: "Skill Gap", slug: "skill-gap" },
    { id: "recommendations", title: "Recommendations", slug: "recommendations" },
    { id: "predictive", title: "Predictive Analytics", slug: "predictive" },
  ];

  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      Promise.all([CourseService.getCourses(), CategoryService.getCategories()]).then(
        ([courses, categories]) => {
          const lower = searchQuery.toLowerCase();
          setSearchResults({
            courses: (courses || [])
              .filter((c) => (c.title || "").toLowerCase().includes(lower))
              .slice(0, 3),
            categories: (categories || [])
              .filter((c) => (c.name || "").toLowerCase().includes(lower))
              .slice(0, 3),
            analytics: ANALYTICS_PAGES.filter((a) => a.title.toLowerCase().includes(lower)).slice(
              0,
              3,
            ),
          });
        },
      );
    } else {
      setSearchResults({ courses: [], categories: [], analytics: [] });
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
    router.navigate({ to: `/admin/${type}/${slug}` });
  };

  const handleSearchBtnClick = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    }
    // If there is query and results exist, navigate to first result
    if (searchQuery.trim().length >= 1) {
      const allResults = [
        ...searchResults.analytics.map((i) => ({ type: "analytics", slug: i.slug })),
        ...searchResults.courses.map((i) => ({
          type: "courses",
          slug: i.slug || i.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        })),
        ...searchResults.categories.map((i) => ({
          type: "categories",
          slug: i.slug || i.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        })),
      ];

      if (allResults.length > 0) {
        handleResultClick(allResults[0].type, allResults[0].slug);
      }
    }
  };

  // Settings Menu
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("profile");

  // Profile Image Upload & State
  const { adminProfile, updateAdminProfile } = useAppStore();
  const [tempProfile, setTempProfile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize temp profile when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setTempProfile({ ...adminProfile });
      setSettingsTab("profile");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
  }, [isSettingsOpen, adminProfile]);

  // Change Password State
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile({ ...tempProfile, image: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      addToast("Please upload a valid image file.", "error");
    }
  };

  const saveSettings = () => {
    updateAdminProfile(tempProfile);
    addToast("Settings saved successfully.", "success");
    setIsSettingsOpen(false);
  };

  return (
    <header className="header relative z-40">
      {/* Left: Menu + Breadcrumb */}
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
          placeholder="Search users, batches, courses, analytics..."
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
            {searchResults.courses.length === 0 &&
            searchResults.categories.length === 0 &&
            searchResults.analytics.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <>
                {searchResults.analytics.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Analytics Hub
                    </div>
                    {searchResults.analytics.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => handleResultClick("analytics", page.slug)}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a24] cursor-pointer flex items-center gap-3 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#01AC9F]/10 text-[#01AC9F] flex items-center justify-center shrink-0">
                          <BarChart2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {page.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.categories.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Categories
                    </div>
                    {searchResults.categories.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() =>
                          handleResultClick(
                            "categories",
                            cat.slug ||
                              (cat.name && cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
                          )
                        }
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a24] cursor-pointer flex items-center gap-3 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#6C1D5F]/10 text-[#6C1D5F] flex items-center justify-center shrink-0">
                          <TagIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {cat.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.courses.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Courses
                    </div>
                    {searchResults.courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() =>
                          handleResultClick(
                            "courses",
                            course.slug ||
                              (course.title &&
                                course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
                          )
                        }
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a24] cursor-pointer flex items-center gap-3 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#84117C]/10 text-[#84117C] flex items-center justify-center shrink-0">
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
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="header-actions">
        <button
          onClick={toggleDark}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1a1a24] text-gray-600 dark:text-gray-400 hover:text-[#6C1D5F] dark:hover:text-[#D3CCEC] transition-colors border border-gray-200 dark:border-[#2e2e3e]"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
        </button>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1a1a24] text-gray-600 dark:text-gray-400 hover:text-[#6C1D5F] dark:hover:text-[#D3CCEC] transition-colors border border-gray-200 dark:border-[#2e2e3e]"
          title="Settings"
        >
          <Settings className="w-[15px] h-[15px]" />
        </button>
      </div>

      {/* Account Settings Modal */}
      {isSettingsOpen && tempProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15151f] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-[#2e2e3e]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2e2e3e] flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">✕</button>
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
                <div className="p-6 space-y-6">
                  <div className="flex flex-col items-center gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/png, image/jpeg" />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1a1a24] border-2 border-dashed ${isDragging ? "border-[#6C1D5F] scale-105" : "border-gray-300 dark:border-[#3e3e4e]"} flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252535] transition-all relative overflow-hidden group`}
                    >
                      <div className="text-xs text-gray-500 font-medium z-10 group-hover:scale-105 transition-transform bg-white/80 dark:bg-black/50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100">Upload</div>
                      {tempProfile.image ? (
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${tempProfile.image})` }} />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl font-bold bg-[#6C1D5F] dark:bg-[#84117C] text-white">{tempProfile.name?.charAt(0) || "A"}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">Max size 2MB (JPG, PNG)</div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      <input type="text" value={tempProfile.name} onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm outline-none focus:border-[#6C1D5F] dark:focus:border-[#84117C]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                      <input type="email" value={tempProfile.email} disabled className="w-full px-4 py-2 bg-gray-100 dark:bg-[#1a1a24]/50 border border-gray-200 dark:border-[#2e2e3e] text-gray-500 rounded-xl text-sm outline-none cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                      <input type="text" value={tempProfile.role} disabled className="w-full px-4 py-2 bg-gray-100 dark:bg-[#1a1a24]/50 border border-gray-200 dark:border-[#2e2e3e] text-gray-500 rounded-xl text-sm outline-none cursor-not-allowed" />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-[#1a1a24] border-t border-gray-100 dark:border-[#2e2e3e] flex justify-end gap-3">
                  <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252535] rounded-xl transition-colors">Cancel</button>
                  <button onClick={saveSettings} className="px-4 py-2 text-sm font-semibold bg-[#6C1D5F] hover:bg-[#5a184f] dark:bg-[#84117C] dark:hover:bg-[#6e0e67] text-white rounded-xl transition-colors">Save Changes</button>
                </div>
              </>
            )}

            {/* Change Password Tab */}
            {settingsTab === "password" && (
              <form onSubmit={handleChangePassword}>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">New password must be 12–72 characters.</p>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                    <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm outline-none focus:border-[#6C1D5F]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm outline-none focus:border-[#6C1D5F]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#2e2e3e] rounded-xl text-sm outline-none focus:border-[#6C1D5F]" />
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-[#1a1a24] border-t border-gray-100 dark:border-[#2e2e3e] flex justify-end gap-3">
                  <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252535] rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isChangingPw} className="px-4 py-2 text-sm font-semibold bg-[#6C1D5F] hover:bg-[#5a184f] dark:bg-[#84117C] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl transition-colors">
                    {isChangingPw ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


    </header>
  );
}
