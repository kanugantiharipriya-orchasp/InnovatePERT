package com.innovatepert.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import com.innovatepert.entity.User;
import com.innovatepert.enums.Role;
import com.innovatepert.enums.Status;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    List<User> findByRole(Role role);

    List<User> findByRoleAndStatus(Role role, Status status);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND (u.createdByAdmin = :createdByAdmin OR u.createdByAdmin IS NULL)")
    long countByRoleAndCreatedByAdmin(@Param("role") Role role, @Param("createdByAdmin") User createdByAdmin);

    List<User> findByRoleAndCreatedByAdmin(Role role, User createdByAdmin);

    List<User> findByRoleAndCreatedByAdminAndStatus(
            Role role,
            User createdByAdmin,
            Status status);

    List<User> findByRoleAndFullNameContainingIgnoreCase(
            Role role,
            String keyword);

    List<User> findByRoleAndCreatedByAdminAndFullNameContainingIgnoreCase(
            Role role,
            User createdByAdmin,
            String keyword);

}