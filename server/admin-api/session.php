<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';

try {
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_require_allowed_client_ip();
    kalite_filo_admin_start_session();
    $payload = [
        'authenticated' => !empty($_SESSION['authenticated']),
        'csrfToken' => (string) $_SESSION['csrf'],
        'environment' => kalite_filo_admin_config()['environment'],
    ];
    if ($payload['authenticated']) $payload['user'] = kalite_filo_admin_safe_identity();
    kalite_filo_admin_json($payload);
} catch (Throwable $exception) {
    error_log('Kalite Filo admin session failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
