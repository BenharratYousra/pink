<?php

require_once '../config/database.php';

$action = $_GET['action'] ?? '';
$db = getDB();

$baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/ikyo/';

switch ($action) {

    case 'profil':
        $vendeurId = (int)($_GET['vendeur_id'] ?? 0);

        if (!$vendeurId) {
            jsonResponse(false, 'Paramètre manquant', [], 400);
        }

        $stmt = $db->prepare("
            SELECT 
                v.id, v.nom_magasin, v.description, v.logo_url,
                v.telephone, v.approuve_le,
                w.nom AS wilaya,
                COUNT(DISTINCT p.id) AS nb_produits,
                COALESCE(AVG(a.note),0) AS note_moyenne,
                COUNT(DISTINCT a.id) AS nb_avis
            FROM vendeurs v
            LEFT JOIN wilayas w ON v.wilaya_id = w.id
            LEFT JOIN produits p ON p.vendeur_id = v.id AND p.actif = 1
            LEFT JOIN avis a ON a.produit_id = p.id
            WHERE v.id = ? AND v.statut = 'approuve'
            GROUP BY v.id
        ");
        $stmt->execute([$vendeurId]);
        $boutique = $stmt->fetch();
        
        if (!$boutique) {
            jsonResponse(false, 'Boutique introuvable', [], 404);
        }

        $cats = $db->prepare("
            SELECT DISTINCT c.id, c.nom
            FROM produits p
            JOIN categories c ON p.categorie_id = c.id
            WHERE p.vendeur_id = ? AND p.actif = 1
            ORDER BY c.nom
        ");
        $cats->execute([$boutique['id']]);
        $boutique['categories'] = $cats->fetchAll();

        jsonResponse(true, 'OK', ['boutique' => $boutique]);
        break;

    case 'produits':
        $vendeurId = (int)($_GET['vendeur_id'] ?? 0);
        $categorieId = (int)($_GET['categorie'] ?? 0);
        $tri = htmlspecialchars(strip_tags(trim($_GET['tri'] ?? 'nouveau')), ENT_QUOTES, 'UTF-8');
        $page = max(1, (int)($_GET['page'] ?? 1));
        $parPage = 12;

        $where = ["p.vendeur_id = ?", "p.actif = 1"];
        $params = [$vendeurId];

        if ($categorieId) {
            $where[] = "p.categorie_id = ?";
            $params[] = $categorieId;
        }

        $order = match($tri) {
            'prix_asc' => "p.prix ASC",
            'prix_desc' => "p.prix DESC",
            'note' => "p.note_moyenne DESC",
            'ventes' => "p.nb_ventes DESC",
            default => "p.created_at DESC"
        };

        $whereSQL = implode(' AND ', $where);
        $offset = ($page - 1) * $parPage;

        $count = $db->prepare("SELECT COUNT(*) FROM produits p WHERE $whereSQL");
        $count->execute($params);
        $total = (int)$count->fetchColumn();

        $sql = "
            SELECT 
                p.id, p.nom, p.prix, p.prix_promo, p.stock,
                p.note_moyenne, p.nb_avis, p.nb_ventes, p.marque,
                c.nom AS categorie,
                CASE WHEN p.prix_promo IS NOT NULL 
                     THEN ROUND((1 - p.prix_promo/p.prix)*100) 
                     ELSE 0 END AS remise_pct,
                pi.url AS image
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            LEFT JOIN produit_images pi ON p.id = pi.produit_id AND pi.principale = 1
            WHERE $whereSQL
            ORDER BY $order
            LIMIT $parPage OFFSET $offset
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params); // ✅ Fix 1
        $produits = $stmt->fetchAll();

        // ✅ Fix 2 - URL absolue des images
        foreach ($produits as &$p) {
            if ($p['image']) {
                $p['image_url'] = $baseUrl . 'uploads/products/' . $p['image'];
            } 
            else {
                $p['image_url'] = $baseUrl . 'section4.jpg';
            }
        }

        jsonResponse(true, 'OK', [
            'produits' => $produits,
            'pagination' => [
                'page' => $page,
                'par_page' => $parPage,
                'total' => $total,
                'nb_pages' => (int)ceil($total / $parPage),
            ]
        ]);
        break;

    case 'avis':
        $vendeurId = (int)($_GET['vendeur_id'] ?? 0);
        $limit = min(20, (int)($_GET['limite'] ?? 10));

        $stmt = $db->prepare("
            SELECT a.note, a.commentaire, a.created_at,
                   CONCAT(cl.prenom,' ', SUBSTRING(cl.nom,1,1),'.') AS auteur,
                   p.nom AS produit_nom
            FROM avis a
            JOIN clients cl ON a.client_id = cl.id
            JOIN produits p ON a.produit_id = p.id
            WHERE p.vendeur_id = ?
            ORDER BY a.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$vendeurId, $limit]);
        $avis = $stmt->fetchAll();

        $dist = $db->prepare("
            SELECT a.note, COUNT(*) AS nb,
                   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 0) AS pct
            FROM avis a
            JOIN produits p ON a.produit_id = p.id
            WHERE p.vendeur_id = ?
            GROUP BY a.note
            ORDER BY a.note DESC
        ");
        $dist->execute([$vendeurId]);

        jsonResponse(true, 'OK', [
            'avis' => $avis,
            'distribution' => $dist->fetchAll()
        ]);
        break;

    case 'liste':
        $wilayaId = (int)($_GET['wilaya'] ?? 0);
        $q = htmlspecialchars(strip_tags(trim($_GET['q'] ?? '')), ENT_QUOTES, 'UTF-8');
        
        $where = ["v.statut = 'approuve'"];
        $params = [];
        
        if ($wilayaId) {
            $where[] = "v.wilaya_id = ?";
            $params[] = $wilayaId;
        }
        if ($q) {
            $where[] = "v.nom_magasin LIKE ?";
            $params[] = "%$q%";
        }
        
        $whereSQL = implode(' AND ', $where);
        
        $stmt = $db->prepare("
            SELECT 
                v.id, 
                v.nom_magasin, 
                v.description,
                w.nom AS wilaya,
                COUNT(DISTINCT p.id) AS nb_produits,
                COALESCE(AVG(a.note),0) AS note_moyenne,
                COUNT(DISTINCT a.id) AS nb_avis
            FROM vendeurs v
            LEFT JOIN wilayas w ON v.wilaya_id = w.id
            LEFT JOIN produits p ON p.vendeur_id = v.id AND p.actif = 1
            LEFT JOIN avis a ON a.produit_id = p.id
            WHERE $whereSQL
            GROUP BY v.id
            ORDER BY nb_produits DESC
        ");
        $stmt->execute($params);
        $boutiques = $stmt->fetchAll();
        
        jsonResponse(true, 'OK', ['boutiques' => $boutiques]);
        break;

    default:
        jsonResponse(false, 'Action inconnue', [], 404);
} 
?>