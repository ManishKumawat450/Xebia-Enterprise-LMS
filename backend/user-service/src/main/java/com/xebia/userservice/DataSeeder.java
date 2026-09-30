package com.xebia.userservice;

import com.xebia.userservice.model.User;
import com.xebia.userservice.repository.UserRepository;
import com.xebia.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapAdminEmail;
    private final String bootstrapAdminName;
    private final String bootstrapAdminPassword;

    public DataSeeder(
            UserService userService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${lms.bootstrap-admin.email:}") String bootstrapAdminEmail,
            @Value("${lms.bootstrap-admin.name:Admin User}") String bootstrapAdminName,
            @Value("${lms.bootstrap-admin.initial-password:}") String bootstrapAdminPassword) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapAdminEmail = bootstrapAdminEmail == null ? "" : bootstrapAdminEmail.trim().toLowerCase(Locale.ROOT);
        this.bootstrapAdminName = bootstrapAdminName;
        this.bootstrapAdminPassword = bootstrapAdminPassword;
    }

    @Override
    public void run(String... args) {
        List<User> existing = userService.getAllUsers();
        if (existing.isEmpty()) {
            System.out.println("Seeding demo users...");
            List<User> demoUsers = List.of(
                createUser("Mritunjai", "mritunjai@xebia.com", "teacher", "Engineering", "https://i.pravatar.cc/150?u=mritunjai"),
                createUser("Manish", "manish@xebia.com", "teacher", "Engineering", "https://i.pravatar.cc/150?u=manish"),
                createUser("Vijay", "vijay@xebia.com", "student", "Computer Science", "https://i.pravatar.cc/150?u=vijay"),
                createUser("Abhijeet", "abhijeet@xebia.com", "student", "Computer Science", "https://i.pravatar.cc/150?u=abhijeet"),
                createUser("Vinit", "vinit@xebia.com", "student", "Computer Science", "https://i.pravatar.cc/150?u=vinit")
            );
            UserService.BulkResult result = userService.createUsersBulk(demoUsers);
            System.out.println("Seeded " + result.getSuccessCount() + " users, " + result.getFailCount() + " failed");
        } else {
            System.out.println("Users already exist (" + existing.size() + "). Skipping demo-user seed.");
        }
        bootstrapAdmin();
    }

    private void bootstrapAdmin() {
        if (bootstrapAdminEmail.isBlank() && (bootstrapAdminPassword == null || bootstrapAdminPassword.isBlank())) {
            return; // Opt-in only; no credentials are generated or logged.
        }
        int passwordBytes = bootstrapAdminPassword == null ? 0 : bootstrapAdminPassword.getBytes(StandardCharsets.UTF_8).length;
        if (bootstrapAdminEmail.isBlank() || bootstrapAdminPassword == null
                || bootstrapAdminPassword.length() < 12 || bootstrapAdminPassword.length() > 72 || passwordBytes > 72) {
            throw new IllegalStateException("Configure BOOTSTRAP_ADMIN_EMAIL and a 12-72 character BOOTSTRAP_ADMIN_INITIAL_PASSWORD together");
        }

        User existing = userRepository.findByEmailIgnoreCase(bootstrapAdminEmail).orElse(null);
        if (existing != null) {
            if (!"admin".equalsIgnoreCase(existing.getRole())) {
                throw new IllegalStateException("Bootstrap Admin email matches an existing non-Admin account; no account was changed");
            }
            if (existing.getPasswordHash() == null || existing.getPasswordHash().isBlank()) {
                existing.setPasswordHash(passwordEncoder.encode(bootstrapAdminPassword));
                existing.setMustChangePassword(true);
                userRepository.save(existing);
            }
            return; // Never reset or replace an already-provisioned Admin.
        }

        User admin = createUser(bootstrapAdminName, bootstrapAdminEmail, "admin", "Administration", null);
        admin.setPasswordHash(passwordEncoder.encode(bootstrapAdminPassword));
        admin.setMustChangePassword(true);
        userRepository.save(admin);
        System.out.println("Bootstrap Admin account ensured; a password change is required after first login.");
    }

    private User createUser(String name, String email, String role, String department, String avatar) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setDepartment(department);
        user.setAvatar(avatar);
        return user;
    }
}
