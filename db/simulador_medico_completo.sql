SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
-- ========================================================
-- CIMED: Base de Datos Completa (simulador_medico)
-- Incluye: Estructura, Usuarios, Casos, Signos, Rúbricas y Evaluaciones
-- Compatible con: XAMPP / MariaDB / MySQL 5.7+ / 8.0+
-- ========================================================

CREATE DATABASE IF NOT EXISTS `simulador_medico` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `simulador_medico`;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- Eliminar tablas previas si existen para una importacion limpia
DROP TABLE IF EXISTS `integrantes_evaluacion`;
DROP TABLE IF EXISTS `evaluaciones`;
DROP TABLE IF EXISTS `archivos`;
DROP TABLE IF EXISTS `videos`;
DROP TABLE IF EXISTS `incisos`;
DROP TABLE IF EXISTS `preguntas`;
DROP TABLE IF EXISTS `signos_pacientes`;
DROP TABLE IF EXISTS `pacientes`;
DROP TABLE IF EXISTS `casos`;
DROP TABLE IF EXISTS `carpetas`;
DROP TABLE IF EXISTS `usuarios`;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. Tabla: usuarios
-- --------------------------------------------------------
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `correo` varchar(255) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `reset_token` varchar(64) NOT NULL DEFAULT '',
  `es_admin` tinyint(1) NOT NULL DEFAULT 0,
  `clave_asignada` varchar(255) DEFAULT NULL,
  `superadmin` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuarios` (`id`, `correo`, `contraseña`, `reset_token`, `es_admin`, `clave_asignada`, `superadmin`) VALUES
(15, '0717502b93ff97a3ab6cab132e014fd61f2749eb9094cb04d37b28ab895bc7cf', '$2y$10$FkGBIUKaebmy4z2E9rkrCuIG/IlVp/UqFHM.uDkjTv5j4SZgvPkgu', '', 0, 'f5bce76b7c8f7798c2b809d80a1edb8bff9c7246171d4b004d17398facf7a80d', 0),
(16, '0c4765c50569dff8a4876191afacf8e30bfbe82f6a8158a62998a6baae883d9e', '$2y$10$85kiqvagDG16arFrlV5SguG2pw28iMpguvxbJhHuldac8JkiIVziK', '', 0, '15101cf8441eef7d0f63fa86011995584d425b02cbbc9eddb6a65544a1a10895', 0),
(17, '4704b83724653e21d363245e8e932d51585fdb4cc7e1e9e924c60b333c3a4e21', '$2y$10$G1cu.V9RfpUn8St0NigmkeDFYH0hStpyA8L2Is2fwVRxEkQ5vcdyq', '', 0, '8599832b6b801c8db5a867432890cc3da24755b3939699109b0bbcc453b04af5', 0),
(18, '8e4c13ce1212e0284a592f07991af0d64960d65cfb45b7e017fe96141f5b7dc7', '$2y$10$n7Zo.laPN3nGM5D5Hdu.WO6ZTPP7PkaLlb.9WHggaT8Ar27VCisja', '', 0, '81035bc92c674db6e010bcec910d38c80a61045d561df5fc21481c30ce8ecd4c', 0),
(99, '244b26917331a3e4e0de1aab4a790e509a005d41503e6a959786caf952193507', '$2y$10$DlBasUyKclXsXjv9MX1yPOVzqW1TaCmbjTbw2ReJjLt2ZwAjq9rRi', '', 1, 'admin123', 0),
(100, 'ff18ffb5e4c58923525122896509eb81ae84ee6ac9790709b2cc7fe8f0e8d22a', '$2y$10$DlBasUyKclXsXjv9MX1yPOVzqW1TaCmbjTbw2ReJjLt2ZwAjq9rRi', '', 1, 'admin123', 0);

-- --------------------------------------------------------
-- 2. Tabla: carpetas
-- --------------------------------------------------------
CREATE TABLE `carpetas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `id_usuario_creador` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_carpeta_usuario` (`id_usuario_creador`),
  CONSTRAINT `carpeta_usuario_fk` FOREIGN KEY (`id_usuario_creador`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `carpetas` (`id`, `nombre`, `descripcion`, `id_usuario_creador`, `fecha_creacion`) VALUES
(1, 'Respiratorios', '', 16, '2026-04-09 06:08:09'),
(2, 'Respiratorios', '', 15, '2026-04-09 15:19:06'),
(3, 'Muscular', '', 15, '2026-05-07 02:32:02'),
(4, 'Cardiovascular', '', 15, '2026-05-07 03:49:56'),
(5, 'Pecho', '', 15, '2026-05-14 07:08:16'),
(6, 'Asma', '', 99, '2026-11-03 00:17:01');

-- --------------------------------------------------------
-- 3. Tabla: casos
-- --------------------------------------------------------
CREATE TABLE `casos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `visibilidad` int(11) NOT NULL DEFAULT 0,
  `clave` varchar(255) NOT NULL DEFAULT '',
  `descripcion` text NOT NULL,
  `motivo_consulta` text NOT NULL,
  `id_usuario_creador` int(11) DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `id_carpeta` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_creador` (`id_usuario_creador`),
  KEY `fk_caso_carpeta` (`id_carpeta`),
  CONSTRAINT `caso_carpeta_fk` FOREIGN KEY (`id_carpeta`) REFERENCES `carpetas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `casos_usuario_fk` FOREIGN KEY (`id_usuario_creador`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `casos` (`id`, `nombre`, `visibilidad`, `clave`, `descripcion`, `motivo_consulta`, `id_usuario_creador`, `fecha_actualizacion`, `id_carpeta`) VALUES
(5, '02210769', 1, '', 'pierde la capacidad de respirar', 'Presenta problemas respiratorios', 16, '2026-04-09 06:24:12', 1),
(8, '2210760', 1, '', 'Dolor en la espaldo', 'Dolor en la espalda', 15, '2026-05-07 03:48:56', 3),
(9, '2210761', 1, '', 'El Paciente se queja de dolores fuertes y repentinos en el pecho', 'Dolores fuertes en el pecgo', 15, '2026-05-27 18:38:33', 4),
(12, 'Crisis asmática severa en adulto joven', 1, '', 'Paciente masculino de 21 años ingresa a urgencias con cuadro de dificultad respiratoria de inicio súbito. A la exploración física presenta sibilancias audibles, uso de músculos accesorios y taquipnea severa. Refiere antecedente de asma desde la infancia y falta de respuesta a su inhalador de rescate.', 'Dificultad para respirar (disnea) aguda y sensación de ahogo.', 99, '2026-11-03 01:17:19', 6);

-- --------------------------------------------------------
-- 4. Tabla: signos_pacientes
-- --------------------------------------------------------
CREATE TABLE `signos_pacientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `FR` int(11) DEFAULT NULL,
  `FC` int(11) DEFAULT NULL,
  `CO2` int(11) DEFAULT 38,
  `TA` varchar(50) DEFAULT NULL,
  `Temperatura` double DEFAULT NULL,
  `SAT` int(11) DEFAULT NULL,
  `id_paciente` int(11) DEFAULT NULL,
  `ritmo` varchar(50) DEFAULT 'sinusal',
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `signos_pacientes` (`id`, `FR`, `FC`, `CO2`, `TA`, `Temperatura`, `SAT`, `id_paciente`, `ritmo`) VALUES
(5, 18, 92, 38, '90/80', 36.5, 96, 5, 'sinusal'),
(8, 60, 90, 38, '90/80', 35, 90, 8, 'sinusal'),
(9, 20, 150, 36, '130/85', 35, 77, 9, 'taquicardia'),
(12, 49, 231, 38, '135/83', 38.8, 85, 12, 'sinusal');

-- --------------------------------------------------------
-- 5. Tabla: pacientes
-- --------------------------------------------------------
CREATE TABLE `pacientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `sexo` varchar(50) NOT NULL,
  `edad` int(11) NOT NULL,
  `peso` float NOT NULL,
  `altura` float NOT NULL,
  `enfermedades` text DEFAULT NULL,
  `id_signos_vitales` int(11) DEFAULT NULL,
  `id_caso` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_perfil_paciente_caso` (`id_caso`),
  KEY `id_signos_vitales` (`id_signos_vitales`),
  CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`id_caso`) REFERENCES `casos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pacientes_ibfk_2` FOREIGN KEY (`id_signos_vitales`) REFERENCES `signos_pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `pacientes` (`id`, `nombre`, `sexo`, `edad`, `peso`, `altura`, `enfermedades`, `id_signos_vitales`, `id_caso`) VALUES
(5, 'Jorge Ruiz', 'Hombre', 21, 68, 168, 'jsjsjsjs', 5, 5),
(8, 'Jorge Alberto', 'Hombre', 22, 67.7, 170, 'Sin Antecedentes importantes', 8, 8),
(9, 'Josue Antonio Ruiz', 'Hombre', 18, 68, 172, 'Sin antrecedentes Importantes', 9, 9),
(12, 'Willy Tarin Castellano', 'Hombre', 21, 71.4, 1.74, 'asma', 12, 12);

ALTER TABLE `signos_pacientes`
  ADD CONSTRAINT `signos_pacientes_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------
-- 6. Tabla: archivos
-- --------------------------------------------------------
CREATE TABLE `archivos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `ruta` varchar(255) NOT NULL,
  `id_caso` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_caso` (`id_caso`),
  CONSTRAINT `archivos_ibfk_1` FOREIGN KEY (`id_caso`) REFERENCES `casos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `archivos` (`id`, `nombre`, `ruta`, `id_caso`) VALUES
(5, 'Estudio1', './uploads/caso_5/reporte_firewall.docx.pdf', 5),
(8, '1', './uploads/caso_8/jrc118163_ai_watch._defining_artificial_intelligence_1.pdf', 8),
(9, 'Estudio 2', './uploads/caso_9/reporte_firewall.docx.pdf', 9),
(10, 'estudio 1', './uploads/caso_9/El-Modelo-Entidad-Relacion.pdf', 9);

-- --------------------------------------------------------
-- 7. Tabla: videos
-- --------------------------------------------------------
CREATE TABLE `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `ruta` varchar(255) NOT NULL,
  `id_caso` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_video_caso` (`id_caso`),
  CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`id_caso`) REFERENCES `casos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `videos` (`id`, `nombre`, `ruta`, `id_caso`) VALUES
(1, '1778125736_9333582c81104aed871da7e524e50bc5.mov', './uploads/videos/1778125736_9333582c81104aed871da7e524e50bc5.mov', 8),
(2, '1778126263_9333582c81104aed871da7e524e50bc5.mov', './uploads/videos/1778126263_9333582c81104aed871da7e524e50bc5.mov', 9);

-- --------------------------------------------------------
-- 8. Tabla: preguntas
-- --------------------------------------------------------
CREATE TABLE `preguntas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `texto_pregunta` text NOT NULL,
  `feedback` text DEFAULT NULL,
  `id_caso` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_preguntas_caso` (`id_caso`),
  CONSTRAINT `preguntas_ibfk_1` FOREIGN KEY (`id_caso`) REFERENCES `casos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `preguntas` (`id`, `texto_pregunta`, `feedback`, `id_caso`) VALUES
(13, 'jsjsjsjs', 'jsjsjsjs', 5),
(28, 'jsjsjsjs', 'jsjsjsj', 8),
(41, 'jsjsjsjs', 'jsjsjsjs', 9),
(42, 'jsjsjsjs', 'jsjsjs', 9),
(43, 'que tiene', 'listo', 12);

-- --------------------------------------------------------
-- 9. Tabla: incisos
-- --------------------------------------------------------
CREATE TABLE `incisos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_pregunta` int(11) DEFAULT NULL,
  `texto` varchar(255) DEFAULT NULL,
  `correcto` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_incisos_pregunta` (`id_pregunta`),
  CONSTRAINT `incisos_ibfk_1` FOREIGN KEY (`id_pregunta`) REFERENCES `preguntas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `incisos` (`id`, `id_pregunta`, `texto`, `correcto`) VALUES
(25, 13, 'jsjsjs', 1),
(26, 13, 'jsjsjsjs', 0),
(55, 28, 'jsjsjsjs', 1),
(56, 28, 'jsjsjsj', 0),
(84, 41, 'jsjsjsjs', 1),
(85, 41, 'jsjsjsj', 0),
(86, 41, 'jsjsjs', 0),
(87, 42, 'jsjsj', 1),
(88, 42, 'jsjjss', 0),
(89, 43, 'nada', 0),
(90, 43, 'asma', 1);

-- --------------------------------------------------------
-- 10. Tabla: evaluaciones
-- --------------------------------------------------------
CREATE TABLE `evaluaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_caso` int(11) NOT NULL,
  `subgrupo` varchar(50) NOT NULL,
  `equipo` varchar(50) NOT NULL,
  `nota_final` decimal(5,2) NOT NULL DEFAULT 0.00,
  `debriefing` tinyint(1) NOT NULL DEFAULT 0,
  `fortalezas` text DEFAULT NULL,
  `debilidades` text DEFAULT NULL,
  `puntajes_rubrica` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_eval_caso` (`id_caso`),
  CONSTRAINT `evaluaciones_ibfk_1` FOREIGN KEY (`id_caso`) REFERENCES `casos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `evaluaciones` (`id`, `id_caso`, `subgrupo`, `equipo`, `nota_final`, `debriefing`, `fortalezas`, `debilidades`, `puntajes_rubrica`, `fecha_creacion`) VALUES
(1, 12, '441', '3', 43.75, 0, '', '', '{\"1\":{\"points\":5,\"label\":\"Excelente\",\"multiplier\":4},\"2\":{\"points\":5,\"label\":\"Excelente\",\"multiplier\":4},\"3\":{\"points\":11.25,\"label\":\"Bueno\",\"multiplier\":3},\"4\":{\"points\":15,\"label\":\"Excelente\",\"multiplier\":4},\"5\":{\"points\":7.5,\"label\":\"Bueno\",\"multiplier\":3}}', '2026-11-02 17:00:26'),
(2, 12, '777', '67', 32.50, 0, '', '', '{\"1\":{\"points\":3.75,\"label\":\"Bueno\",\"multiplier\":3},\"2\":{\"points\":2.5,\"label\":\"Satisfactorio\",\"multiplier\":2},\"3\":{\"points\":7.5,\"label\":\"Satisfactorio\",\"multiplier\":2},\"4\":{\"points\":3.75,\"label\":\"Deficiente\",\"multiplier\":1},\"5\":{\"points\":2.5,\"label\":\"Deficiente\",\"multiplier\":1},\"6\":{\"points\":3.75,\"label\":\"Deficiente\",\"multiplier\":1},\"7\":{\"points\":3.75,\"label\":\"Deficiente\",\"multiplier\":1},\"8\":{\"points\":1.25,\"label\":\"Deficiente\",\"multiplier\":1},\"9\":{\"points\":1.25,\"label\":\"Deficiente\",\"multiplier\":1},\"10\":{\"points\":2.5,\"label\":\"Deficiente\",\"multiplier\":1}}', '2026-11-03 08:47:52');

-- --------------------------------------------------------
-- 11. Tabla: integrantes_evaluacion
-- --------------------------------------------------------
CREATE TABLE `integrantes_evaluacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int(11) NOT NULL,
  `nombre_alumno` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_eval_integrante` (`id_evaluacion`),
  CONSTRAINT `fk_eval_integrante` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `integrantes_evaluacion` (`id`, `id_evaluacion`, `nombre_alumno`) VALUES
(5, 1, 'miguel'),
(6, 2, 'miguel');
