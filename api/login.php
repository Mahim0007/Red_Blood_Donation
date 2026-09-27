<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Builds the complete donor profile including formatted ID and official donation history
 */
function buildDonorProfile($pdo, $donor, $fallbackEmail = '') {
    $donorId = (int)$donor['donor_id'];
    $totalDonations = (int)$donor['total_donations'];
    $formattedId = 'RD-BD-2026-' . str_pad($donorId, 4, '0', STR_PAD_LEFT);

    // Fetch official donation history from Donation_Logs
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

    $lastDonated = $donor['last_donated_date'] ?: null;
    $daysRemaining = 0;
    $isEligible = true;
    $nextEligible = 'Immediately Eligible';
    $status = $donor['availability_status'];

    if ($lastDonated) {
        $diff = (int)$pdo->query("SELECT DATEDIFF(CURDATE(), '$lastDonated')")->fetchColumn();
        if ($diff >= 0 && $diff < 90) {
            $isEligible = false;
            $daysRemaining = 90 - $diff;
            $nextEligible = date('Y-m-d', strtotime($lastDonated . ' +90 days'));
            $status = 'COOLDOWN';
        } else {
            $status = 'AVAILABLE';
        }
    }

    return [
        'id' => $donorId,
        'donorId' => $formattedId,
        'name' => $donor['full_name'],
        'bloodGroup' => $donor['blood_group'],
        'phone' => $donor['contact_phone'],
        'email' => $donor['email'] ?: $fallbackEmail,
        'district' => $donor['district'],
        'area' => $donor['area_address'],
        'totalDonations' => $totalDonations,
        'livesSaved' => $totalDonations * 3,
        'status' => $status,
        'isEligible' => $isEligible,
        'daysRemaining' => $daysRemaining,
        'tier' => $donor['tier'] ?: 'Bronze Lifesaver',
        'lastDonatedDate' => $lastDonated,
        'nextEligibleDate' => $nextEligible,
        'history' => $history,
        'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($donor['full_name'])
    ];
}

/**
 * Finds an existing donor by phone, email, or name, or automatically creates one
 */
function findOrCreateDonor($pdo, $identifier, $bloodGroup = 'O+', $district = 'Dhaka', $area = '') {
    $donorStmt = $pdo->prepare("
        SELECT * FROM Donors 
        WHERE contact_phone = :u1 
           OR email = :u2 
           OR LOWER(full_name) = LOWER(:u3)
        ORDER BY donor_id DESC 
        LIMIT 1
    ");
    $donorStmt->execute([
        ':u1' => $identifier,
        ':u2' => $identifier,
        ':u3' => $identifier
    ]);
    $donor = $donorStmt->fetch();

    if (!$donor) {
        $cleanedName = strpos($identifier, '@') !== false ? explode('@', $identifier)[0] : $identifier;
        $email = strpos($identifier, '@') !== false ? $identifier : ($identifier . '@gmail.com');
        $phone = strpos($identifier, '@') !== false ? ('017' . substr(preg_replace('/\D/', '', md5($identifier)), 0, 8)) : $identifier;
        $targetArea = !empty($area) ? $area : ($district . ' Sadar');

        $insStmt = $pdo->prepare("
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
        $insStmt->execute([
            ':name' => $cleanedName,
            ':bloodGroup' => $bloodGroup,
            ':phone' => $phone,
            ':email' => $email,
            ':district' => $district,
            ':area' => $targetArea
        ]);

        $newId = (int)$pdo->lastInsertId();
        $donor = [
            'donor_id' => $newId,
            'full_name' => $cleanedName,
            'blood_group' => $bloodGroup,
            'gender' => 'Male',
            'contact_phone' => $phone,
            'email' => $email,
            'district' => $district,
            'area_address' => $targetArea,
            'division' => 'Dhaka',
            'total_donations' => 0,
            'availability_status' => 'AVAILABLE',
            'tier' => 'Bronze Lifesaver',
            'last_donated_date' => null
        ];
    }

    return $donor;
}

if ($method === 'POST') {
    try {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: $_POST;

        $username = !empty($input['username']) ? trim($input['username']) : (!empty($input['identifier']) ? trim($input['identifier']) : 'Anonymous User');
        $role = (!empty($input['role']) && strtolower($input['role']) === 'admin') ? 'Admin' : 'User';
        $bloodGroup = !empty($input['blood_group']) ? trim($input['blood_group']) : 'O+';
        $district = !empty($input['district']) ? trim($input['district']) : 'Dhaka';
        $area = !empty($input['area']) ? trim($input['area']) : '';

        // 1. Record login entry in Users table
        $stmt = $pdo->prepare("INSERT INTO Users (username, user_role, login_time) VALUES (:username, :user_role, NOW())");
        $stmt->execute([':username' => $username, ':user_role' => $role]);
        $newLoginId = (int)$pdo->lastInsertId();

        // 2. Find or register in Donors table
        $donor = findOrCreateDonor($pdo, $username, $bloodGroup, $district, $area);
        $profile = buildDonorProfile($pdo, $donor, $username . '@gmail.com');

        echo json_encode([
            'success' => true,
            'message' => 'Login recorded and synchronized with MySQL database!',
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

        // If identifier or id is passed, synchronize and return single donor profile
        if ($identifier || $donorIdParam) {
            $donor = null;
            if ($donorIdParam) {
                $stmt = $pdo->prepare("SELECT * FROM Donors WHERE donor_id = :id LIMIT 1");
                $stmt->execute([':id' => $donorIdParam]);
                $donor = $stmt->fetch();
            }
            if (!$donor && $identifier) {
                $donor = findOrCreateDonor($pdo, $identifier);
            }

            if ($donor) {
                $profile = buildDonorProfile($pdo, $donor);
                echo json_encode([
                    'success' => true,
                    'profile' => $profile
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // Default: Return recent login records from Users table
        $stmt = $pdo->query("SELECT user_id, username, user_role, login_time FROM Users ORDER BY user_id DESC LIMIT 50");
        $users = $stmt->fetchAll();
        echo json_encode([
            'success' => true,
            'count' => count($users),
            'data' => $users
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
