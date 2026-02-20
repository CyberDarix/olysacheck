<?php
/**
 * OLYSA CHECK - API DE VÉRIFICATION D'EMAIL
 * Version: 1.0.0
 * 
 * ⚠️ INSTRUCTIONS IMPORTANTES :
 * 1. Copie ce fichier et renomme-le en check-email.php
 * 2. Ajoute TES identifiants personnels dans check-email.php
 * 3. Ne partage JAMAIS check-email.php sur GitHub !
 */

// ==============================================
// CONFIGURATION - À COMPLÉTER DANS check-email.php
// ==============================================
define('DB_HOST', 'localhost');           // Hôte MySQL (généralement localhost)
define('DB_NAME', 'oack');                 // Nom de ta base de données
define('DB_USER', 'olysacheck_ia');        // Utilisateur MySQL
define('DB_PASS', 'TON_MOT_DE_PASSE_ICI'); // 🔐 Mets ton vrai mot de passe ici DANS check-email.php

define('API_SECRET_KEY', 'TA_CLE_API_ICI'); // 🔐 Mets ta vraie clé API ici DANS check-email.php

// ==============================================
// NE RIEN MODIFIER EN DESSOUS DE CETTE LIGNE
// ==============================================

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Access-Control-Allow-Origin: https://olysacheck.vercel.app');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError(405, 'Méthode non autorisée. Utilisez POST.');
}

$headers = getallheaders();
$apiKey = $headers['X-API-Key'] ?? '';

if ($apiKey !== API_SECRET_KEY) {
    sendError(401, 'Clé API invalide ou manquante');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendError(400, 'Format JSON invalide');
}

$email = trim($input['email'] ?? '');

if (empty($email)) {
    sendError(400, 'L\'email est requis');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError(400, 'Format d\'email invalide');
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    error_log("Erreur DB: " . $e->getMessage());
    sendError(503, 'Service temporairement indisponible', true);
}

try {
    $emailHash = hash('sha256', strtolower($email));
    
    $stmt = $pdo->prepare("
        CALL sp_search_email_ultra_v2(
            :email_hash, 
            :ip_address, 
            :user_agent, 
            TRUE, 
            @global_risk, 
            @recommendation, 
            @confidence_level, 
            @risk_factors
        )
    ");
    
    $stmt->execute([
        ':email_hash' => $emailHash,
        ':ip_address' => $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? null,
        ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);
    
    $breaches = $stmt->fetchAll();
    
    $stmt = $pdo->query("SELECT @global_risk as risk, @recommendation as recommendation, @confidence_level as confidence, @risk_factors as factors");
    $output = $stmt->fetch();
    
    $hasBreaches = !empty($breaches);
    $totalBreaches = count($breaches);
    
    $severityCount = [
        'critical' => 0,
        'high' => 0,
        'medium' => 0,
        'low' => 0
    ];
    
    foreach ($breaches as $breach) {
        $severityCount[$breach['severity']] = ($severityCount[$breach['severity']] ?? 0) + 1;
    }
    
    $response = [
        'success' => true,
        'data' => [
            'email' => maskEmail($email),
            'email_hash' => $emailHash,
            'verified_at' => date('c'),
            'risk' => [
                'score' => round($output['risk'] * 100, 1),
                'level' => getRiskLevel($output['risk']),
                'confidence' => $output['confidence']
            ],
            'breaches' => [
                'total' => $totalBreaches,
                'found' => $hasBreaches,
                'details' => array_map(function($breach) {
                    return [
                        'name' => $breach['breach_name'],
                        'date' => $breach['breach_date'],
                        'severity' => $breach['severity'],
                        'description' => $breach['description'],
                        'category' => $breach['category'],
                        'data_exposed' => json_decode($breach['exposed_data'] ?? '[]', true),
                        'first_seen' => $breach['first_seen'],
                        'darkweb_mentions' => $breach['darkweb_mentions'] ?? 0
                    ];
                }, $breaches),
                'by_severity' => $severityCount
            ],
            'recommendations' => [
                'primary' => $output['recommendation'],
                'steps' => generateRecommendations($output['risk'], $totalBreaches, $severityCount)
            ],
            'analysis' => [
                'factors' => json_decode($output['factors'], true),
                'timestamp' => date('c')
            ]
        ],
        'meta' => [
            'api_version' => '1.0.0',
            'response_time_ms' => round((microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']) * 1000),
            'cached' => false
        ]
    ];
    
    $logStmt = $pdo->prepare("
        INSERT INTO system_logs_ai 
        (event_type, event_message, severity, ai_analysis, ip_address) 
        VALUES ('API_SEARCH', :message, 'INFO', :analysis, :ip)
    ");
    
    $logStmt->execute([
        ':message' => "Recherche API pour email: " . maskEmail($email),
        ':analysis' => json_encode([
            'risk_score' => $output['risk'],
            'breaches_found' => $totalBreaches,
            'api_key_used' => substr($apiKey, 0, 8) . '...'
        ]),
        ':ip' => $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? null
    ]);
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
} catch (PDOException $e) {
    error_log("Erreur requête: " . $e->getMessage());
    sendError(500, 'Erreur lors de l\'analyse', true);
}

function sendError($code, $message, $isTechnical = false) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => $code,
            'message' => $message,
            'technical' => $isTechnical
        ]
    ], JSON_PRETTY_PRINT);
    exit();
}

function maskEmail($email) {
    $parts = explode('@', $email);
    $name = $parts[0];
    $domain = $parts[1];
    
    $maskedName = substr($name, 0, 3) . str_repeat('*', max(0, strlen($name) - 3));
    return $maskedName . '@' . $domain;
}

function getRiskLevel($score) {
    if ($score > 0.8) return 'CRITIQUE';
    if ($score > 0.6) return 'ÉLEVÉ';
    if ($score > 0.3) return 'MOYEN';
    if ($score > 0.1) return 'FAIBLE';
    return 'TRÈS FAIBLE';
}

function generateRecommendations($risk, $totalBreaches, $severityCount) {
    $steps = [];
    
    if ($risk > 0.8 || $severityCount['critical'] > 0) {
        $steps[] = "🔴 **ACTION IMMÉDIATE REQUISE** : Changez tous vos mots de passe maintenant";
        $steps[] = "🔴 Activez l'authentification à deux facteurs sur tous vos comptes";
        $steps[] = "🔴 Vérifiez vos comptes bancaires et cartes de crédit";
    }
    
    if ($totalBreaches > 5) {
        $steps[] = "⚠️ Vous êtes dans " . $totalBreaches . " fuites - utilisez un gestionnaire de mots de passe";
    }
    
    if ($severityCount['high'] > 0) {
        $steps[] = "⚠️ Changez les mots de passe des comptes concernés par des fuites de sévérité ÉLEVÉE";
    }
    
    if ($risk > 0.3) {
        $steps[] = "🔄 Surveillez régulièrement vos comptes pour détecter toute activité suspecte";
        $steps[] = "📧 Méfiez-vous des emails de phishing qui pourraient utiliser ces données";
    }
    
    if ($risk <= 0.3 && $totalBreaches === 0) {
        $steps[] = "✅ Continuez vos bonnes pratiques de sécurité";
        $steps[] = "🔐 Activez la double authentification si ce n'est pas déjà fait";
    }
    
    return $steps;
}