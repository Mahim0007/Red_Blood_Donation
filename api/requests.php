<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $sql = "SELECT 
                    request_id AS id,
                    patient_name AS patientName,
                    blood_group AS bloodGroup,
                    bags_needed AS bagsNeeded,
                    bags_fulfilled AS bagsFulfilled,
                    urgency_level AS urgency,
                    time_limit AS timeLimit,
                    hospital_name AS hospital,
                    district,
                    bed_location AS bedLocation,
                    clinical_reason AS reason,
                    attendant_name AS attendantName,
                    attendant_phone AS attendantPhone,
                    request_status AS status,
                    created_at AS createdAt
                FROM Blood_Requests
                WHERE 1=1";
        
        $params = [];
        if (!empty($_GET['blood_group'])) {
            $sql .= " AND blood_group = :blood_group";
            $params[':blood_group'] = $_GET['blood_group'];
        }
        if (!empty($_GET['district'])) {
            $sql .= " AND district = :district";
            $params[':district'] = $_GET['district'];
        }
        if (!empty($_GET['urgency'])) {
            $sql .= " AND urgency_level = :urgency";
            $params[':urgency'] = $_GET['urgency'];
        }
        if (!empty($_GET['status'])) {
            $sql .= " AND request_status = :status";
            $params[':status'] = $_GET['status'];
        }

        $sql .= " ORDER BY (urgency_level = 'CRITICAL') DESC, request_id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $requests = $stmt->fetchAll();

        foreach ($requests as &$r) {
            $r['id'] = (int)$r['id'];
            $r['bagsNeeded'] = (int)$r['bagsNeeded'];
            $r['bagsFulfilled'] = (int)$r['bagsFulfilled'];
            $r['donorsCommitted'] = [];
            $r['postedAgo'] = 'Recent live SOS';
        }

        echo json_encode([
            'success' => true,
            'count' => count($requests),
            'data' => $requests
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        // Handle Pledge / Fulfill action
        if (!empty($input['action']) && $input['action'] === 'pledge' && !empty($input['request_id'])) {
            $reqId = (int)$input['request_id'];
            $stmt = $pdo->prepare("
                UPDATE Blood_Requests 
                SET bags_fulfilled = LEAST(bags_needed, bags_fulfilled + 1),
                    request_status = IF(bags_fulfilled + 1 >= bags_needed, 'FULFILLED', 'ACTIVE')
                WHERE request_id = :id
            ");
            $stmt->execute([':id' => $reqId]);

            echo json_encode([
                'success' => true,
                'message' => 'Blood request pledge updated in MySQL!',
                'request_id' => $reqId
            ], JSON_PRETTY_PRINT);
            exit();
        }

        if (empty($input['patientName']) || empty($input['bloodGroup']) || empty($input['hospital']) || empty($input['attendantPhone'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Patient Name, Blood Group, Hospital, and Attendant Phone are required.']);
            exit();
        }

        $patientName = trim($input['patientName']);
        $bloodGroup = trim($input['bloodGroup']);
        $bagsNeeded = !empty($input['bagsNeeded']) ? (int)$input['bagsNeeded'] : 1;
        $urgency = !empty($input['urgency']) ? trim($input['urgency']) : 'CRITICAL';
        $timeLimit = !empty($input['timeLimit']) ? trim($input['timeLimit']) : 'Within 4 Hours';
        $hospital = trim($input['hospital']);
        $district = !empty($input['district']) ? trim($input['district']) : 'Dhaka';
        $bedLocation = !empty($input['bedLocation']) ? trim($input['bedLocation']) : 'General Ward';
        $reason = !empty($input['reason']) ? trim($input['reason']) : 'Emergency Transfusion';
        $attendantName = !empty($input['attendantName']) ? trim($input['attendantName']) : 'Patient Attendant';
        $attendantPhone = trim($input['attendantPhone']);

        $stmt = $pdo->prepare("
            INSERT INTO Blood_Requests (
                patient_name, blood_group, bags_needed, bags_fulfilled,
                urgency_level, time_limit, hospital_name, district,
                bed_location, clinical_reason, attendant_name, attendant_phone,
                request_status
            ) VALUES (
                :patient_name, :blood_group, :bags_needed, 0,
                :urgency, :time_limit, :hospital, :district,
                :bed_location, :reason, :attendant_name, :attendant_phone,
                'ACTIVE'
            )
        ");

        $stmt->execute([
            ':patient_name' => $patientName,
            ':blood_group' => $bloodGroup,
            ':bags_needed' => $bagsNeeded,
            ':urgency' => $urgency,
            ':time_limit' => $timeLimit,
            ':hospital' => $hospital,
            ':district' => $district,
            ':bed_location' => $bedLocation,
            ':reason' => $reason,
            ':attendant_name' => $attendantName,
            ':attendant_phone' => $attendantPhone
        ]);

        $newId = (int)$pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Blood request posted to MySQL database!',
            'request_id' => $newId,
            'data' => [
                'id' => $newId,
                'patientName' => $patientName,
                'bloodGroup' => $bloodGroup,
                'bagsNeeded' => $bagsNeeded,
                'urgency' => $urgency,
                'hospital' => $hospital,
                'district' => $district,
                'attendantPhone' => $attendantPhone,
                'status' => 'ACTIVE'
            ]
        ], JSON_PRETTY_PRINT);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
