# Xebia Enterprise LMS — Project Onboarding & Source-Code Walkthrough

**Prepared:** 28 September 2026  
**Method:** source-code inspection of the current workspace. This is not a fresh deployed-browser/E2E test. I cite file paths and distinguish confirmed behavior from inference. No credentials or secret values are included.

> **Important:** the repository’s older `README.md`, `ARCHITECTURE.md`, and `API.md` contain descriptions of earlier/simplified versions. When those disagree with the current source, this guide follows the current source. In particular, the current landing-page login is not JWT/password authentication.

---

## Part 1 — Project Overview

### What is this project?

Xebia Enterprise LMS is a web-based learning platform. It combines course/curriculum management, student enrollment and learning progress, batches, assessments, grading, events, feedback, notifications, and analytics/reporting.

### Who uses it?

The active UI has three portal choices:

- **Student** — courses, lessons, progress, events, assessments, results/certificates, feedback and notifications.
- **Trainer** (stored in the user model as role `teacher`) — batches, assessment builder, submission evaluation, reports, leaderboard, events and settings.
- **Admin** — users, categories, courses/curriculum, batches/allocations, events, assessment oversight and analytics.

The backend demo seeder creates teacher/student users. Admin is a special UI login path, not a seeded user role. “Manager” appears in legacy/mock analytics data, but is not one of the seeded login roles.

### What problem does it solve?

It centralizes learning content and the operational workflow around it: create a course, organize it into modules/lessons, enroll learners, track lesson completion, publish assessments, collect/grade submissions and report outcomes.

### Key source folders

| Path | Responsibility |
|---|---|
| `src/routes/` | TanStack file-based routes for root, student, trainer and admin pages. |
| `src/pages/` | Reusable/legacy page implementations, including Login, AssessmentBuilder, TakeQuiz, Evaluation, Reports, Results and Settings. |
| `src/admin/pages/` | Admin feature screens such as courses, curriculum, users, events, batches and analytics. |
| `src/components/` | Shared layouts, navigation, assessment builder UI and common UI widgets. |
| `src/features/student/` | Student dashboard components/charts and some mock data. |
| `src/context/LMSContext.jsx` | Shared client state, hydration, demo login, assessment and submission workflows. |
| `src/services/api.js` | Frontend fetch wrapper and service objects mapping UI operations to REST paths. |
| `src/services/aiService.js`, `src/utils/aiService.js` | Browser-side AI calls for course/event text, assessment generation/evaluation and coding help. |
| `backend/api-gateway/` | Spring Cloud Gateway entry point and route map. |
| `backend/course-service/` | Courses, curriculum, enrollments and learning progress. |
| `backend/user-service/` | User records, feedback and notifications. |
| `backend/batch-service/` | Batches and trainer allocations. |
| `backend/assessment-service/` | Assessments, questions, submissions, reporting and drafts. |
| `backend/event-service/` | Events and event registrations. |
| `backend/common-lib/` | Shared tenant/user context, JWT helper classes and base entities. |

---

## Part 2 — Technology Stack

### Frontend

- React 19, JavaScript/JSX.
- TanStack Start + TanStack Router for SSR and file-based routing.
- TanStack Query for server-backed course/enrollment/progress screens.
- React Context (`LMSContext`) for shared portal state; Zustand is also present for the admin layout/store.
- Vite 8, Tailwind CSS 4, Framer Motion, Recharts, Lucide icons, Radix UI, Sonner toasts.
- Other notable libraries: Monaco editor for coding, `xlsx` for assessment import/export, `jspdf`/`html2canvas-pro` in course certificate UI, `react-markdown` for coding content.

### Backend

Seven Maven modules are listed in `backend/pom.xml`:

1. `common-lib`
2. `api-gateway`
3. `course-service`
4. `user-service`
5. `batch-service`
6. `assessment-service`
7. `event-service`

The gateway/course modules inherit the root Spring Boot 3.3.6 / Spring Cloud 2023.0.4 dependency setup. The standalone user/batch/assessment/event POMs declare Spring Boot 4.1.0 directly; `event-service` declares Java 21. This version split is real and worth keeping in mind when building/upgrading.

### Database and infrastructure

- PostgreSQL is the primary relational database. Docker Compose uses PostgreSQL 16.
- Redis 7 is included in Docker Compose and configured for the gateway/assessment applications, though assessment draft cache code inspected here is an in-memory `ConcurrentHashMap`, not Redis-backed.
- Course-service uses Flyway migrations under the `course` schema and Hibernate `ddl-auto: validate`.
- Other services generally use Hibernate `ddl-auto: update` in their application YAMLs.
- Course-service has Kafka producer configuration, but Kafka is not defined as a service in the checked-in `backend/docker-compose.yml`; whether a live deployment supplies Kafka needs environment verification.

### External services found in source

- **Groq:** browser-side `fetch` to `https://api.groq.com/openai/v1/chat/completions`; model configured in source is `openai/gpt-oss-120b`.
- **Cloudinary:** browser-side uploads in the course content manager using Vite cloud-name/upload-preset variables.
- **Google Fonts** and external media/document embeds (Google Docs viewer/YouTube) appear in UI code.
- `@google/generative-ai` is a dependency, but a source search found no active usage of that SDK in `src/`; do not assume it is part of an active workflow without more verification.

---

## Part 3 — Project Folder Structure

```text
Xebia-Enterprise-LMS/
├── src/
│   ├── routes/                  TanStack Start file routes
│   ├── admin/                   Admin portal page modules/store/styles
│   ├── pages/                   Shared/student/trainer pages
│   ├── components/              Shared layouts and widgets
│   ├── features/student/         Student widgets/charts/mocks
│   ├── context/LMSContext.jsx    Shared UI state and fake login
│   ├── services/api.js           API client and service wrappers
│   ├── services/aiService.js     Course/event AI text helper
│   ├── utils/aiService.js        Assessment/coding AI helper
│   ├── router.js, start.js       Router/Start setup
│   └── server.js                 SSR server wrapper/error normalization
├── backend/
│   ├── api-gateway/
│   ├── course-service/
│   ├── user-service/
│   ├── batch-service/
│   ├── assessment-service/
│   ├── event-service/
│   ├── common-lib/
│   ├── docker-compose.yml
│   └── pom.xml
├── public/                       Static assets
├── .env.example                  Frontend variable names/example placeholders
├── vite.config.js                TanStack/Vite setup
├── render.yaml                   Backend service/database deployment blueprint
└── package.json                  Frontend commands/dependencies
```

`src/admin/` and `src/pages/` are both active-looking parts of the current tree; route files determine which implementation is actually mounted. Some older `src/pages/*` and legacy/mock modules are not necessarily reachable just because they exist.

---

## Part 4 — Overall Architecture

```text
Browser
  │
  ├── TanStack Start/Router page + React components
  │      ├── LMSContext (users, batches, assessments, submissions, notifications)
  │      ├── React Query (courses, enrollment, lesson progress, some admin data)
  │      └── src/services/api.js → fetchApi()
  │                  │  X-Tenant-Id + X-User-Id headers; JSON
  ▼                  ▼
API Gateway :8080  (Spring Cloud Gateway, routes by URL prefix)
  ├── /api/courses, /api/categories, /api/enrollments, /api/progress → course-service :8084
  ├── /api/v1/users, /api/v1/feedback, /api/v1/notifications → user-service :8081
  ├── /api/v1/batches, /api/v1/allocations → batch-service (compose says :8085)
  ├── /api/v1/assessments, /api/v1/submissions → assessment-service :8086
  └── /api/v1/events → event-service :8087
                       │
                       ▼
              Spring Controller → Service → Spring Data Repository/JPA
                       │
                       ▼
       PostgreSQL (course schema for course-service; other schemas/tables per JPA)
```

The frontend’s `API_BASE_URL` defaults to `http://localhost:8080/api`. `RouteConfig.java` is the actual routing authority; `docker-compose.yml` supplies service URLs for container networking. Note the standalone user-service YAML defaults to port 8083 and batch-service YAML to 8082, while the gateway fallback URLs and Docker Compose use 8081 and 8085 respectively; local manual startup must override `SERVER_PORT` or the gateway will call a different port.

### Important distinction

The actual code has an API gateway and JWT-related helper classes/configuration, but the login workflow does not use them to authenticate. The frontend login is email-match demo auth, and `fetchApi()` does not attach an `Authorization: Bearer ...` token.

---

## Part 5 — Application Startup Flow

### What opens first?

`src/routes/index.jsx` mounts `Login` at `/`. There is no separate `/login` route in the inspected route files.

### Frontend initialization

1. Vite/TanStack Start serves the app; `src/router.js` creates the router from generated `src/routeTree.gen.ts` and provides a `QueryClient`.
2. Root route `src/routes/__root.jsx` installs the `QueryClientProvider`, `LMSProvider`, router outlet and global Sonner `<Toaster>`.
3. `LMSProvider` initializes a few states from localStorage in the browser, then its effect loads user and batch lists through `UserService.getUsers()` and `BatchService.getBatches()`.
4. Students are enriched with batch IDs in the browser by comparing `batch.students` to each student's ID.
5. It fetches notifications, assessments and submissions. Students use `GET /api/v1/assessments/student`; non-students use `GET /api/v1/assessments`.
6. Data is copied to localStorage. Several later actions update both server and local state, while others are local-only (see feature notes below).

### What happens if a user is logged in?

`LMSContext` reads the `session` localStorage item to initialize `currentUser`. Student and trainer parent routes check the current user role after mount. The admin parent route only waits for mount and then renders the admin layout; it has no equivalent user/role guard.

---

## Part 6 — Authentication Flow (Actual Implementation)

### Landing page

`src/pages/Login.jsx` contains role toggles (Trainer, Student, Admin), an email input, an Access Portal button and Quick Access cards. There is no password input and no login API call.

### Trainer/student path

1. Submit handler checks an email is present.
2. It calls `login(email, role)` in `src/context/LMSContext.jsx`.
3. `login()` lowercases/trims the email and searches the already-loaded `teachers` or `students` arrays.
4. If a match exists, it calls `setCurrentUser(match)` and returns true; otherwise false.
5. React context mirrors `currentUser` to localStorage `session`.
6. The Login page navigates to `/trainer` or `/student`.
7. Parent route files check role on the client and redirect to `/` if the role does not match.

### Admin path

The Login page’s Admin branch shows success and navigates to `/admin` for any non-empty email. It does not call `login()` or set an Admin user. `src/routes/admin.jsx` has no role/auth guard.

### Token/session reality

- No login/authentication controller or password field was found in user-service.
- `User` has id/name/email/role/department/avatar and student stats; no password/hash field.
- No token is issued or stored by the login page; no Authorization header is added by `fetchApi()`.
- `common-lib` contains `JwtService`, `JwtProperties`, `TenantHeaderFilter`, and `PermissionGuard`, but source search found no wired JWT validation in the gateway. Course-service uses the tenant header filter, not a login-issued JWT.
- `fetchApi()` reads `session.id` from localStorage for `X-User-Id`, otherwise uses `TEMPORARY_STUDENT_ID`; it sends a fixed tenant header from code.
- Quick Access immediately selects a seeded/listed teacher or student.

**Conclusion:** this is demo-style client-side identity selection, not secure authentication. UI route guards are not a security boundary for APIs.

---

## Part 7 — User Roles & Permissions

| Capability | Student | Trainer (`teacher`) | Admin |
|---|---|---|---|
| Portal route guard | Client-side role check in `/student` | Client-side role check in `/trainer` | No equivalent guard in `/admin` |
| Courses/lessons | Browse/enroll/consume, progress | Trainer pages do not provide course authoring in primary trainer nav | Create/edit course and curriculum through admin pages |
| Batches | View own batch list from context | View/manage trainer batches | Batch overview, allocation, workload tools |
| Assessments | View student-safe list, attempt, view result | Build, publish, evaluate | Assessment overview/details/analytics |
| Events | Browse/register/cancel | Browse trainer event page | Create/edit/delete and registrations |
| User administration | — | — | User management |
| Reports/leaderboard | Results pages | Trainer reports/leaderboard | Multiple admin analytics areas |

The UI exposes these role concepts, but backend role authorization is incomplete/inconsistent. Course-service’s `ServiceConfig` permits HTTP requests and checks that tenant context exists for some methods. Event-service explicitly permits every request. User/batch/assessment services expose controllers without a working app-login/token guard in the inspected code. The API docs’ Bearer-token statement is not reflected by `fetchApi()` or a wired gateway JWT filter.

**Do not treat the role matrix above as production-grade enforcement.** It describes current UI/navigation and visible source behavior, not secure server authorization.

---

## Part 8 — Frontend Structure & Key Components

### Runtime/bootstrap files

- `src/router.js`: creates TanStack router from generated route tree and supplies QueryClient.
- `src/routes/__root.jsx`: HTML shell, metadata, theme initialization, `QueryClientProvider`, `LMSProvider`, `Outlet`, toaster.
- `src/start.js`: TanStack Start request middleware/error wrapper.
- `src/server.js`: SSR entry wrapper; normalizes one class of swallowed 500 SSR errors.

### State and API

- `src/context/LMSContext.jsx`: app-wide lists/currentUser; server loading; localStorage mirroring; demo login; assessment grading/evaluation; notification state.
- `src/services/api.js`: `fetchApi` and named API objects.
- React Query: used for course hierarchy, enrollments and progress in course pages/dashboard.
- `src/admin/store/useAppStore`: admin sidebar/profile/layout UI state (Zustand).

### Main layouts

- `src/components/layout/unified-layout.jsx`: student/trainer unified shell; admin uses its separate header/sidebar presentation.
- `src/components/layout/unified-sidebar.jsx`: navigation config for student, trainer and admin.
- `src/admin/components/layout/Sidebar.jsx`: additional admin-specific sidebar implementation used by legacy/admin surfaces.

### AI and media helpers

- `src/services/aiService.js`: Groq helper for course/category/event descriptions.
- `src/utils/aiService.js`: Groq prompts for assessment questions, subjective answer suggestions and coding help/execution suggestions.
- `src/lib/cloudinary.js` and admin course content manager: Cloudinary document URL and upload helpers.

---

## Part 9 — Backend Structure & Important Classes

| Module | Main classes | Responsibility |
|---|---|---|
| API gateway | `ApiGatewayApplication`, `RouteConfig` | Starts gateway and routes HTTP paths to services. It is not, in the checked-in route configuration, a login/JWT issuer. |
| Common library | `BaseEntity`, `TenantScopedEntity`, `TenantContext`, `TenantHeaderFilter`, `JwtService`, `PermissionGuard`, exception types | Shared IDs/timestamps, optional tenant/user context, JWT helper code and permission helper. Actual wiring varies by service. |
| Course-service | `CourseController`, `CategoryController`, `EnrollmentController`, `ProgressController`; `CourseService`, `EnrollmentService`, `ProgressTrackingService`; repositories; course entities/DTOs | Course catalog, curriculum tree, enrollment and lesson-progress operations. |
| User-service | `UserController`, `FeedbackController`, `NotificationController`; corresponding services/repositories; `DataSeeder` | Users, feedback and notifications. There is no password-auth controller/model. |
| Batch-service | `BatchController`, `TrainerAllocationController`; services/repositories; `Batch`, `TrainerAllocation` | Batches, student membership and trainer/course allocation records. |
| Assessment-service | `AssessmentController`, `SubmissionController`, `DraftController`, `AdminAssessmentController`, `AIController`; `AssessmentService`, `SubmissionService`, repositories | Assessments/questions, student-safe assessment DTO, attempts/submissions, in-memory drafts and analytics. |
| Event-service | `EventController`, `EventRegistrationController`; services/repositories; `Event`, `EventRegistration` | Events and registrations. Security config currently permits all requests. |

### Error handling

- `fetchApi` reads a JSON error `message` where possible and throws a frontend `Error`.
- Assessment-service has a `GlobalExceptionHandler` for bad JSON, `IllegalArgumentException`, status exceptions and generic 500s.
- Course-service has shared exception handling from `common-lib` plus validation in some request DTOs.
- Other services vary; missing date values in event creation, for example, can fall through to a generic 500 rather than a validation response.

---

## Part 10 — Database Structure & Relationships

The apps use relational tables, but IDs that cross microservice boundaries are often stored as plain strings/UUID columns rather than database foreign keys.

### Main records

- **User (`user-service.users`)**: UUID-like id stored as String, unique email, role string, department, avatar, averageScore and assessmentsCompleted. No credentials/password hash.
- **Batch (`batch-service.batches`)**: id, name, course label, status, count, creator/trainer/course identifiers and an `@ElementCollection` student-ID list.
- **TrainerAllocation (`trainer_allocations`)**: trainerId/batchId/courseId/session/status/date fields; IDs are scalars.
- **Course-service schema `course`**:
  - `Course` holds title/description/categoryId/published/visibility/media/duration/metadata.
  - `Category` is tenant-scoped.
  - `CourseModule` stores `courseId` as UUID scalar.
  - `SubModule` stores `moduleId` as UUID scalar.
  - `ContentItem` stores course/module/submodule UUIDs and content type/storageRef.
  - `Enrollment` is a `ManyToOne` to `Course`, with studentId/status/enrolledAt and a unique tenant/course/student constraint.
  - `ContentProgress` tracks student/course/module/submodule/content IDs and completion state.
  - `CourseProgress` tracks last accessed submodule/content. The progress service calculates completion from content progress + course hierarchy.
- **Assessment (`assessment-service.assessments`)**: scalar configuration, status/type, createdBy, `batches` element collection, `questions` one-to-many with cascade and orphan removal.
- **Question (`questions`)**: id/type/text/marks/options/correctAnswer/explanation and JSONB metadata used for extra type-specific fields such as coding settings.
- **Submission (`submissions`)**: assessmentId/studentId/status/timestamps/score/percentage/evaluation metadata; answers one-to-many.
- **Answer (`answers`)**: questionId, text answer, marksAwarded and remarks. Multi-select/object responses are stored via frontend JSON-string encoding and parsed on frontend fetch.
- **Event (`events`)**: tenant-scoped event properties (title, schedule, location/online, status, capacity, creator, active flag).
- **EventRegistration (`event_registrations`)**: eventId + studentId/name/email/status with unique event/student constraint; eventId is a scalar, not a JPA relationship.
- **Feedback (`feedbacks`)**: student/trainer/batch IDs and names, rating/comment/time.
- **Notification (`notifications`)**: client-generated id, title/message/type/recipient/read/time.

### Relationship sketch

```text
Category ── categoryId (scalar on Course) ── Course
Course ── courseId (scalar) ── CourseModule ── moduleId ── SubModule
Course/Module/SubModule ── scalar IDs ── ContentItem
Course ── JPA ManyToOne target ── Enrollment ── studentId (string)
Course + student + content IDs ── ContentProgress / CourseProgress
Batch ── students element-collection IDs; trainerId/courseId are scalar
Batch IDs ── strings in Assessment.batches
Assessment ── OneToMany/cascade/orphanRemoval ── Question
Assessment + student IDs ── Submission ── OneToMany ── Answer
Event ── EventRegistration.eventId (scalar, not FK)
```

Tenant scoping is only explicit on `TenantScopedEntity` descendants (notably course and event entities). User/batch/assessment IDs use separate models and should not be assumed to have database-enforced cross-service referential integrity.

---

## Part 11 — API Map

All frontend calls go through `fetchApi()` in `src/services/api.js`, except direct AI/Cloudinary calls.

### Gateway routing

| Browser path | Gateway destination | Service controller path |
|---|---|---|
| `/api/courses/**`, `/api/categories/**`, `/api/enrollments/**`, `/api/progress/**` | course-service | Gateway strips `/api`; controller paths are `/courses`, `/categories`, etc. |
| `/api/v1/users/**`, `/api/v1/feedback/**`, `/api/v1/notifications/**` | user-service | Prefix preserved. |
| `/api/v1/batches/**`, `/api/v1/allocations/**` | batch-service | Prefix preserved. |
| `/api/v1/assessments/**`, `/api/v1/submissions/**` | assessment-service | Prefix preserved. |
| `/api/v1/events/**` | event-service | Prefix preserved. |

### Users / feedback / notifications

- `GET /api/v1/users[?role=...]` — user list (optional role filter).
- `GET /api/v1/users/{id}` — one user.
- `POST /api/v1/users`, `POST /api/v1/users/bulk` — create user(s).
- `PUT /api/v1/users/{id}` — partial profile update (service changes name/email/department/avatar; role/stats are intentionally not edited here).
- `DELETE /api/v1/users/{id}`, `DELETE /api/v1/users/all`.
- `GET /api/v1/feedback[?studentId=...]`, `POST /api/v1/feedback`.
- `GET /api/v1/notifications`, `POST /api/v1/notifications/sync` (full-list sync).
- **No login/password/reset endpoints found.**

### Batches / allocations

- `GET/POST /api/v1/batches`, `PUT/DELETE /api/v1/batches/{id}`.
- `DELETE /api/v1/batches/created-by/{createdBy}`.
- `GET/POST/PUT/DELETE /api/v1/allocations...`, `POST /api/v1/allocations/bulk`.
- Analytics/workload paths include `/dashboard`, `/analytics`, `/trainer/{trainerId}`, `/batch/{batchId}`, `/course/{courseId}`, `/university/{university}`. Check `TrainerAllocationController` for parameters and business rules.

### Courses / curriculum / enrollment / progress

- `GET/POST /api/courses`, `PUT/DELETE /api/courses/{courseId}`, `GET /api/courses/{courseId}/hierarchy`.
- Module/submodule/content create/update/delete routes are declared in `CourseController`.
- `GET/POST/PUT/DELETE /api/categories...`.
- `POST/DELETE /api/enrollments/{courseId}`, `GET /api/enrollments/{courseId}/status`, `GET /api/enrollments/my-courses`.
- `POST /api/progress/course/{courseId}/submodule/{submoduleId}/complete`, `POST /api/progress/course/{courseId}/access`, `GET /api/progress/course/{courseId}`.
- **Mismatch to verify:** frontend `CourseService.getCourseById()` calls `GET /courses/{id}`, but checked `CourseController` does not declare a corresponding GET-by-id method; active course pages mostly use list/hierarchy.

### Assessments / submissions

- `GET /api/v1/assessments` — full trainer/admin list.
- `GET /api/v1/assessments/student` — student-safe version removing answer keys/explanations (and filtering coding details).
- `POST /api/v1/assessments`, `PUT /api/v1/assessments/{id}`, `DELETE /api/v1/assessments/{id}`.
- `DELETE /api/v1/assessments/created-by/{id}`, `/batch/{id}`.
- `GET /api/v1/assessments/dashboard`, `/analytics`, `/{id}/details`, `/{id}/report`, `/trainer-performance`, `/batch-performance`.
- `POST /api/v1/assessments/ai/generate-description`.
- `GET/POST/PUT/DELETE /api/v1/submissions...`; `GET` accepts optional `studentId` query.
- Draft routes: `GET/POST/DELETE /api/v1/assessments/drafts/{studentId}/{assessmentId}`; current `AssessmentCacheService` is process-memory, so these drafts are not durable across restart.

### Events

- `GET/POST /api/v1/events`, `GET/PUT/DELETE /api/v1/events/{eventId}`.
- `DELETE /api/v1/events/created-by/{createdBy}`.
- `POST/DELETE /api/v1/events/{eventId}/register`, `GET /registration-status`, `GET /registrations`, `GET /api/v1/events/registrations/my`.

---

## Part 12 — Page-by-Page Route Map

The route tree is file-based and generated into `src/routeTree.gen.ts`. 74 route source files are present (plus a routes README); this grouped list includes the route paths extracted from their `createFileRoute()` declarations.

### Root and standalone

| Route | Source | Screen |
|---|---|---|
| `/` | `src/routes/index.jsx` | Login screen. |
| `/analytics` | `src/routes/analytics.jsx` | Standalone analytics shell; route-level role check not present in this file. |

### Student portal

Parent `/student` → `src/routes/student.jsx` checks `currentUser.role === "student"` client-side and renders `UnifiedLayout`.

- `/student/` — dashboard (`src/routes/student/index.jsx`).
- `/student/courses` — enrolled/all courses and course progress (`src/routes/student/courses.jsx`).
- `/student/course/$courseId` — course viewer, lessons, enrollment, progress (`src/routes/student/course/$courseId.jsx`).
- `/student/batches` — student batch list.
- `/student/events` — browse/register/cancel events.
- `/student/assessments` — assigned/published assessments.
- `/student/assessment/$assessmentId` — assessment introduction/details.
- `/student/take/$slug` — quiz-taking UI.
- `/student/take-coding/$slug` — coding assessment UI.
- `/student/results` and `/student/results/$slug/$id` — results list/details.
- `/student/certificate/$submissionId` — client-rendered assessment certificate.
- `/student/notifications`, `/student/feedback`, `/student/profile`.

### Trainer portal

Parent `/trainer` → `src/routes/trainer.jsx` checks `currentUser.role === "teacher"` client-side.

- `/trainer/` dashboard.
- `/trainer/batches`, `/trainer/batches/$id`.
- `/trainer/events`.
- `/trainer/assessment-builder` → shared `AssessmentBuilder` implementation.
- `/trainer/evaluation`.
- `/trainer/leaderboard`.
- `/trainer/reports`.
- `/trainer/notifications`.
- `/trainer/settings`.

### Admin portal

Parent `/admin` → `src/routes/admin.jsx`; source file only waits for mount and renders the admin layout. No currentUser/role guard is present there.

- `/admin/` dashboard.
- `/admin/notifications`.
- `/admin/categories/`, `/admin/categories/$categorySlug`.
- `/admin/courses/`, `/admin/courses/$courseSlug`, `/admin/courses/builder`.
- `/admin/curriculum/`, `/admin/curriculum/$courseId`.
- `/admin/submodules/$submoduleId/content`.
- `/admin/events/`.
- `/admin/users/`.
- `/admin/batches/`, `/admin/batches/$batchId`, `/admin/batches/allocate`, `/admin/batches/allocations`, `/admin/batches/analytics`, `/admin/batches/trainers`.
- `/admin/assessments/`, `/admin/assessments/$assessmentId`, `/admin/assessments/analytics`.
- Analytics child routes: `/admin/analytics/`, `/admin/analytics/ai`, `/admin/analytics/apprentice`, `/admin/analytics/certifications`, `/admin/analytics/champions`, `/admin/analytics/coverage`, `/admin/analytics/effectiveness`, `/admin/analytics/executive`, `/admin/analytics/hours`, `/admin/analytics/investment`, `/admin/analytics/pillars`, `/admin/analytics/predictive`, `/admin/analytics/programs`, `/admin/analytics/recommendations`, `/admin/analytics/skill-gap`, `/admin/analytics/trends`, plus the nested `/admin/analytics/analytics/` route.
- `/admin/organiser` and `/admin/trainer` are additional route files; inspect their components before assuming they are part of the main navigation.

---

## Part 13 — Important Screen Controls / Button Map

This map covers important actions found in the main workflows. A 75-route project has many local chart/filter/modal controls; those are described at feature level rather than listing every decorative/animation button as a separate backend action.

| User action | Main UI | Frontend handler/service | API/backend | Database effect / visible result |
|---|---|---|---|---|
| Choose Trainer/Student/Admin | `pages/Login.jsx` role buttons | `setRole()` | No API | Changes client role selection only. |
| Access Portal | `pages/Login.jsx` submit | `handleLoginSubmit()` → `LMSContext.login()` | No login API | Email-match demo identity; changes local context, navigates. Admin branch navigates directly. |
| Quick Access | `pages/Login.jsx` cards | `handleQuickLogin()` | No login API | Selects listed teacher/student without password. |
| Logout | portal sidebar/header | `LMSContext.logout()` | No API | `currentUser` set null; session localStorage effect removes session. |
| Create/edit course | Admin Courses screens | `CourseService.createCourse/updateCourse` | `POST/PUT /api/courses` → `CourseController` → `CourseService` → `CourseRepository` | Writes `course.courses`; UI refreshes/query invalidation. |
| Add module/lesson/content | Course hierarchy/content manager | `CourseService.addModule/addSubmodule/addContentItem` etc. | `/api/courses/{id}/modules...` | Writes curriculum/content tables. |
| Upload lesson document | `ContentManager` | Cloudinary upload helper | Direct Cloudinary unsigned upload, then course content API | Cloudinary returns URL; content item stores URL/reference. |
| Enroll | Student course detail | `EnrollmentService.enroll()` | `POST /api/enrollments/{courseId}` | Enrollment row; course page reloads. |
| Mark lesson complete | Student CourseViewer | `ProgressService.markComplete()` | `POST /api/progress/course/{courseId}/submodule/{submoduleId}/complete` | Content progress rows; refreshes progress summary. |
| Create batch | Admin batch pages | `LMSContext.createBatch()`/`BatchService` | `POST /api/v1/batches` | Batch row and student-ID collection; local context updated. |
| Allocate trainer/course | Admin allocation wizard | `AllocationService` | `/api/v1/allocations...` | TrainerAllocation row(s). |
| Create assessment | Trainer builder/admin assessment page | `createAssessment()` / `AssessmentService` | `POST /api/v1/assessments` | Assessment and question rows. |
| Save draft/publish | Assessment builder buttons | async draft/publish handlers | `POST`/`PUT /api/v1/assessments` | Draft/published status and settings saved; server validation for title/duration/marks/passing percentage/questions/batches. |
| Start assessment | TakeQuiz/TakeCoding | `startAssessment()` | `POST /api/v1/submissions` | `in_progress` submission. |
| Submit assessment | TakeQuiz | `submitAssessment()` + `SubmissionService.updateSubmission()` | `PUT /api/v1/submissions/{id}` (fallback POST) | Answers/score/status persisted; objective grading calculated client-side; manual types remain pending. |
| Grade submission | Trainer Evaluation | `evaluateSubmission()` | `PUT /api/v1/submissions/{id}` | Stores answer marks/remarks, total, percentage, `isEvaluated`; results update. |
| View/download assessment certificate | Results → View Certificate | route to `/student/certificate/{submissionId}`; `window.print()` | No certificate API | UI allows only evaluated passing submission; certificate is generated in browser/print, not stored as PDF record. |
| Create event | Admin Events form | `EventService.createEvent()` | `POST /api/v1/events` | Event row; event list refreshes after `onBack`. |
| Publish/draft event | Admin CreateEvent buttons | `handleSubmit(status)` | POST/PUT EventService | Sends `status`; create works; source audit found update service currently does not apply status. |
| Register/cancel event | Student Events | EventService registration calls | `POST/DELETE /api/v1/events/{eventId}/register` | EventRegistration row/status. |
| Submit feedback | Student Feedback | `FeedbackService.submitFeedback()` | `POST /api/v1/feedback` | Feedback row. |
| Update profile | Profile/Settings | `updateProfile()` / UserService | `PUT /api/v1/users/{id}` | Server merges name/email/avatar/department. |
| Change password | Trainer Settings | `handleUpdatePassword()` | **No API** | Validates non-empty/matching new values then shows success toast; no password is checked or changed. |
| Save notifications | notification UI | `NotificationService.sync()`/context | `POST /api/v1/notifications/sync` | Server syncs full list; some event-notification code writes localStorage directly. |
| Filter/search tables | page component local state | `setSearch`, `setFilter` etc. | Usually no API | Filters already-loaded data in browser. |
| Delete event/user/batch/course | respective Admin page | relevant service/cascade handler | DELETE endpoint(s) | Soft delete for events; others service-specific; user deletion may cascade through several services. |


### Additional per-portal button details

### Login screen

- **Role buttons:** change local `role` state only.
- **Email input:** sets local email state.
- **Access Portal:** required-email check; demo email match for teacher/student; direct admin navigation.
- **Quick Access cards:** call same email matching for teacher/student. No password/API.
- **Theme toggle:** local UI state/localStorage.

### Student screens

- **Dashboard:** metrics/charts are computed from LMS context plus enrolled courses/progress queries.
- **Courses:** fetches courses, the current `X-User-Id`’s enrollments and progress; search/status/level/favourite/view filters are local UI state.
- **Course Viewer:** enroll posts enrollment; lesson navigation changes active submodule; opening content posts last access; Mark Complete posts completion; view refetches progress.
- **Events:** Register/Cancel call registration POST/DELETE then refetch event/registration lists.
- **Assessments:** Start creates a submission; answers update local state; submit validates required questions, confirms, computes objective marks, persists submission and navigates to result.
- **Results:** View Certificate appears only when `isEvaluated` and score meets the assessment passing mark.
- **Feedback:** rating/comment form sends `POST /api/v1/feedback`.
- **Notifications:** read/search controls; read state syncs the notification list.
- **Profile:** profile save uses `updateProfile` then `UserService.updateUser`; password screen is not a real password API.

### Trainer screens

- **Batches:** list/detail from state/services; mutations call batch APIs.
- **Assessment Builder:** tabs, add/edit/delete/reorder/import/export questions; Save Draft/Publish persist assessment.
- **Evaluation:** Save assembles answer marks/remarks, calls `evaluateSubmission`, then PUTs the submission.
- **Reports:** filters/search in loaded context; calculation is client-side.
- **Leaderboard:** `getLeaderboard()` derives ranking from submissions.
- **Settings:** profile save reaches user-service; password/notification preference functions include local-only/fake-success behavior.

### Admin screens

- **Courses/Curriculum:** course CRUD and module/submodule/content actions; Cloudinary uploads in ContentManager.
- **Categories:** CRUD through category APIs.
- **Users:** CRUD/bulk list and delete-cascade calls through user/batch/assessment/event services.
- **Batches/Allocations:** create/edit batches and trainer allocations through batch-service.
- **Events:** create/edit/draft/publish/delete and registration list through event-service.
- **Assessments:** list/detail/analytics through assessment-service.
- **Analytics Hub:** individual pages use service APIs and/or aggregate UI data; verify a specific report before treating values as authoritative.

---

## Part 14 — Feature-by-Feature Workflows

### A. Login

```text
Open / → Login.jsx → choose role + enter email
  → LMSContext.login(email, role) searches teachers/students arrays
  → match: setCurrentUser → localStorage session → navigate to role path
  → student/trainer layout role check → render portal
```

There is no request body, controller, password verification, repository lookup during submit, JWT issuance or Authorization header. Admin skips `LMSContext.login()` entirely.

### B. Create and consume a course

```text
Admin course screen
 → CourseService.createCourse(data)
 → POST /api/courses
 → gateway strips /api and forwards /courses
 → CourseController.create(@Valid CourseRequest)
 → CourseService.create → CourseRepository.save
 → PostgreSQL course.courses
 → response returns Course → React Query/local page updates
```

Curriculum mutations go to module/submodule/content endpoints. Student viewer calls `CourseService.getCourseHierarchy(courseId)`, which flattens the hierarchy DTO for display. Clicking Enroll calls the enrollment endpoint; opening a lesson calls progress access endpoint; Mark Complete calls progress completion endpoint. Progress service reads/writes `ContentProgress` and calculates summary percentage from course hierarchy.

### C. Assessment → attempt → result → certificate

```text
Trainer builder
 → create questions/config and POST assessment
 → AssessmentController → AssessmentService.validate/sanitize IDs/save
 → assessments + question_options/questions tables

Student list
 → GET /api/v1/assessments/student (answer-key-sanitized response)
 → click assessment → POST /api/v1/submissions (in_progress)
 → answer on TakeQuiz → client-side LMSContext grading for objective types
 → PUT /api/v1/submissions/{id} (SubmissionService serializes array/object answer to string)
 → DB submission + answer rows
 → Results page reads persisted submission
 → when evaluated and percentage >= assessment.passingMarks (default 75), certificate route opens
```

Short answer, paragraph, file upload, coding and assessments configured for manual review set `isEvaluated=false` until trainer evaluation. Trainer Evaluation updates the submission and sets `isEvaluated=true`. Course-completion certificates are a separate client-side modal in student courses.

### D. Event lifecycle

```text
Admin Events → Create Event form → EventService.createEvent(payload)
 → gateway /api/v1/events → EventController → EventService → EventRepository
 → PostgreSQL events
 → GET /api/v1/events list; students use list and registration APIs
 → POST /{eventId}/register → EventRegistrationService capacity/deadline/duplicate checks
 → event_registrations row
```

The current source has confirmed gaps: online field name mismatch, draft list visibility/registration, event update status not applied, date validation gaps and generic UI errors. These are documented as source findings, not assumed fixed.

### E. Batches and trainer allocation

Admin creates a Batch with student ID list and creator metadata via `POST /api/v1/batches`. Trainer allocations use `/api/v1/allocations`; IDs are stored as scalar identifiers. Student batch membership is also re-derived in `LMSContext` from the Batch `students` list.

### F. Feedback and notifications

Student feedback page collects rating/comment and user/batch identity then posts `/api/v1/feedback`. Notifications are loaded from `/api/v1/notifications`, locally updated, then full-list-synced to `/api/v1/notifications/sync`; this is not a per-user inbox API with server-enforced isolation in the controller inspected.

### G. Leaderboard/reports

Trainer leaderboard calls `LMSContext.getLeaderboard()`, which computes entries from in-memory/fetched students and submitted submissions (total score, evaluated average, completed submission count), sorts and assigns ranks. Trainer Reports computes metrics from context arrays. Admin analytics has separate service endpoints for many assessment/allocation dashboards.

---

## Part 15 — Frontend → API → Backend → Database Tracing

### Example: Course lesson completion

1. **User:** student clicks Mark Complete in course viewer.
2. **Frontend:** `src/routes/student/course/$courseId.jsx`, `handleMarkComplete()`.
3. **API:** `ProgressService.markComplete(courseId, submoduleId)` → `POST /api/progress/course/{courseId}/submodule/{submoduleId}/complete`; `fetchApi` adds tenant/user headers.
4. **Gateway:** course route strips `/api` and forwards to course-service.
5. **Controller:** `ProgressController.markSubmoduleComplete()` reads `X-User-Id` and calls service.
6. **Service:** `ProgressTrackingService.markSubmoduleComplete()` updates content completion (see actual service implementation for submodule-to-content behavior).
7. **DB:** `course.content_progress` and possibly course progress/access records.
8. **Response:** no-content success.
9. **Frontend:** `refetchProgress()` reloads progress summary.
10. **UI:** completion state/progress percentage updates.

### Example: Student submits MCQ assessment

1. TakeQuiz records option indexes in local state.
2. `executeFinalSubmission()` converts current answers to `{questionId, answer}` objects.
3. `LMSContext.submitAssessment()` maps answers, evaluates choice answers in browser, sets score/percentage/evaluated state.
4. `SubmissionService.updateSubmission()` JSON-encodes array/object answer values into strings because backend `Answer.answer` is a String column.
5. `PUT /api/v1/submissions/{id}` → `SubmissionController` → `SubmissionService.updateSubmission()` → `SubmissionRepository.save()`.
6. On reload, `SubmissionService.getSubmissions()` parses stringified array/object answers back to JS values.
7. The Results page reads context and displays score, marks and feedback; passing/evaluated submission can navigate to CertificateView.

### Example: Admin creates a user

`src/admin/pages/Users/UserManagement.jsx` → `UserService.createUser()` / bulk service → `POST /api/v1/users` or `/bulk` → `UserController` → `UserService` → `UserRepository` → `users` table. **No password creation or credential enrollment is part of this request.**

---

## Part 16 — Error Handling

- `fetchApi()` checks `response.ok`; tries to parse JSON `message`, otherwise throws a generic error; successful empty responses return `null`.
- Assessment-service explicitly formats many 400/404/409/500 responses in `GlobalExceptionHandler`.
- The root route has a not-found page and error component; `src/server.js` wraps SSR errors.
- Many UI screens only `console.error()` failures (e.g. parts of Events/Settings) and do not show a user-facing toast; this varies by page.
- Course API endpoints use Jakarta validation on some request DTOs; course common security exceptions are handled centrally.
- A database outage typically becomes an API error; frontend components often use local cached data or generic empty states rather than a uniform offline screen.
- Event form illustrates a concrete missing-field failure: labels show required dates, but state is not validated before request and backend compares nullable Instants; missing schedule can become 500.

---

## Part 17 — Complete User Journey (Actual Code)

### Student

1. `/` Login page.
2. Choose Student, enter a listed email, or Quick Access.
3. `LMSContext.login()` matches email in loaded student list; session is written to localStorage.
4. Navigate `/student`; route guard checks `role === "student"` client-side.
5. Root context loads user/batches/assessments/submissions/notifications; screens also load course/enrollment/progress APIs.
6. Browse Courses, enroll, open lessons, update progress; see upcoming events and register; take assessments and submit; view results and eligible print certificate; submit feedback/view notifications.

### Trainer

1. Choose Trainer and use matching listed teacher email; no password.
2. `/trainer` role check is client-side.
3. Navigate batches/events/assessment-builder/evaluation/leaderboard/reports/settings.
4. Builder saves/publishes assessments, Evaluation writes marks/results. Password/notification preference screens are not all backed by server workflows.

### Admin

1. Choose Admin and enter any non-empty email; Login handler displays success and navigates directly to `/admin`.
2. No currentUser admin record/token is created in this branch; `/admin` parent route does not guard access.
3. Admin UI opens dashboard/sidebar; actions use service APIs for users, categories, courses, curriculum, batches/allocations, events and assessments.

---

## Part 18 — Complete Developer Journey (How to Trace a Change)

When changing a feature, follow this path rather than editing the first UI file you find:

1. Find its visible route in `src/routes/` and identify the component it mounts.
2. Follow the button handler/state update in that component or its page (`src/pages/`, `src/admin/pages/`, `src/features/`).
3. Find the API wrapper in `src/services/api.js`; confirm method/path/body/headers.
4. Follow the gateway route in `backend/api-gateway/.../RouteConfig.java`.
5. Find the receiving Spring controller, then the service method and repository.
6. Inspect the entity/DTO and schema/migration, including whether IDs are true foreign keys or plain identifiers.
7. Check role/tenant enforcement at both UI and backend; do not treat a hidden button or route redirect as server security.
8. Test success, validation failure, refresh/read-back, and the other role’s view in an isolated database.
9. Build frontend/backend, stage only the intended files, commit on the agreed branch and verify the remote tip.

**Example — course lesson completion:** `CourseViewer.handleMarkComplete()` → `ProgressService.markComplete()` → `POST /api/progress/.../complete` → gateway course route → `ProgressController` → `ProgressTrackingService` → `ContentProgressRepository` → PostgreSQL → `refetchProgress()` → updated progress UI.

---

## Part 19 — How to Run the Project

### Prerequisites

Use a recent Node.js compatible with the checked-in TanStack/Vite dependency engine requirements (repository guide says Node 22+), JDK 21 recommended (event-service sets Java 21), Maven, Docker Desktop or PostgreSQL + Redis.

### Docker backend

```bash
cd backend
docker compose up --build -d
```

Compose declares PostgreSQL, Redis, gateway and the course/user/batch/assessment/event services. Wait for health/boot logs before using the frontend.

### Frontend

```bash
npm ci
# Create local .env from .env.example and fill only the values you actually have.
npm run dev
```

Default dev page is `http://localhost:3000`; default frontend API base is `http://localhost:8080/api`.

### Build/check

```bash
npm run build
npm run lint
```

Backend build from repository root:

```bash
mvn -f backend/pom.xml -T2 -DskipTests install
```

### Environment variable names (no secret values)

Frontend: `VITE_API_BASE_URL`, `VITE_GROQ_API_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`. Vite-exposed `VITE_*` values are bundled for the browser; **do not put a private production API key in a VITE variable**.

Backend/deployment: `SERVER_PORT`, `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `JWT_ISSUER`, `SERVICES_USER`, `SERVICES_COURSE`, `SERVICES_BATCH`, `SERVICES_ASSESSMENT`, `SERVICES_EVENT`, `KAFKA_BOOTSTRAP_SERVERS`, `GROQ_API_KEY` (service YAMLs may define defaults). Do not copy default/example credentials into production.

`render.yaml` describes the backend web services and PostgreSQL. The checked manifest does not define a frontend static-site service; verify the actual frontend deployment location/config separately.

---

## Part 20 — Developer Learning Path

| Order | Files to study | What to understand before moving on |
|---|---|---|
| 1 | `package.json`, `.env.example`, `vite.config.js` | Frontend tools, scripts, aliases and variables (never copy secrets into docs). |
| 2 | `src/router.js`, `src/routes/__root.jsx`, `src/routeTree.gen.ts` | How a URL becomes a route and how global providers wrap pages. Do not hand-edit generated route tree. |
| 3 | `src/pages/Login.jsx`, `src/context/LMSContext.jsx` | Current demo identity flow and shared data lifecycle. |
| 4 | `src/services/api.js` | Request base URL, headers, JSON/error handling and endpoint wrappers. |
| 5 | `backend/api-gateway/.../RouteConfig.java` | How browser paths map to microservices. |
| 6 | One vertical slice: Course or Assessment | Trace controller → service → repository → entity/DTO and back. |
| 7 | Database config + entities | Understand tenant schema, migrations and scalar IDs versus real JPA relationships. |
| 8 | Portal parent routes + layouts | See route-level role checks and navigation. |
| 9 | `backend/common-lib` security code | Learn which JWT/tenant helpers exist, then verify whether each service actually wires them. |
| 10 | Local build + isolated test | Reproduce, test success/failure/refresh, then make one small change and rebuild. |


## Part 21 — Debugging Map (“Where Should I Look?”)

| Symptom/question | Start here |
|---|---|
| Landing login / wrong portal | `src/pages/Login.jsx`, `src/context/LMSContext.jsx` (`login`), `src/routes/{student,trainer,admin}.jsx` |
| API base URL/headers/error text | `src/services/api.js` (`API_BASE_URL`, `fetchApi`) |
| Route not loading | `src/routes/...`, generated `src/routeTree.gen.ts`, `src/router.js`, root error component |
| Course list/detail/content | `src/routes/student/courses.jsx`, `src/routes/student/course/$courseId.jsx`, `src/admin/pages/Courses/*`, `CourseService` |
| Enrollment/progress | `EnrollmentController/Service`, `ProgressController`, `ProgressTrackingService`, `Enrollment`/progress entities |
| Assessment create/save | `EnterpriseBuilderLayout.jsx`, `QuestionBuilderPanel.jsx`, `AssessmentService`, `AssessmentController`, `Question`/`Assessment` |
| Answer/grade/refresh issue | `TakeQuiz.jsx`, `LMSContext.submitAssessment/evaluateSubmission`, `SubmissionService`, `SubmissionController`, `Submission`/`Answer` |
| Certificate button/page | `src/pages/Results.jsx`, `src/pages/CertificateView.jsx`; no certificate API/table exists |
| Event create/registration | `src/admin/pages/Events/CreateEvent.jsx`, `EventService`, Event controllers/services/entities |
| User CRUD/profile | `UserManagement.jsx`, `Settings.jsx`, `UserService`, `UserController/UserService/User` |
| Cloudinary upload/view | `src/admin/pages/Courses/ContentManager.jsx`, `src/lib/cloudinary.js`, `src/routes/student/course/$courseId.jsx` |
| AI prompt/provider | `src/services/aiService.js`, `src/utils/aiService.js`, `VITE_GROQ_API_KEY` usage |
| Tenant/role context | `common-lib/TenantHeaderFilter`, `TenantContext`, course `ServiceConfig`, API client headers; compare with actual service wiring |
| Database schema | Course Flyway files under `backend/course-service/src/main/resources/db/migration`; other services’ JPA entities and `ddl-auto` settings |

---

## Part 22 — Important Gaps / Unknowns (Source-Confirmed vs Needs Verification)

### Confirmed from source

1. Landing login is email-match demo auth; no password/login API/token.
2. Admin login path accepts any non-empty email and `/admin` has no role guard in its parent route.
3. `fetchApi()` sends X-User-Id/X-Tenant-Id, not a Bearer token; tenant ID is fixed in frontend source.
4. Backend JWT helper classes exist but are not referenced by gateway auth filters in the inspected code.
5. Event service SecurityConfig uses `permitAll`; event endpoints are not role-protected there.
6. Assessment drafts use process-memory map, so drafts disappear when assessment-service restarts.
7. Coding submissions/leaderboard in `LMSContext` are local state/localStorage; there is no separate coding-submission backend controller/API found.
8. Assessment certificate is browser-rendered/printed; no certificate table/API/PDF persistence found.
9. Course module/submodule/content relations use ID columns instead of explicit JPA relations in several entities; do not assume database cascades solely from a diagram.
10. Frontend `CourseService.getCourseById` has no matching GET-by-ID method in `CourseController`; active screens commonly use hierarchy/list instead.
11. `API.md` says endpoints require Bearer JWT, but current Login/fetchApi do not implement that behavior.

### Needs live deployment/config verification

- Whether production infrastructure adds an external auth proxy or gateway identity layer not present in this repository.
- Whether Cloudinary/Groq variables are configured in deployment, and what data providers receive.
- Whether Kafka is provided outside checked-in Compose/Render manifests.
- Whether all routes from generated route tree are linked in production navigation.
- Whether Render deploys the frontend separately; `render.yaml` mainly lists backend services and DB.
- Actual live database contents, tenant IDs, external service availability and production CORS settings.

---

## Part 23 — Complete Workflow Diagram

### Architecture

```text
Browser URL
   ↓
TanStack file route (src/routes + generated routeTree)
   ↓
Page/component (React state, LMSContext, React Query)
   ↓
Service wrapper in src/services/api.js
   ↓  HTTP JSON + X-User-Id + X-Tenant-Id (no Bearer from current client)
API Gateway :8080
   ↓ route by URL prefix
Spring Controller
   ↓
Service/business logic
   ↓
Spring Data repository/JPA
   ↓
PostgreSQL tables (plus Redis/configured external services where used)
   ↓
JSON response
   ↓
React Query/context/localStorage state update
   ↓
Rendered screen/toast/navigation
```

### Fast “what happens?” answer

The browser renders React/TanStack screens. Those screens mostly obtain data through `src/services/api.js` or React Query. That fetch wrapper adds identifying headers and calls the API gateway. The gateway forwards to one of the Spring services. The service uses a repository to read/write PostgreSQL, then returns JSON for the UI to render. The important exception is login: it currently only matches an email in frontend-loaded data, so it does **not** perform the usual backend credential/token step.
