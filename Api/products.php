<?php
// ============================================================
// IKYO – API Produits (liste tous les produits)
// ============================================================

require_once '../config/database.php';

$db = getDB();

$stmt = $db->query("
    SELECT p.*, 
           (SELECT url FROM produit_images WHERE produit_id = p.id AND principale = 1 LIMIT 1) as image_url,
           c.nom as categorie_nom,
           v.nom_magasin as vendeur_nom
    FROM produits p
    LEFT JOIN categories c ON p.categorie_id = c.id
    LEFT JOIN vendeurs v ON p.vendeur_id = v.id
    WHERE p.actif = 1
    ORDER BY p.id DESC
");

$produits = $stmt->fetchAll();

foreach ($produits as &$p) {
    if (!$p['image_url']) {
        $p['image_url'] = '';
    } else {
        $p['image_url'] = BASE_URL . 'uploads/products/' . $p['image_url'];
    }
}

jsonResponse(true, 'OK', $produits);
?>