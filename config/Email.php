<?php
// ============================================================
//  IKYO – Helper Emails
//  Fichier: config/email.php
//  Nécessite PHPMailer: composer require phpmailer/phpmailer
//  OU utilise mail() natif PHP (XAMPP: activer sendmail ou SMTP)
// ============================================================

// ─── CONFIG EMAIL ADMIN ──────────────────────────────────────
define('ADMIN_EMAIL',   'admin@ikyo.dz');       // votre email admin
define('ADMIN_NAME',    'IKYO Admin');
define('FROM_EMAIL',    'no-reply@ikyo.dz');
define('FROM_NAME',     'IKYO Marketplace');
define('SITE_NAME',     'IKYO');
define('SITE_URL',      'http://localhost/ikyo/');
define('ADMIN_PANEL',   'http://localhost/ikyo/admin/vendeurs.php');

// ─────────────────────────────────────────────
//  Fonction principale d'envoi
// ─────────────────────────────────────────────
function sendEmail(string $to, string $toName, string $subject, string $htmlBody): bool {
    // Option 1 : PHPMailer (si installé via Composer)
    if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        return _sendViaPHPMailer($to, $toName, $subject, $htmlBody);
    }
    // Option 2 : mail() natif PHP (XAMPP avec sendmail configuré)
    return _sendViaNativeMail($to, $toName, $subject, $htmlBody);
}

function _sendViaNativeMail(string $to, string $toName, string $subject, string $htmlBody): bool {
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . FROM_NAME . " <" . FROM_EMAIL . ">\r\n";
    $headers .= "Reply-To: " . FROM_EMAIL . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    return mail($to, $subject, $htmlBody, $headers);
}

function _sendViaPHPMailer(string $to, string $toName, string $subject, string $htmlBody): bool {
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        // SMTP (Gmail exemple — remplacez par votre config)
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'yousrabenharrat30@gmail.com';   // ← changez
        $mail->Password   = 'ymmd lmtb oddd uscu'; // ← changez (App Password Gmail)
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(FROM_EMAIL, FROM_NAME);
        $mail->addAddress($to, $toName);
        $mail->Subject = $subject;
        $mail->isHTML(true);
        $mail->Body    = $htmlBody;
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email error: " . $e->getMessage());
        return false;
    }
}

// ─────────────────────────────────────────────
//  Template HTML de base (commun)
// ─────────────────────────────────────────────
function emailTemplate(string $title, string $content): string {
    return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$title}</title></head>
<body style="margin:0;padding:0;background:#f5ede9;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#451d18,#2e110d);padding:32px 40px;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:32px;font-weight:700;font-style:italic;letter-spacing:8px;color:#fff;">IKYO</div>
        <div style="color:rgba(255,255,255,.7);font-size:13px;margin-top:6px;">La marketplace algérienne de confiance</div>
      </td></tr>
      <!-- Content -->
      <tr><td style="padding:36px 40px;">{$content}</td></tr>
      <!-- Footer -->
      <tr><td style="background:#faf8f6;padding:20px 40px;text-align:center;border-top:1px solid #f0e8e4;">
        <div style="font-size:12px;color:#aaa;">© 2025 IKYO — Tous droits réservés</div>
        <div style="font-size:11px;color:#ccc;margin-top:4px;">Cet email a été envoyé automatiquement, merci de ne pas répondre directement.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
HTML;
}

// ─────────────────────────────────────────────
//  EMAIL 1 — Notifier admin d'une nouvelle demande vendeur
// ─────────────────────────────────────────────
function emailNotifAdmin(array $vendeur): bool {
    $nom     = htmlspecialchars($vendeur['prenom'] . ' ' . $vendeur['nom']);
    $magasin = htmlspecialchars($vendeur['nom_magasin']);
    $email   = htmlspecialchars($vendeur['email']);
    $tel     = htmlspecialchars($vendeur['telephone'] ?? 'N/A');
    $wilaya  = htmlspecialchars($vendeur['wilaya'] ?? 'N/A');
    $date    = date('d/m/Y à H:i');
    $panel   = ADMIN_PANEL;

    $content = <<<HTML
<h2 style="color:#451d18;margin:0 0 8px;font-family:Georgia,serif;">🆕 Nouvelle demande vendeur</h2>
<p style="color:#888;margin:0 0 28px;font-size:14px;">Reçue le {$date}</p>

<table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
  <tr><td style="padding:10px 0;border-bottom:1px solid #f0e8e4;color:#555;font-size:14px;width:40%"><strong>Nom complet</strong></td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8e4;color:#222;font-size:14px">{$nom}</td></tr>
  <tr><td style="padding:10px 0;border-bottom:1px solid #f0e8e4;color:#555;font-size:14px"><strong>Magasin</strong></td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8e4;color:#222;font-size:14px">{$magasin}</td></tr>
  <tr><td style="padding:10px 0;border-bottom:1px solid #f0e8e4;color:#555;font-size:14px"><strong>Email</strong></td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8e4;color:#222;font-size:14px">{$email}</td></tr>
  <tr><td style="padding:10px 0;border-bottom:1px solid #f0e8e4;color:#555;font-size:14px"><strong>Téléphone</strong></td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8e4;color:#222;font-size:14px">{$tel}</td></tr>
  <tr><td style="padding:10px 0;color:#555;font-size:14px"><strong>Wilaya</strong></td>
      <td style="padding:10px 0;color:#222;font-size:14px">{$wilaya}</td></tr>
</table>

<a href="{$panel}" style="display:inline-block;background:#451d18;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;margin-bottom:20px;">
  👉 Gérer cette demande dans le panel admin
</a>

<p style="color:#aaa;font-size:12px;margin-top:20px;">Si le bouton ne fonctionne pas : <a href="{$panel}" style="color:#451d18">{$panel}</a></p>
HTML;

    return sendEmail(ADMIN_EMAIL, ADMIN_NAME, "🆕 Nouvelle demande vendeur – {$magasin}", emailTemplate("Nouvelle demande vendeur", $content));
}

// ─────────────────────────────────────────────
//  EMAIL 2 — Accusé de réception au vendeur
// ─────────────────────────────────────────────
function emailAccuseReception(array $vendeur): bool {
    $prenom  = htmlspecialchars($vendeur['prenom']);
    $magasin = htmlspecialchars($vendeur['nom_magasin']);

    $content = <<<HTML
<h2 style="color:#451d18;margin:0 0 8px;font-family:Georgia,serif;">Merci pour votre demande !</h2>
<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px">
    Bonjour <strong>{$prenom}</strong>,<br><br>
    Nous avons bien reçu votre demande pour rejoindre IKYO avec votre boutique <strong>{$magasin}</strong>.
</p>
<div style="background:#faf8f6;border-left:4px solid #451d18;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
    <p style="margin:0;font-size:14px;color:#555;line-height:1.6">
        ⏱ Notre équipe examinera votre dossier dans un délai de <strong>24 à 48h</strong>.<br>
        📧 Vous recevrez un email avec vos identifiants de connexion une fois approuvé.<br>
        📞 En cas de besoin, contactez-nous à <a href="mailto:admin@ikyo.dz" style="color:#451d18">admin@ikyo.dz</a>
    </p>
</div>
<p style="color:#888;font-size:13px;">Merci de votre confiance,<br><strong>L'équipe IKYO</strong></p>
HTML;

    return sendEmail($vendeur['email'], $prenom, "✅ Demande reçue – IKYO", emailTemplate("Demande reçue", $content));
}

// ─────────────────────────────────────────────
//  EMAIL 3 — Compte approuvé + identifiants
// ─────────────────────────────────────────────
function emailCompteApprouve(array $vendeur, string $motDePasse): bool {
    $prenom  = htmlspecialchars($vendeur['prenom']);
    $magasin = htmlspecialchars($vendeur['nom_magasin']);
    $email   = htmlspecialchars($vendeur['email']);
    $mdp     = htmlspecialchars($motDePasse);
    $login   = SITE_URL . 'login.html';
    $dash    = SITE_URL . 'dashboard.html';

    $content = <<<HTML
<h2 style="color:#451d18;margin:0 0 8px;font-family:Georgia,serif;">🎉 Votre boutique est approuvée !</h2>
<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px">
    Bonjour <strong>{$prenom}</strong> !<br>
    Félicitations — votre boutique <strong>{$magasin}</strong> est maintenant active sur IKYO.
</p>

<div style="background:#f5ede9;border-radius:12px;padding:24px;margin-bottom:28px;">
  <div style="font-size:13px;font-weight:700;color:#451d18;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">🔑 Vos identifiants de connexion</div>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#666;font-size:14px;width:35%">Email</td>
        <td style="padding:8px 0;font-size:15px;font-weight:700;color:#1a1a1a">{$email}</td></tr>
    <tr><td style="padding:8px 0;color:#666;font-size:14px">Mot de passe</td>
        <td style="padding:8px 0;font-size:15px;font-weight:700;color:#1a1a1a;letter-spacing:2px">{$mdp}</td></tr>
  </table>
  <p style="margin:12px 0 0;font-size:12px;color:#aaa;">⚠️ Changez votre mot de passe dès la première connexion dans Paramètres.</p>
</div>

<div style="display:flex;gap:12px;margin-bottom:24px;">
  <a href="{$login}" style="flex:1;display:inline-block;background:#451d18;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;">
    🔐 Se connecter
  </a>
  <a href="{$dash}" style="flex:1;display:inline-block;background:#f5ede9;color:#451d18;text-decoration:none;padding:14px 20px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;border:1.5px solid #e0c4bc;">
    📊 Mon dashboard
  </a>
</div>

<div style="background:#fafafa;border-radius:10px;padding:16px;margin-bottom:16px;">
  <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:10px;">📌 Prochaines étapes</div>
  <ul style="margin:0;padding-left:18px;color:#555;font-size:14px;line-height:1.8">
    <li>Connectez-vous à votre espace vendeur</li>
    <li>Complétez votre profil boutique (logo, description, adresse)</li>
    <li>Ajoutez vos premiers produits</li>
    <li>Commencez à vendre !</li>
  </ul>
</div>
HTML;

    return sendEmail($vendeur['email'], $prenom, "🎉 Bienvenue sur IKYO – " . $magasin, emailTemplate("Compte approuvé", $content));
}

// ─────────────────────────────────────────────
//  EMAIL 4 — Demande refusée
// ─────────────────────────────────────────────
function emailDemandeRefusee(array $vendeur, string $raison = ''): bool {
    $prenom  = htmlspecialchars($vendeur['prenom']);
    $magasin = htmlspecialchars($vendeur['nom_magasin']);
    $contact = ADMIN_EMAIL;
    $raisonHtml = $raison ? "<p style='color:#555;font-size:14px;background:#fafafa;padding:12px 16px;border-radius:8px;margin:16px 0'><strong>Raison :</strong> " . htmlspecialchars($raison) . "</p>" : '';

    $content = <<<HTML
<h2 style="color:#451d18;margin:0 0 8px;font-family:Georgia,serif;">Votre demande n'a pas été retenue</h2>
<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 16px">
    Bonjour <strong>{$prenom}</strong>,<br><br>
    Après examen de votre dossier pour la boutique <strong>{$magasin}</strong>, nous ne sommes pas en mesure de donner une suite favorable à votre demande pour le moment.
</p>
{$raisonHtml}
<p style="color:#555;font-size:14px;line-height:1.7">
    Si vous pensez que c'est une erreur ou si vous souhaitez plus d'informations, contactez-nous à 
    <a href="mailto:{$contact}" style="color:#451d18;font-weight:700">{$contact}</a>
</p>
<p style="color:#888;font-size:13px;margin-top:20px;">Cordialement,<br><strong>L'équipe IKYO</strong></p>
HTML;

    return sendEmail($vendeur['email'], $prenom, "Votre demande IKYO", emailTemplate("Demande examinée", $content));
}