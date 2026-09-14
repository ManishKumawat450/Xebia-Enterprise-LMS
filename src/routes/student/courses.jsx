import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  PlayCircle,
  CheckCircle,
  BookOpen,
  Search,
  Award,
  Printer,
  X,
  Users,
  Star,
  MoreVertical,
  LayoutGrid,
  ListIcon,
  Filter,
  Layers,
  Activity,
} from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  CourseService,
  EnrollmentService,
  CategoryService,
  ProgressService,
} from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useLMS } from "@/context/LMSContext";
import { toast } from "sonner";
// jsPDF and html2canvas loaded dynamically to avoid SSR issues

export const Route = createFileRoute("/student/courses")({
  component: MyCourses,
});

const BRAND = "#6C1D5F";
const TEAL = "#01AC9F";

function CertificateModal({ course, student, onClose }) {
  const certificateRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const completionDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const certId = `XEB-${course.id.toUpperCase()}-2026-${student?.id ?? "UNKNOWN"}`;

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm print:bg-transparent print:p-0">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide everything by default */
          body * {
            visibility: hidden !important;
          }
          
          /* Show only the certificate and its children */
          #certificate-print-area, #certificate-print-area * {
            visibility: visible !important;
          }
          
          /* Position the certificate to fill the entire printed page */
          #certificate-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            transform: none !important;
            max-width: none !important;
            z-index: 9999 !important;
          }
        }
      `}</style>
      <motion.div
        id="print-modal-wrapper"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-4xl bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div>
            <h3 className="font-extrabold text-foreground">Certificate of Completion</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Issued by Xebia · {completionDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-[#5a184f] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              {isDownloading ? "Preparing..." : "Print Certificate"}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 flex items-center justify-center p-6 sm:p-10 print:bg-white print:p-0">
          <div
            id="certificate-print-area"
            ref={certificateRef}
            className="w-full max-h-full bg-white relative overflow-hidden shadow-2xl print:shadow-none"
            style={{
              maxWidth: "794px",
              aspectRatio: "1.414 / 1",
              fontFamily: "'Georgia','Times New Roman',serif",
              containerType: "inline-size",
            }}
          >
            {/* Gold accent bars */}
            <div
              className="absolute top-0 left-0 right-0 h-[7px]"
              style={{
                background: "linear-gradient(90deg,#6C1D5F,#B48C3C,#01AC9F,#B48C3C,#6C1D5F)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-[7px]"
              style={{
                background: "linear-gradient(90deg,#6C1D5F,#B48C3C,#01AC9F,#B48C3C,#6C1D5F)",
              }}
            />

            {/* Borders */}
            <div
              className="absolute inset-[10px]"
              style={{ border: `1.5px solid ${BRAND}`, borderRadius: "2px" }}
            />
            <div
              className="absolute inset-[15px]"
              style={{ border: `0.5px solid ${TEAL}40`, borderRadius: "2px" }}
            />

            {/* Corner ornaments */}
            {[
              { cls: "top-[18px] left-[18px]", rot: "0" },
              { cls: "top-[18px] right-[18px]", rot: "90" },
              { cls: "bottom-[18px] right-[18px]", rot: "180" },
              { cls: "bottom-[18px] left-[18px]", rot: "270" },
            ].map(({ cls, rot }, i) => (
              <div
                key={i}
                className={`absolute ${cls}`}
                style={{ transform: `rotate(${rot}deg)`, width: 28, height: 28 }}
              >
                <svg viewBox="0 0 28 28" fill="none">
                  <path d="M1 1 L10 1 L10 3 L3 3 L3 10 L1 10 Z" fill={BRAND} />
                  <path d="M1 1 L7 1 L7 2 L2 2 L2 7 L1 7 Z" fill="#B48C3C" opacity="0.7" />
                </svg>
              </div>
            ))}

            {/* Dot watermark */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: `radial-gradient(${BRAND} 1px,transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />

            <div className="absolute inset-0 z-10 flex flex-col justify-between px-16 pt-10 pb-8 text-center">
              {/* ── TOP: Logo + Tagline ── */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/logo-purple.png"
                  alt="Xebia"
                  className="h-[36px] object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div
                  className="w-[180px] h-px"
                  style={{
                    background: "linear-gradient(to right,transparent,#B48C3C,transparent)",
                  }}
                />
                <p
                  className="font-extrabold uppercase"
                  style={{ color: TEAL, fontSize: "1.15cqw", letterSpacing: "0.28em" }}
                >
                  Enterprise Learning Management System
                </p>
                <p
                  className="font-extrabold uppercase mt-1 text-[#1f2937]"
                  style={{ fontSize: "2.1cqw", letterSpacing: "0.35em" }}
                >
                  Certificate of Completion
                </p>
              </div>

              {/* ── MIDDLE: Name + Course ── */}
              <div className="flex flex-col items-center gap-3 my-auto py-6">
                <p className="italic text-gray-500 font-serif" style={{ fontSize: "1.6cqw" }}>
                  This is to proudly certify that
                </p>
                <div>
                  <h2
                    className="font-bold italic leading-none text-primary font-serif"
                    style={{ fontSize: "6.5cqw" }}
                  >
                    {student?.name ?? "Student"}
                  </h2>
                  <div
                    className="mx-auto mt-2"
                    style={{
                      height: "2px",
                      width: "55%",
                      background:
                        "linear-gradient(to right,transparent,#B48C3C 25%,#B48C3C 75%,transparent)",
                    }}
                  />
                </div>
                <p className="italic text-gray-500 font-serif" style={{ fontSize: "1.6cqw" }}>
                  has successfully completed
                </p>
                <h3
                  className="font-bold text-gray-800 leading-snug font-sans"
                  style={{ fontSize: "2.8cqw", maxWidth: "85%" }}
                >
                  {course.title}
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span
                    className="font-bold uppercase tracking-widest rounded-sm"
                    style={{
                      background: `${TEAL}12`,
                      color: TEAL,
                      border: `1px solid ${TEAL}35`,
                      fontSize: "1.2cqw",
                      padding: "0.4em 1.2em",
                    }}
                  >
                    {course.duration}
                  </span>
                  <span
                    className="font-bold uppercase tracking-widest rounded-sm"
                    style={{
                      background: `${BRAND}08`,
                      color: BRAND,
                      border: `1px solid ${BRAND}25`,
                      fontSize: "1.2cqw",
                      padding: "0.4em 1.2em",
                    }}
                  >
                    Xebia Certified
                  </span>
                </div>
              </div>

              {/* ── BOTTOM: Date + ID + Signature ── */}
              <div
                className="w-full flex items-end justify-between pt-3"
                style={{ borderTop: "1px solid #e2e8f0" }}
              >
                <div className="text-left">
                  <p className="font-bold text-gray-700" style={{ fontSize: "1.4cqw" }}>
                    {completionDate}
                  </p>
                  <p
                    className="uppercase text-gray-400 mt-0.5"
                    style={{ fontSize: "0.95cqw", letterSpacing: "0.22em" }}
                  >
                    Date of Issue
                  </p>
                </div>
                <p
                  className="text-gray-300 uppercase"
                  style={{ fontSize: "0.95cqw", letterSpacing: "0.15em" }}
                >
                  ID: {certId}
                </p>
                <div className="text-right">
                  <div
                    className="h-px ml-auto mb-1.5"
                    style={{ width: "12cqw", background: "#aaa" }}
                  />
                  <p
                    className="font-bold italic text-gray-700 font-serif"
                    style={{ fontSize: "1.5cqw" }}
                  >
                    Anand Sahay
                  </p>
                  <p
                    className="uppercase text-gray-400 mt-0.5"
                    style={{ fontSize: "0.95cqw", letterSpacing: "0.2em" }}
                  >
                    Global CEO, Xebia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MyCourses() {
  const router = useRouter();
  const { currentUser } = useLMS();
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [filterFavorites, setFilterFavorites] = useState("All Courses");
  const [viewMode, setViewMode] = useState("grid");
  const [filterLevel, setFilterLevel] = useState("All Levels");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [certCourse, setCertCourse] = useState(null); // course to show certificate for
  const { data: allCoursesData, isLoading: loadingAll } = useQuery({
    queryKey: ["student-all-courses"],
    queryFn: CourseService.getCourses,
  });
  const { data: enrolledCoursesData, isLoading: loadingEnrolled } = useQuery({
    queryKey: ["student-enrolled-courses"],
    queryFn: EnrollmentService.getMyCourses,
  });

  const loading = loadingAll || loadingEnrolled;
  const allCourses = allCoursesData || [];
  const enrolledCourses = enrolledCoursesData || [];

  // Real per-course completion from the progress service. Without this the
  // cards always showed 0% progress (the Course entity has no progress field),
  // which also made the "View Certificate" button unreachable.
  const { data: progressMap } = useQuery({
    queryKey: ["student-course-progress", enrolledCourses.map((c) => c.id).join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        enrolledCourses.map(async (c) => {
          try {
            const p = await ProgressService.getCourseProgress(c.id);
            return [String(c.id), p?.progressPercentage ?? 0];
          } catch {
            return [String(c.id), 0];
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: enrolledCourses.length > 0,
  });

  const courses = allCourses.map((course) => {
    const enrolled = enrolledCourses.find((e) => String(e.id) === String(course.id));
    const realProgress = enrolled ? (progressMap?.[String(course.id)] ?? 0) : 0;
    return {
      ...course,
      progress: realProgress || enrolled?.progress || course.progress || 0,
      isEnrolled: !!enrolled,
    };
  });

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-[#6C1D5F] animate-spin" />
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
          Loading your courses…
        </p>
      </div>
    );
  }

  const filteredCourses = courses.filter((c) => {
    const level = c.difficultyLevel || c.level || "Beginner";
    const status =
      c.progress === 100 ? "Completed" : c.progress > 0 ? "In Progress" : "Not Started";

    if (filterLevel !== "All Levels" && level !== filterLevel) return false;
    if (filterStatus !== "All Status" && status !== filterStatus) return false;
    if (filterFavorites === "Favorites" && !favorites.has(c.id)) return false;

    if (search && !(c.title || "").toLowerCase().includes(search.toLowerCase())) return false;

    return true;
  });

  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100);
  const completed = courses.filter((c) => c.progress === 100);

  const statusBadge = (course) => {
    if (course.progress === 100)
      return { label: "Completed", className: "bg-[#01AC9F] text-white" };
    if (course.progress > 0) return { label: "In Progress", className: "bg-[#6C1D5F] text-white" };
    return { label: "Not Started", className: "bg-[#5A5A5A] text-white" };
  };

  const CourseCard = ({ course, idx }) => {
    const badge = statusBadge(course);
    const level = course.difficultyLevel || course.level || "Beginner";
    const isPublished = course.published || course.isPublished !== false;
    const active = course.isActive !== false && course.active !== false;
    const duration =
      `${course.durationHours ? course.durationHours + "h " : ""}${course.durationMinutes ? course.durationMinutes + "m" : ""}`.trim() ||
      "N/A";
    const thumb = course.image || course.thumbnailImageUrl || course.thumbnail || course.icon;

    return (
      <motion.div
        key={course.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, delay: idx * 0.03 }}
        className={clsx(
          "group bg-white dark:bg-[#15151f] border border-gray-200 dark:border-[#2e2e3e] hover:border-[#6C1D5F] dark:hover:border-[#D3CCEC] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 ease-out cursor-pointer",
          viewMode === "list"
            ? "flex flex-col sm:flex-row h-auto"
            : "flex flex-col h-full hover:-translate-y-1",
        )}
        onClick={(e) => {
          if (e.target.closest("button")) return;
          router.navigate({ to: `/student/course/${course.id}` });
        }}
      >
        {/* Thumbnail */}
        <div
          className={clsx(
            "relative bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0",
            viewMode === "list" ? "w-full sm:w-48 h-36 sm:h-auto" : "w-full h-32",
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 z-0">
            <span className="text-4xl font-bold opacity-30 uppercase tracking-wider">
              {course.title ? course.title.substring(0, 2) : "CO"}
            </span>
          </div>
          {thumb && (
            <img
              src={thumb}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFavorites((prev) => {
                const next = new Set(prev);
                if (next.has(course.id)) next.delete(course.id);
                else next.add(course.id);
                return next;
              });
            }}
            className="absolute bottom-4 right-4 w-10 h-10 bg-white dark:bg-[#15151f] rounded-lg flex items-center justify-center hover:scale-105 transition-transform shadow-sm z-20"
          >
            <Star
              className={clsx(
                "w-4 h-4 transition-colors",
                favorites.has(course.id)
                  ? "fill-[#FF6200] text-[#FF6200]"
                  : "text-gray-400 dark:text-gray-500",
              )}
            />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col relative">
          {/* Title */}
          <div className="mb-1.5">
            <span className="text-sm font-extrabold text-gray-900 dark:text-white transition-colors leading-tight block line-clamp-2">
              {course.title}
            </span>
          </div>

          {/* Meta Top (Level + Status) */}
          <div className="mb-2.5 flex items-center justify-between">
            <span
              className={clsx(
                "inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-md text-white",
                level === "Beginner"
                  ? "bg-[#01AC9F]"
                  : level === "Intermediate"
                    ? "bg-[#84117C]"
                    : "bg-[#FF6200]",
              )}
            >
              {level}
            </span>
            <span
              className={clsx(
                "text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1",
                badge.className,
              )}
            >
              {course.progress === 100 && <CheckCircle className="w-3 h-3" />}
              {badge.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2.5 font-medium">
            {course.description ||
              course.shortDescription ||
              "No description available."}
          </p>

          {/* Progress (Student Only) */}
          {course.isEnrolled && (
            <div className="mb-2.5">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-500">Progress</span>
                <span
                  className={clsx(
                    "font-extrabold",
                    course.progress === 100 ? "text-[#01AC9F]" : "text-gray-900 dark:text-white",
                  )}
                >
                  {course.progress}%
                </span>
              </div>
              <Progress
                value={course.progress}
                className={clsx(
                  "h-1",
                  course.progress === 100 ? "[&>div]:bg-[#01AC9F]" : "[&>div]:bg-[#6C1D5F]",
                )}
              />
            </div>
          )}

          {/* Meta Stats */}
          <div className="mt-auto flex items-center gap-3 text-xs font-bold text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-[#2e2e3e] pt-2.5 mb-2.5">
            {course.modules?.length || course.modulesCount || course.totalModules ? (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <BookOpen className="w-3 h-3" />
                {course.modules?.length || course.modulesCount || course.totalModules} Modules
              </span>
            ) : null}
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
          </div>

          {/* CTA Button */}
          {course.progress === 100 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCertCourse(course);
              }}
              className="w-full py-2 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 bg-[#01AC9F] text-white shadow-sm hover:-translate-y-0.5"
            >
              <Award className="w-3.5 h-3.5" /> View Certificate
            </button>
          ) : (
            <Link to={`/student/course/${course.id}`} className="block w-full">
              <button className="w-full py-2.5 min-h-[44px] rounded-xl font-bold text-[11px] transition-all shadow-sm flex items-center justify-center gap-1.5 bg-[#6C1D5F] hover:bg-[#84117C] text-white hover:-translate-y-0.5">
                {course.progress === 0 ? "Start Course" : "Resume Course"}
              </button>
            </Link>
          )}
        </div>
      </motion.div>
    );
  };

  const CourseGrid = ({ items }) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-card rounded-2xl border border-border shadow-sm">
          <BookOpen className="w-12 h-12 mb-4 text-gray-200 dark:text-gray-700" />
          <p className="text-lg font-bold text-foreground mb-1">No courses found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Try adjusting your search filters.
          </p>
        </div>
      );
    }
    if (viewMode === "list") {
      return (
        <div className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] shadow-sm overflow-hidden">
          <div className="overflow-x-auto table-scroll-hint">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
              <thead className="bg-[#6C1D5F] text-white uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4 font-bold rounded-tl-2xl">Course</th>
                  <th className="px-6 py-4 font-bold">Duration</th>
                  <th className="px-6 py-4 font-bold">Level</th>
                  <th className="px-6 py-4 font-bold">Progress</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-center rounded-tr-2xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2e2e3e]">
                {items.map((course) => {
                  const badge = statusBadge(course);
                  const level = course.difficultyLevel || course.level || "Beginner";
                  const thumb =
                    course.image || course.thumbnailImageUrl || course.thumbnail || course.icon;
                  const duration =
                    `${course.durationHours ? course.durationHours + "h " : ""}${course.durationMinutes ? course.durationMinutes + "m" : ""}`.trim() ||
                    "N/A";

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#1a1a24] transition-colors group border-l-4 border-transparent hover:border-l-[#6C1D5F]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden relative">
                            {thumb ? (
                              <img src={thumb} className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold uppercase">
                                {course.title?.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          <div className="max-w-[250px] sm:max-w-xs md:max-w-md">
                            <h4 className="font-bold text-gray-900 dark:text-white truncate">
                              {course.title}
                            </h4>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm font-medium">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {duration}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            "inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md text-white shadow-sm",
                            level === "Beginner"
                              ? "bg-[#01AC9F]"
                              : level === "Intermediate"
                                ? "bg-[#84117C]"
                                : "bg-[#FF6200]",
                          )}
                        >
                          {level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={course.progress}
                            className={clsx(
                              "w-20 h-1.5",
                              course.progress === 100
                                ? "[&>div]:bg-[#01AC9F]"
                                : "[&>div]:bg-[#6C1D5F]",
                            )}
                          />
                          <span className="font-bold text-xs text-gray-700 dark:text-gray-300">
                            {course.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            "text-xs font-bold px-2.5 py-1 rounded-md shadow-sm flex w-fit items-center gap-1",
                            badge.className,
                          )}
                        >
                          {course.progress === 100 && <CheckCircle className="w-3 h-3" />}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {course.progress === 100 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCertCourse(course);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-2 to-[#01AC9F] text-white font-bold text-xs shadow-sm hover:shadow-md transition-all"
                          >
                            <Award className="w-3.5 h-3.5" /> View Certificate
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.navigate({ to: `/student/course/${course.id}` });
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#6C1D5F] hover:bg-[#5a184f] text-white font-bold text-xs shadow-sm hover:shadow-md transition-all"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />{" "}
                            {course.progress === 0 ? "Start Course" : "Resume Course"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-all">
        <AnimatePresence>
          {items.map((course, idx) => (
            <CourseCard key={course.id} course={course} idx={idx} />
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              My Courses
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-0.5">
              Access your enrolled courses and track your progress
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Enrolled Courses", value: courses.filter((c) => c.isEnrolled).length, sub: "Total enrollments", icon: BookOpen, bg: "bg-[#6C1D5F]/10", color: "text-[#6C1D5F]" },
          { label: "In Progress", value: inProgress.length, sub: "Ongoing courses", icon: PlayCircle, bg: "bg-[#FF6200]/10", color: "text-[#FF6200]" },
          { label: "Completed", value: completed.length, sub: "Finished courses", icon: Award, bg: "bg-[#01AC9F]/10", color: "text-[#01AC9F]" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-[#15151f] rounded-2xl border border-gray-200 dark:border-[#2e2e3e] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{kpi.value}</div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-[#15151f] border border-gray-200 dark:border-[#2e2e3e] rounded-2xl p-3 flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Left Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto overflow-x-auto hide-scrollbar">
          {/* Search */}
          <div className="relative w-full sm:w-64 shrink-0 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#6C1D5F] transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses by title..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1a1a24] border border-transparent rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:bg-white dark:focus:bg-[#15151f] focus:border-[#6C1D5F] focus:ring-4 focus:ring-[#6C1D5F]/10 transition-all"
            />
          </div>

          <div className="w-px h-8 bg-gray-200 dark:bg-[#2e2e3e] hidden sm:block mx-1 shrink-0"></div>

          {/* Favorites Filter (All Courses) */}
          <div className="shrink-0">
            <Select value={filterFavorites} onValueChange={setFilterFavorites}>
              <SelectTrigger className="w-[140px] h-9 px-3 text-xs bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 focus:ring-0 focus:ring-offset-0 transition-colors hover:bg-gray-100 dark:hover:bg-[#333333] rounded-xl outline-none">
                <div className="flex items-center gap-1.5">
                  <span>{filterFavorites === "All Courses" ? "Course" : filterFavorites}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1a1a24] border border-black dark:border-white rounded-xl shadow-lg">
                {["All Courses", "Favorites"].map((o) => (
                  <SelectItem
                    key={o}
                    value={o}
                    className="text-xs focus:bg-[#f4ebf4] dark:focus:bg-[#252535] focus:text-gray-900 dark:focus:text-white cursor-pointer rounded-md mx-1 my-0.5 [&>.absolute]:hidden !pr-2"
                  >
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid/List Toggle */}
          <div className="flex bg-gray-100 dark:bg-[#1a1a24] rounded-xl p-1 shrink-0 ml-1">
            <button
              onClick={() => setViewMode("grid")}
              className={clsx(
                "p-2.5 min-w-[40px] min-h-[40px] rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-white dark:bg-[#252535] text-[#6C1D5F] dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx(
                "p-2.5 min-w-[40px] min-h-[40px] rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-white dark:bg-[#252535] text-[#6C1D5F] dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
              )}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Group */}
        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar shrink-0 justify-start xl:justify-end">
          <div className="w-px h-8 bg-gray-200 dark:bg-[#2e2e3e] hidden xl:block mx-1 shrink-0"></div>

          {[
            {
              label: "Level",
              value: filterLevel,
              set: setFilterLevel,
              opts: ["All Levels", "Beginner", "Intermediate", "Advanced", "Expert"],
            },
            {
              label: "Status",
              value: filterStatus,
              set: setFilterStatus,
              opts: ["All Status", "Not Started", "In Progress", "Completed"],
            },
          ].map((filter, i) => (
            <div key={i} className="shrink-0">
              <Select value={filter.value} onValueChange={filter.set}>
                <SelectTrigger className="w-[140px] h-9 px-3 text-xs bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 focus:ring-0 focus:ring-offset-0 transition-colors hover:bg-gray-100 dark:hover:bg-[#333333] rounded-xl outline-none">
                  <div className="flex items-center gap-1.5">
                    <span>{filter.value === filter.opts[0] ? filter.label : filter.value}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1a1a24] border border-black dark:border-white rounded-xl shadow-lg">
                  {filter.opts.map((o) => (
                    <SelectItem
                      key={o}
                      value={o}
                      className="text-xs focus:bg-[#f4ebf4] dark:focus:bg-[#252535] focus:text-gray-900 dark:focus:text-white cursor-pointer rounded-md mx-1 my-0.5 [&>.absolute]:hidden !pr-2"
                    >
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <CourseGrid items={filteredCourses} />

      {/* Certificate Modal */}
      <AnimatePresence>
        {certCourse && (
          <CertificateModal
            course={certCourse}
            student={currentUser}
            onClose={() => setCertCourse(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
