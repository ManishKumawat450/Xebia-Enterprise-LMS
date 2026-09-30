package com.xebia.userservice.repository;

import com.xebia.userservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    List<User> findByRole(String role);
    Optional<User> findByEmailIgnoreCase(String email);
}
