<div align="center">

# 🎓 Xebia Enterprise LMS

> **Enterprise-grade Learning Management System** — Built with React 19 + 6 Spring Boot Microservices + PostgreSQL

[![Live Frontend](https://img.shields.io/badge/🌐_Live_Frontend-Vercel-black?style=for-the-badge)](https://xebia-enterprise-lms.vercel.app)
[![API Gateway](https://img.shields.io/badge/⚙️_API_Gateway-Render-46E3B7?style=for-the-badge)](https://xebia-api-gateway-mritunjai.onrender.com)
[![Load Tested](https://img.shields.io/badge/🔥_Load_Tested-50_Concurrent-FF6200?style=for-the-badge)](#-load-testing--performance)

<br/>

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.6-6DB33F?logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Private-blue)
![Last Commit](https://img.shields.io/github/last-commit/mritunjai-prog/Xebia-Enterprise-LMS)

<br/>


An enterprise LMS featuring three portal roles (Admin, Trainer, Student), a microservices backend with 6 Spring Boot services, a React 19 frontend with TanStack Router, and a Docker-based development environment.The current code also includes selected BCrypt/JWT authentication flows, a Groq-backed Student Study Bot, and Groq-assisted assessment-description generation. Built for Xebia, the LMS supports course management, batch allocation, assessments, events, and analytics dashboards.

**[🚀 Live Demo](https://xebia-enterprise-lms.vercel.app)** &nbsp;·&nbsp; **[🐛 Report Bug](https://github.com/mritunjai-prog/Xebia-Enterprise-LMS/issues)** &nbsp;·&nbsp; **[✨ Request Feature](https://github.com/mritunjai-prog/Xebia-Enterprise-LMS/issues)**

</div>


---

### Live Links

| Service | URL |
|---------|-----|
| Frontend (Vercel) | [xebia-enterprise-lms.vercel.app](https://xebia-enterprise-lms.vercel.app) |
| API Gateway | [xebia-api-gateway-mritunjai.onrender.com](https://xebia-api-gateway-mritunjai.onrender.com) |
| Course Service | [xebia-course-service-mritunjai.onrender.com](https://xebia-course-service-mritunjai.onrender.com) |
| User Service | [xebia-user-service-mritunjai.onrender.com](https://xebia-user-service-mritunjai.onrender.com) |
| Batch Service | [xebia-batch-service-mritunjai.onrender.com](https://xebia-batch-service-mritunjai.onrender.com) |
| Assessment Service | [xebia-assessment-service-mritunjai.onrender.com](https://xebia-assessment-service-mritunjai.onrender.com) |
| Event Service | [xebia-event-service-mritunjai.onrender.com](https://xebia-event-service-mritunjai.onrender.com) |
| PostgreSQL | `xebia-postgres-mritunjai` (Render managed) |

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Folder Structure](#-folder-structure)
- [Deployment](#-deployment)
- [🔥 Load Testing & Performance](#-load-testing--performance)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

### ✅ Implemented

**Admin Portal**
- ✅ Dashboard with KPI metrics and charts
- ✅ Category management (CRUD)
- ✅ Course management with module/submodule/content builder
- ✅ Curriculum builder with hierarchical content structure
- ✅ Batch Management — Overview, Analytics, Allocation Matrix, Trainer Allocation Wizard, Trainer Workload
- ✅ Assessment Management — Dashboard, Analytics, Student Reports
- ✅ Event Management — Create, edit, delete events with DateTimePicker, image upload, draft/publish
- ✅ Analytics Hub — 12+ analytics pages (Executive, Coverage, Hours, Pillars, AI, Certifications, Programs, Trends, Effectiveness, Champions, Investment, Apprentice Journey)
- ✅ Organiser page

**Trainer Portal**
- ✅ Trainer Dashboard
- ✅ Batch management
- ✅ Assessment Builder with question types (MCQ, Coding, Mixed, True/False, Multi-Select)
- ✅ Student evaluation and grading with backend persistence
- ✅ Leaderboard and reports
- ✅ Event viewing (read-only)
- ✅ Settings

**Student Portal**
- ✅ Student Dashboard with progress tracking
- ✅ Course browsing and enrollment
- ✅ Batch viewing
- ✅ Assessment taking (MCQ, Coding, Mixed); student-safe listing omits answer keys and explanations
- ✅ Results with certificates
- ✅ Notifications and feedback synchronized with the backend
- ✅ Event discovery and registration
- ✅ Profile management (profile updates persist through the User Service)
- ✅ Floating Student Study Bot for general programming and LMS-navigation help
- ✅ Chat request limits: 20 messages, 800 characters per message, 15-second HTTP timeout, 512-token output cap

**Backend**
- ✅ 6 microservices (API Gateway, User, Course, Batch, Assessment, Event)
- ✅ Bulk User creation API (`POST /api/v1/users/bulk`)
- ✅ Multi-tenant architecture with `TenantScopedEntity`
- ✅ Docker Compose orchestration
- ✅ API Gateway path routing and CORS
- ✅ BCrypt password verification and JWT sign-in/password-management flows in User Service
- ✅ Groq-backed Student Study Bot (`POST /api/v1/chat`) with JWT and STUDENT-role validation
- ✅ Groq-assisted assessment-description generation

### 🚧 In Progress / Planned

- 🚧 Platform-wide JWT validation and role-based authorization across protected domain APIs (selected User Service endpoints already validate tokens)
- 🚧 Course-grounded Study Bot responses using lesson retrieval/RAG
- 🚧 WebSocket real-time notifications
- 🚧 Course video streaming
- 🚧 Mobile responsive optimization
- 🚧 Unit and integration test suites

---

## 🛠 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.2 | UI library |
| **Routing** | TanStack Router | 1.168 | File-based routing with type safety |
| **Build Tool** | Vite | 8.0 | Fast dev server and bundler |
| **Styling** | Tailwind CSS | 4.2 | Utility-first CSS framework |
| **UI Components** | shadcn/ui | — | 46 accessible Radix UI components |
| **State (UI)** | Zustand | 5.0 | Lightweight UI state management |
| **State (Data)** | React Context | — | Domain data (LMSContext) |
| **Charts** | Recharts | 2.15 | Interactive data visualizations |
| **Animations** | Framer Motion | 12.4 | Declarative animations |
| **Forms** | React Hook Form + Zod | 7.71 / 3.24 | Form handling and validation |
| **Backend Framework** | Spring Boot | 3.3.6 | Java microservices |
| **API Gateway** | Spring Cloud Gateway | 2023.0.4 | Request routing and CORS |
| **Language** | Java | 17 | Backend runtime |
| **Database** | PostgreSQL | 16 | Primary data store |
| **Cache** | Redis | 7 | Session and data caching |
| **Containerization** | Docker Compose | — | Multi-service orchestration |
| **Build Tool** | Maven | 3.9.6 | Java dependency management |
| **Password Hashing** | BCrypt | — | Password verification in User Service |
| **Authentication** | JWT | Configurable; 30-minute default | Token issuance and validation on selected User Service endpoints |
| **AI API** | Groq | `openai/gpt-oss-120b` | Student chat and assessment-description generation |

> **AI key note:** `GROQ_API_KEY` is used for backend AI calls. Existing browser-side AI helpers also use `VITE_GROQ_API_KEY`, which is exposed in the client bundle and is not a server-side secret. The Study Bot uses the server-side key. Do not commit actual key or password values.

---

## 🏗 Architecture

### System Overview

The application follows a **microservices architecture** with an API Gateway for LMS REST routing and CORS. The Gateway routes by path but does not globally validate JWTs. Selected User Service endpoints perform their own token/role checks. Existing browser-side AI helpers call Groq directly; the Student Study Bot routes through the Gateway to User Service.

```mermaid
flowchart LR
    subgraph Client["🖥️ Frontend (React 19)"]
        A[Admin Portal] --> GW
        B[Trainer Portal] --> GW
        C[Student Portal] --> GW
        SB[StudentChatbot] --> GW
        BAI[Existing Browser AI Helpers]
    end

    subgraph Gateway["🔀 API Gateway :8080"]
        GW[Spring Cloud Gateway]
    end

    subgraph Services["⚙️ Microservices"]
        US[User Service :8081]
        CS[Course Service :8084]
        BS[Batch Service :8085]
        AS[Assessment Service :8086]
        ES[Event Service :8087]
    end

    subgraph Data["💾 Data Layer"]
        PG[(PostgreSQL 16)]
        RD[(Redis 7)]
    end

    subgraph ExternalAI["☁️ External AI"]
        GR[Groq API<br/>openai/gpt-oss-120b]
    end

    GW --> US & CS & BS & AS & ES
    US & CS & BS & AS & ES --> PG
    CS & AS --> RD
    US --> GR
    AS --> GR
    BAI -. VITE_GROQ_API_KEY .-> GR
```

### Request Flow

```mermaid
sequenceDiagram
    participant C as React Client
    participant G as API Gateway
    participant S as Microservice
    participant D as PostgreSQL

    C->>G: GET /api/v1/events
    G->>G: Match configured path route and filters
    G->>S: Forward to event-service:8087
    S->>D: JPA query
    D-->>S: ResultSet
    S-->>G: JSON response
    G-->>C: 200 OK + JSON
```

### Student Study Bot Request Flow

```mermaid
sequenceDiagram
    participant UI as StudentChatbot
    participant G as API Gateway
    participant U as User Service ChatController
    participant AI as Groq API
    UI->>G: POST /api/v1/chat + Bearer JWT
    G->>U: Route /api/v1/chat (forward header)
    U->>U: Validate JWT, STUDENT role, and request bounds
    U->>AI: Send conversation + fixed system prompt
    AI-->>U: General study response
    U-->>UI: Reply
```

The Gateway performs path routing/CORS only; it is not a global JWT filter. `fetchApi` sends `Authorization: Bearer <JWT>` when `lms_token` is present and retains the existing `X-Tenant-Id` and `X-User-Id` headers; this does not secure APIs that do not validate the token. The chatbot does not fetch course lessons or student profile records. User-submitted conversation messages are sent to Groq.

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Java JDK | 17+ | [adoptium.net](https://adoptium.net/) |
| Docker | 24+ | [docker.com](https://www.docker.com/) |
| Docker Compose | 2.20+ | Included with Docker Desktop |
| Git | 2.40+ | [git-scm.com](https://git-scm.com/) |

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/mritunjai-prog/Xebia-Enterprise-LMS.git
cd Xebia-Enterprise-LMS
```

**2. Start the backend services (Docker)**
```bash
cd backend
docker compose up --build -d
```

This starts 8 containers: API Gateway, User Service, Course Service, Batch Service, Assessment Service, Event Service, PostgreSQL, and Redis. For local authentication/chat, configure the environment variables listed below; never commit secret values.

**3. Install frontend dependencies**
```bash
cd ..
npm install
```

**4. Start the frontend dev server**
```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### Verifying the Setup

1. **Frontend**: Open `http://localhost:3000` — you should see the login page
2. **Backend Gateway**: Visit `http://localhost:8080/api/v1/users` — expect a JSON user list; contents depend on the database and bootstrap configuration.
3. **Docker Status**: Run `docker ps` — all 8 containers should show `Up` status

---

## 📡 API Documentation

### User Service, Authentication, and Chat (`/api/v1/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users (optional `?role=` filter) |
| POST | `/api/v1/users` | Create a single user |
| GET | `/api/v1/users/{id}` | Read a user profile |
| PUT | `/api/v1/users/{id}` | Update a user profile |
| POST | `/api/v1/users/bulk` | Bulk create users (JSON array, any size) |
| POST | `/api/v1/auth/login` | Verify password with BCrypt and return a short-lived JWT |
| POST | `/api/v1/auth/change-password` | Change password for the authenticated user |
| POST | `/api/v1/auth/admin/users/{userId}/temporary-password` | Admin-only temporary-password provisioning |
| POST | `/api/v1/chat` | Student-only Groq Study Bot; validates JWT and STUDENT role |
| GET / POST | `/api/v1/feedback` | Read or submit student feedback |
| GET | `/api/v1/notifications` | Read persisted notifications |
| POST | `/api/v1/notifications/sync` | Synchronize notifications with the backend |

### Course Service (`/api/courses`, `/api/categories`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| POST | `/api/courses` | Create a course |
| PUT | `/api/courses/{id}` | Update a course |
| DELETE | `/api/courses/{id}` | Delete a course |
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category |
| GET | `/api/enrollments` | List enrollments |
| POST | `/api/enrollments` | Enroll in a course |
| GET | `/api/progress` | Get progress data |

### Batch Service (`/api/v1/batches`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/batches` | List all batches |
| POST | `/api/v1/batches` | Create a batch |
| GET | `/api/v1/batches/{id}` | Get batch details |
| PUT | `/api/v1/batches/{id}` | Update a batch |
| DELETE | `/api/v1/batches/{id}` | Delete a batch |
| POST | `/api/v1/batches/{id}/students` | Enroll student in batch |

### Trainer Allocation Service (`/api/v1/allocations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/allocations` | List all allocations |
| POST | `/api/v1/allocations` | Create allocation |
| DELETE | `/api/v1/allocations/{id}` | Delete allocation |
| GET | `/api/v1/allocations/dashboard` | Allocation dashboard KPIs |
| GET | `/api/v1/allocations/analytics` | Allocation analytics |

### Assessment Service (`/api/v1/assessments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/assessments` | List all assessments |
| GET | `/api/v1/assessments/student` | Student-safe list without answer keys/explanations |
| POST | `/api/v1/assessments` | Create assessment |
| PUT | `/api/v1/assessments/{id}` | Update assessment |
| DELETE | `/api/v1/assessments/{id}` | Delete assessment |
| GET | `/api/v1/assessments/dashboard` | Admin dashboard data |
| GET | `/api/v1/assessments/analytics` | Admin analytics data |
| POST | `/api/v1/assessments/ai/generate-description` | Groq-assisted assessment-description generation |
| GET / POST / DELETE | `/api/v1/assessments/drafts/{studentId}/{assessmentId}` | Retrieve, save, or delete a draft |
| POST | `/api/v1/submissions` | Create a submission record |
| PUT / DELETE | `/api/v1/submissions/{id}` | Update or delete a submission record |
| GET | `/api/v1/submissions` | List submissions |

### Event Service (`/api/v1/events`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events` | List all events |
| POST | `/api/v1/events` | Create event |
| GET | `/api/v1/events/{id}` | Get event details |
| PUT | `/api/v1/events/{id}` | Update event |
| DELETE | `/api/v1/events/{id}` | Soft-delete event |
| POST | `/api/v1/events/{id}/register` | Register for event |
| DELETE | `/api/v1/events/{id}/register` | Cancel registration |
| GET | `/api/v1/events/{id}/registration-status` | Check registration |
| GET | `/api/v1/events/{id}/registrations` | List event registrants |
| GET | `/api/v1/events/registrations/my` | My registrations |

---

## 🗄 Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string name
        string email
        string role
        string department
        string avatar
        float averageScore
        int assessmentsCompleted
        string passwordHash "BCrypt hash; never plaintext"
        boolean mustChangePassword
    }

    COURSES {
        uuid id PK
        string title
        string description
        string categoryId FK
        string imageUrl
        boolean active
    }

    CATEGORIES {
        uuid id PK
        string name
        string slug
        string icon
        string description
        string color
        boolean active
    }

    BATCHES {
        uuid id PK
        string name
        string course
        string university
        string academicSession
        string status
        string createdBy
        string createdByName
    }

    ASSESSMENTS {
        uuid id PK
        string title
        text description
        text instructions
        string type
        string difficulty
        int marks
        int duration
        string status
        string[] batches
    }

    QUESTIONS {
        uuid id PK
        uuid assessmentId FK
        text question
        text correctAnswer
        text explanation
    }

    QUESTION_OPTIONS {
        uuid questionId FK
        text options
    }

    SUBMISSIONS {
        uuid id PK
        uuid assessmentId
        uuid studentId
        uuid batchId
        int score
        int totalMarks
        string status
    }

    EVENTS {
        uuid id PK
        uuid tenantId
        string title
        string description
        timestamp startDateTime
        timestamp endDateTime
        timestamp registrationDeadline
        string location
        boolean isOnline
        string status
        int maxCapacity
        boolean isActive
    }

    EVENT_REGISTRATIONS {
        uuid id PK
        uuid eventId FK
        string studentId
        string studentName
        string studentEmail
        string status
    }

    TRAINER_ALLOCATIONS {
        uuid id PK
        string trainerId
        string batchId
        string courseId
        string status
        string academicSession
    }

    COURSES ||--o{ COURSE_MODULE : contains
    COURSE_MODULE ||--o{ SUB_MODULE : contains
    SUB_MODULE ||--o{ CONTENT_ITEM : contains
    CATEGORIES ||--o{ COURSES : belongs_to
    COURSES ||--o{ ENROLLMENTS : has
    USERS ||--o{ ENROLLMENTS : enrolled_in
    ASSESSMENTS ||--o{ QUESTIONS : contains
    ASSESSMENTS ||--o{ SUBMISSIONS : has
    USERS ||--o{ SUBMISSIONS : submitted
    EVENTS ||--o{ EVENT_REGISTRATIONS : has
```

`passwordHash` is a BCrypt hash, never plaintext; both `passwordHash` and `mustChangePassword` are excluded from public User JSON. Assessment startup code converts selected description, instruction, question, answer, explanation, and option columns to `TEXT`; the live database state must be verified separately. The Course Service also includes a migration to widen the category icon column to `TEXT`.

---

## 📁 Folder Structure

```
Xebia-Enterprise-LMS/
├── src/                              # React frontend source
│   ├── routes/                       # TanStack Router file-based routes
│   │   ├── admin/                    # Admin portal routes (28 files)
│   │   │   ├── analytics/            # 12+ analytics pages
│   │   │   ├── batches/              # Batch management routes
│   │   │   ├── assessments/          # Assessment management routes
│   │   │   ├── courses/              # Course management routes
│   │   │   ├── categories/           # Category management routes
│   │   │   ├── curriculum/           # Curriculum builder routes
│   │   │   └── events/               # Event management routes
│   │   ├── student/                  # Student portal routes
│   │   ├── change-password.jsx        # Shared password-change route
│   │   └── trainer/                  # Trainer portal routes (9 files)
│   ├── admin/                        # Admin portal pages & components
│   │   ├── pages/                    # Page components
│   │   │   ├── Batches/              # Batch overview, analytics, allocation
│   │   │   ├── Assessments/          # Assessment overview, analytics, detail
│   │   │   ├── Events/               # Event list, create/edit
│   │   │   ├── Categories/           # Category CRUD
│   │   │   ├── Courses/              # Course CRUD + content manager
│   │   │   ├── Dashboard/            # Admin dashboard
│   │   │   ├── Analytics/            # Analytics hub
│   │   │   └── Curriculum/           # Curriculum builder
│   │   ├── components/               # Admin-specific components
│   │   ├── features/                 # Analytics feature components
│   │   ├── services/                 # Admin API service
│   │   └── store/                    # Zustand store
│   ├── components/                   # Shared components
│   │   ├── StudentChatbot.jsx         # Floating Student Study Bot
│   │   ├── ui/                       # 46 shadcn/ui components
│   │   ├── layout/                   # Unified sidebar, header
│   │   ├── assessment-admin/         # Assessment cards, report table
│   │   ├── assessment-builder/       # Question builder panels
│   │   ├── analytics/                # 16 analytics sub-components
│   │   └── lms-sections.js           # LMS section definitions
│   ├── pages/                        # Student/trainer portal pages
│   │   └── Events/                   # Student & trainer event pages
│   ├── context/                      # React Context (LMSContext)
│   ├── hooks/                        # Custom hooks (useAnalyticsData)
│   ├── services/                     # Unified API service (api.js)
│   ├── utils/                        # Utility functions
│   └── assets/                       # Images, logos
│
├── backend/                          # Spring Boot microservices
│   ├── docker-compose.yml            # Orchestrates all 8 containers
│   ├── pom.xml                       # Parent Maven POM
│   ├── common-lib/                   # Shared library (BaseEntity, TenantScopedEntity, security)
│   ├── api-gateway/                  # Spring Cloud Gateway (:8080)
│   ├── user-service/                 # Users, auth, chat (:8081)
│   │   ├── controller/AuthController.java
│   │   ├── controller/ChatController.java
│   │   ├── service/AuthService.java
│   │   └── security/                  # BCrypt and JWT utilities
│   ├── course-service/               # Courses, categories, enrollments (:8084)
│   ├── batch-service/                # Batches, trainer allocations (:8085)
│   ├── assessment-service/           # Assessments, submissions, AI (:8086)
│   └── event-service/                # Events, registrations (:8087)
│
├── .mimocode/                        # AI planning documents
│   └── plans/                        # Module implementation plans
├── docs/                             # Documentation
└── package.json                      # Frontend dependencies
```

---

## 🚢 Deployment

### Docker (Recommended for Backend)

```bash
cd backend
docker compose up --build -d
```

### Frontend Build

```bash
npm run build        # Production build
npm run preview      # Preview production build locally
```

### Render.com Deployment

All backend services are deployed on Render using `render.yaml`:

```bash
# Render auto-deploys from render.yaml on push to connected branch
# Services: API Gateway, User, Course, Batch, Assessment, Event, PostgreSQL
```

- Frontend is deployed on Vercel
- Backend services are deployed on Render (Docker-based)
- PostgreSQL is managed by Render

**Chatbot deployment note:** the checked `render.yaml` does not list `GROQ_API_KEY` for User Service. Configure the key in the hosted service environment and verify the deployed build before claiming the hosted chatbot is operational.

### Environment Variables

<details>
<summary><strong>Backend Environment Variables</strong></summary>

| Variable | Service | Description | Default |
|----------|---------|-------------|---------|
| `SERVER_PORT` | All | Service port | Varies per service |
| `DB_HOST` | All | PostgreSQL host | `localhost` |
| `DB_NAME` | All | Database name | `postgres` |
| `DB_USERNAME` | All | Database user | `postgres` |
| `DB_PASSWORD` | All | Database password | — |
| `REDIS_HOST` | Gateway, Course, Assessment | Redis host | `localhost` |
| `JWT_SECRET` | Backend config; active token operations in User Service | Strong JWT signing/validation secret (at least 32 random bytes); do not expose the value | — |
| `JWT_ACCESS_TOKEN_MINUTES` | User Service | JWT lifetime (default 30 minutes) | `30` |
| `BOOTSTRAP_ADMIN_EMAIL` | User Service | Admin bootstrap email | — |
| `BOOTSTRAP_ADMIN_NAME` | User Service | Admin bootstrap display name | `Admin User` |
| `BOOTSTRAP_ADMIN_INITIAL_PASSWORD` | User Service | Initial bootstrap password; configure together with the bootstrap email; never publish the value | — |
| `GROQ_API_KEY` | User Service, Assessment Service | Server-side Groq API calls | — |
| `SERVICES_COURSE` | Gateway | Course service URL | `http://course-service:8084` |
| `SERVICES_USER` | Gateway | User service URL | `http://user-service:8081` |
| `SERVICES_BATCH` | Gateway | Batch service URL | `http://batch-service:8085` |
| `SERVICES_ASSESSMENT` | Gateway | Assessment service URL | `http://assessment-service:8086` |
| `SERVICES_EVENT` | Gateway | Event service URL | `http://event-service:8087` |

</details>

<details>
<summary><strong>Frontend Environment Variables</strong></summary>

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | `your-preset` |
| `VITE_GROQ_API_KEY` | Existing browser-side AI helpers; exposed in the client bundle, not a server-side secret | — |

</details>

---

## 🔥 Load Testing & Performance

The documented CRUD load test covered **20 endpoints across five services**, using 50 concurrent requests per phase with a Node.js `Promise.all()` harness. It reports 1,000 total requests and a 100% pass result; it was not a load test of every API endpoint.

### Infrastructure Configuration

| Component | Setting | Value |
|---|---|---|
| API Gateway | `max-connections` | `500` |
| Each Microservice | `hikari.maximum-pool-size` | `10` |
| Total DB Connections | 5 services × 10 | `50` (Render free-tier cap) |

### CRUD Load Test Results

| Service | POST (50) | GET (50) | PUT (50) | DELETE (50) | Status |
|---|---|---|---|---|---|
| **User Service** | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | 🟢 PASS |
| **Batch Service** | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | 🟢 PASS |
| **Assessment Service** | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | 🟢 PASS |
| **Course Service** | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | 🟢 PASS |
| **Event Service** | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | ✅ 50/50 | 🟢 PASS |

> **Total: 1,000 records tested** — 50 concurrent × 4 CRUD phases × 5 services. Zero failures after infrastructure tuning.
> **Coverage note:** the reported CRUD test does not include login, password-change, JWT-validation, or chatbot endpoints. No performance result for those endpoints is claimed here.

### Key Business Rule Validated

> Event Service enforces `registrationDeadline < startDateTime`. Sending an invalid payload returns `HTTP 400 Bad Request` with a clear error message — proving backend validation works correctly under load.

📄 **[View Full API Testing Report (Web View)](https://htmlpreview.github.io/?https://github.com/mritunjai-prog/Xebia-Enterprise-LMS/blob/main/Xebia_LMS_API_Documentation.html)** — Open in browser for the complete load test documentation with sample payloads, error analysis, and CRUD matrices.

---

## 📋 Roadmap

### Phase 1 — Core Platform ✅
- [x] Admin portal with dashboard, categories, courses, curriculum
- [x] Student portal with course browsing, assessment taking, results
- [x] Trainer portal with assessment builder, evaluation, leaderboard
- [x] Microservices backend with API Gateway routing

### Phase 2 — Batch & Allocation Management ✅
- [x] Batch Management module (overview, analytics, allocation matrix)
- [x] Trainer Allocation Wizard (4-step flow)
- [x] Trainer Workload monitoring
- [x] Batch entity tracking (createdBy, createdByName)

### Phase 3 — Assessment Enhancement ✅
- [x] Admin Assessment Management (dashboard, analytics, student reports)
- [x] Assessment card styling matching category pattern
- [x] Compact KPI card layout (2x3 grid)
- [x] Analytics chart optimization (fit on one screen)

### Phase 4 — Event Management ✅
- [x] Event CRUD with DateTimePicker, image upload
- [x] Student event registration and cancellation
- [x] Trainer event viewing
- [x] Draft/Publish event workflow

### Phase 5 — Infrastructure ✅
- [x] Docker Compose orchestration (8 services)
- [x] Bulk User creation API
- [x] Sidebar navigation fixes (dedup, section-based filtering)
- [x] CORS consolidation (single authority at gateway)

### Phase 6 — Infrastructure ✅
- [x] Render.com deployment (6 microservices + PostgreSQL)
- [x] Docker Compose orchestration (8 services)

### Phase 7 — Load Testing & Documentation ✅
- [x] 50-concurrent CRUD load test across all 5 services (1,000 total requests)
- [x] HikariCP connection pool tuning (`maximum-pool-size: 10` per service)
- [x] API Gateway concurrency raised to 500 connections
- [x] Comprehensive HTML API Testing Report (`Xebia_LMS_API_Documentation.html`)
- [x] Production databases cleaned post-testing (clean state)

### Authentication and AI Study Assistant
- [x] BCrypt password verification and short-lived JWT sign-in flows in User Service.
- [x] Selected User Service endpoints validate JWTs; ChatController also checks the STUDENT role.
- [x] Groq-backed Student Study Bot for general programming help, practice prompts, study tips, and LMS navigation.
- [x] Groq-assisted assessment-description generation.
- [ ] Extend JWT validation and role checks across protected domain APIs.
- [ ] Add course-grounded chatbot retrieval/citations (RAG).

---

## 🤝 Contributing

### Branch Naming
- `feature/<module-name>` — New features
- `fix/<issue-description>` — Bug fixes
- `refactor/<component>` — Code refactoring

### Commit Messages
```
feat: Add Event Management module with admin CRUD
fix: Sidebar duplication on dropdown toggle
refactor: Replace MetricCard with KpiCard for consistent styling
```

### Pull Request Process
1. Fork the repository
2. Create a feature branch from `lms-integrate`
3. Make your changes and test locally
4. Ensure `npm run build` passes (frontend)
5. Ensure Docker services build successfully (backend)
6. Submit a PR with a clear description

### Coding Standards
- **Frontend**: ESLint + Prettier (pre-configured), Tailwind CSS for styling
- **Backend**: Spring Boot conventions, `ddl-auto: update` for schema management
- **Components**: Reuse existing shadcn/ui components, match the design system
- **Color palette**: `#6C1D5F` (primary), `#84117C` (secondary), `#01AC9F` (teal), `#FF6200` (orange)

---

## 👥 Contributors

| Name | Role | GitHub |
|------|------|--------|
| Mritunjai Singh | Full-Stack Developer / Project Lead | [@mritunjai-prog](https://github.com/mritunjai-prog) |
| Manish Kumawat | Full-Stack Developer | [@ManishKumawat450](https://github.com/ManishKumawat450) |
| Vijay Menaria | Full-Stack Developer | [@vijaymenaria04](https://github.com/vijaymenaria04) |
| Vinit Menaria | Full-Stack Developer | [@Vinit1120](https://github.com/Vinit1120) |
| Abhijeet Tiwari | Full-Stack Developer | [@Abhijeet0Tiwari](https://github.com/Abhijeet0Tiwari) |

---

## 📄 License

This project is private and proprietary. License to be decided.

---

## 🙏 Acknowledgements

- **[Lovable](https://lovable.dev)** — AI-powered full-stack development platform
- **[shadcn/ui](https://ui.shadcn.com)** — Beautiful, accessible component library
- **[TanStack](https://tanstack.com)** — Type-safe routing and data fetching
- **[Recharts](https://recharts.org)** — Composable charting library
- **[Framer Motion](https://www.framer.com/motion)** — Production-ready animation library
- **[Spring Boot](https://spring.io/projects/spring-boot)** — Enterprise Java framework
- **[Spring Cloud Gateway](https://spring.io/projects/spring-cloud-gateway)** — API gateway for microservices
- **[Xebia](https://xebia.com)** — Enterprise technology consultancy
