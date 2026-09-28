import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnrollmentService, ProgressService } from "@/services/api";
import { useLMS } from "@/context/LMSContext";
import { BookOpen, Calendar, Award, Bell, Play, FileText, BarChart3, Star } from "lucide-react";
import { clsx } from "clsx";

import { WelcomeBanner } from "@/features/student/components/dashboard/WelcomeBanner";
import { StatCard } from "@/features/student/components/dashboard/StatCard";
import { ContinueLearning } from "@/features/student/components/dashboard/ContinueLearning";
import { LearningActivityChart } from "@/features/student/components/charts/LearningActivityChart";
import { SubjectPerformanceChart } from "@/features/student/components/charts/SubjectPerformanceChart";

export const Route = createFileRoute("/student/")({ component: DashboardHome });

function DashboardHome() {
  const { currentUser, submissions, assessments, batches, notifications } = useLMS();
  const { data: enrolledCourses = [] } = useQuery({
    queryKey: ["student-enrolled-courses"],
    queryFn: EnrollmentService.getMyCourses,
  });
  const enrolledCourseIds = enrolledCourses.map((course) => course.id).filter(Boolean);
  const enrolledCourseIdsKey = enrolledCourseIds.join(",");
  const { data: progressByCourse = {} } = useQuery({
    queryKey: ["student-dashboard-course-progress", enrolledCourseIdsKey],
    queryFn: async () => {
      const entries = await Promise.all(
        enrolledCourseIds.map(async (courseId) => {
          try {
            return [String(courseId), await ProgressService.getCourseProgress(courseId)];
          } catch {
            return [String(courseId), null];
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: enrolledCourseIds.length > 0,
  });

  const continueLearningCourses = enrolledCourses.map((course) => {
    const progress = progressByCourse[String(course.id)];
    const duration = [
      course.durationHours ? `${course.durationHours}h` : "",
      course.durationMinutes ? `${course.durationMinutes}m` : "",
    ].filter(Boolean).join(" ");

    return {
      ...course,
      title: course.title || course.name || "Untitled course",
      progress: progress?.progressPercentage ?? course.progress ?? 0,
      image: course.image || course.thumbnailImageUrl || course.thumbnail || course.icon || "",
      duration: duration || course.duration || "Self paced",
      lastWatched: progress?.lastAccessedSubmoduleId
        ? `${progress.completedLessons || 0} lessons completed`
        : "Start your first lesson",
    };
  });

  const unreadNotifications = notifications.filter((n) => !n.isRead && !n.read).length;

  // Compute real chart data from LMSContext
  const { learningData, assessmentData, enrolledBatches, pendingCount, completedCount } = useMemo(() => {
    if (!currentUser) return { learningData: [], assessmentData: [], enrolledBatches: [], pendingCount: 0, completedCount: 0 };

    const myBatchIds = currentUser.batches || [];
    const mySubs = submissions.filter((s) => s.studentId === currentUser.id && s.status === "submitted");

    // Enrolled batches
    const enrolled = batches.filter((b) => myBatchIds.includes(b.id));

    // Pending assessments (assigned but not completed)
    const allAssigned = assessments.filter(
      (a) => a.status === "published" && (a.batches || []).some((bId) => myBatchIds.includes(bId)),
    );
    const completedIds = new Set(mySubs.map((s) => s.assessmentId));
    const pending = allAssigned.filter((a) => !completedIds.has(a.id));
    const completed = allAssigned.filter((a) => completedIds.has(a.id));

    // Subject Performance: map each completed assessment to its score
    const perf = mySubs
      .filter((s) => s.isEvaluated && s.percentage != null)
      .map((s) => {
        const a = assessments.find((x) => x.id === s.assessmentId);
        return { subject: a?.title?.substring(0, 12) || "Assessment", score: s.percentage };
      });

    // Learning Activity: map batch completion over time
    const activity = enrolled.map((b) => {
      const bAssessments = assessments.filter((a) => (a.batches || []).includes(b.id));
      const done = mySubs.filter((s) => bAssessments.some((a) => a.id === s.assessmentId)).length;
      const total = bAssessments.length || 1;
      return { name: b.name.substring(0, 10), progress: Math.min(Math.round((done / total) * 100), 100) };
    });

    return {
      learningData: activity,
      assessmentData: perf,
      enrolledBatches: enrolled,
      pendingCount: pending.length,
      completedCount: completed.length,
    };
  }, [currentUser, submissions, assessments, batches]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/student/courses" className="group">
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#15151f] p-5 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-gray-200 dark:border-[#2e2e3e]">
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-1">Jump Back In</p>
              <h3 className="text-gray-900 dark:text-white text-sm font-extrabold group-hover:text-[#6C1D5F] transition-colors">Resume Last Course</h3>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-xl bg-[#6C1D5F]/10 flex items-center justify-center text-[#6C1D5F] shrink-0">
              <Play className="w-4 h-4" />
            </div>
          </div>
        </Link>
        <Link to="/student/assessments" className="group">
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#15151f] p-5 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-gray-200 dark:border-[#2e2e3e]">
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-1">Action Required</p>
              <h3 className="text-gray-900 dark:text-white text-sm font-extrabold group-hover:text-[#6C1D5F] transition-colors">Take Assessment</h3>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-xl bg-[#FF6200]/10 flex items-center justify-center text-[#FF6200] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} title="Enrolled Courses" value={enrolledBatches.length} icon={BookOpen} trend="Total active" trendUp={false} colorClass="text-[#6C1D5F]" bgClass="bg-[#6C1D5F]/10" />
        <StatCard index={1} title="Pending" value={pendingCount} icon={Calendar} trend="Action required" trendUp={false} colorClass="text-[#FF6200]" bgClass="bg-[#FF6200]/10" />
        <StatCard index={2} title="Completed" value={completedCount} icon={Award} trend="Finished" trendUp={false} colorClass="text-[#01AC9F]" bgClass="bg-[#01AC9F]/10" />
        <StatCard index={3} title="Notifications" value={unreadNotifications} icon={Bell} trend="Unread" trendUp={false} colorClass="text-[#84117C]" bgClass="bg-[#84117C]/10" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#15151f] border border-gray-200 dark:border-[#2e2e3e] rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6200]/10 flex items-center justify-center text-[#FF6200]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900 dark:text-white">Course Progress</h2>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completion by batch</p>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            <LearningActivityChart data={learningData} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#15151f] border border-gray-200 dark:border-[#2e2e3e] rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#01AC9F]/10 flex items-center justify-center text-[#01AC9F]">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900 dark:text-white">Subject Performance</h2>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessment scores</p>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            <SubjectPerformanceChart data={assessmentData} />
          </div>
        </div>
      </div>

      {/* Continue Learning */}
      {continueLearningCourses.length > 0 && <ContinueLearning courses={continueLearningCourses} />}
    </div>
  );
}
