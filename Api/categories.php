<?php


require_once '../config/database.php';

$db = getDB();


$stmt = $db->query("
    SELECT c1.*, 
           (SELECT COUNT(*) FROM categories WHERE parent_id = c1.id) as has_children
    FROM categories c1
    WHERE c1.parent_id IS NULL
    ORDER BY c1.nom
");
$categories = $stmt->fetchAll();


foreach ($categories as &$cat) {
    $stmt2 = $db->prepare("
        SELECT id, nom, slug 
        FROM categories 
        WHERE parent_id = ? 
        ORDER BY nom
    ");
    $stmt2->execute([$cat['id']]);
    $cat['children'] = $stmt2->fetchAll();
}

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'data' => $categories
]);
?>