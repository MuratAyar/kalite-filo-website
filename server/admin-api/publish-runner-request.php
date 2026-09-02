<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';

try {
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_require_runner_authentication();
    $id = trim((string) ($_GET['id'] ?? ''));
    $snapshotHash = strtolower(trim((string) ($_GET['snapshotHash'] ?? '')));
    $runId = kalite_filo_admin_runner_run_id();
    $lock = kalite_filo_admin_lock_publish_store();
    try { $record = kalite_filo_admin_claim_publish_request($id, $snapshotHash, $runId); }
    finally { kalite_filo_admin_unlock_publish_store($lock); }
    kalite_filo_admin_audit('staging_publish_runner_claim', 'success', ['id' => $id, 'snapshotHash' => $snapshotHash, 'runId' => $runId]);
    kalite_filo_admin_json(['request' => $record]);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'runner_conflict'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Publish runner request failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
