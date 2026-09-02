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
    $requests = array_map('kalite_filo_admin_safe_publish_request', kalite_filo_admin_publish_requests_with_details(kalite_filo_admin_publish_requests()));
    $payload = kalite_filo_admin_staging_publish_payload();
    $currentRequestId = null;
    $markerPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'kalite-filo-release.json';
    if (is_file($markerPath) && !is_link($markerPath) && filesize($markerPath) <= 4096) {
        $marker = json_decode((string) file_get_contents($markerPath), true, 8, JSON_THROW_ON_ERROR);
        $candidate = $marker['requestId'] ?? null;
        if (is_string($candidate) && preg_match('/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/', $candidate) === 1) $currentRequestId = $candidate;
    }
    kalite_filo_admin_json([
        'changes' => kalite_filo_admin_unpublished_changes(),
        'requests' => $requests,
        'validation' => kalite_filo_admin_validate_staging_publish_payload($payload),
        'automation' => kalite_filo_admin_publishing_automation_status(),
        'currentRequestId' => $currentRequestId,
        'productionEnabled' => false,
    ]);
} catch (Throwable $exception) {
    error_log('Publishing overview failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
