<?php
// Configuration de ta base olysacore
$host = "localhost";
$port = "5432";
$dbname = "olysacore";
$user = "postgres";
$password = "Kacem2012henni76600@"; // <--- METS TON VRAI MOT DE PASSE ICI

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;user=$user;password=$password";
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Si on reçoit un email du bouton "Vérifier"
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'])) {
        $email = $_POST['email'];

        // On l'insère dans la table que tu as créée sur pgAdmin
        $sql = "INSERT INTO comptes_permanents (email) VALUES (:email) ON CONFLICT (email) DO NOTHING";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['email' => $email]);

        echo "Succès : Utilisateur enregistré";
    }

} catch (PDOException $e) {
    // Si ça rate, on affiche l'erreur pour comprendre pourquoi
    echo "Erreur de connexion : " . $e->getMessage();
}
?>