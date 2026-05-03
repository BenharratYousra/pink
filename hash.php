<?php
$password = 'ikramzenatiziani';
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "Mot de passe: " . $password . "<br>";
echo "Hash: " . $hash . "<br>";
echo "<hr>";
echo "Vérification: " . (password_verify($password, $hash) ? "OK" : "ERREUR");
?>