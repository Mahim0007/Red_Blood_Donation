<?php
require_once __DIR__ . '/db.php';

try {
    $sql = "SELECT 
                i.inventory_id AS id,
                i.hospital_id AS hospitalId,
                h.name AS hospitalName,
                h.district,
                i.blood_group AS `group`,
                i.whole_blood_bags AS wholeBlood,
                i.prbc_red_cells_bags AS prbc,
                i.platelets_units AS platelets,
                i.plasma_ffp_bags AS ffp,
                i.stock_status AS status,
                i.last_audited_at AS lastAudited
            FROM Blood_Inventory i
            JOIN Hospitals h ON i.hospital_id = h.hospital_id";
    
    $params = [];
    if (!empty($_GET['blood_group'])) {
        $sql .= " WHERE i.blood_group = :group";
        $params[':group'] = $_GET['blood_group'];
    }

    $sql .= " ORDER BY (i.stock_status = 'CRITICAL') DESC, h.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $inventory = $stmt->fetchAll();

    foreach ($inventory as &$inv) {
        $inv['id'] = (int)$inv['id'];
        $inv['wholeBlood'] = (int)$inv['wholeBlood'];
        $inv['prbc'] = (int)$inv['prbc'];
        $inv['platelets'] = (int)$inv['platelets'];
        $inv['ffp'] = (int)$inv['ffp'];
    }

    echo json_encode([
        'success' => true,
        'count' => count($inventory),
        'data' => $inventory
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
