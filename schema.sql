-- ============================================================
-- Script de inicialización de la base de datos
-- Ejecutar en MySQL como usuario root o con permisos CREATE
-- ============================================================

CREATE DATABASE IF NOT EXISTS control_finanzas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE control_finanzas;

-- Tabla de ingresos
CREATE TABLE IF NOT EXISTS ingresos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de egresos
CREATE TABLE IF NOT EXISTS egresos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Verificación
SHOW TABLES;
