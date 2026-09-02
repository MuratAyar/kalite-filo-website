<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';
require_once __DIR__ . '/publishing-deployment.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_runner_authentication();
    $runId = kalite_filo_admin_runner_run_id();
    $body = kalite_filo_admin_read_json();
    $requestId = trim((string) ($body['requestId'] ?? ''));
    $snapshotHash = strtolower(trim((string) ($body['snapshotHash'] ?? '')));
    $artifactHash = strtolower(trim((string) ($body['artifactHash'] ?? '')));
    if (preg_match('/^[a-f0-9]{64}$/', $artifactHash) !== 1) throw new InvalidArgumentException('Invalid rollback identity.');
    $record = kalite_filo_admin_require_claimed_publish_request($requestId, $snapshotHash, $runId);
    $rollbackId = kalite_filo_admin_rollback_staging_release($record, $artifactHash, $runId);
    kalite_filo_admin_audit('staging_publish_rollback', 'success', ['id' => $requestId, 'rollbackId' => $rollbackId]);
    kalite_filo_admin_json(['rolledBack' => true, 'rollbackId' => $rollbackId]);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'runner_conflict'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Publish runner rollback failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
