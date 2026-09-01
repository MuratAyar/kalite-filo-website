<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';

try {
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    $id = (string) ($_GET['id'] ?? '');
    $record = kalite_filo_admin_publish_request($id);
    if ($record === null) kalite_filo_admin_json(['error' => 'not_found'], 404);
    $encoded = json_encode($record, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    kalite_filo_admin_audit('staging_publish_snapshot_download', 'success', ['id' => $id, 'snapshotHash' => $record['snapshotHash'] ?? null]);
    header('Content-Type: application/json; charset=UTF-8');
    header('Content-Length: ' . strlen($encoded));
    header('Content-Disposition: attachment; filename="' . $id . '.json"');
    header('X-Content-Type-Options: nosniff');
    echo $encoded;
    exit;
} catch (Throwable $exception) {
    error_log('Publish request download failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
