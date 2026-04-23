<?php
// ============================================================
//  IKYO – Configuration Base de données
//  Fichier: config/database.php
// ============================================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');        // Votre utilisateur XAMPP
define('DB_PASS', '');            // Mot de passe (vide par défaut XAMPP)
define('DB_NAME', 'ikyo_db');
define('DB_CHARSET', 'utf8mb4');

// URL de base du site
define('BASE_URL', 'http://localhost/ikyo/');
define('UPLOAD_DIR', __DIR__ . '/../uploads/products/');
define('UPLOAD_URL', BASE_URL . 'uploads/products/');

// Clé secrète pour JWT (sessions)
define('SECRET_KEY', 'ikyo_secret_2025_changez_moi');

// ─────────────────────────────────────────────
//  Connexion PDO (recommandée - plus sécurisée)
// ─────────────────────────────────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['success' => false, 'message' => 'Erreur connexion BD: ' . $e->getMessage()]));
        }
    }
    return $pdo;
}

// ─────────────────────────────────────────────
//  Helpers globaux
// ─────────────────────────────────────────────
function jsonResponse(bool $success, string $message, array $data = [], int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $data));
    exit;
}

function sanitize(string $input): string {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

function generateOrderNumber(): string {
    return 'IK-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
}

// Démarrer session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Headers CORS (pour requêtes AJAX)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);