<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';
require_once __DIR__ . '/vehicle-media.php';
require_once __DIR__ . '/media-store.php';

try {
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_require_runner_authentication();
    $requestId = trim((string) ($_GET['requestId'] ?? ''));
    $snapshotHash = strtolower(trim((string) ($_GET['snapshotHash'] ?? '')));
    $kind = (string) ($_GET['kind'] ?? '');
    $id = strtolower(trim((string) ($_GET['id'] ?? '')));
    $extension = strtolower(trim((string) ($_GET['extension'] ?? '')));
    $runId = kalite_filo_admin_runner_run_id();
    $record = kalite_filo_admin_require_claimed_publish_request($requestId, $snapshotHash, $runId);
    if (!in_array($kind, ['vehicle', 'library'], true) || preg_match('/^[a-f0-9]{32}$/', $id) !== 1 || !in_array($extension, ['jpg', 'png', 'webp'], true)) throw new InvalidArgumentException('Invalid media identity.');
    $expected = null;
    if ($kind === 'vehicle') {
        foreach ($record['snapshot']['vehicles'] ?? [] as $vehicle) {
            $media = is_array($vehicle) && is_array($vehicle['draftMedia'] ?? null) ? $vehicle['draftMedia'] : null;
            if (is_array($media) && ($media['id'] ?? null) === $id && ($media['extension'] ?? null) === $extension) { $expected = $media; break; }
        }
        $path = kalite_filo_admin_vehicle_media_path($id, $extension);
    } else {
        foreach ($record['snapshot']['media'] ?? [] as $media) {
            if (is_array($media) && ($media['id'] ?? null) === $id && ($media['extension'] ?? null) === $extension) { $expected = $media; break; }
        }
        $path = kalite_filo_admin_media_path($id, $extension);
    }
    if (!is_array($expected) || !is_file($path) || is_link($path)) kalite_filo_admin_json(['error' => 'not_found'], 404);
    $size = filesize($path);
    $checksum = hash_file('sha256', $path);
    if (!is_int($size) || !is_string($checksum) || $size !== ($expected['size'] ?? null) || !hash_equals((string) ($expected['checksum'] ?? ''), $checksum)) throw new RuntimeException('Private media integrity check failed.');
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . $size);
    header('Content-Disposition: attachment; filename="' . $id . '.' . $extension . '"');
    header('X-Content-Type-Options: nosniff');
    header('X-Kalite-Content-SHA256: ' . $checksum);
    readfile($path);
    exit;
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'runner_conflict'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Publish runner media failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
