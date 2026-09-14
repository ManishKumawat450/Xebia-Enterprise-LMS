import { createFileRoute, Link } from "@tanstack/react-router";
import { commentsData, studentProfile } from "@/features/student/mocks/dummy-data";
import { useQuery } from "@tanstack/react-query";
import { CourseService, EnrollmentService, ProgressService } from "@/services/api";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  ChevronDown,
  CheckCircle2,
  FileText,
  PlayCircle,
  Image as ImageIcon,
  Code,
  Link as LinkIcon,
  File,
  Play,
  X,
  Download,
  Layers,
  Activity,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { getCloudinaryDocumentPreviewUrl, normalizeCloudinaryDocumentUrl } from "@/lib/cloudinary";

export const Route = createFileRoute("/student/course/$courseId")({
  component: CourseViewer,
});

function ContentRenderer({ block }) {
  const type = block.type || "NOTE";
  let parsedData = {};

  try {
    if (block.storageRef) {
      let parsed = JSON.parse(block.storageRef);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      parsedData = parsed;
    } else if (block.contentData) {
      parsedData = { text: block.contentData, uiType: type };
    }
  } catch (e) {
    parsedData = { text: block.storageRef, uiType: type };
  }

  const uiType = parsedData.uiType || type;
  const ensureAbsoluteUrl = (url, resourceType = "image") => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "izyaykle";
      // If it doesn't have an extension, assume it's a PDF for document type
      const hasExtension = url.includes(".");
      const finalUrl = hasExtension ? url : `${url}.pdf`;
      return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${finalUrl}`;
    }
    return url;
  };

  let dataToRender = "";
  if (uiType === "Video" || uiType === "VIDEO_REFERENCE" || uiType === "VIDEO") {
    dataToRender = ensureAbsoluteUrl(parsedData.videoUrl || block.contentData || "", "video");
  } else if (uiType === "PDF" || uiType === "DOCUMENT" || uiType === "PPT") {
    dataToRender = ensureAbsoluteUrl(parsedData.pdfUrl || block.contentData || "", "image");
  } else if (uiType === "Image" || uiType === "IMAGE") {
    dataToRender = ensureAbsoluteUrl(parsedData.imageUrl || block.contentData || "", "image");
  } else if (uiType === "Code" || uiType === "CODE") {
    dataToRender = parsedData.code || block.contentData || "";
  } else if (uiType === "Table") {
    dataToRender = parsedData.tableData || parsedData.text || block.contentData || "";
  } else if (uiType === "Heading") {
    dataToRender = parsedData.headingText || parsedData.text || block.title || "";
  } else {
    dataToRender = parsedData.text || parsedData.title || block.title || block.contentData || "";
  }

  switch (uiType) {
    case "Video":
    case "VIDEO_REFERENCE":
    case "VIDEO":
      let videoUrl = dataToRender;
      if (videoUrl) {
        // Convert standard YouTube links to embed format
        if (videoUrl.includes("youtube.com/watch?v=")) {
          videoUrl = videoUrl.replace("watch?v=", "embed/");
          videoUrl = videoUrl.split("&")[0]; // Remove extra params
        } else if (videoUrl.includes("youtu.be/")) {
          const videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
          videoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
      return (
        <div className="w-full bg-[#000000] rounded-2xl overflow-hidden aspect-video shadow-xl border border-[#DEDEDE] dark:border-white/10 flex items-center justify-center">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              className="w-full h-full"
              allowFullScreen
              title="Video Content"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className="flex flex-col items-center text-[#5A5A5A] dark:text-[#DADCEA]">
              <Play className="w-16 h-16 opacity-50 mb-2" />
              <p>Video Not Available</p>
            </div>
          )}
        </div>
      );
    case "PDF":
    case "DOCUMENT":
    case "PPT":
      return (
        <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-[#DEDEDE] dark:border-white/10 bg-[#F7F8FC] dark:bg-[#15151f]">
          {dataToRender ? (
            <div className="relative group w-full aspect-[4/3] md:aspect-video bg-white">
              {uiType === "PDF" ? (
                <iframe src={dataToRender} className="w-full h-full border-0" title="PDF Viewer" />
              ) : (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(dataToRender)}&embedded=true`}
                  className="w-full h-full border-0"
                  title="Document Viewer"
                />
              )}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={dataToRender}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm flex items-center gap-2 text-xs font-bold transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" /> Download Original
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full min-h-64 flex flex-col items-center justify-center text-[#5A5A5A] dark:text-[#DADCEA]">
              <File className="w-12 h-12 mb-2 opacity-50" />
              <p>Document Not Available</p>
            </div>
          )}
        </div>
      );
    case "Code":
    case "CODE":
      return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-[#DEDEDE] dark:border-white/10 bg-[#1e1e1e] p-6 text-sm text-gray-300 overflow-x-auto">
          <pre>
            <code>{dataToRender}</code>
          </pre>
        </div>
      );
    case "Image":
    case "IMAGE":
      return (
        <div className="rounded-2xl overflow-hidden shadow-lg border border-[#DEDEDE] dark:border-white/10 flex justify-center bg-[#F7F8FC] dark:bg-[#15151f] p-4">
          {dataToRender ? (
            <img src={dataToRender} alt="Lesson Content" className="max-w-full h-auto rounded-lg" />
          ) : (
            <ImageIcon className="w-12 h-12 text-[#DADCEA] dark:text-[#5A5A5A]" />
          )}
        </div>
      );
    case "LINK":
      return (
        <div className="p-6 rounded-2xl bg-[#6C1D5F]/5 dark:bg-[#84117C]/10 border border-[#6C1D5F]/20 dark:border-[#84117C]/30 flex flex-col items-center justify-center text-center">
          <LinkIcon className="w-12 h-12 text-[#6C1D5F] dark:text-[#84117C] mb-3" />
          <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF] mb-2">
            External Resource
          </h3>
          <a
            href={dataToRender}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#4A1E47] text-[#FFFFFF] text-sm font-bold rounded-xl shadow transition-all"
          >
            Open Link <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      );
    case "Heading": {
      const HeadingTag = `h${parsedData.headingLevel || 1}`;
      const sizeClass =
        parsedData.headingLevel === 1
          ? "text-4xl"
          : parsedData.headingLevel === 2
            ? "text-3xl"
            : "text-2xl";
      return (
        <HeadingTag
          className={clsx(`font-extrabold text-[#000000] dark:text-[#FFFFFF] my-4`, sizeClass)}
        >
          {dataToRender}
        </HeadingTag>
      );
    }
    case "Callout":
      return (
        <div className="p-6 rounded-xl bg-[#01AC9F]/10 dark:bg-[#01AC9F]/20 border border-[#01AC9F]/20 text-[#01AC9F] shadow-sm">
          <div dangerouslySetInnerHTML={{ __html: dataToRender }} className="font-medium" />
        </div>
      );
    case "Table":
      try {
        const tableData = JSON.parse(dataToRender);
        if (Array.isArray(tableData) && tableData.length > 0) {
          const headers = Object.keys(tableData[0]);
          return (
            <div className="overflow-x-auto w-full my-6 rounded-xl border border-[#2e2e3e] shadow-sm bg-white dark:bg-[#15151f]">
              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-[#1a1a24] text-gray-500 dark:text-gray-400 border-b border-[#2e2e3e]">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-6 py-4 font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 dark:border-[#2e2e3e] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1a24] transition-colors"
                    >
                      {headers.map((h, j) => (
                        <td key={j} className="px-6 py-4 whitespace-pre-wrap">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      } catch (e) {
        // Fallback to text if JSON is invalid
      }
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap font-mono text-sm text-gray-500 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            {dataToRender || "No table data. Add JSON array in Admin."}
          </div>
        </div>
      );
    case "Text":
    case "NOTE":
    case "TEXT":
    default:
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-extrabold prose-p:text-[#5A5A5A] dark:prose-p:text-[#DADCEA] prose-a:text-[#6C1D5F] dark:prose-a:text-[#84117C] whitespace-pre-wrap">
          <div dangerouslySetInnerHTML={{ __html: dataToRender }} />
        </div>
      );
  }
}

function CourseViewer() {
  const { courseId } = Route.useParams();
  const {
    data: courseHierarchy,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["student-course-hierarchy", courseId],
    queryFn: () => CourseService.getCourseHierarchy(courseId),
  });

  const { data: enrollmentStatus, isLoading: loadingEnrollment } = useQuery({
    queryKey: ["student-enrollment-status", courseId],
    queryFn: () => EnrollmentService.getStatus(courseId),
  });

  const { data: enrolledCoursesData } = useQuery({
    queryKey: ["student-enrolled-courses"],
    queryFn: EnrollmentService.getMyCourses,
  });

  const isEnrolled =
    enrollmentStatus?.isEnrolled ||
    (enrolledCoursesData || []).some((c) => String(c.id) === String(courseId));

  const {
    data: progressData,
    isLoading: loadingProgress,
    refetch: refetchProgress,
  } = useQuery({
    queryKey: ["student-progress", courseId],
    queryFn: () => ProgressService.getCourseProgress(courseId),
    enabled: isEnrolled,
  });

  const course = courseHierarchy || {};
  const modules = useMemo(() => courseHierarchy?.modules || [], [courseHierarchy]);

  const handleEnroll = async () => {
    try {
      await EnrollmentService.enroll(courseId);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  // Flatten submodules for navigation
  const flatSubmodules = useMemo(() => {
    return modules.reduce((acc, mod) => acc.concat(mod.submodules || []), []);
  }, [modules]);

  const [activeSubmoduleId, setActiveSubmoduleId] = useState(null);

  const [expandedModules, setExpandedModules] = useState([]);

  // Auto-select first lesson and expand its module
  useEffect(() => {
    if (flatSubmodules.length > 0 && modules.length > 0 && !loadingProgress && isEnrolled) {
      if (!activeSubmoduleId) {
        // Find last accessed or first incomplete
        let currentActive = progressData?.lastAccessedSubmoduleId || flatSubmodules[0].id;

        // Validate that the last accessed module still exists (prevents "No Lessons Available" bug if lesson was deleted)
        if (!flatSubmodules.some((s) => s.id === currentActive)) {
          currentActive = flatSubmodules[0].id;
        }

        setActiveSubmoduleId(currentActive);

        // Auto-expand the module containing this submodule
        const mod = modules.find((m) => (m.submodules || []).some((s) => s.id === currentActive));
        if (mod) {
          setExpandedModules((prev) => {
            if (!prev.includes(mod.id)) {
              return [...prev, mod.id];
            }
            return prev;
          });
        }
      }
    }
  }, [flatSubmodules, modules, progressData, loadingProgress, isEnrolled]);

  // Persist access to backend when active changes
  useEffect(() => {
    if (
      activeSubmoduleId &&
      activeSubmoduleId !== progressData?.lastAccessedSubmoduleId &&
      isEnrolled
    ) {
      const activeIndex = flatSubmodules.findIndex((s) => s.id === activeSubmoduleId);
      const activeSubmodule = activeIndex !== -1 ? flatSubmodules[activeIndex] : null;
      if (activeSubmodule && activeSubmodule.contentBlocks?.length > 0) {
        ProgressService.updateAccess(
          courseId,
          activeSubmoduleId,
          activeSubmodule.contentBlocks[0].id,
        );
      }
    }
  }, [activeSubmoduleId, courseId, isEnrolled, flatSubmodules, progressData]);

  const activeIndex = flatSubmodules.findIndex((s) => s.id === activeSubmoduleId);
  const activeSubmodule = activeIndex !== -1 ? flatSubmodules[activeIndex] : null;

  const handleNext = () => {
    if (activeIndex < flatSubmodules.length - 1) {
      setActiveSubmoduleId(flatSubmodules[activeIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveSubmoduleId(flatSubmodules[activeIndex - 1].id);
    }
  };

  const toggleModule = (id) => {
    setExpandedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleMarkComplete = async () => {
    if (!activeSubmoduleId) return;
    try {
      await ProgressService.markComplete(courseId, activeSubmoduleId);
      await refetchProgress();
      handleNext();
    } catch (e) {
      console.error(e);
    }
  };

  // Local Progress Indicator
  const totalLessons = progressData?.totalLessons || flatSubmodules.length;
  const completedLessons = progressData?.completedLessons || 0;
  const progressPercent = progressData?.progressPercentage || 0;
  const completedSubmoduleIds = progressData?.completedSubmoduleIds || [];

  if (loading || loadingEnrollment) {
    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-background animate-pulse">
        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-80 flex-shrink-0 border-r border-border bg-card flex flex-col p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 p-6 lg:p-10 flex flex-col bg-gray-50/50 dark:bg-background">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-2/3 mb-8" />
            <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-2xl w-full" />
            <div className="flex justify-between mt-8">
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-32" />
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !course.title) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-destructive/10 dark:bg-destructive text-destructive rounded-full flex items-center justify-center mb-2">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Course Unavailable</h2>
        <p className="text-muted-foreground text-sm">
          We couldn't load the course content. It may have been moved or you might be offline.
        </p>
        <Link
          to="/student/courses"
          className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-colors"
        >
          Return to My Courses
        </Link>
      </div>
    );
  }

  // Pre-enrollment Preview State
  if (!isEnrolled) {
    return (
      <div className="max-w-[1200px] mx-auto pb-12 h-full flex flex-col animate-in fade-in duration-500">
        <div className="mb-6">
          <Link
            to="/student/courses"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#15151f] border border-[#DEDEDE] dark:border-white/10 flex items-center justify-center text-[#5A5A5A] dark:text-[#DADCEA] hover:bg-[#F7F8FC] dark:hover:bg-[#4A1E47] transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-[#15151f] border border-[#DEDEDE] dark:border-[#5A5A5A] rounded-3xl shadow-xl overflow-hidden">
          {/* Banner Image */}
          <div className="w-full aspect-video md:aspect-[21/9] bg-[#F7F8FC] dark:bg-[#15151f] relative border-b border-[#DEDEDE] dark:border-[#5A5A5A]">
            {course.image || course.thumbnailImageUrl || course.thumbnail || course.icon ? (
              <img
                src={course.image || course.thumbnailImageUrl || course.thumbnail || course.icon}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-20 h-20 text-[#DADCEA] dark:text-[#5A5A5A]" />
              </div>
            )}
          </div>

          <div className="p-8 sm:p-12 max-w-5xl mx-auto">
            <div className="space-y-8">
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] dark:text-[#FFFFFF] leading-tight">
                  {course.title}
                </h1>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 py-6 border-y border-[#DEDEDE] dark:border-[#5A5A5A]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#000000] dark:text-[#FFFFFF] bg-[#F7F8FC] dark:bg-white/5 px-4 py-2 rounded-xl">
                  <Clock className="w-4 h-4 text-[#6C1D5F] dark:text-[#84117C]" />
                  {`${course.durationHours ? course.durationHours + "h " : ""}${course.durationMinutes ? course.durationMinutes + "m" : ""}`.trim() ||
                    course.duration ||
                    "Self Paced"}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#000000] dark:text-[#FFFFFF] bg-[#F7F8FC] dark:bg-white/5 px-4 py-2 rounded-xl">
                  <Layers className="w-4 h-4 text-[#6C1D5F] dark:text-[#84117C]" />
                  {modules?.length || 0} Modules
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#000000] dark:text-[#FFFFFF] bg-[#F7F8FC] dark:bg-white/5 px-4 py-2 rounded-xl">
                  <BookOpen className="w-4 h-4 text-[#6C1D5F] dark:text-[#84117C]" />
                  {totalLessons} Lessons
                </div>
                <div
                  className={clsx(
                    "flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl text-white shadow-md",
                    (course.difficultyLevel || course.level || "Beginner") === "Beginner"
                      ? "bg-[#01AC9F] shadow-[0_0_15px_rgba(1,172,159,0.3)]"
                      : (course.difficultyLevel || course.level || "Beginner") === "Intermediate"
                        ? "bg-[#84117C] shadow-[0_0_15px_rgba(132,17,124,0.3)]"
                        : "bg-[#FF6200] shadow-[0_0_15px_rgba(255,98,0,0.3)]",
                  )}
                >
                  <Activity className="w-4 h-4 text-white" />
                  {course.difficultyLevel || course.level || "Beginner"}
                </div>
              </div>

              <p className="text-lg text-[#5A5A5A] dark:text-[#DADCEA] leading-relaxed text-left whitespace-pre-wrap">
                {course.description ||
                  course.shortDescription ||
                  "Join this course to unlock premium learning materials and enhance your skills."}
              </p>

              <div className="pt-4 flex justify-center sm:justify-start">
                <button
                  onClick={handleEnroll}
                  className="w-full sm:w-auto px-10 py-4 bg-[#6C1D5F] hover:bg-[#4A1E47] text-[#FFFFFF] text-lg font-bold rounded-xl shadow-[0_4px_14px_-2px_rgba(108,29,95,0.4)] hover:shadow-[0_6px_20px_-2px_rgba(108,29,95,0.5)] hover:-translate-y-1 transition-all"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-12 h-full flex flex-col animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/student/courses"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#15151f] border border-[#DEDEDE] dark:border-white/10 flex items-center justify-center text-[#5A5A5A] dark:text-[#DADCEA] hover:bg-[#F7F8FC] dark:hover:bg-[#4A1E47] transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#6C1D5F] dark:text-[#84117C] mb-1 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" /> Course
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] leading-tight line-clamp-1">
              {course.title}
            </h1>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 bg-white dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-[#DEDEDE] dark:border-white/10 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#5A5A5A] dark:text-[#DADCEA] uppercase tracking-wider mb-0.5">
              Your Progress
            </p>
            <p className="text-sm font-extrabold text-[#000000] dark:text-[#FFFFFF] leading-none">
              {progressPercent}%
            </p>
          </div>
          <div className="w-32">
            <Progress
              value={progressPercent}
              className="h-2 [&>div]:bg-[#6C1D5F] dark:[&>div]:bg-[#84117C] bg-[#F7F8FC] dark:bg-[#15151f]"
            />
          </div>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Content Area (Left/Main) ── */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div className="bg-white dark:bg-[#15151f] border border-[#DEDEDE] dark:border-white/10 rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
            {activeSubmodule ? (
              <>
                <div className="p-6 sm:p-10 flex-1 space-y-8 bg-white dark:bg-[#15151f]">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-2 mb-8"
                  >
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#6C1D5F]/10 dark:bg-[#84117C]/20 text-[#6C1D5F] dark:text-[#84117C] uppercase tracking-wider">
                      Lesson {activeIndex + 1} of {totalLessons}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black text-[#000000] dark:text-[#FFFFFF]">
                      {activeSubmodule.title}
                    </h2>
                  </motion.div>

                  {/* Render Content Blocks */}
                  {(activeSubmodule.contentBlocks || []).length > 0 ? (
                    <motion.div
                      className="space-y-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.2 }}
                    >
                      {[...activeSubmodule.contentBlocks]
                        .sort(
                          (a, b) =>
                            (a.sequenceOrder ?? a.position ?? 0) -
                            (b.sequenceOrder ?? b.position ?? 0),
                        )
                        .map((block, idx) => (
                          <motion.div
                            key={block.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                          >
                            <ContentRenderer block={block} />
                          </motion.div>
                        ))}
                    </motion.div>
                  ) : (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-[#F7F8FC] dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-[#DADCEA] dark:text-[#5A5A5A]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">
                        Empty Lesson
                      </h3>
                      <p className="text-[#5A5A5A] dark:text-[#DADCEA] mt-1">
                        No content has been added to this lesson yet.
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Bar */}
                <div className="p-4 bg-[#F7F8FC] dark:bg-[#15151f] border-t border-[#DEDEDE] dark:border-white/10 flex items-center justify-between shrink-0">
                  <button
                    onClick={handlePrev}
                    disabled={activeIndex === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-[#DEDEDE] dark:border-white/10 text-[#5A5A5A] dark:text-[#DADCEA] text-sm font-bold rounded-xl transition-all shadow-sm hover:-translate-x-1 hover:bg-[#F7F8FC] dark:hover:bg-white/10 disabled:opacity-50 disabled:hover:translate-x-0"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-[#5A5A5A] dark:text-[#DADCEA] hidden sm:block mb-2">
                      {activeIndex + 1} / {totalLessons}
                    </span>
                    {!completedSubmoduleIds.includes(activeSubmoduleId) ? (
                      <button
                        onClick={handleMarkComplete}
                        className="px-4 py-1.5 bg-[#01AC9F]/10 text-[#01AC9F] border border-[#01AC9F]/20 rounded-lg text-sm font-bold hover:bg-[#01AC9F] hover:text-[#FFFFFF] transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Complete
                      </button>
                    ) : (
                      <span className="px-4 py-1.5 text-[#01AC9F] text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={activeIndex === totalLessons - 1}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C1D5F] hover:bg-[#4A1E47] text-[#FFFFFF] text-sm font-bold rounded-xl transition-all shadow hover:translate-x-1 disabled:opacity-50 disabled:hover:translate-x-0"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center">
                <div>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">No Lessons Available</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    This course doesn't have any published curriculum yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Curriculum Sidebar (Right) ── */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0">
          <div
            className="bg-white dark:bg-[#15151f] border border-[#DEDEDE] dark:border-white/10 rounded-3xl shadow-lg lg:sticky lg:top-6 overflow-hidden flex flex-col"
            style={{ maxHeight: "calc(100vh - 48px)" }}
          >
            <div className="p-6 border-b border-[#DEDEDE] dark:border-white/10 bg-[#F7F8FC] dark:bg-white/5 shrink-0">
              <h3 className="text-lg font-extrabold text-[#000000] dark:text-[#FFFFFF]">
                Curriculum
              </h3>
              <p className="text-xs font-medium text-[#5A5A5A] dark:text-[#DADCEA] mt-1">
                {modules.length} Modules • {totalLessons} Lessons
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {modules.length > 0 ? (
                modules.map((mod, mIdx) => {
                  const isExpanded = expandedModules.includes(mod.id);
                  const modSubmodules = mod.submodules || [];
                  const isActiveModule = modSubmodules.some((s) => s.id === activeSubmoduleId);

                  return (
                    <div
                      key={mod.id}
                      className={clsx(
                        "rounded-2xl overflow-hidden transition-all duration-300",
                        isActiveModule
                          ? "border-[#6C1D5F]/30 dark:border-[#84117C]/30 shadow-md ring-1 ring-[#6C1D5F]/20 dark:ring-[#84117C]/20"
                          : "border border-[#DEDEDE] dark:border-white/10",
                      )}
                    >
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className={clsx(
                          "w-full flex items-center gap-3 p-4 transition-colors text-left",
                          isActiveModule
                            ? "bg-[#6C1D5F]/5 dark:bg-[#84117C]/10"
                            : "bg-white dark:bg-[#15151f] hover:bg-[#F7F8FC] dark:hover:bg-white/5",
                        )}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p
                            className={clsx(
                              "font-extrabold text-sm leading-tight line-clamp-2",
                              isActiveModule
                                ? "text-[#6C1D5F] dark:text-[#84117C]"
                                : "text-[#000000] dark:text-[#FFFFFF]",
                            )}
                          >
                            <span className="opacity-50 font-normal mr-2">
                              {(mIdx + 1).toString().padStart(2, "0")}
                            </span>
                            {mod.title}
                          </p>
                          <p className="text-[11px] font-bold text-[#5A5A5A] dark:text-[#DADCEA] mt-1.5 uppercase tracking-wider">
                            {modSubmodules.length} Lessons
                          </p>
                        </div>
                        <ChevronDown
                          className={clsx(
                            "w-4 h-4 shrink-0 transition-transform duration-300",
                            isActiveModule
                              ? "text-[#6C1D5F] dark:text-[#84117C]"
                              : "text-[#DADCEA] dark:text-[#5A5A5A]",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden bg-white dark:bg-[#15151f]"
                          >
                            <div className="px-3 py-2 space-y-1 border-t border-[#DEDEDE]/50 dark:border-white/5">
                              {modSubmodules.map((sub) => {
                                const isActive = sub.id === activeSubmoduleId;
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => setActiveSubmoduleId(sub.id)}
                                    className={clsx(
                                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all group",
                                      isActive
                                        ? "bg-[#6C1D5F] text-[#FFFFFF] shadow-md shadow-[#6C1D5F]/20 scale-[0.98]"
                                        : "hover:bg-[#F7F8FC] dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF]",
                                    )}
                                  >
                                    <div className="shrink-0 flex items-center justify-center">
                                      {completedSubmoduleIds.includes(sub.id) ? (
                                        <CheckCircle2
                                          className={clsx(
                                            "w-5 h-5",
                                            isActive ? "text-[#FFFFFF]" : "text-[#01AC9F]",
                                          )}
                                        />
                                      ) : isActive ? (
                                        <PlayCircle className="w-4 h-4 text-[#FFFFFF] animate-pulse" />
                                      ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#DADCEA] dark:bg-[#5A5A5A] group-hover:bg-[#6C1D5F] dark:group-hover:bg-[#84117C] transition-colors" />
                                      )}
                                    </div>
                                    <span
                                      className={clsx(
                                        "text-sm font-bold truncate flex-1",
                                        isActive
                                          ? "text-[#FFFFFF]"
                                          : "text-[#5A5A5A] dark:text-[#DADCEA] group-hover:text-[#000000] dark:group-hover:text-[#FFFFFF]",
                                      )}
                                    >
                                      {sub.title}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">Curriculum not available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
