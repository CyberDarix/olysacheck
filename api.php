<?php
// api.php - Version sécurisée pour la mise en ligne
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ⚠️ NE PAS METTRE LES IDENTIFIANTS EN CLAIR ICI
// Ils seront lus depuis des variables d'environnement

$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'oack';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Message d'erreur générique (ne donne pas d'informations sensibles)
    http_response_code(500);
    echo json_encode(['error' => 'Service temporairement indisponible']);
    exit;
}

$email = isset($_GET['email']) ? $_GET['email'] : '';
if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email manquant']);
    exit;
}

// Validation simple de l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

$email_hash = hash('sha256', strtolower(trim($email)));

$sql = "SELECT b.breach_name, b.breach_date, b.severity, ce.exposed_data
        FROM compromised_emails ce
        JOIN breaches b ON ce.breach_id = b.id
        WHERE ce.email_hash = :hash
        ORDER BY b.breach_date DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute(['hash' => $email_hash]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['breaches' => $results]);

// Mise à jour silencieuse des stats (on ignore les erreurs)
@$pdo->exec("UPDATE stats_cache SET stat_value = stat_value + 1 WHERE stat_key = 'total_searches'");
?>