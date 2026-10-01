<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Builds donor/user profile from Donors table record
 */
function buildDonorProfile($pdo, $donor, $fallbackEmail = '') {
    $donorId = (int)$donor['donor_id'];
    $totalDonations = (int)($donor['total_donations'] ?? 0);
    $formattedId = 'RD-BD-2026-' . str_pad($donorId, 4, '0', STR_PAD_LEFT);

    // Fetch official donation history from Donation_Logs
    $logsStmt = $pdo->prepare("
        SELECT 
            l.log_id,
            l.donation_date AS date,
            l.bags_donated AS bags,
            l.certificate_id AS certificateId,
            COALESCE(l.hospital_name, h.name, l.remarks, 'Hospital Transfusion Center') AS hospital,
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
    $status = $donor['availability_status'] ?? 'AVAILABLE';

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
        'bloodGroup' => $donor['blood_group'] ?? 'O+',
        'phone' => $donor['contact_phone'] ?? '',
        'email' => $donor['email'] ?: $fallbackEmail,
        'district' => $donor['district'] ?? 'Dhaka',
        'area' => $donor['area_address'] ?? 'Dhaka Sadar',
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
 * Builds user profile directly from Users table
 */
function buildUserProfileFromUserRow($pdo, $user) {
    $userId = (int)$user['user_id'];
    $identifier = $user['username'];
    $phone = $user['phone'] ?: (strpos($identifier, '@') === false ? $identifier : '');
    $email = $user['email'] ?: (strpos($identifier, '@') !== false ? $identifier : '');

    // Check if this user also has a record in Donors table
    $dStmt = $pdo->prepare("
        SELECT * FROM Donors 
        WHERE (contact_phone != '' AND contact_phone = :p)
           OR (email != '' AND email = :e)
           OR (full_name != '' AND LOWER(full_name) = LOWER(:n))
        ORDER BY donor_id DESC 
        LIMIT 1
    ");
    $dStmt->execute([
        ':p' => $phone ?: '---',
        ':e' => $email ?: '---',
        ':n' => $user['full_name'] ?: '---'
    ]);
    $donor = $dStmt->fetch();

    if ($donor) {
        $profile = buildDonorProfile($pdo, $donor, $email);
        $profile['userId'] = $userId;
        if (!empty($user['full_name'])) $profile['name'] = $user['full_name'];
        if (!empty($user['blood_group'])) $profile['bloodGroup'] = $user['blood_group'];
        if (!empty($user['district'])) $profile['district'] = $user['district'];
        return $profile;
    }

    return [
        'id' => $userId,
        'userId' => $userId,
        'donorId' => 'RD-USR-' . str_pad($userId, 4, '0', STR_PAD_LEFT),
        'name' => $user['full_name'] ?: $identifier,
        'bloodGroup' => $user['blood_group'] ?: 'O+',
        'phone' => $phone,
        'email' => $email,
        'district' => $user['district'] ?: 'Dhaka',
        'area' => $user['area'] ?: (($user['district'] ?: 'Dhaka') . ' Sadar'),
        'totalDonations' => 0,
        'livesSaved' => 0,
        'status' => 'AVAILABLE',
        'isEligible' => true,
        'daysRemaining' => 0,
        'tier' => 'Community Member',
        'lastDonatedDate' => null,
        'nextEligibleDate' => 'Immediately Eligible',
        'history' => [],
        'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($user['full_name'] ?: $identifier)
    ];
}

if ($method === 'POST') {
    try {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: $_POST;

        $action = !empty($input['action']) ? trim($input['action']) : 'login';

        // =========================================================================
        // ACTION 1: CREATE ACCOUNT (Sign Up)
        // =========================================================================
        if ($action === 'register') {
            $firstName = !empty($input['firstName']) ? trim($input['firstName']) : '';
            $lastName  = !empty($input['lastName']) ? trim($input['lastName']) : '';
            $fullName  = !empty($input['fullName']) ? trim($input['fullName']) : trim("$firstName $lastName");
            $contact   = !empty($input['contact']) ? trim($input['contact']) : (!empty($input['username']) ? trim($input['username']) : '');
            $password  = !empty($input['password']) ? trim($input['password']) : '';
            $blood     = !empty($input['blood']) ? trim($input['blood']) : (!empty($input['bloodGroup']) ? trim($input['bloodGroup']) : 'O+');
            $district  = !empty($input['district']) ? trim($input['district']) : 'Dhaka';
            $area      = !empty($input['area']) ? trim($input['area']) : ($district . ' Sadar');

            if (empty($contact)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Email or phone number is required.']);
                exit();
            }
            if (empty($password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Password is required.']);
                exit();
            }

            // Check if user already exists in Users table
            $checkStmt = $pdo->prepare("
                SELECT user_id, username FROM Users 
                WHERE username = :c1 
                   OR (email != '' AND email = :c2) 
                   OR (phone != '' AND phone = :c3) 
                LIMIT 1
            ");
            $checkStmt->execute([
                ':c1' => $contact,
                ':c2' => $contact,
                ':c3' => $contact
            ]);
            $existing = $checkStmt->fetch();

            if ($existing) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'An account with this email/phone already exists! Please log in.'
                ]);
                exit();
            }

            $email = strpos($contact, '@') !== false ? $contact : '';
            $phone = strpos($contact, '@') === false ? $contact : '';

            $insStmt = $pdo->prepare("
                INSERT INTO Users (
                    full_name, username, email, phone, password, 
                    blood_group, district, area, user_role, created_at, login_time
                ) VALUES (
                    :full_name, :username, :email, :phone, :password, 
                    :blood_group, :district, :area, 'User', NOW(), NOW()
                )
            ");
            $insStmt->execute([
                ':full_name'   => $fullName ?: $contact,
                ':username'    => $contact,
                ':email'       => $email,
                ':phone'       => $phone,
                ':password'    => $password,
                ':blood_group' => $blood,
                ':district'    => $district,
                ':area'        => $area
            ]);
            $newUserId = (int)$pdo->lastInsertId();

            // Link donor_id if this user exists in Donors table
            $linkStmt = $pdo->prepare("
                SELECT donor_id FROM Donors 
                WHERE (contact_phone != '' AND contact_phone = :p)
                   OR (email != '' AND email = :e)
                LIMIT 1
            ");
            $linkStmt->execute([':p' => $phone ?: '---', ':e' => $email ?: '---']);
            $linkedDonorId = $linkStmt->fetchColumn();
            if ($linkedDonorId) {
                $pdo->prepare("UPDATE Users SET donor_id = :did WHERE user_id = :uid")
                    ->execute([':did' => $linkedDonorId, ':uid' => $newUserId]);
            }

            echo json_encode([
                'success'   => true,
                'message'   => 'Account created successfully in database! Please log in with your password.',
                'user_id'   => $newUserId,
                'username'  => $contact,
                'full_name' => $fullName
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        // =========================================================================
        // ACTION 2: LOGIN (Log in using created account)
        // =========================================================================
        $identifier = !empty($input['identifier']) ? trim($input['identifier']) : (!empty($input['username']) ? trim($input['username']) : '');
        $password   = !empty($input['password']) ? trim($input['password']) : '';
        $role       = (!empty($input['role']) && strtolower($input['role']) === 'admin') ? 'Admin' : 'User';

        if (empty($identifier)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Phone or email is required.']);
            exit();
        }

        // A. Admin Login Branch
        if ($role === 'Admin' || strtolower($identifier) === 'admin' || strtolower($identifier) === 'dbms') {
            if ($password === 'admin123' || $password === 'admin') {
                // Update login time for admin in Users table
                $uStmt = $pdo->prepare("UPDATE Users SET login_time = NOW() WHERE username = 'admin' OR user_role = 'Admin'");
                $uStmt->execute();

                echo json_encode([
                    'success' => true,
                    'role'    => 'admin',
                    'message' => 'Admin logged in successfully',
                    'profile' => [
                        'id'      => 1,
                        'name'    => 'DBMS Administrator',
                        'phone'   => '01700000000',
                        'email'   => 'admin@reddrop.org',
                        'role'    => 'admin',
                        'donorId' => 'ADMIN-ROOT'
                    ]
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                exit();
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid admin credentials! (Use admin / admin123)']);
                exit();
            }
        }

        // B. User Login Branch
        // Find existing record in Users table
        $userStmt = $pdo->prepare("
            SELECT * FROM Users 
            WHERE username = :id1 
               OR (email != '' AND email = :id2) 
               OR (phone != '' AND phone = :id3) 
            ORDER BY user_id DESC 
            LIMIT 1
        ");
        $userStmt->execute([
            ':id1' => $identifier,
            ':id2' => $identifier,
            ':id3' => $identifier
        ]);
        $user = $userStmt->fetch();

        if ($user) {
            // Check password
            $dbPassword = $user['password'];
            $passwordsMatch = false;

            if ($dbPassword !== null && $dbPassword !== '') {
                $passwordsMatch = ($password === $dbPassword);
            } else {
                // Legacy demo accounts with empty password accept 123456 or empty
                $passwordsMatch = ($password === '123456' || empty($password));
            }

            if (!$passwordsMatch) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Incorrect password! Please check and try again.'
                ]);
                exit();
            }

            // CRITICAL: DO NOT INSERT DUPLICATE ROW! Update login_time only.
            $pdo->prepare("UPDATE Users SET login_time = NOW() WHERE user_id = :uid")
                ->execute([':uid' => $user['user_id']]);

            // Sync donor_id if not yet linked
            if (empty($user['donor_id'])) {
                $phone = $user['phone'] ?: '';
                $email = $user['email'] ?: '';
                $syncStmt = $pdo->prepare("
                    SELECT donor_id FROM Donors 
                    WHERE (contact_phone != '' AND contact_phone = :p)
                       OR (email != '' AND email = :e)
                    LIMIT 1
                ");
                $syncStmt->execute([':p' => $phone ?: '---', ':e' => $email ?: '---']);
                $syncedDonorId = $syncStmt->fetchColumn();
                if ($syncedDonorId) {
                    $pdo->prepare("UPDATE Users SET donor_id = :did WHERE user_id = :uid")
                        ->execute([':did' => $syncedDonorId, ':uid' => $user['user_id']]);
                }
            }

            // Build profile from DB record
            $profile = buildUserProfileFromUserRow($pdo, $user);

            echo json_encode([
                'success' => true,
                'message' => "Welcome back, {$profile['name']}!",
                'profile' => $profile
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        // C. If user not in Users table, check Donors table (for initial sample donors)
        $donorStmt = $pdo->prepare("
            SELECT * FROM Donors 
            WHERE contact_phone = :d1 
               OR email = :d2 
               OR LOWER(full_name) = LOWER(:d3) 
            ORDER BY donor_id DESC 
            LIMIT 1
        ");
        $donorStmt->execute([
            ':d1' => $identifier,
            ':d2' => $identifier,
            ':d3' => $identifier
        ]);
        $donor = $donorStmt->fetch();

        if ($donor && ($password === '123456' || empty($password))) {
            // Seed this donor into Users once so future logins are direct
            $email = $donor['email'] ?: '';
            $phone = $donor['contact_phone'] ?: '';
            $insStmt = $pdo->prepare("
                INSERT INTO Users (
                    full_name, username, email, phone, password, 
                    blood_group, district, area, user_role, created_at, login_time
                ) VALUES (
                    :full_name, :username, :email, :phone, '123456', 
                    :blood_group, :district, :area, 'User', NOW(), NOW()
                )
            ");
            $insStmt->execute([
                ':full_name'   => $donor['full_name'],
                ':username'    => $donor['contact_phone'] ?: $donor['email'],
                ':email'       => $email,
                ':phone'       => $phone,
                ':blood_group' => $donor['blood_group'],
                ':district'    => $donor['district'],
                ':area'        => $donor['area_address']
            ]);
            $newUserId = (int)$pdo->lastInsertId();
            // Link donor_id immediately
            $pdo->prepare("UPDATE Users SET donor_id = :did WHERE user_id = :uid")
                ->execute([':did' => $donor['donor_id'], ':uid' => $newUserId]);

            $profile = buildDonorProfile($pdo, $donor, $email);
            echo json_encode([
                'success' => true,
                'message' => "Welcome back, {$profile['name']}!",
                'profile' => $profile
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        // D. Neither in Users nor valid Donor
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error'   => 'No account found with this phone or email. Please create an account first!'
        ]);
        exit();

    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    try {
        $identifier = !empty($_GET['identifier']) ? trim($_GET['identifier']) : (!empty($_GET['username']) ? trim($_GET['username']) : null);
        $donorIdParam = !empty($_GET['id']) ? (int)$_GET['id'] : null;

        // Synchronize and return profile WITHOUT creating duplicate rows
        if ($identifier || $donorIdParam) {
            $user = null;
            if ($identifier) {
                $uStmt = $pdo->prepare("
                    SELECT * FROM Users 
                    WHERE username = :id1 
                       OR (email != '' AND email = :id2) 
                       OR (phone != '' AND phone = :id3) 
                    ORDER BY user_id DESC 
                    LIMIT 1
                ");
                $uStmt->execute([
                    ':id1' => $identifier,
                    ':id2' => $identifier,
                    ':id3' => $identifier
                ]);
                $user = $uStmt->fetch();
            }

            if ($user) {
                $profile = buildUserProfileFromUserRow($pdo, $user);
                echo json_encode([
                    'success' => true,
                    'profile' => $profile
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Check Donors table if not in Users
            $dStmt = $pdo->prepare("
                SELECT * FROM Donors 
                WHERE donor_id = :did 
                   OR contact_phone = :d1 
                   OR email = :d2 
                ORDER BY donor_id DESC 
                LIMIT 1
            ");
            $dStmt->execute([
                ':did' => $donorIdParam ?: 0,
                ':d1'  => $identifier ?: '---',
                ':d2'  => $identifier ?: '---'
            ]);
            $donor = $dStmt->fetch();

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
        $stmt = $pdo->query("
            SELECT user_id, full_name, username, email, phone, blood_group, district, user_role, login_time 
            FROM Users 
            ORDER BY login_time DESC, user_id DESC 
            LIMIT 50
        ");
        $users = $stmt->fetchAll();
        echo json_encode([
            'success' => true,
            'count'   => count($users),
            'data'    => $users
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
