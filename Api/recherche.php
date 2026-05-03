<?php
// ============================================================
//  IKYO – API Recherche
// ============================================================

session_start();
header('Content-Type: application/json');

require_once '../config/database.php';

$db = getDB();

/* ===== GET PARAMS ===== */
$q = trim($_GET['q'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$par_page = 20;

if (empty($q)) {
    echo json_encode(['success' => true, 'message' => 'OK', 'data' => [], 'pagination' => ['total' => 0, 'page' => 1, 'nb_pages' => 0]]);
    exit;
}

/* ===== SEARCH ===== */
$offset = ($page - 1) * $par_page;

// Count total
$countStmt = $db->prepare("
    SELECT COUNT(*) FROM produits p 
    WHERE p.actif = 1 AND (p.nom LIKE :q OR p.description LIKE :q)
");
$countStmt->execute([':q' => "%$q%"]);
$total = (int)$countStmt->fetchColumn();

// Get products
$stmt = $db->prepare("
    SELECT 
        p.id, p.nom, p.prix, p.prix_promo, p.stock, p.note_moyenne, p.nb_avis,
        v.nom_magasin,
        (SELECT url FROM produit_images WHERE produit_id = p.id AND principale = 1 LIMIT 1) AS image_url
    FROM produits p
    LEFT JOIN vendeurs v ON p.vendeur_id = v.id
    WHERE p.actif = 1 AND (p.nom LIKE :q2 OR p.description LIKE :q2)
    ORDER BY p.id DESC
    LIMIT :limit OFFSET :offset
");

$stmt->bindValue(':q2', "%$q%", PDO::PARAM_STR);
$stmt->bindValue(':limit', $par_page, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$produits = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($produits as &$p) {
    if (empty($p['image_url'])) {
        $p['image_url'] = BASE_URL . 'section4.jpg';
    } else {
        $p['image_url'] = BASE_URL . 'uploads/products/' . $p['image_url'];
    }
}

echo json_encode([
    'success' => true,
    'message' => 'OK',
    'data' => $produits,
    'pagination' => [
        'total' => $total,
        'page' => $page,
        'par_page' => $par_page,
        'nb_pages' => (int)ceil($total / $par_page)
    ]
]);
?>