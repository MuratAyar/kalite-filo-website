<?php
declare(strict_types=1);

function kalite_filo_admin_deployment_failure_reason(Throwable $exception): string
{
    $messages = [];
    for ($current = $exception; $current !== null; $current = $current->getPrevious()) {
        $messages[] = strtolower($current->getMessage());
    }
    $message = implode(' | ', $messages);
    $groups = [
        'artifact_upload_unavailable' => ['upload metadata', 'upload is incomplete', 'chunk could not be read'],
        'artifact_assembly_failed' => ['assembly could not start', 'chunk could not be assembled', 'artifact could not be finalized'],
        'artifact_validation_failed' => ['artifact checksum', 'tar artifact'],
        'phar_unavailable' => ['phardata is unavailable'],
        'release_extraction_failed' => ['release extraction', 'phardata'],
        'release_validation_failed' => ['extracted release', 'release manifest', 'release marker'],
        'document_root_invalid' => ['canonical staging document root'],
        'deployment_storage_failed' => ['private admin storage', 'incoming release could not be created'],
        'deployment_filesystem_mismatch' => ['same filesystem'],
        'rollback_retention_failed' => ['current staging release could not be retained'],
        'release_activation_failed' => ['new staging release could not be activated'],
        'deployment_state_failed' => ['deployment state could not be written'],
    ];
    foreach ($groups as $reason => $needles) {
        foreach ($needles as $needle) {
            if (str_contains($message, $needle)) return $reason;
        }
    }
    return 'deployment_runtime_failed';
}

/** @return array<string,mixed> */
function kalite_filo_admin_runner_upload_metadata(string $root): array
{
    $path = $root . DIRECTORY_SEPARATOR . 'metadata.json';
    if (!is_file($path) || is_link($path) || filesize($path) > 4096) throw new RuntimeException('Artifact upload metadata is unavailable.');
    $metadata = json_decode((string) file_get_contents($path), true, 8, JSON_THROW_ON_ERROR);
    if (!is_array($metadata) || ($metadata['schemaVersion'] ?? null) !== 1) throw new RuntimeException('Artifact upload metadata is invalid.');
    return $metadata;
}

function kalite_filo_admin_assemble_runner_artifact(string $root, array $expected): string
{
    $metadata = kalite_filo_admin_runner_upload_metadata($root);
    foreach (['requestId', 'snapshotHash', 'artifactHash', 'chunkCount', 'runId'] as $field) {
        if (($metadata[$field] ?? null) !== ($expected[$field] ?? null)) throw new DomainException('Artifact upload identity mismatch.');
    }
    $target = $root . DIRECTORY_SEPARATOR . 'artifact.tar';
    if (is_file($target)) {
        if (is_link($target) || !hash_equals((string) $expected['artifactHash'], (string) hash_file('sha256', $target))) throw new DomainException('Assembled artifact checksum mismatch.');
        return $target;
    }
    $temporary = $target . '.tmp-' . bin2hex(random_bytes(5));
    $output = fopen($temporary, 'xb');
    if ($output === false) throw new RuntimeException('Artifact assembly could not start.');
    $total = 0;
    try {
        for ($index = 0; $index < $expected['chunkCount']; $index++) {
            $chunk = $root . DIRECTORY_SEPARATOR . sprintf('chunk-%03d.bin', $index);
            if (!is_file($chunk) || is_link($chunk)) throw new RuntimeException('Artifact upload is incomplete.');
            $size = filesize($chunk);
            if (!is_int($size) || $size < 1 || $size > KALITE_FILO_RUNNER_MAX_CHUNK_BYTES) throw new RuntimeException('Artifact chunk is invalid.');
            $total += $size;
            if ($total > KALITE_FILO_RUNNER_MAX_ARTIFACT_BYTES) throw new RuntimeException('Artifact exceeds the deployment limit.');
            $input = fopen($chunk, 'rb');
            if ($input === false) throw new RuntimeException('Artifact chunk could not be read.');
            try { if (stream_copy_to_stream($input, $output) !== $size) throw new RuntimeException('Artifact chunk could not be assembled.'); }
            finally { fclose($input); }
        }
        fflush($output);
    } catch (Throwable $exception) {
        fclose($output);
        @unlink($temporary);
        throw $exception;
    }
    fclose($output);
    if (!hash_equals((string) $expected['artifactHash'], (string) hash_file('sha256', $temporary))) { @unlink($temporary); throw new DomainException('Artifact checksum mismatch.'); }
    @chmod($temporary, 0600);
    if (!rename($temporary, $target)) { @unlink($temporary); throw new RuntimeException('Artifact could not be finalized.'); }
    @chmod($target, 0600);
    return $target;
}

/** @return array{entries:int,bytes:int} */
function kalite_filo_admin_preflight_tar(string $path): array
{
    $size = filesize($path);
    if (!is_int($size) || $size < 1024 || $size > KALITE_FILO_RUNNER_MAX_ARTIFACT_BYTES || $size % 512 !== 0) throw new RuntimeException('Tar artifact size is invalid.');
    $handle = fopen($path, 'rb');
    if ($handle === false) throw new RuntimeException('Tar artifact could not be read.');
    $entries = 0; $bytes = 0; $seen = []; $foundEnd = false;
    try {
        while (($header = fread($handle, 512)) !== false && strlen($header) === 512) {
            if ($header === str_repeat("\0", 512)) {
                $secondEndBlock = fread($handle, 512);
                if ($secondEndBlock !== str_repeat("\0", 512)) throw new RuntimeException('Tar artifact terminator is invalid.');
                $foundEnd = true;
                break;
            }
            $checksumField = trim(substr($header, 148, 8), " \0");
            if ($checksumField === '' || preg_match('/^[0-7]+$/', $checksumField) !== 1) throw new RuntimeException('Tar artifact header checksum is invalid.');
            $checksumHeader = substr_replace($header, str_repeat(' ', 8), 148, 8);
            $calculatedChecksum = array_sum(unpack('C*', $checksumHeader));
            if ($calculatedChecksum !== intval($checksumField, 8) || substr($header, 257, 5) !== 'ustar') throw new RuntimeException('Tar artifact header is invalid.');
            $name = rtrim(substr($header, 0, 100), "\0");
            $prefix = rtrim(substr($header, 345, 155), "\0");
            $relative = $prefix !== '' ? $prefix . '/' . $name : $name;
            while (str_starts_with($relative, './')) $relative = substr($relative, 2);
            $type = substr($header, 156, 1);
            $sizeField = trim(substr($header, 124, 12), " \0");
            if (($relative === '' && $type !== '5') || str_starts_with($relative, '/') || str_contains($relative, '\\') || str_contains($relative, "\0") || preg_match('#(^|/)\.\.(/|$)#', $relative) === 1 || preg_match('/[\x00-\x1F\x7F]/', $relative) === 1) throw new RuntimeException('Tar artifact contains an unsafe path.');
            if (!in_array($type, ["\0", '0', '5'], true) || ($sizeField !== '' && preg_match('/^[0-7]+$/', $sizeField) !== 1)) throw new RuntimeException('Tar artifact contains an unsupported entry.');
            if (isset($seen[$relative])) throw new RuntimeException('Tar artifact contains a duplicate path.');
            $seen[$relative] = true;
            $entrySize = $sizeField === '' ? 0 : intval($sizeField, 8);
            if ($type === '5' && $entrySize !== 0) throw new RuntimeException('Tar directory entry is invalid.');
            if ($relative === '') continue;
            if ($entrySize < 0 || $entrySize > KALITE_FILO_RUNNER_MAX_ARTIFACT_BYTES) throw new RuntimeException('Tar artifact entry is too large.');
            $entries++; $bytes += $entrySize;
            if ($entries > 5000 || $bytes > 268435456) throw new RuntimeException('Tar artifact exceeds extraction limits.');
            $skip = (int) (ceil($entrySize / 512) * 512);
            if ($skip > 0 && fseek($handle, $skip, SEEK_CUR) !== 0) throw new RuntimeException('Tar artifact is truncated.');
            $position = ftell($handle);
            if (!is_int($position) || $position > $size) throw new RuntimeException('Tar artifact is truncated.');
        }
    } finally { fclose($handle); }
    if (!$foundEnd || $entries < 4) throw new RuntimeException('Tar artifact is incomplete.');
    return ['entries' => $entries, 'bytes' => $bytes];
}

function kalite_filo_admin_safe_release_relative_path(mixed $value): string
{
    if (!is_string($value) || $value === '' || strlen($value) > 512 || str_starts_with($value, '/') || str_contains($value, '\\') || preg_match('#(^|/)\.\.?(/|$)#', $value) === 1 || preg_match('/[\x00-\x1F\x7F]/', $value) === 1) throw new RuntimeException('Release manifest path is invalid.');
    return $value;
}

function kalite_filo_admin_remove_private_tree(string $path): void
{
    if (is_link($path) || is_file($path)) { @unlink($path); return; }
    if (!is_dir($path)) return;
    foreach (scandir($path) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        kalite_filo_admin_remove_private_tree($path . DIRECTORY_SEPARATOR . $entry);
    }
    @rmdir($path);
}

/** @return list<array{path:string,size:int,sha256:string}> */
function kalite_filo_admin_validate_extracted_release(string $root, array $identity): array
{
    foreach (['index.html', 'admin/index.html', 'admin-api/session.php', 'kalite-filo-release.json', 'kalite-filo-release-manifest.json'] as $required) if (!is_file($root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $required))) throw new RuntimeException('Extracted release is incomplete.');
    $marker = json_decode((string) file_get_contents($root . DIRECTORY_SEPARATOR . 'kalite-filo-release.json'), true, 8, JSON_THROW_ON_ERROR);
    foreach (['requestId', 'snapshotHash', 'manifestHash'] as $field) if (($marker[$field] ?? null) !== ($identity[$field] ?? null)) throw new DomainException('Release marker identity mismatch.');
    if (($marker['schemaVersion'] ?? null) !== 1 || ($marker['target'] ?? null) !== 'staging') throw new DomainException('Release marker contract is invalid.');
    $manifestPath = $root . DIRECTORY_SEPARATOR . 'kalite-filo-release-manifest.json';
    if (filesize($manifestPath) > 2097152) throw new RuntimeException('Release manifest is too large.');
    $manifest = json_decode((string) file_get_contents($manifestPath), true, 12, JSON_THROW_ON_ERROR);
    if (
        ($manifest['schemaVersion'] ?? null) !== 1 || ($manifest['target'] ?? null) !== 'staging'
        || ($manifest['requestId'] ?? null) !== ($identity['requestId'] ?? null)
        || ($manifest['snapshotHash'] ?? null) !== ($identity['snapshotHash'] ?? null)
        || ($manifest['manifestHash'] ?? null) !== ($identity['manifestHash'] ?? null)
        || !is_array($manifest['files'] ?? null) || count($manifest['files']) > 5000
    ) throw new RuntimeException('Release manifest is invalid.');
    $expected = [];
    foreach ($manifest['files'] as $file) {
        if (!is_array($file)) throw new RuntimeException('Release manifest record is invalid.');
        $relative = kalite_filo_admin_safe_release_relative_path($file['path'] ?? null);
        $fileSize = $file['size'] ?? null; $checksum = $file['sha256'] ?? null;
        if (!is_int($fileSize) || $fileSize < 0 || !is_string($checksum) || preg_match('/^[a-f0-9]{64}$/', $checksum) !== 1 || isset($expected[$relative])) throw new RuntimeException('Release manifest record is invalid.');
        $expected[$relative] = ['path' => $relative, 'size' => $fileSize, 'sha256' => $checksum];
    }
    ksort($expected, SORT_STRING);
    $actual = [];
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if ($file->isLink() || !$file->isFile()) throw new RuntimeException('Extracted release contains an unsupported entry.');
        $full = $file->getPathname();
        $relative = str_replace(DIRECTORY_SEPARATOR, '/', substr($full, strlen(rtrim($root, DIRECTORY_SEPARATOR)) + 1));
        if ($relative === 'kalite-filo-release-manifest.json') continue;
        $actual[$relative] = true;
    }
    ksort($actual, SORT_STRING);
    if (array_keys($expected) !== array_keys($actual)) throw new RuntimeException('Extracted release file set does not match its manifest.');
    foreach ($expected as $relative => $file) {
        $target = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
        if (filesize($target) !== $file['size'] || !hash_equals($file['sha256'], (string) hash_file('sha256', $target))) throw new RuntimeException('Extracted release checksum mismatch.');
    }
    return array_values($expected);
}

/** @return array{rollbackId:string,alreadyDeployed:bool} */
function kalite_filo_admin_activate_staging_release(array $record, string $artifactHash, int $chunkCount, string $runId): array
{
    $requestId = (string) $record['id']; $snapshotHash = (string) $record['snapshotHash'];
    $manifestHash = strtolower(trim((string) ($_SERVER['HTTP_X_KALITE_MANIFEST_SHA256'] ?? '')));
    if (preg_match('/^[a-f0-9]{64}$/', $manifestHash) !== 1) throw new InvalidArgumentException('Invalid review manifest hash.');
    $releaseId = $requestId . '-' . substr($artifactHash, 0, 12);
    $deployRoot = kalite_filo_admin_publish_deploy_root();
    $stateDirectory = $deployRoot . DIRECTORY_SEPARATOR . 'deployments'; kalite_filo_admin_ensure_private_directory($stateDirectory);
    $statePath = $stateDirectory . DIRECTORY_SEPARATOR . $releaseId . '.json';
    if (is_file($statePath)) {
        $state = json_decode((string) file_get_contents($statePath), true, 8, JSON_THROW_ON_ERROR);
        if (($state['status'] ?? null) === 'activated' && ($state['runId'] ?? null) === $runId) return ['rollbackId' => $releaseId, 'alreadyDeployed' => true];
        throw new DomainException('Deployment identity is already used.');
    }
    $uploadRoot = kalite_filo_admin_publish_upload_root($requestId, $artifactHash);
    $artifact = kalite_filo_admin_assemble_runner_artifact($uploadRoot, ['requestId' => $requestId, 'snapshotHash' => $snapshotHash, 'artifactHash' => $artifactHash, 'chunkCount' => $chunkCount, 'runId' => $runId]);
    kalite_filo_admin_preflight_tar($artifact);
    if (!class_exists('PharData')) throw new RuntimeException('PharData is unavailable.');
    $incomingDirectory = $deployRoot . DIRECTORY_SEPARATOR . 'incoming'; kalite_filo_admin_ensure_private_directory($incomingDirectory);
    $incoming = $incomingDirectory . DIRECTORY_SEPARATOR . $releaseId;
    if (file_exists($incoming)) throw new DomainException('Incoming release already exists.');
    if (!mkdir($incoming, 0700, true)) throw new RuntimeException('Incoming release could not be created.');
    try {
        $archive = new PharData($artifact);
        $archive->extractTo($incoming, null, false);
        unset($archive);
        kalite_filo_admin_validate_extracted_release($incoming, ['requestId' => $requestId, 'snapshotHash' => $snapshotHash, 'manifestHash' => $manifestHash]);
    } catch (Throwable $exception) {
        kalite_filo_admin_remove_private_tree($incoming);
        throw new RuntimeException('Release extraction or validation failed.', 0, $exception);
    }
    $documentRoot = realpath(dirname(__DIR__));
    if (!is_string($documentRoot) || basename($documentRoot) !== 'staging.kalitefilo.com.tr' || is_link($documentRoot) || kalite_filo_admin_config()['environment'] !== 'staging') throw new RuntimeException('Canonical staging document root is invalid.');
    $rollbackDirectory = $deployRoot . DIRECTORY_SEPARATOR . 'rollbacks'; kalite_filo_admin_ensure_private_directory($rollbackDirectory);
    $rollback = $rollbackDirectory . DIRECTORY_SEPARATOR . $releaseId;
    if (file_exists($rollback)) throw new DomainException('Rollback identity already exists.');
    $documentStat = stat($documentRoot); $incomingStat = stat($incomingDirectory);
    if (!is_array($documentStat) || !is_array($incomingStat) || ($documentStat['dev'] ?? null) !== ($incomingStat['dev'] ?? null)) throw new RuntimeException('Deployment paths are not on the same filesystem.');
    $movedOld = false; $movedNew = false;
    try {
        if (!rename($documentRoot, $rollback)) throw new RuntimeException('Current staging release could not be retained.');
        $movedOld = true;
        if (!rename($incoming, $documentRoot)) throw new RuntimeException('New staging release could not be activated.');
        $movedNew = true;
        @chmod($documentRoot, 0755);
        $state = ['schemaVersion' => 1, 'status' => 'activated', 'requestId' => $requestId, 'snapshotHash' => $snapshotHash, 'manifestHash' => $manifestHash, 'artifactHash' => $artifactHash, 'runId' => $runId, 'rollbackId' => $releaseId, 'activatedAt' => gmdate('c')];
        if (file_put_contents($statePath, json_encode($state, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT), LOCK_EX) === false) throw new RuntimeException('Deployment state could not be written.');
        @chmod($statePath, 0600);
    } catch (Throwable $exception) {
        @unlink($statePath);
        $failed = $deployRoot . DIRECTORY_SEPARATOR . 'failed-' . $releaseId . '-' . gmdate('YmdHis');
        if ($movedNew && is_dir($documentRoot)) @rename($documentRoot, $failed);
        if ($movedOld && is_dir($rollback) && !file_exists($documentRoot)) @rename($rollback, $documentRoot);
        throw $exception;
    }
    return ['rollbackId' => $releaseId, 'alreadyDeployed' => false];
}

function kalite_filo_admin_rollback_staging_release(array $record, string $artifactHash, string $runId): string
{
    $releaseId = (string) $record['id'] . '-' . substr($artifactHash, 0, 12);
    $deployRoot = kalite_filo_admin_publish_deploy_root();
    $rollback = $deployRoot . DIRECTORY_SEPARATOR . 'rollbacks' . DIRECTORY_SEPARATOR . $releaseId;
    $statePath = $deployRoot . DIRECTORY_SEPARATOR . 'deployments' . DIRECTORY_SEPARATOR . $releaseId . '.json';
    $documentRoot = realpath(dirname(__DIR__));
    if (!is_string($documentRoot) || basename($documentRoot) !== 'staging.kalitefilo.com.tr' || !is_dir($rollback) || is_link($rollback) || !is_file($statePath)) throw new RuntimeException('Rollback state is unavailable.');
    $state = json_decode((string) file_get_contents($statePath), true, 8, JSON_THROW_ON_ERROR);
    if (($state['status'] ?? null) === 'rolled_back' && ($state['runId'] ?? null) === $runId) return $releaseId;
    if (($state['status'] ?? null) !== 'activated' || ($state['runId'] ?? null) !== $runId || ($state['artifactHash'] ?? null) !== $artifactHash) throw new DomainException('Rollback identity mismatch.');
    $failed = $deployRoot . DIRECTORY_SEPARATOR . 'rolled-back-' . $releaseId;
    if (file_exists($failed)) throw new DomainException('Rollback destination already exists.');
    $movedCurrent = false;
    try {
        if (!rename($documentRoot, $failed)) throw new RuntimeException('Failed staging release could not be retained.');
        $movedCurrent = true;
        if (!rename($rollback, $documentRoot)) throw new RuntimeException('Previous staging release could not be restored.');
        @chmod($documentRoot, 0755);
        $state['status'] = 'rolled_back'; $state['rolledBackAt'] = gmdate('c');
        if (file_put_contents($statePath, json_encode($state, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT), LOCK_EX) === false) throw new RuntimeException('Rollback state could not be written.');
    } catch (Throwable $exception) {
        if ($movedCurrent && !file_exists($documentRoot) && is_dir($failed)) @rename($failed, $documentRoot);
        throw $exception;
    }
    return $releaseId;
}
