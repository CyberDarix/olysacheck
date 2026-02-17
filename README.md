-- 10_ai_models.sql
USE oack;

CREATE TABLE ai_models (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    model_type ENUM('risk_scoring', 'anomaly_detection', 'breach_prediction') NOT NULL,
    accuracy FLOAT,
    training_date DATETIME,
    model_data LONGBLOB, -- pour stocker le modèle sérialisé (ex: pickle)
    parameters JSON,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_model (model_name, model_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des prédictions
CREATE TABLE ai_predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email_hash CHAR(64),
    model_id BIGINT,
    prediction_score FLOAT,
    prediction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE CASCADE,
    INDEX idx_email (email_hash)
) ENGINE=InnoDB;