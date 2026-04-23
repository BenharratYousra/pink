<?php
// ============================================================
//  IKYO – API Commandes + Suivi GPS
//  Fichier: api/commandes.php
// ============================================================

require_once '../config/database.php';

$action = $_GET['action'] ?? '';
$db     = getDB();
$data   = json_decode(file_get_contents('php://input'), true) ?? $_POST;

switch ($action) {

    // ─── CRÉER UNE COMMANDE ──────────────────────────────────
    case 'creer':
        $clientId = $_SESSION['client_id'] ?? null;
        if (!$clientId) jsonResponse(false, 'Non connecté', [], 401);

        $adresse  = sanitize($data['adresse']  ?? '');
        $wilayaId = (int)($data['wilaya_id']   ?? 0);
        $commune  = sanitize($data['commune']  ?? '');
        $modePai  = sanitize($data['mode_paiement'] ?? 'especes');
        $notes    = sanitize($data['notes']    ?? '');
        $lat      = (float)($data['latitude']  ?? 0);
        $lng      = (float)($data['longitude'] ?? 0);
        $lignes   = $data['lignes']            ?? [];

        if (empty($lignes)) {
            jsonResponse(false, 'Panier vide', [], 400);
        }

        // Regrouper par vendeur
        $commandesParVendeur = [];
        foreach ($lignes as $ligne) {
            $prodId = (int)$ligne['produit_id'];
            $stmt   = $db->prepare("SELECT p.*, v.id AS vid, v.latitude_vendeur, v.longitude_vendeur FROM produits p JOIN vendeurs v ON p.vendeur_id=v.id WHERE p.id=? AND p.actif=1 AND p.stock>=?");
            $stmt->execute([$prodId, (int)($ligne['quantite'] ?? 1)]);
            $produit = $stmt->fetch();
            if (!$produit) continue;

            $vendeurId = $produit['vid'];
            if (!isset($commandesParVendeur[$vendeurId])) {
                $commandesParVendeur[$vendeurId] = [
                    'total'  => 0,
                    'lignes' => [],
                    'lat_v'  => $produit['latitude_vendeur'] ?? 0,
                    'lng_v'  => $produit['longitude_vendeur'] ?? 0,
                ];
            }
            $prixUnit = $produit['prix_promo'] ?? $produit['prix'];
            $commandesParVendeur[$vendeurId]['total']  += $prixUnit * (int)($ligne['quantite'] ?? 1);
            $commandesParVendeur[$vendeurId]['lignes'][] = [
                'produit_id' => $prodId,
                'quantite'   => (int)($ligne['quantite'] ?? 1),
                'prix_unit'  => $prixUnit,
                'couleur'    => $ligne['couleur'] ?? '',
                'taille'     => $ligne['taille']  ?? '',
                'stock'      => $produit['stock'],
            ];
        }

        $commandesCreees = [];
        $db->beginTransaction();
        try {
            foreach ($commandesParVendeur as $vendeurId => $cmd) {
                $fraisLivraison = $cmd['total'] >= 5000 ? 0 : 300; // Livraison gratuite >5000 DA
                $totalFinal     = $cmd['total'] + $fraisLivraison;
                $numeroCmd      = generateOrderNumber();

                $stmt = $db->prepare("
                    INSERT INTO commandes 
                    (client_id, vendeur_id, numero_commande, total_produits, frais_livraison, total_final, mode_paiement, adresse_livraison, wilaya_livraison, commune_livraison, notes_client, latitude_client, longitude_client, latitude_vendeur, longitude_vendeur)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ");
                $stmt->execute([
                    $clientId, $vendeurId, $numeroCmd,
                    $cmd['total'], $fraisLivraison, $totalFinal,
                    $modePai, $adresse, $wilayaId ?: null, $commune,
                    $notes, $lat ?: null, $lng ?: null,
                    $cmd['lat_v'] ?: null, $cmd['lng_v'] ?: null
                ]);
                $commandeId = $db->lastInsertId();

                // Insérer les lignes + décrémenter stock
                foreach ($cmd['lignes'] as $ligne) {
                    $stmt2 = $db->prepare("INSERT INTO commande_lignes (commande_id, produit_id, quantite, prix_unit, couleur, taille) VALUES (?,?,?,?,?,?)");
                    $stmt2->execute([$commandeId, $ligne['produit_id'], $ligne['quantite'], $ligne['prix_unit'], $ligne['couleur'], $ligne['taille']]);

                    $db->prepare("UPDATE produits SET stock = stock - ?, nb_ventes = nb_ventes + ? WHERE id = ?")->execute([$ligne['quantite'], $ligne['quantite'], $ligne['produit_id']]);
                }

                // Point GPS initial
                if ($cmd['lat_v'] && $cmd['lng_v']) {
                    $db->prepare("INSERT INTO suivi_gps (commande_id, latitude, longitude, statut_msg) VALUES (?,?,?,?)")
                       ->execute([$commandeId, $cmd['lat_v'], $cmd['lng_v'], 'Commande enregistrée au magasin']);
                }

                $commandesCreees[] = [
                    'commande_id'    => $commandeId,
                    'numero'         => $numeroCmd,
                    'total'          => $totalFinal,
                    'frais_livraison'=> $fraisLivraison,
                ];
            }

            // Vider panier
            $db->prepare("DELETE FROM panier WHERE client_id = ?")->execute([$clientId]);

            $db->commit();
            jsonResponse(true, 'Commande(s) créée(s) avec succès !', ['commandes' => $commandesCreees]);
        } catch (Exception $e) {
            $db->rollBack();
            jsonResponse(false, 'Erreur: ' . $e->getMessage(), [], 500);
        }
        break;

    // ─── MES COMMANDES (CLIENT) ──────────────────────────────
    case 'mes_commandes':
        $clientId = $_SESSION['client_id'] ?? null;
        if (!$clientId) jsonResponse(false, 'Non connecté', [], 401);

        $stmt = $db->prepare("
            SELECT c.*, w.nom AS wilaya_nom, v.nom_magasin,
                   (SELECT COUNT(*) FROM commande_lignes cl WHERE cl.commande_id = c.id) AS nb_articles
            FROM commandes c
            JOIN wilayas w ON c.wilaya_livraison = w.id
            JOIN vendeurs v ON c.vendeur_id = v.id
            WHERE c.client_id = ?
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$clientId]);
        jsonResponse(true, 'OK', ['commandes' => $stmt->fetchAll()]);
        break;

    // ─── DÉTAIL D'UNE COMMANDE ───────────────────────────────
    case 'detail':
        $commandeId = (int)($_GET['id'] ?? 0);
        $clientId   = $_SESSION['client_id'] ?? null;

        $stmt = $db->prepare("
            SELECT c.*, w.nom AS wilaya_nom, v.nom_magasin, v.telephone AS tel_vendeur
            FROM commandes c
            JOIN wilayas  w ON c.wilaya_livraison = w.id
            JOIN vendeurs v ON c.vendeur_id = v.id
            WHERE c.id = ? AND c.client_id = ?
        ");
        $stmt->execute([$commandeId, $clientId]);
        $commande = $stmt->fetch();
        if (!$commande) jsonResponse(false, 'Commande introuvable', [], 404);

        $stmt2 = $db->prepare("
            SELECT cl.*, p.nom AS produit_nom, p.slug,
                   (SELECT url FROM produit_images pi WHERE pi.produit_id = p.id AND pi.principale=1 LIMIT 1) AS image
            FROM commande_lignes cl
            JOIN produits p ON cl.produit_id = p.id
            WHERE cl.commande_id = ?
        ");
        $stmt2->execute([$commandeId]);
        $commande['lignes'] = $stmt2->fetchAll();

        // Récupérer dernier point GPS
        $stmt3 = $db->prepare("SELECT * FROM suivi_gps WHERE commande_id = ? ORDER BY enregistre_le DESC LIMIT 1");
        $stmt3->execute([$commandeId]);
        $commande['derniere_position'] = $stmt3->fetch();

        jsonResponse(true, 'OK', ['commande' => $commande]);
        break;

    // ─── SUIVI GPS – OBTENIR POSITIONS ──────────────────────
    case 'gps_positions':
        $commandeId = (int)($_GET['id'] ?? 0);
        $clientId   = $_SESSION['client_id'] ?? null;

        // Vérifier que la commande appartient au client
        $check = $db->prepare("SELECT id, statut, latitude_client, longitude_client FROM commandes WHERE id=? AND client_id=?");
        $check->execute([$commandeId, $clientId]);
        $commande = $check->fetch();
        if (!$commande) jsonResponse(false, 'Non autorisé', [], 403);

        $stmt = $db->prepare("SELECT * FROM suivi_gps WHERE commande_id = ? ORDER BY enregistre_le ASC");
        $stmt->execute([$commandeId]);
        $positions = $stmt->fetchAll();

        jsonResponse(true, 'OK', [
            'positions'       => $positions,
            'statut'          => $commande['statut'],
            'position_client' => [
                'lat' => $commande['latitude_client'],
                'lng' => $commande['longitude_client']
            ]
        ]);
        break;

    // ─── SUIVI GPS – METTRE À JOUR (livreur/vendeur) ────────
    case 'gps_update':
        $vendeurId  = $_SESSION['vendeur_id'] ?? null;
        if (!$vendeurId) jsonResponse(false, 'Non autorisé', [], 401);

        $commandeId = (int)($data['commande_id'] ?? 0);
        $lat        = (float)($data['latitude']  ?? 0);
        $lng        = (float)($data['longitude'] ?? 0);
        $msg        = sanitize($data['message']  ?? 'En route');
        $statut     = sanitize($data['statut']   ?? '');

        if (!$lat || !$lng) jsonResponse(false, 'Coordonnées manquantes', [], 400);

        $db->prepare("INSERT INTO suivi_gps (commande_id, latitude, longitude, statut_msg) VALUES (?,?,?,?)")
           ->execute([$commandeId, $lat, $lng, $msg]);

        // Mettre à jour statut commande si fourni
        $statutsValides = ['confirmee','en_preparation','expediee','en_livraison','livree'];
        if ($statut && in_array($statut, $statutsValides)) {
            $db->prepare("UPDATE commandes SET statut=? WHERE id=? AND vendeur_id=?")
               ->execute([$statut, $commandeId, $vendeurId]);
        }

        jsonResponse(true, 'Position mise à jour', ['timestamp' => date('Y-m-d H:i:s')]);
        break;

    // ─── COMMANDES DU VENDEUR ────────────────────────────────
    case 'vendeur_commandes':
        $vendeurId = $_SESSION['vendeur_id'] ?? null;
        if (!$vendeurId) jsonResponse(false, 'Non connecté', [], 401);

        $statut = sanitize($_GET['statut'] ?? '');
        $sql    = "SELECT c.*, CONCAT(cl.prenom,' ',cl.nom) AS client_nom, cl.telephone AS tel_client, w.nom AS wilaya_nom
                   FROM commandes c
                   JOIN clients  cl ON c.client_id  = cl.id
                   JOIN wilayas  w  ON c.wilaya_livraison = w.id
                   WHERE c.vendeur_id = ?";
        $params = [$vendeurId];

        if ($statut) { $sql .= " AND c.statut = ?"; $params[] = $statut; }
        $sql .= " ORDER BY c.created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        jsonResponse(true, 'OK', ['commandes' => $stmt->fetchAll()]);
        break;

    // ─── CHANGER STATUT (vendeur) ─────────────────────────────
    case 'changer_statut':
        $vendeurId  = $_SESSION['vendeur_id'] ?? null;
        if (!$vendeurId) jsonResponse(false, 'Non autorisé', [], 401);

        $commandeId = (int)($data['commande_id'] ?? 0);
        $statut     = sanitize($data['statut']   ?? '');
        $statutsOK  = ['confirmee','en_preparation','expediee','en_livraison','livree','annulee'];

        if (!in_array($statut, $statutsOK)) jsonResponse(false, 'Statut invalide', [], 400);

        $db->prepare("UPDATE commandes SET statut=? WHERE id=? AND vendeur_id=?")
           ->execute([$statut, $commandeId, $vendeurId]);

        jsonResponse(true, "Commande #$commandeId → $statut");
        break;

    default:
        jsonResponse(false, 'Action inconnue', [], 404);
}