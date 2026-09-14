import {
  Mail,
  Building,
  CalendarDays,
  Hash,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { EnrollmentService } from "@/services/api";
import { useLMS } from "@/context/LMSContext";

/**
 * Personal information grid, driven by the real logged-in user
 * (LMSContext.currentUser -> users table) instead of mock data.
 */
export function ProfileDetails() {
  const { currentUser, batches } = useLMS();
  const { data: enrolledCoursesData } = useQuery({
    queryKey: ["student-enrolled-courses"],
    queryFn: EnrollmentService.getMyCourses,
  });
  const enrolledCourses = enrolledCoursesData || [];

  if (!currentUser) return null;

  const myBatchNames = (currentUser.batches || [])
    .map((id) => (batches || []).find((b) => b.id === id)?.name)
    .filter(Boolean);

  const infoItems = [
    {
      icon: Mail,
      label: "Email Address",
      value: currentUser.email || "—",
      color: "text-accent-2",
      bg: "bg-accent-2/10",
    },
    {
      icon: Hash,
      label: "Student ID",
      value: currentUser.id || "—",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Building,
      label: "Department / Organisation",
      value: currentUser.department || "Xebia",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      icon: CalendarDays,
      label: "Batch",
      value: myBatchNames.length > 0 ? myBatchNames.join(", ") : "Not assigned yet",
      color: "text-accent-2",
      bg: "bg-accent-2/10",
    },
    {
      icon: GraduationCap,
      label: "Average Score",
      value:
        currentUser.averageScore != null
          ? `${currentUser.averageScore}%`
          : "No evaluations yet",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: BookOpen,
      label: "Enrolled Courses",
      value: `${enrolledCourses.length} Course${enrolledCourses.length === 1 ? "" : "s"}`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Your account details and enrollment information.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-muted/50"
            >
              <div className={`p-2.5 rounded-lg ${item.bg} ${item.color} flex-shrink-0`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="font-semibold mt-0.5 truncate" title={String(item.value)}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Enrolled courses summary list shown on the profile page.
 * Backed by GET /enrollments/my-courses (real enrollments, not mock data).
 */
export function EnrolledCoursesList() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["student-enrolled-courses"],
    queryFn: EnrollmentService.getMyCourses,
  });

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="py-12 flex items-center justify-center text-sm text-muted-foreground">
          Loading your enrollments…
        </CardContent>
      </Card>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Enrolled Courses</CardTitle>
          <CardDescription>Courses you are currently enrolled in.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-6">
            You haven't enrolled in any course yet. Browse the catalog and hit
            "Enroll Now" to see courses here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Enrolled Courses</CardTitle>
        <CardDescription>Courses you are currently enrolled in.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-4">
        {courses.map((course) => {
          const moduleCount =
            course.modules?.length || course.modulesCount || course.totalModules;
          const thumb = course.thumbnailImageUrl || course.icon;
          const hasThumb =
            thumb && (thumb.startsWith("data:image") || thumb.startsWith("http"));
          return (
            <div
              key={course.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold">
                {hasThumb ? (
                  <img src={thumb} alt={course.title} className="h-full w-full object-cover" />
                ) : (
                  <BookOpen className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{course.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[
                    course.difficultyLevel,
                    course.durationHours ? `${course.durationHours}h` : null,
                    moduleCount ? `${moduleCount} modules` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Enrolled"}
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Enrolled
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
