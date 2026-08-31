<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/vehicle-store.php';
require_once __DIR__ . '/article-store.php';
require_once __DIR__ . '/media-store.php';
require_once __DIR__ . '/taxonomy-store.php';
require_once __DIR__ . '/publishing-store.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    kalite_filo_admin_require_csrf();
    $body = kalite_filo_admin_read_json();
    if (($body['confirmation'] ?? null) !== 'STAGING') throw new InvalidArgumentException('Staging confirmation is invalid.');
    $lock = kalite_filo_admin_lock_publish_store();
    try { $record = kalite_filo_admin_create_staging_publish_request(); }
    finally { kalite_filo_admin_unlock_publish_store($lock); }
    kalite_filo_admin_audit('staging_publish_request', 'success', ['id' => $record['id'], 'changeCount' => $record['changeCount']]);
    kalite_filo_admin_json(['request' => kalite_filo_admin_safe_publish_request($record)], 202);
} catch (InvalidArgumentException) {
    $validation = kalite_filo_admin_validate_staging_publish_payload(kalite_filo_admin_staging_publish_payload());
    kalite_filo_admin_json(['error' => 'validation_failed', 'validation' => $validation], 422);
} catch (Throwable $exception) {
    error_log('Staging publish request failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
