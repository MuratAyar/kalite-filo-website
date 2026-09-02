<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';
require_once __DIR__ . '/publishing-deployment.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    kalite_filo_admin_require_csrf();
    $body = kalite_filo_admin_read_json();
    $requestId = trim((string) ($body['requestId'] ?? ''));
    if (($body['confirmation'] ?? null) !== 'STAGING GERİ AL') throw new InvalidArgumentException('Rollback confirmation is invalid.');
    $lock = kalite_filo_admin_lock_publish_store();
    try {
        $record = kalite_filo_admin_publish_request($requestId);
        if ($record === null) throw new OutOfBoundsException('Publish request was not found.');
        $restored = kalite_filo_admin_restore_retained_staging_release($record);
        kalite_filo_admin_write_publish_baseline($record);
    } finally { kalite_filo_admin_unlock_publish_store($lock); }
    kalite_filo_admin_audit('staging_publish_admin_restore', 'success', ['id' => $requestId, 'previousReleaseId' => $restored['previousReleaseId'], 'alreadyActive' => $restored['alreadyActive']]);
    kalite_filo_admin_json(['restored' => true] + $restored);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'release_unavailable'], 404);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Admin staging restore failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
