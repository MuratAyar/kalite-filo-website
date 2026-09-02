<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';

try {
    kalite_filo_admin_require_method('DELETE');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_roles(['owner']);
    kalite_filo_admin_require_csrf();
    $body = kalite_filo_admin_read_json();
    if (($body['confirmation'] ?? null) !== 'GEÇMİŞİ SİL') throw new InvalidArgumentException('History confirmation is invalid.');
    $lock = kalite_filo_admin_lock_publish_store();
    try { $result = kalite_filo_admin_clear_publish_history(); }
    finally { kalite_filo_admin_unlock_publish_store($lock); }
    kalite_filo_admin_audit('staging_publish_history_clear', 'success', $result);
    kalite_filo_admin_json($result);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Publishing history clear failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
