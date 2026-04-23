<?php
// ============================================================
//  IKYO – API Dashboard Vendeur (données réelles)
//  Fichier: api/dashboard.php
// ============================================================

require_once '../config/database.php';

$action    = $_GET['action'] ?? '';
$db        = getDB();
$vendeurId = $_SESSION['vendeur_id'] ?? null;

// Pour test sans session, décommenter la ligne suivante :
// $vendeurId = 1;

if (!$vendeurId) {
    jsonResponse(false, 'Non connecté', [], 401);
}

switch ($action) {

    // ─── STATS GÉNÉRALES ─────────────────────────────────────
    case 'stats':
        // Revenus ce mois
        $rev = $db->prepare("
            SELECT COALESCE(SUM(total_final),0) as total
            FROM commandes
            WHERE vendeur_id=? AND MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
            AND statut NOT IN ('annulee','remboursee')
        ");
        $rev->execute([$vendeurId]);
        $revenus = $rev->fetchColumn();

        // Total commandes ce mois
        $cmd = $db->prepare("
            SELECT COUNT(*) FROM commandes
            WHERE vendeur_id=? AND MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
        ");
        $cmd->execute([$vendeurId]);
        $nbCommandes = $cmd->fetchColumn();

        // Commandes en attente
        $att = $db->prepare("SELECT COUNT(*) FROM commandes WHERE vendeur_id=? AND statut='en_attente'");
        $att->execute([$vendeurId]);
        $enAttente = $att->fetchColumn();

        // Produits actifs
        $prod = $db->prepare("SELECT COUNT(*) FROM produits WHERE vendeur_id=? AND actif=1");
        $prod->execute([$vendeurId]);
        $nbProduits = $prod->fetchColumn();

        // Note moyenne vendeur
        $note = $db->prepare("
            SELECT COALESCE(AVG(a.note),0)
            FROM avis a
            JOIN produits p ON a.produit_id=p.id
            WHERE p.vendeur_id=?
        ");
        $note->execute([$vendeurId]);
        $noteMoyenne = round($note->fetchColumn(), 1);

        // Revenus mois précédent (pour calcul %)
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

        // Revenus 12 derniers mois
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

        // Statuts commandes ce mois
        $statuts = $db->prepare("
            SELECT statut, COUNT(*) as nb
            FROM commandes
            WHERE vendeur_id=? AND MONTH(created_at)=MONTH(NOW())
            GROUP BY statut
        ");
        $statuts->execute([$vendeurId]);
        $statutsData = $statuts->fetchAll();

        jsonResponse(true, 'OK', [
            'revenus'      => (float)$revenus,
            'revenus_pct'  => $pctRevenu,
            'nb_commandes' => (int)$nbCommandes,
            'en_attente'   => (int)$enAttente,
            'nb_produits'  => (int)$nbProduits,
            'note_moyenne' => (float)$noteMoyenne,
            'revenus_12'   => $revenus12,
            'statuts'      => $statutsData,
        ]);
        break;

    // ─── DERNIÈRES COMMANDES ──────────────────────────────────
    case 'commandes':
        $limite = (int)($_GET['limite'] ?? 10);
        $statut = sanitize($_GET['statut'] ?? '');
        $q      = sanitize($_GET['q'] ?? '');

        $where  = ["c.vendeur_id = ?"];
        $params = [$vendeurId];

        if ($statut) { $where[] = "c.statut = ?"; $params[] = $statut; }
        if ($q)      { $where[] = "(c.numero_commande LIKE ? OR CONCAT(cl.prenom,' ',cl.nom) LIKE ?)"; $params[] = "%$q%"; $params[] = "%$q%"; }

        $sql = "
            SELECT c.id, c.numero_commande, c.statut, c.total_final,
                   c.mode_paiement, c.created_at, c.wilaya_livraison,
                   c.adresse_livraison, c.commune_livraison,
                   CONCAT(cl.prenom,' ',cl.nom) AS client_nom,
                   cl.telephone AS client_tel,
                   w.nom AS wilaya_nom,
                   (SELECT COUNT(*) FROM commande_lignes cl2 WHERE cl2.commande_id=c.id) AS nb_articles
            FROM commandes c
            JOIN clients cl ON c.client_id = cl.id
            LEFT JOIN wilayas w ON c.wilaya_livraison = w.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY c.created_at DESC
            LIMIT ?
        ";
        $params[] = $limite;
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $commandes = $stmt->fetchAll();

        // Total count
        $countSql = "SELECT COUNT(*) FROM commandes c JOIN clients cl ON c.client_id=cl.id WHERE " . implode(' AND ', array_slice($where, 0));
        $countStmt = $db->prepare($countSql);
        $countStmt->execute(array_slice($params, 0, -1));
        $total = $countStmt->fetchColumn();

        jsonResponse(true, 'OK', ['commandes' => $commandes, 'total' => (int)$total]);
        break;

    // ─── MES PRODUITS ────────────────────────────────────────
    case 'produits':
        $stmt = $db->prepare("
            SELECT p.id, p.nom, p.prix, p.prix_promo, p.stock, p.nb_ventes,
                   p.note_moyenne, p.nb_avis, p.actif, p.marque, p.genre,
                   p.couleurs, p.tailles, p.created_at,
                   c.nom AS categorie,
                   (SELECT url FROM produit_images pi WHERE pi.produit_id=p.id AND pi.principale=1 LIMIT 1) AS image
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.vendeur_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$vendeurId]);
        $produits = $stmt->fetchAll();
        foreach ($produits as &$p) {
            $p['couleurs'] = json_decode($p['couleurs'] ?? '[]', true);
            $p['tailles']  = json_decode($p['tailles']  ?? '[]', true);
        }
        jsonResponse(true, 'OK', ['produits' => $produits]);
        break;

    // ─── MES CLIENTS ─────────────────────────────────────────
    case 'clients':
        $stmt = $db->prepare("
            SELECT cl.id, CONCAT(cl.prenom,' ',cl.nom) AS nom, cl.email,
                   cl.telephone, w.nom AS wilaya,
                   COUNT(DISTINCT c.id) AS nb_commandes,
                   COALESCE(SUM(c.total_final),0) AS total_depense,
                   MAX(c.created_at) AS dernier_achat
            FROM commandes c
            JOIN clients cl ON c.client_id = cl.id
            LEFT JOIN wilayas w ON cl.wilaya_id = w.id
            WHERE c.vendeur_id = ?
            GROUP BY cl.id
            ORDER BY total_depense DESC
        ");
        $stmt->execute([$vendeurId]);
        jsonResponse(true, 'OK', ['clients' => $stmt->fetchAll()]);
        break;

    // ─── MES AVIS ────────────────────────────────────────────
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
        $avis = $stmt->fetchAll();

        // Stats avis
        $statsAvis = $db->prepare("
            SELECT COUNT(*) as total, AVG(note) as moyenne,
                   SUM(note=5) as n5, SUM(note=4) as n4,
                   SUM(note=3) as n3, SUM(note=2) as n2, SUM(note=1) as n1
            FROM avis a JOIN produits p ON a.produit_id=p.id
            WHERE p.vendeur_id=?
        ");
        $statsAvis->execute([$vendeurId]);
        $statsAvis = $statsAvis->fetch();

        jsonResponse(true, 'OK', ['avis' => $avis, 'stats' => $statsAvis]);
        break;

    // ─── TOP PRODUITS ─────────────────────────────────────────
    case 'top_produits':
        $stmt = $db->prepare("
            SELECT p.id, p.nom, p.prix, p.nb_ventes,
                   COALESCE(SUM(p.prix * p.nb_ventes), 0) AS revenus,
                   (SELECT url FROM produit_images pi WHERE pi.produit_id=p.id AND pi.principale=1 LIMIT 1) AS image
            FROM produits p
            WHERE p.vendeur_id = ? AND p.actif = 1
            GROUP BY p.id
            ORDER BY p.nb_ventes DESC
            LIMIT 5
        ");
        $stmt->execute([$vendeurId]);
        jsonResponse(true, 'OK', ['produits' => $stmt->fetchAll()]);
        break;

    // ─── VENTES PAR WILAYA ────────────────────────────────────
    case 'ventes_wilaya':
        $stmt = $db->prepare("
            SELECT w.nom AS wilaya, COUNT(*) AS nb_commandes,
                   COALESCE(SUM(c.total_final),0) AS total
            FROM commandes c
            JOIN wilayas w ON c.wilaya_livraison = w.id
            WHERE c.vendeur_id = ? AND c.statut NOT IN ('annulee','remboursee')
            GROUP BY w.id
            ORDER BY total DESC
            LIMIT 8
        ");
        $stmt->execute([$vendeurId]);
        jsonResponse(true, 'OK', ['wilayas' => $stmt->fetchAll()]);
        break;

    // ─── CHANGER STATUT COMMANDE ──────────────────────────────
    case 'changer_statut':
        $data       = json_decode(file_get_contents('php://input'), true) ?? [];
        $commandeId = (int)($data['commande_id'] ?? 0);
        $statut     = sanitize($data['statut'] ?? '');
        $statutsOK  = ['confirmee','en_preparation','expediee','en_livraison','livree','annulee'];

        if (!in_array($statut, $statutsOK)) {
            jsonResponse(false, 'Statut invalide', [], 400);
        }
        $db->prepare("UPDATE commandes SET statut=? WHERE id=? AND vendeur_id=?")
           ->execute([$statut, $commandeId, $vendeurId]);
        jsonResponse(true, 'Statut mis à jour');
        break;

    // ─── INFO VENDEUR ─────────────────────────────────────────
    case 'mon_profil':
        $stmt = $db->prepare("SELECT v.*, w.nom AS wilaya_nom FROM vendeurs v LEFT JOIN wilayas w ON v.wilaya_id=w.id WHERE v.id=?");
        $stmt->execute([$vendeurId]);
        $vendeur = $stmt->fetch();
        unset($vendeur['mot_de_passe']);
        jsonResponse(true, 'OK', ['vendeur' => $vendeur]);
        break;

    // ─── MODIFIER PROFIL ──────────────────────────────────────
    case 'modifier_profil':
        $data       = json_decode(file_get_contents('php://input'), true) ?? [];
        $nomMagasin = sanitize($data['nom_magasin'] ?? '');
        $telephone  = sanitize($data['telephone']   ?? '');
        $description= sanitize($data['description'] ?? '');
        $wilayaId   = (int)($data['wilaya_id']      ?? 0);

        $db->prepare("UPDATE vendeurs SET nom_magasin=?, telephone=?, description=?, wilaya_id=? WHERE id=?")
           ->execute([$nomMagasin, $telephone, $description, $wilayaId ?: null, $vendeurId]);
        jsonResponse(true, 'Profil mis à jour');
        break;

    // ─── SUPPRIMER PRODUIT ────────────────────────────────────
    case 'supprimer_produit':
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id   = (int)($data['produit_id'] ?? 0);
        $db->prepare("UPDATE produits SET actif=0 WHERE id=? AND vendeur_id=?")->execute([$id, $vendeurId]);
        jsonResponse(true, 'Produit supprimé');
        break;

    // ─── NOTIFICATIONS ────────────────────────────────────────
    case 'notifications':
        // Nouvelles commandes (dernières 24h)
        $stmt = $db->prepare("
            SELECT 'commande' AS type, numero_commande AS ref,
                   total_final AS montant, created_at
            FROM commandes
            WHERE vendeur_id=? AND created_at >= NOW() - INTERVAL 24 HOUR
            ORDER BY created_at DESC LIMIT 5
        ");
        $stmt->execute([$vendeurId]);
        $notifs = $stmt->fetchAll();

        // Stock faible
        $stock = $db->prepare("SELECT nom, stock FROM produits WHERE vendeur_id=? AND stock <= 5 AND stock > 0 AND actif=1");
        $stock->execute([$vendeurId]);
        foreach ($stock->fetchAll() as $s) {
            $notifs[] = ['type' => 'stock', 'ref' => $s['nom'], 'montant' => $s['stock'], 'created_at' => date('Y-m-d H:i:s')];
        }

        // Nouveaux avis
        $avis = $db->prepare("
            SELECT 'avis' AS type, p.nom AS ref, a.note AS montant, a.created_at
            FROM avis a JOIN produits p ON a.produit_id=p.id
            WHERE p.vendeur_id=? AND a.created_at >= NOW() - INTERVAL 48 HOUR
            ORDER BY a.created_at DESC LIMIT 3
        ");
        $avis->execute([$vendeurId]);
        foreach ($avis->fetchAll() as $a) { $notifs[] = $a; }

        jsonResponse(true, 'OK', ['notifications' => $notifs, 'nb' => count($notifs)]);
        break;

    default:
        jsonResponse(false, 'Action inconnue', [], 404);
}