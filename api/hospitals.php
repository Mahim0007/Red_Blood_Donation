<?php
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->query("
        SELECT 
            hospital_id AS id,
            name,
            district,
            address,
            hotline_phone AS hotline,
            hospital_type AS type,
            latitude AS lat,
            longitude AS lng
        FROM Hospitals
        ORDER BY name ASC
    ");
    $hospitals = $stmt->fetchAll();

    foreach ($hospitals as &$h) {
        $h['lat'] = (float)$h['lat'];
        $h['lng'] = (float)$h['lng'];
    }

    echo json_encode([
        'success' => true,
        'count' => count($hospitals),
        'data' => $hospitals
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
