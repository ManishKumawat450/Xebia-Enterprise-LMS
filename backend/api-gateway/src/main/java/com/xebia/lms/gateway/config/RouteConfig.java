package com.xebia.lms.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class RouteConfig {
    private final Environment environment;

    public RouteConfig(Environment environment) {
        this.environment = environment;
    }

    @Bean
    RouteLocator lmsRoutes(RouteLocatorBuilder routes) {
        return routes.routes()
                .route("course-service-courses", route -> route.path("/api/courses", "/api/courses/**").filters(filter -> filter.stripPrefix(1)).uri(serviceUrl("course", "http://course-service:8084")))
                .route("course-service-categories", route -> route.path("/api/categories", "/api/categories/**").filters(filter -> filter.stripPrefix(1)).uri(serviceUrl("course", "http://course-service:8084")))
                .route("course-service-enrollments", route -> route.path("/api/enrollments", "/api/enrollments/**").filters(filter -> filter.stripPrefix(1)).uri(serviceUrl("course", "http://course-service:8084")))
                .route("course-service-progress", route -> route.path("/api/progress", "/api/progress/**").filters(filter -> filter.stripPrefix(1)).uri(serviceUrl("course", "http://course-service:8084")))
                .route("user-service", route -> route.path("/api/v1/users", "/api/v1/users/**").filters(filter -> filter.stripPrefix(0)).uri(serviceUrl("user", "http://user-service:8081")))
                .route("user-service-feedback", route -> route.path("/api/v1/feedback", "/api/v1/feedback/**").filters(filter -> filter.stripPrefix(0)).uri(serviceUrl("user", "http://user-service:8081")))
                .route("user-service-notifications", route -> route.path("/api/v1/notifications", "/api/v1/notifications/**").filters(filter -> filter.stripPrefix(0)).uri(serviceUrl("user", "http://user-service:8081")))
                .route("batch-service", route -> route.path("/api/v1/batches", "/api/v1/batches/**").filters(filter -> filter.stripPrefix(0)).uri(serviceUrl("batch", "http://batch-service:8085")))
                .route("batch-service-allocations", route -> route.path("/api/v1/allocations", "/api/v1/allocations/**").filters(filter -> filter.stripPrefix(0)).uri(serviceUrl("batch", "http://batch-service:8085")))
                .route("assessment-service-assessments", route -> route.path("/api/v1/assessments", "/api/v1/assessments/**").filters(filter -> filter.stripPrefix(0)).uri(serviceUrl("assessment", "http://assessment-service:8086")))
                .route("assessment-service-admin", route -> route
    .path("/api/v1/assessments/dashboard", "/api/v1/assessments/analytics",
          "/api/v1/assessments/trainer-performance", "/api/v1/assessments/batch-performance")
    .filters(filter -> filter.stripPrefix(0))
    .uri(serviceUrl("assessment", "http://assessment-service:8086")))
.route("assessment-service-submissions", route -> route.path("/api/v1/submissions", "/api/v1/submissions/**").filters(filter -> filter.stripPrefix(0)).uri(serviceUrl("assessment", "http://assessment-service:8086")))
                .route("event-service-events", route -> route.path("/api/v1/events", "/api/v1/events/**").filters(filter -> filter.stripPrefix(0)).uri(serviceUrl("event", "http://event-service:8087")))
                .build();
    }

    private String serviceUrl(String key, String fallback) {
        String propertyValue = environment.getProperty("services." + key);
        if (propertyValue != null && !propertyValue.isBlank()) {
            return propertyValue;
        }
        String envKey = "SERVICES_" + key.toUpperCase().replace("-", "_");
        String envValue = System.getenv(envKey);
        return envValue == null || envValue.isBlank() ? fallback : envValue;
    }
}

