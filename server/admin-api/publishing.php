<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/vehicle-store.php';
require_once __DIR__ . '/article-store.php';
require_once __DIR__ . '/media-store.php';
require_once __DIR__ . '/taxonomy-store.php';
require_once __DIR__ . '/featured-article-store.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';

try {
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    $payload = kalite_filo_admin_staging_publish_payload();
    $unpublishedChanges = kalite_filo_admin_unpublished_changes();
    $publishingChanges = [];
    $activeRequest = null;
    $requests = [];
    $currentRequestId = null;
    $historyAvailable = true;
    try {
        $rawRequests = kalite_filo_admin_publish_requests_with_details(kalite_filo_admin_publish_requests());
        foreach ($rawRequests as $candidate) {
            if (kalite_filo_admin_publish_request_is_in_flight($candidate)) { $activeRequest = $candidate; break; }
        }
        $comparisonSnapshot = is_array($activeRequest['snapshot'] ?? null)
            ? $activeRequest['snapshot']
            : kalite_filo_admin_previous_publish_snapshot();
        if ($comparisonSnapshot !== null) {
            foreach ($unpublishedChanges as &$change) {
                $change['details'] = kalite_filo_admin_publish_change_details((string) ($change['type'] ?? ''), $comparisonSnapshot, $payload);
            }
            unset($change);
        }
        if ($activeRequest !== null) {
            $activeFingerprints = [];
            foreach (is_array($activeRequest['changes'] ?? null) ? $activeRequest['changes'] : [] as $change) {
                if (is_array($change) && is_string($change['type'] ?? null) && is_string($change['fingerprint'] ?? null)) $activeFingerprints[$change['type']] = $change['fingerprint'];
            }
            $unpublishedChanges = array_values(array_filter($unpublishedChanges, static fn (array $change): bool => !isset($activeFingerprints[$change['type']]) || !hash_equals($activeFingerprints[$change['type']], (string) ($change['fingerprint'] ?? ''))));
            $publishingChanges = kalite_filo_admin_safe_publish_request($activeRequest)['changes'];
        }
        $requests = array_map('kalite_filo_admin_safe_publish_request', $rawRequests);
        $currentRequestId = kalite_filo_admin_current_publish_request_id();
        if ($currentRequestId !== null && count(array_filter($requests, static fn (array $request): bool => ($request['id'] ?? null) === $currentRequestId)) === 0) {
            $fallback = kalite_filo_admin_current_publish_history_fallback();
            if ($fallback !== null) array_unshift($requests, $fallback);
        }
    } catch (Throwable $historyException) {
        $historyAvailable = false;
        error_log('Publishing history overview degraded [' . get_class($historyException) . '].');
    }
    kalite_filo_admin_json([
        'changes' => array_map(static function (array $change): array { unset($change['fingerprint']); return $change; }, $unpublishedChanges),
        'publishingChanges' => $publishingChanges,
        'activeRequest' => $activeRequest !== null ? kalite_filo_admin_safe_publish_request($activeRequest) : null,
        'requests' => $requests,
        'validation' => kalite_filo_admin_validate_staging_publish_payload($payload),
        'automation' => kalite_filo_admin_publishing_automation_status(),
        'currentRequestId' => $currentRequestId,
        'historyAvailable' => $historyAvailable,
        'productionEnabled' => false,
    ]);
} catch (Throwable $exception) {
    error_log('Publishing overview failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
