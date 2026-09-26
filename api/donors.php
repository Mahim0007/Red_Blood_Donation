<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $sql = "SELECT 
                    donor_id AS id,
                    full_name AS name,
                    blood_group AS bloodGroup,
                    gender,
                    contact_phone AS phone,
                    email,
                    district,
                    area_address AS area,
                    division,
                    age,
                    weight_kg AS weight,
                    total_donations AS totalDonations,
                    last_donated_date AS lastDonatedDate,
                    availability_status AS status,
                    is_verified AS verified,
                    tier,
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' AS avatar
                FROM Donors
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
        if (!empty($_GET['status'])) {
            $sql .= " AND availability_status = :status";
            $params[':status'] = $_GET['status'];
        }

        $sql .= " ORDER BY total_donations DESC, donor_id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $donors = $stmt->fetchAll();

        // Convert types
        foreach ($donors as &$d) {
            $d['id'] = (int)$d['id'];
            $d['age'] = (int)$d['age'];
            $d['weight'] = (float)$d['weight'];
            $d['totalDonations'] = (int)$d['totalDonations'];
            $d['verified'] = (bool)$d['verified'];
            $d['badge'] = $d['totalDonations'] >= 10 ? 'Champion' : ($d['totalDonations'] >= 5 ? 'Dedicated' : 'Active Volunteer');
            if ($d['bloodGroup'] === 'O-' || $d['bloodGroup'] === 'AB-') {
                $d['badge'] = 'Rare Hero';
            }
        }

        echo json_encode([
            'success' => true,
            'count' => count($donors),
            'data' => $donors
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

        if (empty($input['name']) || empty($input['bloodGroup']) || empty($input['phone'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name, Blood Group, and Phone are required.']);
            exit();
        }

        $fullName = trim($input['name']);
        $bloodGroup = trim($input['bloodGroup']);
        $gender = !empty($input['gender']) ? trim($input['gender']) : 'Male';
        $phone = trim($input['phone']);
        $email = !empty($input['email']) ? trim($input['email']) : null;
        $district = !empty($input['district']) ? trim($input['district']) : 'Dhaka';
        $area = !empty($input['area']) ? trim($input['area']) : $district;
        $division = !empty($input['division']) ? trim($input['division']) : 'Dhaka';
        $age = !empty($input['age']) ? (int)$input['age'] : 25;
        $weight = !empty($input['weight']) ? (float)$input['weight'] : 60.0;
        $totalDonations = !empty($input['totalDonations']) ? (int)$input['totalDonations'] : 0;
        $status = !empty($input['status']) ? trim($input['status']) : 'AVAILABLE';
        $tier = $totalDonations >= 15 ? 'Platinum Lifesaver' : ($totalDonations >= 10 ? 'Gold Lifesaver' : ($totalDonations >= 5 ? 'Silver Lifesaver' : 'Bronze Lifesaver'));

        $stmt = $pdo->prepare("
            INSERT INTO Donors (
                full_name, blood_group, gender, contact_phone, email, 
                district, area_address, division, age, weight_kg, 
                total_donations, availability_status, is_verified, tier
            ) VALUES (
                :name, :bloodGroup, :gender, :phone, :email, 
                :district, :area, :division, :age, :weight, 
                :totalDonations, :status, 1, :tier
            )
        ");

        $stmt->execute([
            ':name' => $fullName,
            ':bloodGroup' => $bloodGroup,
            ':gender' => $gender,
            ':phone' => $phone,
            ':email' => $email,
            ':district' => $district,
            ':area' => $area,
            ':division' => $division,
            ':age' => $age,
            ':weight' => $weight,
            ':totalDonations' => $totalDonations,
            ':status' => $status,
            ':tier' => $tier
        ]);

        $newId = (int)$pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Donor registered successfully in MySQL!',
            'donor_id' => $newId,
            'data' => [
                'id' => $newId,
                'name' => $fullName,
                'bloodGroup' => $bloodGroup,
                'phone' => $phone,
                'district' => $district,
                'status' => $status,
                'tier' => $tier
            ]
        ], JSON_PRETTY_PRINT);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
