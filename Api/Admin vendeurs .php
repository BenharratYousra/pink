<?php
// ============================================================
//  IKYO – API Admin — Gestion Vendeurs
//  Fichier: api/admin_vendeurs.php
//  ⚠️  Protéger par mot de passe admin (session ou .htaccess)
// ============================================================

require_once '../config/database.php';
require_once '../config/email.php';

// ── Vérification session admin ───────────────────────────────
// Pour simplifier : on vérifie un flag admin en session
// En production : ajoutez une table admins avec son propre login
$ADMIN_PASS = 'ikyo2026'; // ← Changez ce mot de passe !

if (!isset($_SESSION['admin_ok'])) {
    // Authentification simple par mot de passe GET/POST (à améliorer en prod)
    $adminKey = $_GET['key'] ?? $_POST['key'] ?? '';
    if ($adminKey !== $ADMIN_PASS) {
        jsonResponse(false, 'Accès refusé', [], 403);
    }
    $_SESSION['admin_ok'] = true;
}

$action = $_GET['action'] ?? '';
$db     = getDB();
$data   = json_decode(file_get_contents('php://input'), true) ?? $_POST;

switch ($action) {

    // ─── LISTE TOUS LES VENDEURS ─────────────────────────────
    case 'liste':
        $stmt = $db->prepare("
            SELECT v.*, w.nom AS wilaya_nom
            FROM vendeurs v
            LEFT JOIN wilayas w ON v.wilaya_id = w.id
            ORDER BY 
                CASE v.statut 
                    WHEN 'en_attente' THEN 0
                    WHEN 'approuve'   THEN 1
                    ELSE 2 
                END,
                v.created_at DESC
        ");
        $stmt->execute();
        $vendeurs = $stmt->fetchAll();
        // Supprimer mots de passe de la réponse
        foreach ($vendeurs as &$v) unset($v['mot_de_passe']);
        jsonResponse(true, 'OK', ['vendeurs' => $vendeurs]);
        break;

    // ─── APPROUVER UN VENDEUR ────────────────────────────────
    case 'approuver':
        $vendeurId = (int)($data['vendeur_id'] ?? 0);
        $mdp       = $data['mot_de_passe']     ?? '';
        $shopName  = sanitize($data['nom_magasin'] ?? '');

        if (!$vendeurId || !$mdp) {
            jsonResponse(false, 'Données manquantes', [], 400);
        }

        // Récupérer le vendeur
        $stmt = $db->prepare("SELECT * FROM vendeurs WHERE id = ?");
        $stmt->execute([$vendeurId]);
        $vendeur = $stmt->fetch();
        if (!$vendeur) jsonResponse(false, 'Vendeur introuvable', [], 404);

        // Hasher le mot de passe
        $hash = password_hash($mdp, PASSWORD_BCRYPT);

        // Mettre à jour statut + mot de passe + nom magasin si fourni
        $db->prepare("
            UPDATE vendeurs 
            SET statut = 'approuve', 
                mot_de_passe = ?,
                nom_magasin = COALESCE(NULLIF(?, ''), nom_magasin),
                approuve_le = NOW()
            WHERE id = ?
        ")->execute([$hash, $shopName, $vendeurId]);

        // Créer la boutique automatiquement (si table boutiques existe)
        try {
            $db->prepare("
                INSERT IGNORE INTO boutiques (vendeur_id, nom, description, actif)
                VALUES (?, ?, 'Bienvenue sur ma boutique IKYO !', 1)
            ")->execute([$vendeurId, $vendeur['nom_magasin']]);
        } catch (Exception $e) {
            // Table boutiques optionnelle — ne pas bloquer si elle n'existe pas
        }

        // Envoyer email au vendeur avec ses identifiants
        $vendeurData = [
            'prenom'      => $vendeur['prenom'],
            'nom'         => $vendeur['nom'],
            'nom_magasin' => $shopName ?: $vendeur['nom_magasin'],
            'email'       => $vendeur['email'],
            'telephone'   => $vendeur['telephone'],
        ];
        $emailSent = emailCompteApprouve($vendeurData, $mdp);

        jsonResponse(true, 'Vendeur approuvé' . ($emailSent ? ' — email envoyé' : ' (email non envoyé)'), [
            'email_sent' => $emailSent,
            'vendeur_id' => $vendeurId
        ]);
        break;

    // ─── REFUSER / SUSPENDRE UN VENDEUR ─────────────────────
    case 'refuser':
        $vendeurId = (int)($data['vendeur_id'] ?? 0);
        $raison    = sanitize($data['raison']  ?? '');

        $stmt = $db->prepare("SELECT * FROM vendeurs WHERE id = ?");
        $stmt->execute([$vendeurId]);
        $vendeur = $stmt->fetch();
        if (!$vendeur) jsonResponse(false, 'Vendeur introuvable', [], 404);

        $db->prepare("UPDATE vendeurs SET statut = 'refuse' WHERE id = ?")
           ->execute([$vendeurId]);

        // Envoyer email de refus
        $vendeurData = [
            'prenom'      => $vendeur['prenom'],
            'nom'         => $vendeur['nom'],
            'nom_magasin' => $vendeur['nom_magasin'],
            'email'       => $vendeur['email'],
        ];
        $emailSent = emailDemandeRefusee($vendeurData, $raison);

        jsonResponse(true, 'Demande refusée' . ($emailSent ? ' — email envoyé' : ''), [
            'email_sent' => $emailSent
        ]);
        break;

    // ─── DÉTAIL VENDEUR ──────────────────────────────────────
    case 'detail':
        $vendeurId = (int)($_GET['id'] ?? 0);
        $stmt = $db->prepare("
            SELECT v.*, w.nom AS wilaya_nom,
                   COUNT(DISTINCT p.id) AS nb_produits,
                   COUNT(DISTINCT c.id) AS nb_commandes
            FROM vendeurs v
            LEFT JOIN wilayas w ON v.wilaya_id = w.id
            LEFT JOIN produits p ON p.vendeur_id = v.id
            LEFT JOIN commandes c ON c.vendeur_id = v.id
            WHERE v.id = ?
            GROUP BY v.id
        ");
        $stmt->execute([$vendeurId]);
        $vendeur = $stmt->fetch();
        if (!$vendeur) jsonResponse(false, 'Vendeur introuvable', [], 404);
        unset($vendeur['mot_de_passe']);
        jsonResponse(true, 'OK', ['vendeur' => $vendeur]);
        break;

    // ─── STATS RAPIDES ───────────────────────────────────────
    case 'stats':
        $stats = [];
        foreach (['en_attente', 'approuve', 'refuse'] as $s) {
            $r = $db->prepare("SELECT COUNT(*) FROM vendeurs WHERE statut = ?");
            $r->execute([$s]);
            $stats[$s] = (int)$r->fetchColumn();
        }
        $stats['total'] = array_sum($stats);
        jsonResponse(true, 'OK', ['stats' => $stats]);
        break;

    default:
        jsonResponse(false, 'Action inconnue', [], 404);
}