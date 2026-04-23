<?php
// ============================================================
//  IKYO – API Panier & Favoris
//  Fichier: api/panier.php
// ============================================================

require_once '../config/database.php';

$action = $_GET['action'] ?? '';
$db     = getDB();
$data   = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$clientId = $_SESSION['client_id'] ?? null;

if (!$clientId) jsonResponse(false, 'Connectez-vous', [], 401);

switch ($action) {

    case 'ajouter':
        $produitId = (int)($data['produit_id'] ?? 0);
        $quantite  = (int)($data['quantite']   ?? 1);
        $couleur   = sanitize($data['couleur'] ?? '');
        $taille    = sanitize($data['taille']  ?? '');

        // Vérifier stock
        $p = $db->prepare("SELECT stock FROM produits WHERE id=? AND actif=1");
        $p->execute([$produitId]);
        $prod = $p->fetch();
        if (!$prod || $prod['stock'] < $quantite) {
            jsonResponse(false, 'Stock insuffisant', [], 400);
        }

        // Vérifier si déjà dans le panier
        $exist = $db->prepare("SELECT id, quantite FROM panier WHERE client_id=? AND produit_id=? AND couleur=? AND taille=?");
        $exist->execute([$clientId, $produitId, $couleur, $taille]);
        $item = $exist->fetch();

        if ($item) {
            $db->prepare("UPDATE panier SET quantite=quantite+? WHERE id=?")->execute([$quantite, $item['id']]);
        } else {
            $db->prepare("INSERT INTO panier (client_id, produit_id, quantite, couleur, taille) VALUES (?,?,?,?,?)")
               ->execute([$clientId, $produitId, $quantite, $couleur, $taille]);
        }
        jsonResponse(true, 'Ajouté au panier');
        break;

    case 'liste':
        $stmt = $db->prepare("
            SELECT pan.id, pan.quantite, pan.couleur, pan.taille,
                   p.nom, p.prix, p.prix_promo, p.stock, p.slug,
                   v.nom_magasin,
                   (SELECT url FROM produit_images pi WHERE pi.produit_id=p.id AND pi.principale=1 LIMIT 1) AS image
            FROM panier pan
            JOIN produits p ON pan.produit_id = p.id
            JOIN vendeurs v ON p.vendeur_id   = v.id
            WHERE pan.client_id = ?
        ");
        $stmt->execute([$clientId]);
        $items = $stmt->fetchAll();

        $total = array_sum(array_map(fn($i) => ($i['prix_promo'] ?? $i['prix']) * $i['quantite'], $items));
        jsonResponse(true, 'OK', ['items' => $items, 'total' => $total, 'nb' => count($items)]);
        break;

    case 'modifier':
        $panId    = (int)($data['panier_id'] ?? 0);
        $quantite = (int)($data['quantite']  ?? 1);
        if ($quantite <= 0) {
            $db->prepare("DELETE FROM panier WHERE id=? AND client_id=?")->execute([$panId, $clientId]);
        } else {
            $db->prepare("UPDATE panier SET quantite=? WHERE id=? AND client_id=?")->execute([$quantite, $panId, $clientId]);
        }
        jsonResponse(true, 'Panier mis à jour');
        break;

    case 'supprimer':
        $panId = (int)($data['panier_id'] ?? 0);
        $db->prepare("DELETE FROM panier WHERE id=? AND client_id=?")->execute([$panId, $clientId]);
        jsonResponse(true, 'Article supprimé');
        break;

    case 'vider':
        $db->prepare("DELETE FROM panier WHERE client_id=?")->execute([$clientId]);
        jsonResponse(true, 'Panier vidé');
        break;

    // ── FAVORIS ──────────────────────────────────────────────
    case 'toggle_favori':
        $produitId = (int)($data['produit_id'] ?? 0);
        $exist = $db->prepare("SELECT id FROM favoris WHERE client_id=? AND produit_id=?");
        $exist->execute([$clientId, $produitId]);
        if ($exist->fetch()) {
            $db->prepare("DELETE FROM favoris WHERE client_id=? AND produit_id=?")->execute([$clientId, $produitId]);
            jsonResponse(true, 'Retiré des favoris', ['favori' => false]);
        } else {
            $db->prepare("INSERT INTO favoris (client_id, produit_id) VALUES (?,?)")->execute([$clientId, $produitId]);
            jsonResponse(true, 'Ajouté aux favoris', ['favori' => true]);
        }
        break;

    case 'mes_favoris':
        $stmt = $db->prepare("
            SELECT p.id, p.nom, p.slug, p.prix, p.prix_promo, p.note_moyenne, v.nom_magasin,
                   (SELECT url FROM produit_images pi WHERE pi.produit_id=p.id AND pi.principale=1 LIMIT 1) AS image
            FROM favoris f
            JOIN produits p ON f.produit_id = p.id
            JOIN vendeurs v ON p.vendeur_id  = v.id
            WHERE f.client_id=? AND p.actif=1
            ORDER BY f.ajoute_le DESC
        ");
        $stmt->execute([$clientId]);
        jsonResponse(true, 'OK', ['favoris' => $stmt->fetchAll()]);
        break;

    default:
        jsonResponse(false, 'Action inconnue', [], 404);
}