<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        $username = !empty($input['username']) ? trim($input['username']) : (!empty($input['identifier']) ? trim($input['identifier']) : 'Anonymous User');
        $role = (!empty($input['role']) && strtolower($input['role']) === 'admin') ? 'Admin' : 'User';

        // 1. Record login in Users table
        $stmt = $pdo->prepare("INSERT INTO Users (username, user_role, login_time) VALUES (:username, :user_role, NOW())");
        $stmt->execute([
            ':username' => $username,
            ':user_role' => $role
        ]);
        $newLoginId = (int)$pdo->lastInsertId();

        // 2. Check if user exists in Donors table
        $donorStmt = $pdo->prepare("
            SELECT * FROM Donors 
            WHERE contact_phone = :u1 
               OR email = :u2 
               OR LOWER(full_name) = LOWER(:u3)
            ORDER BY donor_id DESC 
            LIMIT 1
        ");
        $donorStmt->execute([
            ':u1' => $username,
            ':u2' => $username,
            ':u3' => $username
        ]);
        $donor = $donorStmt->fetch();

        // 3. If donor does not exist in Donors table, auto-register them with official DB donor_id
        if (!$donor) {
            $cleanedName = strpos($username, '@') !== false ? explode('@', $username)[0] : $username;
            $email = strpos($username, '@') !== false ? $username : ($username . '@gmail.com');
            $phone = strpos($username, '@') !== false ? ('017' . substr(preg_replace('/\D/', '', md5($username)), 0, 8)) : $username;
            $bloodGroup = !empty($input['blood_group']) ? $input['blood_group'] : 'O+';
            $district = !empty($input['district']) ? $input['district'] : 'Dhaka';
            $area = !empty($input['area']) ? $input['area'] : ($district . ' Sadar');

            $insertStmt = $pdo->prepare("
                INSERT INTO Donors (
                    full_name, blood_group, gender, contact_phone, email, 
                    district, area_address, division, age, weight_kg, 
                    total_donations, availability_status, is_verified, tier
                ) VALUES (
                    :name, :bloodGroup, 'Male', :phone, :email, 
                    :district, :area, 'Dhaka', 24, 62.00, 
                    0, 'AVAILABLE', 1, 'Bronze Lifesaver'
                )
            ");
            $insertStmt->execute([
                ':name' => $cleanedName,
                ':bloodGroup' => $bloodGroup,
                ':phone' => $phone,
                ':email' => $email,
                ':district' => $district,
                ':area' => $area
            ]);

            $donorId = (int)$pdo->lastInsertId();
            $donor = [
                'donor_id' => $donorId,
                'full_name' => $cleanedName,
                'blood_group' => $bloodGroup,
                'gender' => 'Male',
                'contact_phone' => $phone,
                'email' => $email,
                'district' => $district,
                'area_address' => $area,
                'division' => 'Dhaka',
                'total_donations' => 0,
                'availability_status' => 'AVAILABLE',
                'tier' => 'Bronze Lifesaver'
            ];
        } else {
            $donorId = (int)$donor['donor_id'];
        }

        $totalDonations = (int)$donor['total_donations'];
        $donorFormattedId = 'RD-BD-2026-' . str_pad($donorId, 4, '0', STR_PAD_LEFT);

        // 4. Fetch official donation history from Donation_Logs table
        $logsStmt = $pdo->prepare("
            SELECT 
                l.log_id,
                l.donation_date AS date,
                l.bags_donated AS bags,
                l.certificate_id AS certificateId,
                COALESCE(h.name, l.remarks, 'Hospital Transfusion Center') AS hospital,
                'Emergency Patient' AS recipient
            FROM Donation_Logs l
            LEFT JOIN Hospitals h ON l.hospital_id = h.hospital_id
            WHERE l.donor_id = :d_id
            ORDER BY l.donation_date DESC, l.log_id DESC
        ");
        $logsStmt->execute([':d_id' => $donorId]);
        $history = $logsStmt->fetchAll();

        $profile = [
            'id' => $donorId,
            'donorId' => $donorFormattedId,
            'name' => $donor['full_name'],
            'bloodGroup' => $donor['blood_group'],
            'phone' => $donor['contact_phone'],
            'email' => $donor['email'] ?: ($username . '@gmail.com'),
            'district' => $donor['district'],
            'area' => $donor['area_address'],
            'totalDonations' => $totalDonations,
            'livesSaved' => $totalDonations * 3,
            'status' => $donor['availability_status'],
            'tier' => $donor['tier'] ?: 'Bronze Lifesaver',
            'lastDonatedDate' => $donor['last_donated_date'] ?: null,
            'nextEligibleDate' => $donor['last_donated_date'] ? date('Y-m-d', strtotime($donor['last_donated_date'] . ' +90 days')) : null,
            'history' => $history,
            'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($donor['full_name'])
        ];

        echo json_encode([
            'success' => true,
            'message' => 'Login recorded and synced with Donors database!',
            'user_id' => $newLoginId,
            'username' => $username,
            'role' => $role,
            'profile' => $profile
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    try {
        $identifier = !empty($_GET['identifier']) ? trim($_GET['identifier']) : (!empty($_GET['username']) ? trim($_GET['username']) : null);
        $donorIdParam = !empty($_GET['id']) ? (int)$_GET['id'] : null;

        // If identifier or id is passed, sync and return single donor profile
        if ($identifier || $donorIdParam) {
            $donorStmt = $pdo->prepare("
                SELECT * FROM Donors 
                WHERE donor_id = :d_id
                   OR contact_phone = :u1 
                   OR email = :u2 
                   OR LOWER(full_name) = LOWER(:u3)
                ORDER BY donor_id DESC 
                LIMIT 1
            ");
            $donorStmt->execute([
                ':d_id' => $donorIdParam ?: 0,
                ':u1' => $identifier ?: '',
                ':u2' => $identifier ?: '',
                ':u3' => $identifier ?: ''
            ]);
            $donor = $donorStmt->fetch();

            if (!$donor && $identifier) {
                // If not found, auto-create so donor id is permanent
                $cleanedName = strpos($identifier, '@') !== false ? explode('@', $identifier)[0] : $identifier;
                $email = strpos($identifier, '@') !== false ? $identifier : ($identifier . '@gmail.com');
                $phone = strpos($identifier, '@') !== false ? ('017' . substr(preg_replace('/\D/', '', md5($identifier)), 0, 8)) : $identifier;

                $insStmt = $pdo->prepare("
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
                $insStmt->execute([
                    ':name' => $cleanedName,
                    ':phone' => $phone,
                    ':email' => $email
                ]);
                $newId = (int)$pdo->lastInsertId();
                $donor = [
                    'donor_id' => $newId,
                    'full_name' => $cleanedName,
                    'blood_group' => 'O+',
                    'gender' => 'Male',
                    'contact_phone' => $phone,
                    'email' => $email,
                    'district' => 'Dhaka',
                    'area_address' => 'Dhaka Sadar',
                    'division' => 'Dhaka',
                    'total_donations' => 0,
                    'availability_status' => 'AVAILABLE',
                    'tier' => 'Bronze Lifesaver'
                ];
            }

            if ($donor) {
                $dId = (int)$donor['donor_id'];
                $totalDonations = (int)$donor['total_donations'];
                $formattedId = 'RD-BD-2026-' . str_pad($dId, 4, '0', STR_PAD_LEFT);

                // Fetch history
                $logsStmt = $pdo->prepare("
                    SELECT 
                        l.log_id,
                        l.donation_date AS date,
                        l.bags_donated AS bags,
                        l.certificate_id AS certificateId,
                        COALESCE(h.name, l.remarks, 'Hospital Transfusion Center') AS hospital,
                        'Emergency Patient' AS recipient
                    FROM Donation_Logs l
                    LEFT JOIN Hospitals h ON l.hospital_id = h.hospital_id
                    WHERE l.donor_id = :d_id
                    ORDER BY l.donation_date DESC, l.log_id DESC
                ");
                $logsStmt->execute([':d_id' => $dId]);
                $history = $logsStmt->fetchAll();

                echo json_encode([
                    'success' => true,
                    'profile' => [
                        'id' => $dId,
                        'donorId' => $formattedId,
                        'name' => $donor['full_name'],
                        'bloodGroup' => $donor['blood_group'],
                        'phone' => $donor['contact_phone'],
                        'email' => $donor['email'],
                        'district' => $donor['district'],
                        'area' => $donor['area_address'],
                        'totalDonations' => $totalDonations,
                        'livesSaved' => $totalDonations * 3,
                        'status' => $donor['availability_status'],
                        'tier' => $donor['tier'] ?: 'Bronze Lifesaver',
                        'lastDonatedDate' => $donor['last_donated_date'] ?: null,
                        'nextEligibleDate' => $donor['last_donated_date'] ? date('Y-m-d', strtotime($donor['last_donated_date'] . ' +90 days')) : null,
                        'history' => $history,
                        'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($donor['full_name'])
                    ]
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // Default: Return recent login records from Users
        $stmt = $pdo->query("SELECT user_id, username, user_role, login_time FROM Users ORDER BY user_id DESC");
        $users = $stmt->fetchAll();
        echo json_encode([
            'success' => true,
            'count' => count($users),
            'data' => $users
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
