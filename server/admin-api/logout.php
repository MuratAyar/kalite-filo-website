<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    kalite_filo_admin_require_csrf();
    kalite_filo_admin_audit('logout', 'success');
    kalite_filo_admin_end_session();
    kalite_filo_admin_json(['authenticated' => false]);
} catch (Throwable $exception) {
    error_log('Kalite Filo admin logout failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
