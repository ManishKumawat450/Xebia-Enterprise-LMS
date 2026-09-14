import React, { useState, useMemo, useEffect } from "react";
import { useLMS } from "@/context/LMSContext";
import {
  Bell,
  BookOpen,
  ClipboardCheck,
  Users,
  Award,
  CalendarDays,
  CheckCircle2,
  Trash2,
  Search,
  MailOpen,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

export default function StudentNotifications() {
  const { notifications, setNotifications, currentUser } = useLMS();
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    setNotifications(localNotifications);
    localStorage.setItem("notifications", JSON.stringify(localNotifications));
  }, [localNotifications, setNotifications]);

  // Hydration guard: on SSR/first paint `notifications` from context may not
  // be loaded yet, so the local copy starts empty. Adopt the loaded list once
  // instead of rendering nothing (and previously overwriting the cache with []).
  const seededFromContext = React.useRef(false);
  useEffect(() => {
    if (seededFromContext.current) return;
    if (notifications.length > 0 && localNotifications.length === 0) {
      setLocalNotifications(notifications);
      seededFromContext.current = true;
    }
  }, [notifications, localNotifications.length]);

  const myNotifications = useMemo(() => {
    let result = localNotifications.filter(
      (n) => !n.recipientId || n.recipientId === currentUser?.id || n.type === "system"
    );
    if (filter === "unread") result = result.filter((n) => !n.isRead && !n.read);
    if (filter === "read") result = result.filter((n) => n.isRead || n.read);
    if (typeFilter !== "all") result = result.filter((n) => n.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) => (n.title && n.title.toLowerCase().includes(q)) || (n.message && n.message.toLowerCase().includes(q))
      );
    }
    return result;
  }, [localNotifications, currentUser?.id, filter, typeFilter, searchQuery]);

  const allMyNotifications = localNotifications.filter(
    (n) => !n.recipientId || n.recipientId === currentUser?.id || n.type === "system"
  );
  const unreadCount = allMyNotifications.filter((n) => !n.isRead && !n.read).length;

  const getIconData = (type) => {
    switch (type) {
      case "allocation": return { icon: <BookOpen className="w-4 h-4" />, bg: "bg-[#01AC9F]/10", color: "text-[#01AC9F]", border: "border-[#01AC9F]/20" };
      case "assessment": return { icon: <ClipboardCheck className="w-4 h-4" />, bg: "bg-[#FF6200]/10", color: "text-[#FF6200]", border: "border-[#FF6200]/20" };
      case "batch": return { icon: <Users className="w-4 h-4" />, bg: "bg-[#6C1D5F]/10", color: "text-[#6C1D5F]", border: "border-[#6C1D5F]/20" };
      case "result": return { icon: <Award className="w-4 h-4" />, bg: "bg-[#84117C]/10", color: "text-[#84117C]", border: "border-[#84117C]/20" };
      case "event": return { icon: <CalendarDays className="w-4 h-4" />, bg: "bg-blue-500/10", color: "text-blue-500", border: "border-blue-500/20" };
      case "course": return { icon: <BookOpen className="w-4 h-4" />, bg: "bg-[#6C1D5F]/10", color: "text-[#6C1D5F]", border: "border-[#6C1D5F]/20" };
      case "comment": return { icon: <Users className="w-4 h-4" />, bg: "bg-[#84117C]/10", color: "text-[#84117C]", border: "border-[#84117C]/20" };
      default: return { icon: <Bell className="w-4 h-4" />, bg: "bg-gray-100 dark:bg-neutral-800", color: "text-gray-500 dark:text-gray-400", border: "border-gray-200 dark:border-neutral-700" };
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const markAllAsRead = () => setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  const markAsRead = (id) => setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  const toggleRead = (id) => setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead && !n.read } : n)));
  const deleteNotification = (id) => {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };
  const deleteSelected = () => {
    setLocalNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };
  const toggleSelect = (id) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleSelectAll = () => {
    if (selectedIds.size === myNotifications.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(myNotifications.map((n) => n.id)));
  };
  const clearAll = () => setLocalNotifications((prev) => prev.filter((n) => !(n.recipientId === currentUser?.id || (!n.recipientId && n.type === "system"))));

  const filters = [
    { key: "all", label: "All", count: allMyNotifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read", label: "Read", count: allMyNotifications.length - unreadCount },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6C1D5F] via-[#84117C] to-[#01AC9F] p-6 sm:p-8 text-white shadow-lg"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="mt-2 text-white/80 text-sm font-medium">Stay updated with your courses, assessments, and results</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition-all">
                <MailOpen className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            {isSelectMode ? (
              <>
                <button onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition-all">
                  {selectedIds.size === myNotifications.length ? "Deselect" : "Select all"}
                </button>
                {selectedIds.size > 0 && (
                  <button onClick={deleteSelected}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.size})
                  </button>
                )}
                <button onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition-all">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsSelectMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Select
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                filter === f.key ? "bg-[#6C1D5F] text-white shadow-md" : "bg-gray-100 dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2e2e3e]"
              )}>
              {f.label}
              {f.count > 0 && <span className="ml-1 text-[9px] opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a2e] rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/30 cursor-pointer">
            <option value="all">All Types</option>
            <option value="allocation">Allocations</option>
            <option value="batch">Batches</option>
            <option value="assessment">Assessments</option>
            <option value="event">Events</option>
            <option value="result">Results</option>
            <option value="system">System</option>
          </select>
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-100 dark:bg-[#1a1a2e] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]/30 text-gray-700 dark:text-gray-300 placeholder-gray-400" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Cards */}
      {myNotifications.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-[#1a1a2e] flex items-center justify-center">
            <Bell className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-bold text-gray-700 dark:text-gray-300">
            {filter === "unread" ? "All caught up!" : "No notifications"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === "unread" ? "You've read all your notifications" : "Nothing to show here"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence mode="popLayout">
            {myNotifications.map((notification, idx) => {
              const iconData = getIconData(notification.type);
              const isUnread = !notification.isRead && !notification.read;
              const isSelected = selectedIds.has(notification.id);

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  onClick={() => { if (isSelectMode) toggleSelect(notification.id); else if (isUnread) markAsRead(notification.id); }}
                  className={clsx(
                    "group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    isSelected
                      ? "bg-[#6C1D5F]/5 dark:bg-[#6C1D5F]/10 border-[#6C1D5F]/30 shadow-md"
                      : isUnread
                        ? "bg-white dark:bg-[#15151f] border-gray-200 dark:border-[#2e2e3e] shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        : "bg-white dark:bg-[#15151f] border-gray-100 dark:border-[#2e2e3e]/60 hover:shadow-sm"
                  )}
                >
                  {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6C1D5F]" />}

                  <div className="flex items-start gap-4 p-4 sm:p-5">
                    {isSelectMode && (
                      <div className="pt-1 shrink-0">
                        <div className={clsx(
                          "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                          isSelected ? "bg-[#6C1D5F] border-[#6C1D5F]" : "border-gray-300 dark:border-gray-600"
                        )}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                    )}

                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", iconData.bg, iconData.color, iconData.border)}>
                      {iconData.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={clsx(
                          "text-sm font-bold truncate",
                          isUnread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                        )}>
                          {notification.title}
                        </p>
                        {isUnread && (
                          <span className="shrink-0 px-1.5 py-0.5 bg-[#6C1D5F] text-white text-[8px] font-bold rounded-full uppercase">
                            New
                          </span>
                        )}
                      </div>
                      <p className={clsx(
                        "text-xs leading-relaxed line-clamp-2",
                        isUnread ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"
                      )}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#1a1a2e] px-2 py-0.5 rounded-md">
                          {notification.type || "system"}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                          {timeAgo(notification.createdAt || notification.timestamp)}
                        </span>
                      </div>
                    </div>

                    {!isSelectMode && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0 pt-1">
                        <button onClick={(e) => { e.stopPropagation(); toggleRead(notification.id); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a2e] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title={isUnread ? "Mark as read" : "Mark as unread"}>
                          {isUnread ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      {allMyNotifications.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {myNotifications.length} notification{myNotifications.length !== 1 ? "s" : ""}
            {filter !== "all" && ` (filtered from ${allMyNotifications.length})`}
          </span>
          <button onClick={clearAll}
            className="text-xs font-semibold text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
