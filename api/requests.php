<?php
header('Content-Type: application/json; charset=utf-8');
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
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: $_POST;

        // Action A: Pledge blood donation for an SOS request
        if (!empty($input['action']) && $input['action'] === 'pledge' && !empty($input['request_id'])) {
            $reqId = (int)$input['request_id'];
            
            // 1. Fetch request details first
            $reqStmt = $pdo->prepare("SELECT * FROM Blood_Requests WHERE request_id = :id LIMIT 1");
            $reqStmt->execute([':id' => $reqId]);
            $requestData = $reqStmt->fetch();

            if (!$requestData) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Blood request not found.']);
                exit();
            }

            // 2. Find or identify donor in Donors table
            $donorId = !empty($input['donor_id']) ? (int)$input['donor_id'] : null;
            $donorName = !empty($input['donorName']) ? trim($input['donorName']) : 'Voluntary Donor';
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
                        'error' => "Medical Cooldown Active: You cannot pledge or donate blood within 90 days. You last donated on {$lastDate}. You will be eligible again in {$remaining} day(s) on {$nextDate}."
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    exit();
                }
            }

            // 3. Update Blood_Requests fulfilled count & status
            $stmt = $pdo->prepare("
                UPDATE Blood_Requests 
                SET bags_fulfilled = LEAST(bags_needed, bags_fulfilled + 1),
                    request_status = IF(bags_fulfilled + 1 >= bags_needed, 'FULFILLED', 'ACTIVE')
                WHERE request_id = :id
            ");
            $stmt->execute([':id' => $reqId]);

            if (!$donor) {
                $insDonor = $pdo->prepare("
                    INSERT INTO Donors (
                        full_name, blood_group, gender, contact_phone, email,
                        district, area_address, division, age, weight_kg,
                        total_donations, availability_status, is_verified, tier
                    ) VALUES (
                        :name, :bg, 'Male', :phone, :email,
                        :dist, 'Dhaka Sadar', 'Dhaka', 24, 62.00,
                        0, 'AVAILABLE', 1, 'Bronze Lifesaver'
                    )
                ");
                $insDonor->execute([
                    ':name' => $donorName,
                    ':bg' => ($requestData ? $requestData['blood_group'] : 'O+'),
                    ':phone' => $donorPhone ?: ('017' . rand(10000000, 99999999)),
                    ':email' => $donorEmail ?: (preg_replace('/[^a-z0-9]/', '', strtolower($donorName)) . '@gmail.com'),
                    ':dist' => ($requestData ? $requestData['district'] : 'Dhaka')
                ]);
                $donorId = (int)$pdo->lastInsertId();
            } else {
                $donorId = (int)$donor['donor_id'];
            }

            // 4. Insert record into Donation_Logs (Triggers MySQL database BEFORE INSERT cooldown verification)
            $certId = !empty($input['certificateId']) ? trim($input['certificateId']) : ('CERT-2026-' . rand(1000, 9999));
            $hospName = $requestData ? $requestData['hospital_name'] : (!empty($input['hospital']) ? $input['hospital'] : 'NICVD, Dhaka');
            
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
                ':remarks' => 'Emergency SOS blood pledge for ' . ($requestData ? $requestData['patient_name'] : 'emergency patient')
            ]);

            // 5. Increment total_donations and set 90-day cooldown in Donors table
            $updateDonor = $pdo->prepare("
                UPDATE Donors 
                SET total_donations = total_donations + 1,
                    last_donated_date = CURDATE(),
                    availability_status = 'COOLDOWN',
                    tier = IF(total_donations + 1 >= 15, 'Platinum Lifesaver', IF(total_donations + 1 >= 10, 'Gold Lifesaver', IF(total_donations + 1 >= 5, 'Silver Lifesaver', 'Bronze Lifesaver')))
                WHERE donor_id = :id
            ");
            $updateDonor->execute([':id' => $donorId]);

            // Query updated total
            $fetchUpdated = $pdo->prepare("SELECT total_donations FROM Donors WHERE donor_id = :id");
            $fetchUpdated->execute([':id' => $donorId]);
            $newTotal = (int)$fetchUpdated->fetchColumn();

            echo json_encode([
                'success' => true,
                'message' => 'Blood request pledge updated in MySQL! Total donations incremented.',
                'request_id' => $reqId,
                'donor_id' => $donorId,
                'donorId' => 'RD-BD-2026-' . str_pad($donorId, 4, '0', STR_PAD_LEFT),
                'total_donations' => $newTotal,
                'lives_saved' => $newTotal * 3,
                'certificate_id' => $certId,
                'hospital' => $hospName,
                'date' => date('Y-m-d'),
                'lastDonatedDate' => date('Y-m-d'),
                'nextEligibleDate' => date('Y-m-d', strtotime('+90 days')),
                'status' => 'COOLDOWN'
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Action B: Create new emergency blood request
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
            'message' => 'Emergency blood request created successfully in MySQL!',
            'request_id' => $newId,
            'data' => [
                'id' => $newId,
                'patientName' => $patientName,
                'bloodGroup' => $bloodGroup,
                'bagsNeeded' => $bagsNeeded,
                'bagsFulfilled' => 0,
                'hospital' => $hospital,
                'district' => $district,
                'status' => 'ACTIVE'
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
