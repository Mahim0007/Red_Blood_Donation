<?php
require_once __DIR__ . '/db.php';

try {
    $donorsCount = $pdo->query("SELECT COUNT(*) FROM Donors")->fetchColumn();
    $activeRequestsCount = $pdo->query("SELECT COUNT(*) FROM Blood_Requests WHERE request_status = 'ACTIVE'")->fetchColumn();
    $totalDonationsCount = $pdo->query("SELECT SUM(total_donations) FROM Donors")->fetchColumn() ?: 0;
    $hospitalsCount = $pdo->query("SELECT COUNT(*) FROM Hospitals")->fetchColumn();
    $criticalShortages = $pdo->query("SELECT COUNT(*) FROM Blood_Inventory WHERE stock_status = 'CRITICAL'")->fetchColumn();

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_donors' => (int)$donorsCount,
            'active_requests' => (int)$activeRequestsCount,
            'total_donations' => (int)$totalDonationsCount,
            'lives_saved' => (int)$totalDonationsCount * 3, // Each unit saves up to 3 lives
            'hospitals_connected' => (int)$hospitalsCount,
            'critical_shortages' => (int)$criticalShortages
        ]
    ], JSON_PRETTY_PRINT);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
