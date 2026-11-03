-- tablas para el modulo de evaluaciones

USE `simulador_medico`;

-- tabla principal de evaluaciones
CREATE TABLE IF NOT EXISTS `evaluaciones` (
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
  KEY `fk_eval_caso` (`id_caso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- integrantes por evaluacion
CREATE TABLE IF NOT EXISTS `integrantes_evaluacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_evaluacion` int(11) NOT NULL,
  `nombre_alumno` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_eval_integrante` (`id_evaluacion`),
  CONSTRAINT `fk_eval_integrante` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
