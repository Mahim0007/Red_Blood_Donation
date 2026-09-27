<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Auto-synchronize 90-day cooldown status across all donors in database
        $pdo->query("
            UPDATE Donors 
            SET availability_status = 'AVAILABLE' 
            WHERE availability_status = 'COOLDOWN' 
              AND last_donated_date IS NOT NULL 
              AND DATEDIFF(CURDATE(), last_donated_date) >= 90
        ");
        $pdo->query("
            UPDATE Donors 
            SET availability_status = 'COOLDOWN' 
            WHERE last_donated_date IS NOT NULL 
              AND DATEDIFF(CURDATE(), last_donated_date) < 90
        ");

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

            // Calculate precise 90-day cooldown status
            if (!empty($d['lastDonatedDate'])) {
                $diff = (int)$pdo->query("SELECT DATEDIFF(CURDATE(), '{$d['lastDonatedDate']}')")->fetchColumn();
                $d['daysSinceDonation'] = $diff;
                $d['isEligible'] = ($diff >= 90);
                $d['daysRemaining'] = ($diff < 90) ? (90 - $diff) : 0;
                $d['nextEligibleDate'] = date('Y-m-d', strtotime($d['lastDonatedDate'] . ' +90 days'));
            } else {
                $d['daysSinceDonation'] = null;
                $d['isEligible'] = true;
                $d['daysRemaining'] = 0;
                $d['nextEligibleDate'] = 'Immediately Eligible';
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
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: $_POST;

        // Action A: Record direct voluntary blood donation
        if (!empty($input['action']) && $input['action'] === 'donate') {
            $donorId = !empty($input['donor_id']) ? (int)$input['donor_id'] : null;
            $donorName = !empty($input['donorName']) ? trim($input['donorName']) : (!empty($input['name']) ? trim($input['name']) : 'Voluntary Donor');
            $donorPhone = !empty($input['donorPhone']) ? trim($input['donorPhone']) : '';
            $donorEmail = !empty($input['donorEmail']) ? trim($input['donorEmail']) : '';

            $donor = null;
            if ($donorId) {
                $dStmt = $pdo->prepare("SELECT * FROM Donors WHERE donor_id = :id LIMIT 1");
                $dStmt->execute([':id' => $donorId]);
                $donor = $dStmt->fetch();
            }
            if (!$donor && ($donorPhone || $donorEmail || $donorName)) {
                $dStmt = $pdo->prepare("
                    SELECT * FROM Donors 
                    WHERE contact_phone = :p 
                       OR email = :e 
                       OR LOWER(full_name) = LOWER(:n) 
                    ORDER BY donor_id DESC LIMIT 1
                ");
                $dStmt->execute([
                    ':p' => $donorPhone ?: '---',
                    ':e' => $donorEmail ?: '---',
                    ':n' => $donorName
                ]);
                $donor = $dStmt->fetch();
            }

            // STRICT 90-DAY DATABASE COOLDOWN CHECK
            if ($donor && !empty($donor['last_donated_date'])) {
                $lastDate = $donor['last_donated_date'];
                $diff = (int)$pdo->query("SELECT DATEDIFF(CURDATE(), '$lastDate')")->fetchColumn();
                if ($diff >= 0 && $diff < 90) {
                    $remaining = 90 - $diff;
                    $nextDate = date('Y-m-d', strtotime($lastDate . ' +90 days'));
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'cooldown_active' => true,
                        'last_donated_date' => $lastDate,
                        'days_since_donation' => $diff,
                        'days_remaining' => $remaining,
                        'next_eligible_date' => $nextDate,
                        'error' => "Medical Cooldown Active: You cannot donate blood within 90 days. You last donated on {$lastDate}. You will be eligible again in {$remaining} day(s) on {$nextDate}."
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    exit();
                }
            }

            if (!$donor) {
                $ins = $pdo->prepare("
                    INSERT INTO Donors (
                        full_name, blood_group, gender, contact_phone, email,
                        district, area_address, division, age, weight_kg,
                        total_donations, availability_status, is_verified, tier
                    ) VALUES (
                        :name, 'O+', 'Male', :phone, :email,
                        'Dhaka', 'Dhaka Sadar', 'Dhaka', 24, 62.00,
                        0, 'AVAILABLE', 1, 'Bronze Lifesaver'
                    )
                ");
                $ins->execute([
                    ':name' => $donorName,
                    ':phone' => $donorPhone ?: ('017' . rand(10000000, 99999999)),
                    ':email' => $donorEmail ?: (preg_replace('/[^a-z0-9]/', '', strtolower($donorName)) . '@gmail.com')
                ]);
                $donorId = (int)$pdo->lastInsertId();
            } else {
                $donorId = (int)$donor['donor_id'];
            }

            // 1. Log donation certificate (Triggers MySQL database BEFORE INSERT check)
            $certId = !empty($input['certificateId']) ? trim($input['certificateId']) : ('CERT-2026-' . rand(1000, 9999));
            $hospName = !empty($input['hospital']) ? trim($input['hospital']) : 'Dhaka Medical College Hospital (DMCH)';

            $hospStmt = $pdo->prepare("SELECT hospital_id FROM Hospitals WHERE :h LIKE CONCAT('%', name, '%') OR name LIKE CONCAT('%', :h2, '%') LIMIT 1");
            $hospStmt->execute([':h' => $hospName, ':h2' => $hospName]);
            $matchedHospId = $hospStmt->fetchColumn() ?: 'H1';

            $logStmt = $pdo->prepare("
                INSERT INTO Donation_Logs (
                    donor_id, hospital_id, donation_date, bags_donated,
                    blood_component, certificate_id, remarks
                ) VALUES (
                    :donor_id, :hospital_id, CURDATE(), 1,
                    'Whole Blood', :cert_id, :remarks
                )
            ");
            $logStmt->execute([
                ':donor_id' => $donorId,
                ':hospital_id' => $matchedHospId,
                ':cert_id' => $certId,
                ':remarks' => !empty($input['remarks']) ? $input['remarks'] : 'Voluntary Blood Transfusion Camp'
            ]);

            // 2. Increment total_donations and trigger 90-day cooldown in Donors table
            $updateStmt = $pdo->prepare("
                UPDATE Donors 
                SET total_donations = total_donations + 1,
                    last_donated_date = CURDATE(),
                    availability_status = 'COOLDOWN',
                    tier = IF(total_donations + 1 >= 15, 'Platinum Lifesaver', IF(total_donations + 1 >= 10, 'Gold Lifesaver', IF(total_donations + 1 >= 5, 'Silver Lifesaver', 'Bronze Lifesaver')))
                WHERE donor_id = :id
            ");
            $updateStmt->execute([':id' => $donorId]);

            // 3. Query updated donor record
            $fetchStmt = $pdo->prepare("SELECT total_donations, full_name, blood_group, district, tier FROM Donors WHERE donor_id = :id");
            $fetchStmt->execute([':id' => $donorId]);
            $updatedDonor = $fetchStmt->fetch();
            $newTotal = (int)$updatedDonor['total_donations'];

            echo json_encode([
                'success' => true,
                'message' => 'Blood donation recorded successfully in MySQL database!',
                'donor_id' => $donorId,
                'donorId' => 'RD-BD-2026-' . str_pad($donorId, 4, '0', STR_PAD_LEFT),
                'total_donations' => $newTotal,
                'lives_saved' => $newTotal * 3,
                'certificate_id' => $certId,
                'hospital' => $hospName,
                'date' => date('Y-m-d'),
                'lastDonatedDate' => date('Y-m-d'),
                'nextEligibleDate' => date('Y-m-d', strtotime('+90 days')),
                'status' => 'COOLDOWN',
                'tier' => $updatedDonor['tier']
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Action B: New donor registration
        $fullName = !empty($input['name']) ? trim($input['name']) : (!empty($input['full_name']) ? trim($input['full_name']) : '');
        $bloodGroup = !empty($input['bloodGroup']) ? trim($input['bloodGroup']) : (!empty($input['blood']) ? trim($input['blood']) : 'O+');
        $rawContact = !empty($input['phone']) ? trim($input['phone']) : (!empty($input['contact']) ? trim($input['contact']) : '01711223344');

        if (empty($fullName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name is required.']);
            exit();
        }

        $gender = !empty($input['gender']) ? trim($input['gender']) : 'Male';
        if (strpos($rawContact, '@') !== false) {
            $email = $rawContact;
            $phone = '017' . substr(preg_replace('/\D/', '', md5($rawContact)), 0, 8);
        } else {
            $phone = substr(preg_replace('/[^0-9+]/', '', $rawContact), 0, 15) ?: ('017' . rand(10000000, 99999999));
            $email = !empty($input['email']) ? trim($input['email']) : (preg_replace('/[^a-zA-Z0-9]/', '', strtolower($fullName)) . '@gmail.com');
        }

        $district = !empty($input['district']) ? trim($input['district']) : 'Dhaka';
        $area = !empty($input['area']) ? trim($input['area']) : ($district . ' Sadar');
        $division = !empty($input['division']) ? trim($input['division']) : ($district === 'Chattogram' ? 'Chattogram' : ($district === 'Sylhet' ? 'Sylhet' : 'Dhaka'));
        $age = !empty($input['age']) ? (int)$input['age'] : 24;
        $weight = !empty($input['weight']) ? (float)$input['weight'] : 62.0;
        $totalDonations = isset($input['totalDonations']) ? (int)$input['totalDonations'] : 0;
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
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
