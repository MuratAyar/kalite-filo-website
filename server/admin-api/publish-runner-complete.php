<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_runner_authentication();
    $runId = kalite_filo_admin_runner_run_id();
    $body = kalite_filo_admin_read_json();
    $requestId = trim((string) ($body['requestId'] ?? ''));
    $snapshotHash = strtolower(trim((string) ($body['snapshotHash'] ?? '')));
    $result = $body['result'] ?? null;
    if (!is_array($result)) throw new InvalidArgumentException('Runner result is required.');

    $lock = kalite_filo_admin_lock_publish_store();
    try {
        kalite_filo_admin_require_claimed_publish_request($requestId, $snapshotHash, $runId);
        $record = kalite_filo_admin_transition_publish_request(
            $requestId,
            $snapshotHash,
            'complete',
            $result,
            'github-actions:' . $runId,
        );
    } finally { kalite_filo_admin_unlock_publish_store($lock); }
    kalite_filo_admin_audit('staging_publish_complete', ($record['status'] ?? null) === 'staging_succeeded' ? 'success' : 'failed', [
        'id' => $requestId,
        'runId' => $runId,
        'outcome' => $record['result']['outcome'] ?? null,
    ]);
    kalite_filo_admin_json(['request' => kalite_filo_admin_safe_publish_request($record)]);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'runner_conflict'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Publish runner completion failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
