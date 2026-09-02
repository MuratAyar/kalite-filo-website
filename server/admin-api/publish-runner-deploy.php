<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';
require_once __DIR__ . '/publishing-deployment.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_runner_authentication();
    if (function_exists('set_time_limit')) @set_time_limit(120);
    ignore_user_abort(true);
    $runId = kalite_filo_admin_runner_run_id();
    $body = kalite_filo_admin_read_json();
    $requestId = trim((string) ($body['requestId'] ?? ''));
    $snapshotHash = strtolower(trim((string) ($body['snapshotHash'] ?? '')));
    $artifactHash = strtolower(trim((string) ($body['artifactHash'] ?? '')));
    $chunkCount = filter_var($body['chunkCount'] ?? null, FILTER_VALIDATE_INT);
    if (
        preg_match('/^[a-f0-9]{64}$/', $artifactHash) !== 1
        || !is_int($chunkCount) || $chunkCount < 1 || $chunkCount > KALITE_FILO_RUNNER_MAX_CHUNKS
    ) throw new InvalidArgumentException('Invalid deployment identity.');

    $lock = kalite_filo_admin_lock_publish_store();
    try {
        $record = kalite_filo_admin_require_claimed_publish_request($requestId, $snapshotHash, $runId);
        $record = kalite_filo_admin_set_publish_automation($record, 'deploying', [
            'artifactHash' => $artifactHash,
            'deployStartedAt' => gmdate('c'),
        ]);
    } finally { kalite_filo_admin_unlock_publish_store($lock); }

    $deployment = kalite_filo_admin_activate_staging_release($record, $artifactHash, $chunkCount, $runId);
    kalite_filo_admin_audit('staging_publish_deploy', 'success', [
        'id' => $requestId,
        'rollbackId' => $deployment['rollbackId'],
        'alreadyDeployed' => $deployment['alreadyDeployed'],
    ]);
    kalite_filo_admin_json($deployment);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'runner_conflict'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    $reason = kalite_filo_admin_deployment_failure_reason($exception);
    error_log('Publish runner deployment failed [' . get_class($exception) . '; reason=' . $reason . '].');
    kalite_filo_admin_json(['error' => 'deployment_failed', 'reason' => $reason], 503);
}
