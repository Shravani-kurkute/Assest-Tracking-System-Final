CREATE DATABASE IF NOT EXISTS asset_tracking_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE asset_tracking_db;

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_departments_name (name),
  UNIQUE KEY uq_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  employee_code VARCHAR(50) NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  role ENUM('system_admin', 'dept_admin', 'employee', 'management') NOT NULL DEFAULT 'employee',
  department VARCHAR(100) NULL,
  department_id INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL,
  UNIQUE KEY uq_users_employee_id (employee_id),
  UNIQUE KEY uq_users_employee_code (employee_code),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_department_id (department_id),
  CONSTRAINT fk_users_department_id FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  status ENUM('Available', 'Assigned', 'Maintenance') NOT NULL DEFAULT 'Available',
  assigned_to INT NULL,
  purchase_date DATE NOT NULL,
  return_date DATE NULL,
  UNIQUE KEY uq_assets_asset_id (asset_id),
  KEY idx_assets_assigned_to (assigned_to),
  CONSTRAINT fk_assets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_date DATE NOT NULL,
  return_date DATE NULL,
  KEY idx_assignments_asset_id (asset_id),
  KEY idx_assignments_user_id (user_id),
  CONSTRAINT fk_assignments_asset_id FOREIGN KEY (asset_id) REFERENCES assets (id),
  CONSTRAINT fk_assignments_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  asset_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  request_date DATE NOT NULL,
  approval_date DATE NULL,
  KEY idx_asset_requests_user_id (user_id),
  KEY idx_asset_requests_asset_id (asset_id),
  CONSTRAINT fk_asset_requests_user_id FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_asset_requests_asset_id FOREIGN KEY (asset_id) REFERENCES assets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  user_id INT NOT NULL,
  issue_description VARCHAR(500) NOT NULL,
  status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_maintenance_asset_id (asset_id),
  KEY idx_maintenance_user_id (user_id),
  CONSTRAINT fk_maintenance_asset_id FOREIGN KEY (asset_id) REFERENCES assets (id),
  CONSTRAINT fk_maintenance_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_user_id (user_id),
  CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
