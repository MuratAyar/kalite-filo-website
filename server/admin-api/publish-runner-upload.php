<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/publishing-store.php';
require_once __DIR__ . '/publishing-automation.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_runner_authentication();
    $requestId = trim((string) ($_SERVER['HTTP_X_KALITE_REQUEST_ID'] ?? ''));
    $snapshotHash = strtolower(trim((string) ($_SERVER['HTTP_X_KALITE_SNAPSHOT_SHA256'] ?? '')));
    $artifactHash = strtolower(trim((string) ($_SERVER['HTTP_X_KALITE_ARTIFACT_SHA256'] ?? '')));
    $chunkHash = strtolower(trim((string) ($_SERVER['HTTP_X_KALITE_CHUNK_SHA256'] ?? '')));
    $chunkIndex = filter_var($_SERVER['HTTP_X_KALITE_CHUNK_INDEX'] ?? null, FILTER_VALIDATE_INT);
    $chunkCount = filter_var($_SERVER['HTTP_X_KALITE_CHUNK_COUNT'] ?? null, FILTER_VALIDATE_INT);
    $runId = kalite_filo_admin_runner_run_id();
    if (
        preg_match('/^[a-f0-9]{64}$/', $artifactHash) !== 1 || preg_match('/^[a-f0-9]{64}$/', $chunkHash) !== 1
        || !is_int($chunkIndex) || !is_int($chunkCount) || $chunkIndex < 0 || $chunkCount < 1
        || $chunkCount > KALITE_FILO_RUNNER_MAX_CHUNKS || $chunkIndex >= $chunkCount
    ) throw new InvalidArgumentException('Invalid artifact chunk metadata.');
    kalite_filo_admin_require_claimed_publish_request($requestId, $snapshotHash, $runId);
    $contentLength = filter_var($_SERVER['CONTENT_LENGTH'] ?? null, FILTER_VALIDATE_INT);
    if (!is_int($contentLength) || $contentLength < 1 || $contentLength > KALITE_FILO_RUNNER_MAX_CHUNK_BYTES) kalite_filo_admin_json(['error' => 'invalid_chunk_size'], 413);
    $body = file_get_contents('php://input', false, null, 0, KALITE_FILO_RUNNER_MAX_CHUNK_BYTES + 1);
    if (!is_string($body) || strlen($body) !== $contentLength || !hash_equals($chunkHash, hash('sha256', $body))) throw new InvalidArgumentException('Artifact chunk checksum mismatch.');
    $root = kalite_filo_admin_publish_upload_root($requestId, $artifactHash);
    kalite_filo_admin_ensure_private_directory($root);
    $lockPath = $root . DIRECTORY_SEPARATOR . '.lock';
    $lock = fopen($lockPath, 'c+');
    if ($lock === false || !flock($lock, LOCK_EX)) throw new RuntimeException('Artifact upload could not be locked.');
    try {
        @chmod($lockPath, 0600);
        $metadataPath = $root . DIRECTORY_SEPARATOR . 'metadata.json';
        $metadata = ['schemaVersion' => 1, 'requestId' => $requestId, 'snapshotHash' => $snapshotHash, 'artifactHash' => $artifactHash, 'chunkCount' => $chunkCount, 'runId' => $runId];
        if (is_file($metadataPath)) {
            $stored = json_decode((string) file_get_contents($metadataPath), true, 8, JSON_THROW_ON_ERROR);
            if ($stored !== $metadata) throw new DomainException('Artifact upload metadata conflict.');
        } else {
            $temporaryMetadata = $metadataPath . '.tmp-' . bin2hex(random_bytes(5));
            if (file_put_contents($temporaryMetadata, json_encode($metadata, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT), LOCK_EX) === false || !rename($temporaryMetadata, $metadataPath)) throw new RuntimeException('Artifact upload metadata could not be written.');
            @chmod($metadataPath, 0600);
        }
        $chunkPath = $root . DIRECTORY_SEPARATOR . sprintf('chunk-%03d.bin', $chunkIndex);
        if (is_file($chunkPath)) {
            if (!hash_equals($chunkHash, (string) hash_file('sha256', $chunkPath))) throw new DomainException('Artifact chunk conflict.');
        } else {
            $temporary = $chunkPath . '.tmp-' . bin2hex(random_bytes(5));
            if (file_put_contents($temporary, $body, LOCK_EX) === false || !rename($temporary, $chunkPath)) { @unlink($temporary); throw new RuntimeException('Artifact chunk could not be written.'); }
            @chmod($chunkPath, 0600);
        }
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
    kalite_filo_admin_json(['accepted' => true, 'chunkIndex' => $chunkIndex, 'chunkCount' => $chunkCount]);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'runner_conflict'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Publish runner upload failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
