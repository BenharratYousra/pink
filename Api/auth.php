<?php
// ============================================================
//  IKYO – API Authentification
//  Fichier: api/auth.php
//  Appels: POST /api/auth.php?action=...
// ============================================================

require_once '../config/database.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data   = json_decode(file_get_contents('php://input'), true) ?? $_POST;

switch ($action) {

    // ─── CONNEXION CLIENT ───────────────────────────────────
    case 'client_login':
        $email = strtolower(trim($data['email'] ?? ''));
        $mdp   = $data['mot_de_passe'] ?? '';

        if (!$email || !$mdp) {
            jsonResponse(false, 'Email et mot de passe requis', [], 400);
        }

        $db   = getDB();
        $stmt = $db->prepare("SELECT * FROM clients WHERE email = ? AND actif = 1 LIMIT 1");
        $stmt->execute([$email]);
        $client = $stmt->fetch();

        if (!$client || !password_verify($mdp, $client['mot_de_passe'])) {
            jsonResponse(false, 'Email ou mot de passe incorrect', [], 401);
        }

        // Stocker session
        $_SESSION['client_id']   = $client['id'];
        $_SESSION['client_nom']  = $client['prenom'] . ' ' . $client['nom'];
        $_SESSION['client_role'] = 'client';

        unset($client['mot_de_passe']); // ne jamais renvoyer le mdp
        jsonResponse(true, 'Connexion réussie', ['client' => $client, 'redirect' => 'index.html']);
        break;

    // ─── INSCRIPTION CLIENT ──────────────────────────────────
    case 'client_register':
        $prenom = sanitize($data['prenom'] ?? '');
        $nom    = sanitize($data['nom']    ?? '');
        $email  = strtolower(trim($data['email'] ?? ''));
        $tel    = sanitize($data['telephone'] ?? '');
        $mdp    = $data['mot_de_passe'] ?? '';
        $mdp2   = $data['confirmer']    ?? '';

        // Validations
        if (!$prenom || !$nom || !$email || !$mdp) {
            jsonResponse(false, 'Tous les champs obligatoires', [], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, 'Email invalide', [], 400);
        }
        if (strlen($mdp) < 6) {
            jsonResponse(false, 'Mot de passe minimum 6 caractères', [], 400);
        }
        if ($mdp !== $mdp2) {
            jsonResponse(false, 'Les mots de passe ne correspondent pas', [], 400);
        }

        $db = getDB();
        // Vérifier email unique
        $check = $db->prepare("SELECT id FROM clients WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            jsonResponse(false, 'Cet email est déjà utilisé', [], 409);
        }

        $hash = password_hash($mdp, PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO clients (prenom, nom, email, telephone, mot_de_passe) VALUES (?,?,?,?,?)");
        $stmt->execute([$prenom, $nom, $email, $tel, $hash]);
        $newId = $db->lastInsertId();

        $_SESSION['client_id']   = $newId;
        $_SESSION['client_nom']  = "$prenom $nom";
        $_SESSION['client_role'] = 'client';

        jsonResponse(true, 'Compte créé avec succès !', ['client_id' => $newId, 'redirect' => 'index.html']);
        break;

    // ─── CONNEXION VENDEUR ───────────────────────────────────
    case 'vendeur_login':
        $email = strtolower(trim($data['email'] ?? ''));
        $mdp   = $data['mot_de_passe'] ?? '';

        $db   = getDB();
        $stmt = $db->prepare("SELECT * FROM vendeurs WHERE email = ? AND statut = 'approuve' LIMIT 1");
        $stmt->execute([$email]);
        $vendeur = $stmt->fetch();

        if (!$vendeur || !password_verify($mdp, $vendeur['mot_de_passe'])) {
            jsonResponse(false, 'Identifiants incorrects ou compte non approuvé', [], 401);
        }

        $_SESSION['vendeur_id']   = $vendeur['id'];
        $_SESSION['vendeur_nom']  = $vendeur['nom_magasin'];
        $_SESSION['vendeur_role'] = 'vendeur';

        unset($vendeur['mot_de_passe']);
        jsonResponse(true, 'Connexion réussie', ['vendeur' => $vendeur, 'redirect' => 'dashboard.html']);
        break;

    // ─── INSCRIPTION VENDEUR ─────────────────────────────────
    case 'vendeur_register':
        $prenom   = sanitize($data['prenom']       ?? '');
        $nom      = sanitize($data['nom']          ?? '');
        $magasin  = sanitize($data['nom_magasin']  ?? '');
        $email    = strtolower(trim($data['email'] ?? ''));
        $tel      = sanitize($data['telephone']    ?? '');
        $wilayaId = (int)($data['wilaya_id']       ?? 0);
        $mdp      = $data['mot_de_passe']          ?? '';

        if (!$prenom || !$nom || !$magasin || !$email || !$mdp) {
            jsonResponse(false, 'Tous les champs sont requis', [], 400);
        }

        $db    = getDB();
        $check = $db->prepare("SELECT id FROM vendeurs WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            jsonResponse(false, 'Cet email est déjà enregistré', [], 409);
        }

        $hash = password_hash($mdp, PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO vendeurs (prenom, nom, nom_magasin, email, telephone, mot_de_passe, wilaya_id, statut) VALUES (?,?,?,?,?,?,?,'en_attente')");
        $stmt->execute([$prenom, $nom, $magasin, $email, $tel, $hash, $wilayaId ?: null]);

        // ── Notifications email ─────────────────────────────
        $vendeurData = [
            'prenom'      => $prenom,
            'nom'         => $nom,
            'nom_magasin' => $magasin,
            'email'       => $email,
            'telephone'   => $tel,
            'wilaya'      => $data['wilaya'] ?? ''
        ];
        $emailFile = dirname(__DIR__) . '/config/email.php';
        if (file_exists($emailFile)) {
            require_once $emailFile;
            emailNotifAdmin($vendeurData);
            emailAccuseReception($vendeurData);
        }

        jsonResponse(true, 'Demande envoyée ! Vous serez contacté après vérification sous 24h.', []);
        break;

    // ─── DÉCONNEXION ─────────────────────────────────────────
    case 'logout':
        session_destroy();
        jsonResponse(true, 'Déconnecté', ['redirect' => 'login.html']);
        break;

    // ─── VÉRIFIER SESSION ────────────────────────────────────
    case 'check_session':
        if (isset($_SESSION['client_id'])) {
            jsonResponse(true, 'Connecté', [
                'role'    => 'client',
                'user_id' => $_SESSION['client_id'],
                'nom'     => $_SESSION['client_nom']
            ]);
        } elseif (isset($_SESSION['vendeur_id'])) {
            jsonResponse(true, 'Connecté', [
                'role'    => 'vendeur',
                'user_id' => $_SESSION['vendeur_id'],
                'nom'     => $_SESSION['vendeur_nom']
            ]);
        } else {
            jsonResponse(false, 'Non connecté', [], 401);
        }
        break;

    // ─── MOT DE PASSE OUBLIÉ ─────────────────────────────────
    case 'forgot_password':
        $email = strtolower(trim($data['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, 'Email invalide', [], 400);
        }

        $db   = getDB();
        $stmt = $db->prepare("SELECT id FROM clients WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // On répond toujours "succès" pour la sécurité
        jsonResponse(true, 'Si cet email existe, un lien a été envoyé.', []);
        break;

    default:
        jsonResponse(false, 'Action inconnue', [], 404);
}