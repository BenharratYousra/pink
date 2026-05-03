<?php
// ============================================================
// IKYO – API Dashboard Vendeur (CORRIGÉ + upload image)
// ============================================================

require_once '../config/database.php';

$action = $_GET['action'] ?? '';
$db = getDB();
$vendeurId = $_SESSION['vendeur_id'] ?? null;

if (!$vendeurId) {
    jsonResponse(false, 'Non connecté', [], 401);
}

switch ($action) {

    case 'stats':
        $rev = $db->prepare("
            SELECT COALESCE(SUM(total_final),0) as total
            FROM commandes
            WHERE vendeur_id=? AND MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
            AND statut NOT IN ('annulee','remboursee')
        ");
        $rev->execute([$vendeurId]);
        $revenus = $rev->fetchColumn();

        $cmd = $db->prepare("
            SELECT COUNT(*) FROM commandes
            WHERE vendeur_id=? AND MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
        ");
        $cmd->execute([$vendeurId]);
        $nbCommandes = $cmd->fetchColumn();

        $att = $db->prepare("SELECT COUNT(*) FROM commandes WHERE vendeur_id=? AND statut='en_attente'");
        $att->execute([$vendeurId]);
        $enAttente = $att->fetchColumn();

        $prod = $db->prepare("SELECT COUNT(*) FROM produits WHERE vendeur_id=? AND actif=1");
        $prod->execute([$vendeurId]);
        $nbProduits = $prod->fetchColumn();

        $note = $db->prepare("
            SELECT COALESCE(AVG(a.note),0)
            FROM avis a
            JOIN produits p ON a.produit_id=p.id
            WHERE p.vendeur_id=?
        ");
        $note->execute([$vendeurId]);
        $noteMoyenne = round($note->fetchColumn(), 1);

        $revPrev = $db->prepare("
            SELECT COALESCE(SUM(total_final),0)
            FROM commandes
            WHERE vendeur_id=? AND MONTH(created_at)=MONTH(NOW()-INTERVAL 1 MONTH)
            AND YEAR(created_at)=YEAR(NOW()-INTERVAL 1 MONTH)
            AND statut NOT IN ('annulee','remboursee')
        ");
        $revPrev->execute([$vendeurId]);
        $revenusPrev = $revPrev->fetchColumn();
        $pctRevenu = $revenusPrev > 0 ? round((($revenus - $revenusPrev) / $revenusPrev) * 100, 1) : 0;

        $rev12 = $db->prepare("
            SELECT MONTH(created_at) as mois, YEAR(created_at) as annee,
                   COALESCE(SUM(total_final),0) as total
            FROM commandes
            WHERE vendeur_id=? AND created_at >= NOW() - INTERVAL 12 MONTH
            AND statut NOT IN ('annulee','remboursee')
            GROUP BY YEAR(created_at), MONTH(created_at)
            ORDER BY annee ASC, mois ASC
        ");
        $rev12->execute([$vendeurId]);
        $revenus12 = $rev12->fetchAll();

        $statuts = $db->prepare("
            SELECT statut, COUNT(*) as nb
            FROM commandes
            WHERE vendeur_id=? AND MONTH(created_at)=MONTH(NOW())
            GROUP BY statut
        ");
        $statuts->execute([$vendeurId]);
        $statutsData = $statuts->fetchAll();

        jsonResponse(true, 'OK', [
            'revenus' => (float)$revenus,
            'revenus_pct' => $pctRevenu,
            'nb_commandes' => (int)$nbCommandes,
            'en_attente' => (int)$enAttente,
            'nb_produits' => (int)$nbProduits,
            'note_moyenne' => (float)$noteMoyenne,
            'revenus_12' => $revenus12,
            'statuts' => $statutsData,
        ]);
        break;

    // ⭐ NOUVEAU: AJOUTER UN PRODUIT AVEC UPLOAD D'IMAGE
    case 'ajouter_produit':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            // Essayer de lire depuis $_POST (form-data)
            $data = $_POST;
        }
        
        $nom = sanitize($data['nom'] ?? '');
        $description = sanitize($data['description'] ?? '');
        $prix = (float)($data['prix'] ?? 0);
        $stock = (int)($data['stock'] ?? 0);
        $categorie_id = (int)($data['categorie_id'] ?? 1);
        $marque = sanitize($data['marque'] ?? '');
        $genre = sanitize($data['genre'] ?? '');
        
        if (empty($nom) || $prix <= 0) {
            jsonResponse(false, 'Nom et prix requis');
        }
        
        $stmt = $db->prepare("
            INSERT INTO produits (vendeur_id, nom, description, prix, stock, categorie_id, marque, genre, actif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ");
        $stmt->execute([$vendeurId, $nom, $description, $prix, $stock, $categorie_id, $marque, $genre]);
        $produitId = $db->lastInsertId();
        
        // Gérer l'upload d'image si présente
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/products/';
            if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
            
            $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($ext, $allowed)) {
                $filename = uniqid() . '.' . $ext;
                move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $filename);
                
                $db->prepare("INSERT INTO produit_images (produit_id, url, principale) VALUES (?, ?, 1)")
                   ->execute([$produitId, $filename]);
            }
        }
        
        jsonResponse(true, 'Produit ajouté avec succès', ['produit_id' => $produitId]);
        break;

    case 'modifier_produit':
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $id = (int)($data['produit_id'] ?? 0);
        $nom = sanitize($data['nom'] ?? '');
        $prix = (float)($data['prix'] ?? 0);
        $stock = (int)($data['stock'] ?? 0);
        
        if (!$id) jsonResponse(false, 'ID produit requis');
        
        $db->prepare("
            UPDATE produits 
            SET nom=?, prix=?, stock=?
            WHERE id=? AND vendeur_id=?
        ")->execute([$nom, $prix, $stock, $id, $vendeurId]);
        
        jsonResponse(true, 'Produit modifié');
        break;

    case 'commandes':
        $limite = (int)($_GET['limite'] ?? 10);
        $statut = sanitize($_GET['statut'] ?? '');
        $q = sanitize($_GET['q'] ?? '');

        $where = ["c.vendeur_id = ?"];
        $params = [$vendeurId];

        if ($statut) { $where[] = "c.statut = ?"; $params[] = $statut; }
        if ($q) { $where[] = "(c.numero_commande LIKE ? OR CONCAT(cl.prenom,' ',cl.nom) LIKE ?)"; $params[] = "%$q%"; $params[] = "%$q%"; }

        $sql = "
            SELECT c.id, c.numero_commande, c.statut, c.total_final,
                   c.mode_paiement, c.created_at,
                   CONCAT(cl.prenom,' ',cl.nom) AS client_nom,
                   cl.telephone AS client_tel,
                   (SELECT COUNT(*) FROM commande_lignes cl2 WHERE cl2.commande_id=c.id) AS nb_articles
            FROM commandes c
            JOIN clients cl ON c.client_id = cl.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY c.created_at DESC
            LIMIT ?
        ";
        $params[] = $limite;
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $commandes = $stmt->fetchAll();

        jsonResponse(true, 'OK', ['commandes' => $commandes]);
        break;

    case 'produits':
        $stmt = $db->prepare("
            SELECT p.id, p.nom, p.prix, p.prix_promo, p.stock, p.nb_ventes,
                   p.note_moyenne, p.actif, p.marque,
                   c.nom AS categorie,
                   (SELECT url FROM produit_images pi WHERE pi.produit_id=p.id AND pi.principale=1 LIMIT 1) AS image
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.vendeur_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$vendeurId]);
        $produits = $stmt->fetchAll();
        jsonResponse(true, 'OK', ['produits' => $produits]);
        break;

    case 'clients':
        $stmt = $db->prepare("
            SELECT cl.id, CONCAT(cl.prenom,' ',cl.nom) AS nom, cl.email,
                   cl.telephone,
                   COUNT(DISTINCT c.id) AS nb_commandes,
                   COALESCE(SUM(c.total_final),0) AS total_depense,
                   MAX(c.created_at) AS dernier_achat
            FROM commandes c
            JOIN clients cl ON c.client_id = cl.id
            WHERE c.vendeur_id = ?
            GROUP BY cl.id
            ORDER BY total_depense DESC
        ");
        $stmt->execute([$vendeurId]);
        jsonResponse(true, 'OK', ['clients' => $stmt->fetchAll()]);
        break;

    case 'avis':
        $stmt = $db->prepare("
            SELECT a.note, a.commentaire, a.created_at,
                   CONCAT(cl.prenom,' ',SUBSTRING(cl.nom,1,1),'.') AS auteur,
                   p.nom AS produit_nom
            FROM avis a
            JOIN clients cl ON a.client_id = cl.id
            JOIN produits p ON a.produit_id = p.id
            WHERE p.vendeur_id = ?
            ORDER BY a.created_at DESC
            LIMIT 20
        ");
        $stmt->execute([$vendeurId]);
        jsonResponse(true, 'OK', ['avis' => $stmt->fetchAll()]);
        break;

    case 'changer_statut':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $commandeId = (int)($data['commande_id'] ?? 0);
        $statut = sanitize($data['statut'] ?? '');
        $statutsOK = ['confirmee','en_preparation','expediee','en_livraison','livree','annulee'];

        if (!in_array($statut, $statutsOK)) {
            jsonResponse(false, 'Statut invalide', [], 400);
        }
        $db->prepare("UPDATE commandes SET statut=? WHERE id=? AND vendeur_id=?")
           ->execute([$statut, $commandeId, $vendeurId]);
        jsonResponse(true, 'Statut mis à jour');
        break;

    case 'mon_profil':
        $stmt = $db->prepare("SELECT v.*, w.nom AS wilaya_nom FROM vendeurs v LEFT JOIN wilayas w ON v.wilaya_id=w.id WHERE v.id=?");
        $stmt->execute([$vendeurId]);
        $vendeur = $stmt->fetch();
        unset($vendeur['mot_de_passe']);
        jsonResponse(true, 'OK', ['vendeur' => $vendeur]);
        break;

    case 'modifier_profil':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $nomMagasin = sanitize($data['nom_magasin'] ?? '');
        $telephone = sanitize($data['telephone'] ?? '');
        $description = sanitize($data['description'] ?? '');
        $wilayaId = (int)($data['wilaya_id'] ?? 0);

        $db->prepare("UPDATE vendeurs SET nom_magasin=?, telephone=?, description=?, wilaya_id=? WHERE id=?")
           ->execute([$nomMagasin, $telephone, $description, $wilayaId ?: null, $vendeurId]);
        jsonResponse(true, 'Profil mis à jour');
        break;

    case 'supprimer_produit':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)($data['produit_id'] ?? 0);
        $db->prepare("UPDATE produits SET actif=0 WHERE id=? AND vendeur_id=?")->execute([$id, $vendeurId]);
        jsonResponse(true, 'Produit supprimé');
        break;

    default:
        jsonResponse(false, 'Action inconnue', [], 404);
}
?>