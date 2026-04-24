```php
<?php
// ============================================================
//  IKYO – API Recherche (VERSION STABLE FIXED)
// ============================================================

session_start();
header('Content-Type: application/json');

require_once '../config/database.php';

$db = getDB();

/* ===== Helper ===== */
function jsonResponse($success, $message, $data = []) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data"    => $data
    ]);
    exit;
}

/* ===== GET PARAMS ===== */
$q            = trim($_GET['q'] ?? '');
$wilaya_id    = (int)($_GET['wilaya'] ?? 0);
$categorie_id = (int)($_GET['categorie'] ?? 0);
$prix_min     = (float)($_GET['prix_min'] ?? 0);
$prix_max     = (float)($_GET['prix_max'] ?? 0);
$tri          = $_GET['tri'] ?? 'pertinence';
$page         = max(1, (int)($_GET['page'] ?? 1));
$par_page     = 20;

/* ===== QUERY BUILD ===== */
$where  = ["p.actif = 1"];
$params = [];

/* 🔍 search */
if ($q !== '') {
    $where[] = "(p.nom LIKE ? OR p.description LIKE ?)";
    $params[] = "%$q%";
    $params[] = "%$q%";
}

/* 📍 wilaya */
if ($wilaya_id > 0) {
    $where[] = "p.wilaya_id = ?";
    $params[] = $wilaya_id;
}

/* 🏷 catégorie */
if ($categorie_id > 0) {
    $where[] = "p.categorie_id = ?";
    $params[] = $categorie_id;
}

/* 💰 prix */
if ($prix_min > 0) {
    $where[] = "p.prix >= ?";
    $params[] = $prix_min;
}
if ($prix_max > 0) {
    $where[] = "p.prix <= ?";
    $params[] = $prix_max;
}

/* ===== ORDER ===== */
switch ($tri) {
    case 'prix_asc':
        $order = "p.prix ASC";
        break;
    case 'prix_desc':
        $order = "p.prix DESC";
        break;
    default:
        $order = "p.id DESC";
}

/* ===== COUNT ===== */
$whereSQL = implode(' AND ', $where);

$countStmt = $db->prepare("SELECT COUNT(*) FROM produits p WHERE $whereSQL");
$countStmt->execute($params);
$total = $countStmt->fetchColumn();

/* ===== SELECT ===== */
$offset = ($page - 1) * $par_page;

$sql = "
SELECT 
    p.id,
    p.nom,
    p.prix,
    p.prix_promo,
    p.stock,
    p.note_moyenne,
    p.nb_avis,
    w.nom AS wilaya_nom,
    v.nom_magasin,
    (SELECT url FROM produit_images WHERE produit_id = p.id LIMIT 1) AS image_url
FROM produits p
LEFT JOIN wilayas w ON p.wilaya_id = w.id
LEFT JOIN vendeurs v ON p.vendeur_id = v.id
WHERE $whereSQL
ORDER BY $order
LIMIT ? OFFSET ?
";

$params[] = $par_page;
$params[] = $offset;

$stmt = $db->prepare($sql);
$stmt->execute($params);

$produits = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* ===== FORMAT ===== */
foreach ($produits as &$p) {
    $p['image_url'] = $p['image_url'] ?: 'assets/no-image.jpg';
}

