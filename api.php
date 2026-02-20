<?php
// ==========================================================
// 🚀 OLYSACHECK - API DE VÉRIFICATION D'EMAIL
// ==========================================================
// Version: 2.0.0
// Description: API sécurisée pour vérifier les fuites de données
// Sécurité: Variables d'environnement, CORS restreint, logs
// ==========================================================

header('Content-Type: application/json');

// ==========================================================
// 1. CONFIGURATION CORS SÉCURISÉE
// ==========================================================
$allowed_origin = 'https://olysacheck.vercel.app';
if (isset($_SERVER['HTTP_ORIGIN'])) {
    if ($_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
        header("Access-Control-Allow-Origin: $allowed_origin");
        header('Access-Control-Allow-Methods: GET');
        header('Access-Control-Allow-Headers: Content-Type');
    }
}

// Gérer les requêtes OPTIONS (pré-vol CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================================
// 2. CHARGEMENT SÉCURISÉ DES VARIABLES D'ENVIRONNEMENT
// ==========================================================
// Ces variables sont stockées sur Vercel, pas dans le code
$host = getenv('DB_HOST');
$dbname = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');

// Vérification que toutes les variables existent
if (!$host || !$dbname || !$user || $pass === false) {
    error_log('[SECURITY] Variables d\'environnement manquantes');
    http_response_code(500);
    echo json_encode(['error' => 'Configuration serveur incomplète']);
    exit;
}

// ==========================================================
// 3. CONNEXION À LA BASE DE DONNÉES
// ==========================================================
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 3
        ]
    );
} catch (PDOException $e) {
    error_log('[BDD] Erreur de connexion: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Service temporairement indisponible']);
    exit;
}

// ==========================================================
// 4. VALIDATION DE L'EMAIL
// ==========================================================
$email = $_GET['email'] ?? '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email manquant']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

// Normalisation de l'email (minuscules, sans espaces)
$email = strtolower(trim($email));

// ==========================================================
// 5. RECHERCHE DES FUITES (REQUÊTE PRÉPARÉE)
// ==========================================================
try {
    // Hachage de l'email pour la recherche
    $emailHash = hash('sha256', $email);
    
    $sql = "SELECT 
                b.breach_name,
                b.breach_date,
                b.severity,
                b.description,
                ce.exposed_data
            FROM compromised_emails ce
            INNER JOIN breaches b ON ce.breach_id = b.id
            WHERE ce.email_hash = :email_hash
            ORDER BY b.breach_date DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['email_hash' => $emailHash]);
    $results = $stmt->fetchAll();
    
    // Décoder les données JSON pour chaque résultat
    foreach ($results as &$row) {
        if (isset($row['exposed_data'])) {
            $row['exposed_data'] = json_decode($row['exposed_data'], true);
        }
    }
    
} catch (PDOException $e) {
    error_log('[BDD] Erreur de requête: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la recherche']);
    exit;
}

// ==========================================================
// 6. MISE À JOUR DES STATISTIQUES
// ==========================================================
try {
    // Incrémenter le compteur de recherches
    $pdo->exec("UPDATE stats_cache 
                SET stat_value = stat_value + 1 
                WHERE stat_key = 'total_searches'");
} catch (Exception $e) {
    // On ignore les erreurs de stats (non critique)
    error_log('[STATS] Erreur: ' . $e->getMessage());
}

// ==========================================================
// 7. CONSTRUCTION DE LA RÉPONSE
// ==========================================================
$response = [
    'success' => true,
    'email' => $email,
    'breaches' => $results,
    'stats' => [
        'total' => count($results)
    ]
];

// Si aucun résultat, ajouter un message
if (count($results) === 0) {
    $response['message'] = 'Aucune fuite trouvée pour cet email';
}

echo json_encode($response, JSON_UNESCAPED_SLASHES);

// ==========================================================
// 8. LOG DE SÉCURITÉ (optionnel)
// ==========================================================
// Journaliser les recherches pour audit (sans l'email)
error_log("[AUDIT] Recherche effectuée - Hash: " . $emailHash);