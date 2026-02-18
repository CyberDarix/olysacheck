<?php
// api.php - Version sécurisée et optimisée pour la mise en ligne
header('Content-Type: application/json');

// ⚠️ Restreindre l'accès CORS à ton domaine uniquement (plus sécurisé)
$allowed_origin = 'https://olysacheck.vercel.app';
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
    header("Access-Control-Allow-Origin: $allowed_origin");
    header('Access-Control-Allow-Methods: GET');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Ne pas exposer d'informations sensibles en cas d'erreur
error_reporting(0);
ini_set('display_errors', 0);

// Lire les variables d'environnement (avec vérification)
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'oack';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

// Vérifier que les variables essentielles ne sont pas vides (évite les connexions par défaut en prod)
if (empty($host) || empty($dbname) || empty($user)) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuration serveur incomplète.']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // sécurité supplémentaire
} catch (PDOException $e) {
    // Log interne (sans afficher les détails au client)
    error_log('Erreur de connexion BDD : ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Service temporairement indisponible.']);
    exit;
}

// Récupérer et valider l'email
$email = isset($_GET['email']) ? trim($_GET['email']) : '';
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

// Hachage sécurisé
$email_hash = hash('sha256', strtolower($email));

// Requête préparée (déjà sécurisée)
$sql = "SELECT b.breach_name, b.breach_date, b.severity, ce.exposed_data
        FROM compromised_emails ce
        JOIN breaches b ON ce.breach_id = b.id
        WHERE ce.email_hash = :hash
        ORDER BY b.breach_date DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute(['hash' => $email_hash]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['breaches' => $results]);

// Mise à jour des stats sans affichage d'erreur
try {
    $pdo->exec("UPDATE stats_cache SET stat_value = stat_value + 1 WHERE stat_key = 'total_searches'");
} catch (Exception $e) {
    // On ignore silencieusement (log interne conseillé)
    error_log('Erreur mise à jour stats : ' . $e->getMessage());
}