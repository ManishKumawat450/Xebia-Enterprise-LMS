import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Navigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import "@/admin/index.css";
import { LMSProvider } from "../context/LMSContext";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

function NotFoundComponent() {
  return _jsx("div", {
    className: "flex min-h-screen items-center justify-center bg-background px-4",
    children: _jsxs("div", {
      className: "max-w-md text-center",
      children: [
        _jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
        _jsx("h2", {
          className: "mt-4 text-xl font-semibold text-foreground",
          children: "Page not found",
        }),
        _jsx("p", {
          className: "mt-2 text-sm text-muted-foreground",
          children: "The page you're looking for doesn't exist or has been moved.",
        }),
        _jsx("div", {
          className: "mt-6",
          children: _jsx(Link, {
            to: "/",
            className:
              "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
            children: "Go home",
          }),
        }),
      ],
    }),
  });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return _jsx("div", {
    className: "flex min-h-screen items-center justify-center bg-background px-4",
    children: _jsxs("div", {
      className: "max-w-md text-center",
      children: [
        _jsx("h1", {
          className: "text-xl font-semibold tracking-tight text-foreground",
          children: "This page didn't load",
        }),
        _jsx("p", {
          className: "mt-2 text-sm text-muted-foreground",
          children: "Something went wrong on our end. You can try refreshing or head back home.",
        }),
        _jsx("div", {
          className:
            "mt-4 p-4 bg-red-100 text-red-800 rounded text-left overflow-auto max-h-40 text-xs",
          children: error?.message || String(error),
        }),
        _jsxs("div", {
          className: "mt-6 flex flex-wrap justify-center gap-2",
          children: [
            _jsx("button", {
              onClick: () => {
                router.invalidate();
                reset();
              },
              className:
                "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
              children: "Try again",
            }),
            _jsx("a", {
              href: "/",
              className:
                "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
              children: "Go home",
            }),
          ],
        }),
      ],
    }),
  });
}
export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Xebia Enterprise LMS — One Platform for Learning at Scale" },
      {
        name: "description",
        content:
          "Enterprise-grade Learning Management System for universities, organisations and enterprises. Identity, courses, assessments, video learning and reporting on one multi-tenant platform.",
      },
      { name: "author", content: "Xebia" },
      { property: "og:title", content: "Xebia Enterprise LMS" },
      {
        property: "og:description",
        content: "One platform for universities, organisations and enterprise learning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
function RootShell({ children }) {
  const themeScript = `
    (function() {
      try {
        var theme = localStorage.getItem('lms_theme');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          if (!theme) localStorage.setItem('lms_theme', 'light');
        }
      } catch (e) {}
    })();
  `;

  // Critical inline CSS to prevent sidebar FOUC (Flash of Unstyled Content).
  // These styles load instantly with the HTML before any external CSS.
  const criticalCss = `
    .sidebar { background: #FFFFFF !important; border-right: 1px solid #DEDEDE !important; }
    html.dark .sidebar { background: #4A1E47 !important; border-right: none !important; }
    .sidebar-student { background: #4A1E47 !important; border-right: none !important; }
    .nav-item { color: #4B5563; }
    html.dark .nav-item { color: rgba(255,255,255,0.7) !important; }
    html.dark .nav-item.active { background: #FFFFFF !important; color: #4A1E47 !important; }
    html.dark .nav-item:hover { background: rgba(255,255,255,0.1) !important; color: #FFFFFF !important; }
    .nav-item.active { background: var(--primary); color: #fff; }
    .nav-section { color: #9CA3AF; }
    html.dark .nav-section { color: rgba(255,255,255,0.4) !important; }
    .sidebar-brand .logo-text { color: #111827; }
    html.dark .sidebar-brand .logo-text { color: #fff !important; }
    .sidebar-brand .logo-sub { color: #6C1D5F; }
    html.dark .sidebar-brand .logo-sub { color: rgba(255,255,255,0.6) !important; }
    .user-name { color: #111827; }
    html.dark .user-name { color: #fff !important; }
    .user-role { color: #6B7280; }
    html.dark .user-role { color: rgba(255,255,255,0.5) !important; }
    .sidebar-student .nav-item { color: rgba(255,255,255,0.65); }
    .sidebar-student .nav-item.active { background: #FFFFFF !important; color: #4A1E47 !important; }
    .sidebar-student .nav-section { color: rgba(255,255,255,0.35); }
    .sidebar-student .logo-text { color: #fff !important; }
    .sidebar-student .logo-sub { color: rgba(255,255,255,0.45); }
    .sidebar-student .user-name { color: rgba(255,255,255,0.9) !important; }
    .sidebar-student .user-role { color: rgba(255,255,255,0.4); }
    
    /* Sleek scrollbar */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.2); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(150, 150, 150, 0.4); }
  `;

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LMSProvider>
        <Outlet />
        {/* Global sonner host — without this, toast.* calls on the
            student/trainer portals were created but never rendered. */}
        <Toaster position="top-right" richColors closeButton />
      </LMSProvider>
    </QueryClientProvider>
  );
}
