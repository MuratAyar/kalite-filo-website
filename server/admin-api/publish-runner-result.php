<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    kalite_filo_admin_require_csrf();
    $body = kalite_filo_admin_read_json(8192);
    $id = trim((string) ($body['id'] ?? ''));
    $snapshotHash = strtolower(trim((string) ($body['snapshotHash'] ?? '')));
    $action = (string) ($body['action'] ?? '');
    $lock = kalite_filo_admin_lock_publish_store();
    try { $record = kalite_filo_admin_transition_publish_request($id, $snapshotHash, $action, is_array($body['result'] ?? null) ? $body['result'] : []); }
    finally { kalite_filo_admin_unlock_publish_store($lock); }
    kalite_filo_admin_audit('staging_publish_runner_' . $action, 'success', ['id' => $id, 'snapshotHash' => $snapshotHash, 'status' => $record['status']]);
    kalite_filo_admin_json(['request' => kalite_filo_admin_safe_publish_request($record)]);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'invalid_transition'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Publish runner result failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
