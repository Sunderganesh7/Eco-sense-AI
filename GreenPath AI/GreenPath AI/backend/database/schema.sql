-- ============================================================================
-- GreenPath AI — Enterprise Authentication & Security + AI Conservation Module
-- Complete MySQL Database Schema (10 Normalized MVC Tables)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `greenpath_ai`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `greenpath_ai`;

-- ============================================================================
-- 1. Table: roles (Stores RBAC user roles and default permission descriptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Admin, Researcher, Officer',
    `description` VARCHAR(255) NOT NULL COMMENT 'Summary of access scope',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. Table: users (Core user authentication credentials)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt encrypted password',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Deactivated',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_email` (`email`),
    INDEX `idx_user_status` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. Table: user_roles (Many-to-Many junction table for RBAC assignment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `user_roles` (
    `user_id` INT UNSIGNED NOT NULL,
    `role_id` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_userroles_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_userroles_role` FOREIGN KEY (`role_id`)
        REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_ur_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. Table: user_profiles (1-to-1 extension of users for user details)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `user_profiles` (
    `user_id` INT UNSIGNED NOT NULL PRIMARY KEY,
    `full_name` VARCHAR(150) NOT NULL,
    `phone_number` VARCHAR(25) NULL,
    `designation` VARCHAR(100) NULL,
    `organization` VARCHAR(150) NULL,
    `profile_photo_url` VARCHAR(255) NULL,
    `account_created_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `fk_userprofile_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. Table: sessions (JWT active & refresh token registry for secure sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `jwt_id` VARCHAR(100) NOT NULL UNIQUE COMMENT 'JWT JTI (unique identifier)',
    `refresh_token_hash` VARCHAR(255) NULL,
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_jwt_id` (`jwt_id`),
    INDEX `idx_session_user` (`user_id`),
    INDEX `idx_session_expires` (`expires_at`, `is_revoked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. Table: password_reset_otps (Stores 6-digit email OTPs with 5-min TTL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `password_reset_otps` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `otp_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt hash of OTP for security',
    `expires_at` TIMESTAMP NOT NULL COMMENT 'Timestamp when OTP expires',
    `is_used` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Already used for reset',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_otp_user_status` (`user_id`, `is_used`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. Table: activity_logs (Detailed audit log of critical system activities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL COMMENT 'Null if anonymous or system activity',
    `activity` VARCHAR(100) NOT NULL COMMENT 'e.g. User Logged In, AI Detection Started',
    `details` TEXT NULL COMMENT 'JSON or descriptive event payload',
    `ip_address` VARCHAR(45) NOT NULL COMMENT 'Supports IPv4 and IPv6',
    `browser` VARCHAR(100) NULL,
    `device` VARCHAR(100) NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_activity_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_activity_user` (`user_id`),
    INDEX `idx_activity_type` (`activity`),
    INDEX `idx_activity_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. Table: login_history (Detailed authentication telemetry & sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `login_history` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `logout_time` TIMESTAMP NULL DEFAULT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `browser` VARCHAR(100) NULL,
    `operating_system` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL DEFAULT 'India',
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' COMMENT 'SUCCESS or FAILED',
    CONSTRAINT `fk_loginhistory_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_login_user` (`user_id`),
    INDEX `idx_login_time` (`login_time`),
    INDEX `idx_login_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. Table: analyses (Environmental AI image analysis history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `analyses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `filename` VARCHAR(255) NOT NULL,
    `tree_count` INT NOT NULL DEFAULT 0,
    `green_percent` DOUBLE NOT NULL DEFAULT 0.0,
    `co2_absorption` DOUBLE NOT NULL DEFAULT 0.0,
    `eco_index` INT NOT NULL DEFAULT 0,
    `aqi_result` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_analysis_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_analysis_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. Table: reports (Generated PDF reports archive)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `reports` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `analysis_id` BIGINT UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_report_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_report_analysis` FOREIGN KEY (`analysis_id`)
        REFERENCES `analyses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_report_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA INSERTION (Bootstraps default RBAC roles and default users)
-- ============================================================================

-- Insert standard roles if they do not exist
INSERT IGNORE INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'Admin', 'Full Access: Manage users, delete users, view analytics, and audit logs.'),
(2, 'Researcher', 'Research Scope: Upload images, run AI detection, generate reports, view history.'),
(3, 'Officer', 'Review Scope: View reports, view dashboard, download reports.');

-- Insert default accounts (Password for all 3 is: Admin@GreenPath2024, encrypted with scrypt)
INSERT IGNORE INTO `users` (`id`, `email`, `password_hash`, `is_active`) VALUES
(101, 'admin@greenpath.ai', 'scrypt:32768:8:1$vuePVLXnGy6Rq6Le$4ae0becd02aac2b41e77be0c53b40c97efa09d328257db58475e49a58b7b8d3d1b04f0b8e57c561ff67ff0a02a232fdded505eda7dc5ba9353f4ea87a9b7b038', 1),
(102, 'researcher@greenpath.ai', 'scrypt:32768:8:1$vuePVLXnGy6Rq6Le$4ae0becd02aac2b41e77be0c53b40c97efa09d328257db58475e49a58b7b8d3d1b04f0b8e57c561ff67ff0a02a232fdded505eda7dc5ba9353f4ea87a9b7b038', 1),
(103, 'officer@greenpath.ai', 'scrypt:32768:8:1$vuePVLXnGy6Rq6Le$4ae0becd02aac2b41e77be0c53b40c97efa09d328257db58475e49a58b7b8d3d1b04f0b8e57c561ff67ff0a02a232fdded505eda7dc5ba9353f4ea87a9b7b038', 1);

-- Map sample users to their RBAC role
INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`) VALUES
(101, 1),
(102, 2),
(103, 3);

-- Insert sample profiles for the default users
INSERT IGNORE INTO `user_profiles` (`user_id`, `full_name`, `phone_number`, `designation`, `organization`, `profile_photo_url`) VALUES
(101, 'Dr. Sunder Ganesh (Admin)', '+91 9876543210', 'Chief AI Security Officer', 'GreenPath AI Headquarters', NULL),
(102, 'Priya Sharma (Researcher)', '+91 9876543211', 'Senior Environmental Data Scientist', 'GreenPath AI Research Dept', NULL),
(103, 'Vikram Mehta (Officer)', '+91 9876543212', 'Forestry & Conservation Officer', 'Ministry of Environment & Forest', NULL);
