import { Link } from "@tanstack/react-router";
import { BookOpen, Clock, PlayCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/**
 * "Continue Learning" section – shows in-progress courses with resume CTA.
 * @param {{ courses: Array }} props
 */
export function ContinueLearning({ courses }) {
  const inProgress = courses.filter((c) => Number(c.progress) >= 0 && Number(c.progress) < 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight">Continue Learning</h2>
        <Button variant="ghost" asChild>
          <Link to="/student/courses">View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inProgress.map((course) => (
          <Card
            key={course.id}
            className="glass hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="h-32 w-full overflow-hidden">
              {course.image ? (
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <BookOpen className="w-10 h-10" aria-hidden="true" />
                </div>
              )}
            </div>

            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {course.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {course.duration}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progress</span>
                <span className="font-medium">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
              <div className="mt-3 flex items-center text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                <PlayCircle className="h-4 w-4 mr-2 text-primary" />
                <span className="line-clamp-1">{course.lastWatched}</span>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
              <Button className="w-full btn-hero" size="sm" asChild>
                <Link to={`/student/course/${course.id}`}>Resume Learning</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
