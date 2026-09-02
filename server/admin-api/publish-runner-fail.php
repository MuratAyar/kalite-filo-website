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
    $stage = trim((string) ($body['stage'] ?? 'materialization'));
    $allowedStages = ['materialization', 'validation', 'build', 'release', 'deployment', 'smoke'];
    if (!in_array($stage, $allowedStages, true)) throw new InvalidArgumentException('Invalid runner failure stage.');
    $summary = trim((string) ($body['summary'] ?? 'GitHub Actions runner failed.'));
    if (mb_strlen($summary) > 300 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $summary) === 1) throw new InvalidArgumentException('Invalid runner failure summary.');

    $lock = kalite_filo_admin_lock_publish_store();
    try {
        $record = kalite_filo_admin_publish_request($requestId);
        if ($record === null) throw new OutOfBoundsException('Publish request was not found.');
        if (!hash_equals((string) ($record['snapshotHash'] ?? ''), $snapshotHash)) throw new InvalidArgumentException('Snapshot identity mismatch.');
        if (($record['status'] ?? null) === 'failed') {
            kalite_filo_admin_json(['request' => kalite_filo_admin_safe_publish_request($record)]);
        }
        if (($record['status'] ?? null) === 'awaiting_runner') {
            $record = kalite_filo_admin_claim_publish_request($requestId, $snapshotHash, $runId);
        } else {
            $record = kalite_filo_admin_require_claimed_publish_request($requestId, $snapshotHash, $runId);
        }
        $failedIndex = array_search($stage, $allowedStages, true);
        $stages = [];
        foreach ($allowedStages as $index => $name) $stages[$name] = $index < $failedIndex ? 'passed' : ($index === $failedIndex ? 'failed' : 'skipped');
        $record = kalite_filo_admin_transition_publish_request($requestId, $snapshotHash, 'complete', [
            'outcome' => 'failed', 'manifestHash' => null, 'artifactHash' => null,
            'stages' => $stages, 'summary' => $summary,
        ], 'github-actions:' . $runId);
    } finally { kalite_filo_admin_unlock_publish_store($lock); }
    kalite_filo_admin_audit('staging_publish_runner_failed', 'failed', ['id' => $requestId, 'runId' => $runId, 'stage' => $stage]);
    kalite_filo_admin_json(['request' => kalite_filo_admin_safe_publish_request($record)]);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'runner_conflict'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Publish runner failure report failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
