<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        $hospitalId = !empty($input['hospitalId']) ? trim($input['hospitalId']) : '';
        $group = !empty($input['group']) ? trim($input['group']) : '';
        $component = !empty($input['component']) ? trim($input['component']) : 'wholeBlood';
        $delta = isset($input['delta']) ? (int)$input['delta'] : -1;

        $col = 'whole_blood_bags';
        if ($component === 'prbc') $col = 'prbc_red_cells_bags';
        elseif ($component === 'platelets') $col = 'platelets_units';
        elseif ($component === 'ffp') $col = 'plasma_ffp_bags';

        $stmt = $pdo->prepare("
            UPDATE Blood_Inventory
            SET $col = GREATEST(0, $col + :delta),
                stock_status = CASE 
                    WHEN (whole_blood_bags + prbc_red_cells_bags) <= 2 THEN 'CRITICAL'
                    WHEN (whole_blood_bags + prbc_red_cells_bags) <= 8 THEN 'LOW'
                    ELSE 'OPTIMAL'
                END
            WHERE hospital_id = :hospital_id AND blood_group = :group
        ");
        $stmt->execute([
            ':delta' => $delta,
            ':hospital_id' => $hospitalId,
            ':group' => $group
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Blood inventory updated in MySQL database!'
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

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
