<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/vehicle-store.php';
require_once __DIR__ . '/article-store.php';
require_once __DIR__ . '/media-store.php';
require_once __DIR__ . '/taxonomy-store.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    kalite_filo_admin_require_csrf();
    $body = kalite_filo_admin_read_json();
    if (($body['confirmation'] ?? null) !== 'STAGING') throw new InvalidArgumentException('Staging confirmation is invalid.');
    $lock = kalite_filo_admin_lock_publish_store();
    try {
        $record = kalite_filo_admin_create_staging_publish_request();
        $automation = is_array($record['automation'] ?? null) ? $record['automation'] : [];
        $automationState = $automation['status'] ?? null;
        $updatedAt = is_string($automation['updatedAt'] ?? null) ? strtotime($automation['updatedAt']) : false;
        $age = is_int($updatedAt) ? time() - $updatedAt : PHP_INT_MAX;
        $stale = in_array($automationState, ['dispatching', 'queued'], true) && $age > 1200
            || in_array($automationState, ['running', 'deploying'], true) && $age > 1200;
        $shouldDispatch = !in_array($automationState, ['queued', 'running', 'deploying', 'succeeded'], true) || $stale;
        if ($shouldDispatch) {
            if ($stale) { $record['status'] = 'awaiting_runner'; $record['startedAt'] = null; }
            $record = kalite_filo_admin_set_publish_automation($record, 'dispatching', [
                'runId' => null,
                'providerRunId' => null,
                'runUrl' => null,
                'errorCode' => null,
                'attempt' => max(1, (int) ($automation['attempt'] ?? 0) + 1),
            ]);
        }
    } finally { kalite_filo_admin_unlock_publish_store($lock); }
    if (!$shouldDispatch) kalite_filo_admin_json(['request' => kalite_filo_admin_safe_publish_request($record), 'alreadyRunning' => true], 202);
    $automationStatus = kalite_filo_admin_publishing_automation_status();
    if ($automationStatus['ready'] !== true) {
        $lock = kalite_filo_admin_lock_publish_store();
        try { $record = kalite_filo_admin_set_publish_automation($record, 'dispatch_failed', ['errorCode' => 'automation_not_ready']); }
        finally { kalite_filo_admin_unlock_publish_store($lock); }
        kalite_filo_admin_audit('staging_publish_dispatch', 'failed', ['id' => $record['id'], 'errorCode' => 'automation_not_ready']);
        kalite_filo_admin_json(['error' => 'automation_not_ready', 'automation' => $automationStatus, 'request' => kalite_filo_admin_safe_publish_request($record)], 503);
    }
    try {
        $dispatch = kalite_filo_admin_dispatch_publish_workflow($record);
        $lock = kalite_filo_admin_lock_publish_store();
        try { $record = kalite_filo_admin_set_publish_automation($record, 'queued', ['dispatchedAt' => gmdate('c'), 'providerRunId' => $dispatch['runId'], 'runUrl' => $dispatch['runUrl'], 'errorCode' => null]); }
        finally { kalite_filo_admin_unlock_publish_store($lock); }
    } catch (Throwable $exception) {
        $lock = kalite_filo_admin_lock_publish_store();
        try { $record = kalite_filo_admin_set_publish_automation($record, 'dispatch_failed', ['errorCode' => 'github_dispatch_failed']); }
        finally { kalite_filo_admin_unlock_publish_store($lock); }
        kalite_filo_admin_audit('staging_publish_dispatch', 'failed', ['id' => $record['id'], 'errorCode' => 'github_dispatch_failed']);
        kalite_filo_admin_json(['error' => 'automation_dispatch_failed', 'request' => kalite_filo_admin_safe_publish_request($record)], 503);
    }
    kalite_filo_admin_audit('staging_publish_dispatch', 'success', ['id' => $record['id'], 'changeCount' => $record['changeCount']]);
    kalite_filo_admin_json(['request' => kalite_filo_admin_safe_publish_request($record), 'dispatched' => true], 202);
} catch (InvalidArgumentException) {
    $validation = kalite_filo_admin_validate_staging_publish_payload(kalite_filo_admin_staging_publish_payload());
    kalite_filo_admin_json(['error' => 'validation_failed', 'validation' => $validation], 422);
} catch (Throwable $exception) {
    error_log('Staging publish request failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
