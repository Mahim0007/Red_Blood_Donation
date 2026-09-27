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

        $stmt = $pdo->prepare("INSERT INTO Users (username, user_role, login_time) VALUES (:username, :user_role, NOW())");
        $stmt->execute([
            ':username' => $username,
            ':user_role' => $role
        ]);

        $userId = (int)$pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Login recorded successfully in Users table!',
            'user_id' => $userId,
            'username' => $username,
            'role' => $role
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    try {
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
