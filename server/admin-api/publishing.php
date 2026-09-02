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
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    $payload = kalite_filo_admin_staging_publish_payload();
    $requests = [];
    $currentRequestId = null;
    $historyAvailable = true;
    try {
        $requests = array_map('kalite_filo_admin_safe_publish_request', kalite_filo_admin_publish_requests_with_details(kalite_filo_admin_publish_requests()));
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
        'changes' => kalite_filo_admin_unpublished_changes(),
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
