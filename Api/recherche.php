<?php
// ============================================================
//  IKYO – API Recherche avec TOUS les filtres
//  Fichier: api/recherche.php
//  GET /api/recherche.php?q=tshirt&wilaya=31&prix_min=1000...
// ============================================================

require_once '../config/database.php';

$db = getDB();

// ─────────────────────────────────────────────
//  RÉCUPÉRER TOUS LES PARAMÈTRES DE RECHERCHE
// ─────────────────────────────────────────────
$q            = sanitize($_GET['q']            ?? '');   // mot-clé libre
$wilaya_id    = (int)($_GET['wilaya']          ?? 0);    // ex: 31 = Oran
$categorie_id = (int)($_GET['categorie']       ?? 0);    // ex: 9 = T-shirts Homme
$prix_min     = (float)($_GET['prix_min']      ?? 0);
$prix_max     = (float)($_GET['prix_max']      ?? 0);
$couleur      = sanitize($_GET['couleur']      ?? '');   // rouge, bleu, noir...
$taille       = sanitize($_GET['taille']       ?? '');   // S, M, L, XL...
$genre        = sanitize($_GET['genre']        ?? '');   // homme, femme, enfant, unisexe
$marque       = sanitize($_GET['marque']       ?? '');
$note_min     = (float)($_GET['note_min']      ?? 0);    // 1 à 5
$en_promo     = isset($_GET['promo'])  ? (bool)$_GET['promo']  : false;
$en_stock     = isset($_GET['stock'])  ? (bool)$_GET['stock']  : false;
$tri          = sanitize($_GET['tri']          ?? 'pertinence'); // pertinence, prix_asc, prix_desc, note, ventes, nouveau
$page         = max(1, (int)($_GET['page']     ?? 1));
$par_page     = min(50, max(8, (int)($_GET['par_page'] ?? 20)));

// ─────────────────────────────────────────────
//  CONSTRUCTION DYNAMIQUE DE LA REQUÊTE SQL
// ─────────────────────────────────────────────
$where  = ["p.actif = 1"];
$params = [];
$joins  = "";

// ── Recherche par mot-clé (FULLTEXT + LIKE fallback) ────────
if ($q !== '') {
    $where[]  = "(MATCH(p.nom, p.description, p.marque) AGAINST (? IN BOOLEAN MODE) OR p.nom LIKE ? OR p.marque LIKE ?)";
    $params[] = $q . '*';
    $params[] = "%$q%";
    $params[] = "%$q%";
}

// ── Filtre par wilaya ────────────────────────────────────────
if ($wilaya_id > 0) {
    $where[]  = "p.wilaya_id = ?";
    $params[] = $wilaya_id;
}

// ── Filtre par catégorie (inclut sous-catégories) ───────────
if ($categorie_id > 0) {
    // Récupérer la catégorie ET ses enfants
    $catStmt = $db->prepare("SELECT id FROM categories WHERE id = ? OR parent_id = ?");
    $catStmt->execute([$categorie_id, $categorie_id]);
    $catIds = array_column($catStmt->fetchAll(), 'id');
    if ($catIds) {
        $placeholders = implode(',', array_fill(0, count($catIds), '?'));
        $where[]  = "p.categorie_id IN ($placeholders)";
        $params   = array_merge($params, $catIds);
    }
}

// ── Filtre par prix ──────────────────────────────────────────
if ($prix_min > 0) {
    $where[]  = "p.prix >= ?";
    $params[] = $prix_min;
}
if ($prix_max > 0) {
    $where[]  = "p.prix <= ?";
    $params[] = $prix_max;
}

// ── Filtre par couleur ───────────────────────────────────────
if ($couleur !== '') {
    $where[]  = "JSON_CONTAINS(p.couleurs, JSON_QUOTE(?))";
    $params[] = strtolower($couleur);
}

// ── Filtre par taille ────────────────────────────────────────
if ($taille !== '') {
    $where[]  = "JSON_CONTAINS(p.tailles, JSON_QUOTE(?))";
    $params[] = strtoupper($taille);
}

// ── Filtre par genre ─────────────────────────────────────────
if (in_array($genre, ['homme', 'femme', 'enfant', 'unisexe'])) {
    $where[]  = "p.genre = ?";
    $params[] = $genre;
}

// ── Filtre par marque ────────────────────────────────────────
if ($marque !== '') {
    $where[]  = "p.marque LIKE ?";
    $params[] = "%$marque%";
}

// ── Filtre par note minimum ──────────────────────────────────
if ($note_min > 0) {
    $where[]  = "p.note_moyenne >= ?";
    $params[] = $note_min;
}

// ── Filtre produits en promo ─────────────────────────────────
if ($en_promo) {
    $where[] = "p.prix_promo IS NOT NULL";
}

// ── Filtre en stock seulement ────────────────────────────────
if ($en_stock) {
    $where[] = "p.stock > 0";
}

// ─────────────────────────────────────────────
//  TRI
// ─────────────────────────────────────────────
$order = match($tri) {
    'prix_asc'   => "p.prix ASC",
    'prix_desc'  => "p.prix DESC",
    'note'       => "p.note_moyenne DESC, p.nb_avis DESC",
    'ventes'     => "p.nb_ventes DESC",
    'nouveau'    => "p.created_at DESC",
    'promo'      => "p.prix_promo ASC",
    default      => ($q ? "MATCH(p.nom, p.description, p.marque) AGAINST (?) DESC, p.nb_ventes DESC" : "p.nb_ventes DESC")
};

// ─────────────────────────────────────────────
//  COMPTE TOTAL (pour pagination)
// ─────────────────────────────────────────────
$whereSQL = implode(' AND ', $where);
$countSQL = "SELECT COUNT(*) as total FROM produits p $joins WHERE $whereSQL";
$countStmt = $db->prepare($countSQL);
$countStmt->execute($params);
$total = $countStmt->fetchColumn();

// ─────────────────────────────────────────────
//  REQUÊTE PRINCIPALE
// ─────────────────────────────────────────────
$offset  = ($page - 1) * $par_page;
$selectSQL = "
    SELECT 
        p.id,
        p.nom,
        p.slug,
        p.prix,
        p.prix_promo,
        p.stock,
        p.genre,
        p.marque,
        p.couleurs,
        p.tailles,
        p.note_moyenne,
        p.nb_avis,
        p.nb_ventes,
        p.created_at,
        c.nom       AS categorie_nom,
        c.slug      AS categorie_slug,
        w.nom       AS wilaya_nom,
        v.nom_magasin,
        v.id        AS vendeur_id,
        (SELECT url FROM produit_images pi WHERE pi.produit_id = p.id AND pi.principale = 1 LIMIT 1) AS image_url,
        CASE WHEN p.prix_promo IS NOT NULL 
             THEN ROUND((1 - p.prix_promo/p.prix)*100) 
             ELSE 0 END AS remise_pct
    FROM produits p
    LEFT JOIN categories c ON p.categorie_id = c.id
    LEFT JOIN wilayas    w ON p.wilaya_id    = w.id
    LEFT JOIN vendeurs   v ON p.vendeur_id   = v.id
    $joins
    WHERE $whereSQL
    ORDER BY $order
    LIMIT ? OFFSET ?
";

// Pour FULLTEXT dans ORDER BY on doit ajouter le paramètre
$execParams = $params;
if ($tri === 'pertinence' && $q) {
    array_unshift($execParams, $q . '*');
}
$execParams[] = $par_page;
$execParams[] = $offset;

$stmt = $db->prepare($selectSQL);
$stmt->execute($execParams);
$produits = $stmt->fetchAll();

// Décoder JSON (couleurs/tailles)
foreach ($produits as &$p) {
    $p['couleurs'] = json_decode($p['couleurs'] ?? '[]', true);
    $p['tailles']  = json_decode($p['tailles']  ?? '[]', true);
    $p['image_url'] = $p['image_url'] 
        ? UPLOAD_URL . $p['image_url'] 
        : BASE_URL . 'assets/no-image.jpg';
}

// ─────────────────────────────────────────────
//  FACETTES (filtres disponibles dans les résultats)
// ─────────────────────────────────────────────
$facetSQL = "
    SELECT 
        MIN(p.prix) as prix_min_disponible,
        MAX(p.prix) as prix_max_disponible,
        COUNT(DISTINCT p.marque) as nb_marques,
        COUNT(DISTINCT p.wilaya_id) as nb_wilayas
    FROM produits p $joins WHERE $whereSQL
";
$facetStmt = $db->prepare($facetSQL);
$facetStmt->execute($params);
$facettes = $facetStmt->fetch();

// ─────────────────────────────────────────────
//  SAUVEGARDER HISTORIQUE RECHERCHE
// ─────────────────────────────────────────────
$clientId = $_SESSION['client_id'] ?? null;
$hStmt = $db->prepare("
    INSERT INTO historique_recherches 
    (client_id, mot_cle, wilaya_id, categorie_id, prix_min, prix_max, couleur, genre, nb_resultats)
    VALUES (?,?,?,?,?,?,?,?,?)
");
$hStmt->execute([
    $clientId,
    $q ?: null,
    $wilaya_id ?: null,
    $categorie_id ?: null,
    $prix_min ?: null,
    $prix_max ?: null,
    $couleur ?: null,
    $genre ?: null,
    $total
]);

// ─────────────────────────────────────────────
//  RÉPONSE
// ─────────────────────────────────────────────
jsonResponse(true, "$total résultat(s) trouvé(s)", [
    'produits'    => $produits,
    'pagination'  => [
        'page'       => $page,
        'par_page'   => $par_page,
        'total'      => (int)$total,
        'nb_pages'   => (int)ceil($total / $par_page),
    ],
    'facettes'    => $facettes,
    'filtres_actifs' => array_filter([
        'q'           => $q,
        'wilaya_id'   => $wilaya_id ?: null,
        'categorie_id'=> $categorie_id ?: null,
        'prix_min'    => $prix_min ?: null,
        'prix_max'    => $prix_max ?: null,
        'couleur'     => $couleur,
        'taille'      => $taille,
        'genre'       => $genre,
        'marque'      => $marque,
        'en_promo'    => $en_promo ?: null,
        'tri'         => $tri,
    ])
]);