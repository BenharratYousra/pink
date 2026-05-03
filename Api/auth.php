<?php
// ============================================================
// IKYO – API Authentification (CORRIGÉ COMPLET)
// ============================================================

require_once '../config/database.php';

$action = $_GET['action'] ?? '';
$pdo = getDB();

// Lire les données POST (supporte JSON et FormData)
$rawInput = file_get_contents('php://input');
$postData = json_decode($rawInput, true);
if ($postData) {
    $_POST = array_merge($_POST, $postData);
}

// ========== TEST ==========
if ($action === 'test') {
    jsonResponse(true, 'API fonctionne!');
}

// ========== CLIENT REGISTER ==========
if ($action === 'client_register') {
    $prenom = trim($_POST['prenom'] ?? '');
    $nom = trim($_POST['nom'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $telephone = trim($_POST['telephone'] ?? '');
    $mot_de_passe = $_POST['mot_de_passe'] ?? '';
    $confirmer = $_POST['confirmer'] ?? '';
    
    if (empty($prenom) || empty($nom) || empty($email) || empty($mot_de_passe)) {
        jsonResponse(false, 'Tous les champs sont requis');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'Email invalide');
    }
    
    if (strlen($mot_de_passe) < 6) {
        jsonResponse(false, 'Mot de passe minimum 6 caractères');
    }
    
    if ($mot_de_passe !== $confirmer) {
        jsonResponse(false, 'Les mots de passe ne correspondent pas');
    }
    
    $stmt = $pdo->prepare("SELECT id FROM clients WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(false, 'Cet email est déjà utilisé');
    }
    
    $hash = password_hash($mot_de_passe, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO clients (prenom, nom, email, telephone, mot_de_passe) VALUES (?, ?, ?, ?, ?)");
    
    if ($stmt->execute([$prenom, $nom, $email, $telephone, $hash])) {
        $_SESSION['client_id'] = $pdo->lastInsertId();
        $_SESSION['client_email'] = $email;
        jsonResponse(true, 'Compte créé avec succès!', ['client_id' => $pdo->lastInsertId()]);
    } else {
        jsonResponse(false, 'Erreur lors de l\'inscription');
    }
}

// ========== CLIENT LOGIN ==========
if ($action === 'client_login') {
    $email = trim($_POST['email'] ?? '');
    $mot_de_passe = $_POST['mot_de_passe'] ?? '';
    
    if (empty($email) || empty($mot_de_passe)) {
        jsonResponse(false, 'Email et mot de passe requis');
    }
    
    $stmt = $pdo->prepare("SELECT * FROM clients WHERE email = ?");
    $stmt->execute([$email]);
    $client = $stmt->fetch();
    
    if ($client && password_verify($mot_de_passe, $client['mot_de_passe'])) {
        unset($client['mot_de_passe']);
        $_SESSION['client_id'] = $client['id'];
        $_SESSION['client_email'] = $client['email'];
        jsonResponse(true, 'Connexion réussie', ['client' => $client]);
    } else {
        jsonResponse(false, 'Email ou mot de passe incorrect');
    }
}

// ========== VENDEUR REGISTER ==========
if ($action === 'vendeur_register') {
    $prenom = trim($_POST['prenom'] ?? '');
    $nom = trim($_POST['nom'] ?? '');
    $magasin = trim($_POST['nom_magasin'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $telephone = trim($_POST['telephone'] ?? '');
    $wilaya_id = isset($_POST['wilaya_id']) ? (int)$_POST['wilaya_id'] : 0;
    $mot_de_passe = $_POST['mot_de_passe'] ?? '';
    
    if (empty($prenom) || empty($nom) || empty($magasin) || empty($email) || empty($mot_de_passe)) {
        jsonResponse(false, 'Tous les champs sont requis');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'Email invalide');
    }
    
    if (strlen($mot_de_passe) < 6) {
        jsonResponse(false, 'Mot de passe minimum 6 caractères');
    }
    
    $stmt = $pdo->prepare("SELECT id FROM vendeurs WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(false, 'Cet email est déjà enregistré');
    }
    
    $hash = password_hash($mot_de_passe, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO vendeurs (prenom, nom, nom_magasin, email, telephone, mot_de_passe, wilaya_id, statut) VALUES (?, ?, ?, ?, ?, ?, ?, 'en_attente')");
    
    if ($stmt->execute([$prenom, $nom, $magasin, $email, $telephone, $hash, $wilaya_id ?: null])) {
        jsonResponse(true, 'Demande envoyée ! Réponse sous 48h.');
    } else {
        jsonResponse(false, 'Erreur lors de l\'inscription');
    }
}

// ========== VENDEUR LOGIN ==========
if ($action === 'vendeur_login') {
    $email = trim($_POST['email'] ?? '');
    $mot_de_passe = $_POST['mot_de_passe'] ?? '';
    
    if (empty($email) || empty($mot_de_passe)) {
        jsonResponse(false, 'Email et mot de passe requis');
    }
    
    $stmt = $pdo->prepare("SELECT * FROM vendeurs WHERE email = ? AND statut = 'approuve'");
    $stmt->execute([$email]);
    $vendeur = $stmt->fetch();
    
    if ($vendeur && password_verify($mot_de_passe, $vendeur['mot_de_passe'])) {
        unset($vendeur['mot_de_passe']);
        $_SESSION['vendeur_id'] = $vendeur['id'];
        $_SESSION['vendeur_email'] = $vendeur['email'];
        jsonResponse(true, 'Connexion réussie', ['vendeur' => $vendeur]);
    } else {
        jsonResponse(false, 'Email ou mot de passe incorrect, ou compte non approuvé');
    }
}

// ========== CHECK SESSION (AJOUTÉ) ==========
if ($action === 'check_session') {
    if (isset($_SESSION['client_id'])) {
        $stmt = $pdo->prepare("SELECT id, prenom, nom, email FROM clients WHERE id = ?");
        $stmt->execute([$_SESSION['client_id']]);
        $user = $stmt->fetch();
        if ($user) {
            jsonResponse(true, 'Connecté', ['role' => 'client', 'id' => $user['id'], 'nom' => $user['prenom'] . ' ' . $user['nom']]);
        } else {
            jsonResponse(false, 'Session invalide');
        }
    } elseif (isset($_SESSION['vendeur_id'])) {
        $stmt = $pdo->prepare("SELECT id, prenom, nom, nom_magasin, email FROM vendeurs WHERE id = ?");
        $stmt->execute([$_SESSION['vendeur_id']]);
        $user = $stmt->fetch();
        if ($user) {
            jsonResponse(true, 'Connecté', ['role' => 'vendeur', 'id' => $user['id'], 'nom' => $user['nom_magasin']]);
        } else {
            jsonResponse(false, 'Session invalide');
        }
    } else {
        jsonResponse(false, 'Non connecté');
    }
}

// ========== LOGOUT ==========
if ($action === 'logout') {
    session_destroy();
    jsonResponse(true, 'Déconnecté');
}

jsonResponse(false, 'Action inconnue: ' . $action);
?>