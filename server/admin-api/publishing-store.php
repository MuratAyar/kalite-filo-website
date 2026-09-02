<?php
declare(strict_types=1);

function kalite_filo_admin_publish_root(): string
{
    return (string) kalite_filo_admin_config()['data_root'] . DIRECTORY_SEPARATOR . 'publish';
}

function kalite_filo_admin_publish_baseline_path(): string
{
    return kalite_filo_admin_publish_root() . DIRECTORY_SEPARATOR . 'staging-baseline.json';
}

function kalite_filo_admin_publish_baseline_snapshot_path(): string
{
    return kalite_filo_admin_publish_root() . DIRECTORY_SEPARATOR . 'staging-baseline-snapshot.json';
}

/** @return array<string,mixed>|null */
function kalite_filo_admin_publish_baseline_snapshot(): ?array
{
    $path = kalite_filo_admin_publish_baseline_snapshot_path();
    if (!is_file($path) || is_link($path) || filesize($path) > 33554432) return null;
    try {
        $raw = file_get_contents($path);
        if (!is_string($raw)) return null;
        $value = json_decode($raw, true, 30, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        error_log('Publishing baseline snapshot is unreadable [' . basename($path) . '].');
        return null;
    }
    return is_array($value) && ($value['formatVersion'] ?? null) === 1 ? $value : null;
}

/** @return array<string,string> */
function kalite_filo_admin_publish_baseline(): array
{
    $path = kalite_filo_admin_publish_baseline_path();
    if (!is_file($path) || is_link($path) || filesize($path) > 1048576) return [];
    try {
        $raw = file_get_contents($path);
        if (!is_string($raw)) return [];
        $value = json_decode($raw, true, 6, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        error_log('Publishing baseline is unreadable [' . basename($path) . '].');
        return [];
    }
    if (!is_array($value) || ($value['schemaVersion'] ?? null) !== 1 || !is_array($value['fingerprints'] ?? null)) return [];
    $result = [];
    foreach ($value['fingerprints'] as $type => $fingerprint) {
        if (is_string($type) && preg_match('/^[a-z_]{3,40}$/', $type) === 1 && is_string($fingerprint) && preg_match('/^[a-f0-9]{64}$/', $fingerprint) === 1) $result[$type] = $fingerprint;
    }
    return $result;
}

/** @return array<string,mixed> */
function kalite_filo_admin_publish_baseline_record(): array
{
    $path = kalite_filo_admin_publish_baseline_path();
    if (!is_file($path) || is_link($path) || filesize($path) > 1048576) return [];
    try {
        $raw = file_get_contents($path);
        if (!is_string($raw)) return [];
        $value = json_decode($raw, true, 12, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        error_log('Publishing baseline record is unreadable [' . basename($path) . '].');
        return [];
    }
    return is_array($value) && ($value['schemaVersion'] ?? null) === 1 ? $value : [];
}

function kalite_filo_admin_current_publish_request_id(): ?string
{
    $markerPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'kalite-filo-release.json';
    if (is_file($markerPath) && !is_link($markerPath) && filesize($markerPath) <= 4096) {
        try {
            $raw = file_get_contents($markerPath);
            $marker = is_string($raw) ? json_decode($raw, true, 8, JSON_THROW_ON_ERROR) : null;
            $candidate = is_array($marker) ? ($marker['requestId'] ?? null) : null;
            if (is_string($candidate) && preg_match('/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/', $candidate) === 1) return $candidate;
        } catch (JsonException $exception) {
            error_log('Active release marker is unreadable. Falling back to the private baseline.');
        }
    }
    $candidate = kalite_filo_admin_publish_baseline_record()['requestId'] ?? null;
    return is_string($candidate) && preg_match('/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/', $candidate) === 1 ? $candidate : null;
}

function kalite_filo_admin_write_publish_baseline(array $record): void
{
    $fingerprints = [];
    foreach (is_array($record['changes'] ?? null) ? $record['changes'] : [] as $change) {
        if (is_array($change) && is_string($change['type'] ?? null) && is_string($change['fingerprint'] ?? null) && preg_match('/^[a-f0-9]{64}$/', $change['fingerprint']) === 1) $fingerprints[$change['type']] = $change['fingerprint'];
    }
    $root = kalite_filo_admin_publish_root(); kalite_filo_admin_ensure_private_directory($root);
    $path = kalite_filo_admin_publish_baseline_path(); $temporary = $path . '.tmp-' . bin2hex(random_bytes(5));
    $payload = ['schemaVersion' => 1, 'requestId' => $record['id'] ?? null, 'snapshotHash' => $record['snapshotHash'] ?? null, 'fingerprints' => $fingerprints, 'history' => kalite_filo_admin_safe_publish_request($record), 'updatedAt' => gmdate('c')];
    if (file_put_contents($temporary, json_encode($payload, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT), LOCK_EX) === false || !rename($temporary, $path)) { @unlink($temporary); throw new RuntimeException('Staging baseline could not be written.'); }
    @chmod($path, 0600);
    if (is_array($record['snapshot'] ?? null)) {
        $snapshotPath = kalite_filo_admin_publish_baseline_snapshot_path();
        $snapshotTemporary = $snapshotPath . '.tmp-' . bin2hex(random_bytes(5));
        $encoded = json_encode($record['snapshot'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (file_put_contents($snapshotTemporary, $encoded, LOCK_EX) === false || !rename($snapshotTemporary, $snapshotPath)) { @unlink($snapshotTemporary); throw new RuntimeException('Staging baseline snapshot could not be written.'); }
        @chmod($snapshotPath, 0600);
    }
}

/** @return array<string,mixed>|null */
function kalite_filo_admin_previous_publish_snapshot(): ?array
{
    $baseline = kalite_filo_admin_publish_baseline_snapshot();
    if ($baseline !== null) return $baseline;
    foreach (kalite_filo_admin_publish_requests() as $request) {
        if (($request['target'] ?? null) === 'staging' && ($request['status'] ?? null) === 'staging_succeeded' && is_array($request['snapshot'] ?? null)) return $request['snapshot'];
    }
    return null;
}

function kalite_filo_admin_diff_value(mixed $value): string
{
    if ($value === null || $value === '') return '—';
    if (is_bool($value)) return $value ? 'Evet' : 'Hayır';
    if (is_array($value)) {
        $items = array_slice(array_values(array_filter($value, static fn (mixed $item): bool => is_scalar($item))), 0, 8);
        $value = implode(', ', array_map(static fn (mixed $item): string => (string) $item, $items));
    }
    if (!is_scalar($value)) return 'Güncellendi';
    $text = trim((string) $value);
    return mb_strlen($text) > 120 ? mb_substr($text, 0, 117) . '…' : ($text !== '' ? $text : '—');
}

/** @param list<array<string,mixed>> $records @return array<string,array<string,mixed>> */
function kalite_filo_admin_index_publish_entities(array $records): array
{
    $indexed = [];
    foreach ($records as $record) if (is_array($record) && is_string($record['id'] ?? null) && $record['id'] !== '') $indexed[$record['id']] = $record;
    return $indexed;
}

/** @return list<array<string,mixed>> */
function kalite_filo_admin_vehicle_change_details(array $before, array $after): array
{
    $previous = kalite_filo_admin_index_publish_entities(is_array($before['vehicles'] ?? null) ? $before['vehicles'] : []);
    $current = kalite_filo_admin_index_publish_entities(is_array($after['vehicles'] ?? null) ? $after['vehicles'] : []);
    $fields = ['make'=>'Marka','model'=>'Model','trim'=>'Donanım','modelYearLabel'=>'Model yılı','categoryLabel'=>'Kategori','segmentLabel'=>'Segment','fuelLabel'=>'Yakıt','transmissionLabel'=>'Şanzıman','powerHp'=>'Güç (HP)','seats'=>'Koltuk','slug'=>'Slug','summary'=>'Özet','priority'=>'Öncelik','sourceStatus'=>'Kaynak durumu','publicationStatus'=>'Yayın durumu','priceAmountMinor'=>'Fiyat','priceStatus'=>'Fiyat durumu','featured'=>'Öne çıkan','featuredOrder'=>'Öne çıkan sırası'];
    $details = [];
    foreach (array_unique(array_merge(array_keys($previous), array_keys($current))) as $id) {
        $old = $previous[$id] ?? null; $new = $current[$id] ?? null;
        $record = $new ?? $old ?? [];
        $entity = trim((string) ($record['make'] ?? '') . ' ' . (string) ($record['model'] ?? ''));
        $entity = $entity !== '' ? $entity : $id;
        if ($old === null || $new === null) { $details[] = ['entity'=>$entity,'action'=>$old === null ? 'created' : 'removed','fields'=>[]]; continue; }
        $changed = [];
        foreach ($fields as $key => $label) if (($old[$key] ?? null) !== ($new[$key] ?? null)) $changed[] = ['label'=>$label,'before'=>kalite_filo_admin_diff_value($old[$key] ?? null),'after'=>kalite_filo_admin_diff_value($new[$key] ?? null)];
        $oldImage = array_map(static fn(array $media): mixed => $media['id'] ?? null, is_array($old['galleryMedia'] ?? null) ? $old['galleryMedia'] : (is_array($old['draftMedia'] ?? null) ? [$old['draftMedia']] : []));
        $newImage = array_map(static fn(array $media): mixed => $media['id'] ?? null, is_array($new['galleryMedia'] ?? null) ? $new['galleryMedia'] : (is_array($new['draftMedia'] ?? null) ? [$new['draftMedia']] : []));
        if ($oldImage === []) $oldImage = $old['coverImage']['src'] ?? null;
        if ($newImage === []) $newImage = $new['coverImage']['src'] ?? null;
        if ($oldImage !== $newImage) $changed[] = ['label'=>'Görsel','before'=>kalite_filo_admin_diff_value($oldImage),'after'=>kalite_filo_admin_diff_value($newImage)];
        if ($changed !== []) $details[] = ['entity'=>$entity,'action'=>'updated','fields'=>array_slice($changed, 0, 20)];
        if (count($details) >= 50) break;
    }
    return $details;
}

/** @return list<array<string,mixed>> */
function kalite_filo_admin_publish_change_details(string $type, array $before, array $after): array
{
    if ($type === 'vehicles') return kalite_filo_admin_vehicle_change_details($before, $after);
    if ($type === 'featured_vehicles') {
        $old = is_array($before['featuredVehicleIds'] ?? null) ? $before['featuredVehicleIds'] : [];
        $new = is_array($after['featuredVehicleIds'] ?? null) ? $after['featuredVehicleIds'] : [];
        return $old === $new ? [] : [['entity'=>'Ana sayfa araç sıralaması','action'=>'reordered','fields'=>[['label'=>'Sıralama','before'=>kalite_filo_admin_diff_value($old),'after'=>kalite_filo_admin_diff_value($new)]]]];
    }
    if ($type === 'articles') {
        $old = kalite_filo_admin_index_publish_entities(is_array($before['articles'] ?? null) ? $before['articles'] : []);
        $new = kalite_filo_admin_index_publish_entities(is_array($after['articles'] ?? null) ? $after['articles'] : []);
        $details=[];
        foreach(array_unique(array_merge(array_keys($old),array_keys($new))) as $id){$a=$old[$id]??null;$b=$new[$id]??null;if($a===$b)continue;$entity=(string)($b['locales']['tr']['title']??$a['locales']['tr']['title']??$id);$details[]=['entity'=>$entity,'action'=>$a===null?'created':($b===null?'removed':'updated'),'fields'=>$a!==null&&$b!==null?[['label'=>'İçerik ve metadata','before'=>'Önceki sürüm','after'=>'Güncellendi']]:[]];if(count($details)>=50)break;}
        return $details;
    }
    if ($type === 'vehicle_taxonomy') return ($before['taxonomy'] ?? null) === ($after['taxonomy'] ?? null) ? [] : [['entity'=>'Araç etiketleri','action'=>'updated','fields'=>[['label'=>'Etiket listeleri','before'=>'Önceki sürüm','after'=>'Güncellendi']]]];
    if ($type === 'media') return ($before['media'] ?? null) === ($after['media'] ?? null) ? [] : [['entity'=>'Medya kütüphanesi','action'=>'updated','fields'=>[['label'=>'Medya kayıtları','before'=>'Önceki sürüm','after'=>'Güncellendi']]]];
    return [];
}

/** @param list<array<string,mixed>> $requests @return list<array<string,mixed>> */
function kalite_filo_admin_publish_requests_with_details(array $requests): array
{
    foreach ($requests as $index => &$request) {
        if (!is_array($request['snapshot'] ?? null)) continue;
        $previous = null;
        for ($candidate = $index + 1, $count = count($requests); $candidate < $count; $candidate++) {
            if (($requests[$candidate]['status'] ?? null) === 'staging_succeeded' && is_array($requests[$candidate]['snapshot'] ?? null)) { $previous = $requests[$candidate]['snapshot']; break; }
        }
        if ($previous === null) continue;
        foreach (is_array($request['changes'] ?? null) ? $request['changes'] : [] as &$change) {
            if (!is_array($change) || is_array($change['details'] ?? null)) continue;
            $change['details'] = kalite_filo_admin_publish_change_details((string) ($change['type'] ?? ''), $previous, $request['snapshot']);
        }
        unset($change);
    }
    unset($request);
    return $requests;
}

/** @return resource */
function kalite_filo_admin_lock_publish_store()
{
    $root = kalite_filo_admin_publish_root();
    kalite_filo_admin_ensure_private_directory($root);
    $handle = fopen($root . DIRECTORY_SEPARATOR . '.lock', 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) fclose($handle);
        throw new RuntimeException('Publish store could not be locked.');
    }
    @chmod($root . DIRECTORY_SEPARATOR . '.lock', 0600);
    return $handle;
}

/** @param resource $handle */
function kalite_filo_admin_unlock_publish_store($handle): void
{
    flock($handle, LOCK_UN);
    fclose($handle);
}

/** @param list<array<string,mixed>> $vehicles @return list<string> */
function kalite_filo_admin_publish_featured_ids(array $vehicles): array
{
    $path = (string) kalite_filo_admin_config()['data_root'] . DIRECTORY_SEPARATOR . 'drafts' . DIRECTORY_SEPARATOR . 'featured-vehicles.json';
    if (is_file($path)) {
        $data = json_decode((string) file_get_contents($path), true, 6, JSON_THROW_ON_ERROR);
        if (is_array($data) && is_array($data['ids'] ?? null)) return array_values($data['ids']);
    }
    return array_values(array_map(static fn (array $vehicle): string => (string) $vehicle['id'], array_filter($vehicles, static fn (array $vehicle): bool => ($vehicle['featured'] ?? false) === true)));
}

/** @return list<array{id:string,type:string,label:string,updatedAt:?string}> */
function kalite_filo_admin_unpublished_changes(): array
{
    $config = kalite_filo_admin_config();
    $root = (string) $config['data_root'];
    $changes = [];
    $sources = [
        ['type' => 'vehicles', 'label' => 'Araç taslakları', 'path' => kalite_filo_admin_vehicle_store_path()],
        ['type' => 'articles', 'label' => 'Filo Rehberi taslakları', 'path' => kalite_filo_admin_article_store_path()],
        ['type' => 'featured_vehicles', 'label' => 'Öne çıkan araç sıralaması', 'path' => $root . DIRECTORY_SEPARATOR . 'drafts' . DIRECTORY_SEPARATOR . 'featured-vehicles.json'],
        ['type' => 'vehicle_taxonomy', 'label' => 'Araç etiketleri', 'path' => $root . DIRECTORY_SEPARATOR . 'drafts' . DIRECTORY_SEPARATOR . 'vehicle-taxonomy.json'],
        ['type' => 'media', 'label' => 'Medya kütüphanesi', 'path' => kalite_filo_admin_media_catalog_path()],
    ];
    $publishedFingerprints = kalite_filo_admin_publish_baseline();
    foreach (kalite_filo_admin_publish_requests() as $publishedRequest) {
        if (($publishedRequest['target'] ?? null) !== 'staging' || ($publishedRequest['status'] ?? null) !== 'staging_succeeded') continue;
        foreach (is_array($publishedRequest['changes'] ?? null) ? $publishedRequest['changes'] : [] as $change) {
            if (is_array($change) && is_string($change['type'] ?? null) && is_string($change['fingerprint'] ?? null) && !isset($publishedFingerprints[$change['type']])) {
                $publishedFingerprints[$change['type']] = $change['fingerprint'];
            }
        }
    }
    foreach ($sources as $source) {
        if (!is_file($source['path'])) continue;
        $modified = filemtime($source['path']);
        $fingerprint = hash_file('sha256', $source['path']);
        if (!is_string($fingerprint)) throw new RuntimeException('Draft fingerprint could not be calculated.');
        if (isset($publishedFingerprints[$source['type']]) && hash_equals($publishedFingerprints[$source['type']], $fingerprint)) continue;
        $changes[] = [
            'id' => hash('sha256', $source['type'] . '|' . $fingerprint),
            'type' => $source['type'],
            'label' => $source['label'],
            'updatedAt' => is_int($modified) ? gmdate('c', $modified) : null,
            'fingerprint' => $fingerprint,
        ];
    }
    return $changes;
}

/** @return list<array<string,mixed>> */
function kalite_filo_admin_publish_requests(): array
{
    $directory = kalite_filo_admin_publish_root() . DIRECTORY_SEPARATOR . 'requests';
    if (!is_dir($directory)) return [];
    $files = glob($directory . DIRECTORY_SEPARATOR . 'publish-*.json') ?: [];
    rsort($files, SORT_STRING);
    $records = [];
    foreach (array_slice($files, 0, 100) as $path) {
        $raw = file_get_contents($path);
        if (!is_string($raw) || strlen($raw) > 33554432) continue;
        try {
            $record = json_decode($raw, true, 30, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            error_log('Publish request record is unreadable [' . basename($path) . '].');
            continue;
        }
        if (is_array($record) && ($record['schemaVersion'] ?? null) === 1) $records[] = $record;
    }
    return $records;
}

/** @return array<string,mixed>|null */
function kalite_filo_admin_publish_request(string $id): ?array
{
    if (preg_match('/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/', $id) !== 1) return null;
    $directory = kalite_filo_admin_publish_root() . DIRECTORY_SEPARATOR . 'requests';
    $path = $directory . DIRECTORY_SEPARATOR . $id . '.json';
    if (!is_file($path) || filesize($path) > 33554432) return null;
    $directoryReal = realpath($directory);
    $pathReal = realpath($path);
    if (!is_string($directoryReal) || !is_string($pathReal) || !str_starts_with($pathReal, $directoryReal . DIRECTORY_SEPARATOR)) return null;
    $raw = file_get_contents($pathReal);
    if (!is_string($raw)) return null;
    $record = json_decode($raw, true, 30, JSON_THROW_ON_ERROR);
    if (!is_array($record) || ($record['schemaVersion'] ?? null) !== 1 || ($record['id'] ?? null) !== $id) return null;
    return $record;
}

/** @param array<string,mixed> $record */
function kalite_filo_admin_replace_publish_request(array $record): void
{
    $id = (string) ($record['id'] ?? '');
    if (preg_match('/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/', $id) !== 1) throw new InvalidArgumentException('Invalid publish request ID.');
    $directory = kalite_filo_admin_publish_root() . DIRECTORY_SEPARATOR . 'requests';
    kalite_filo_admin_ensure_private_directory($directory);
    $path = $directory . DIRECTORY_SEPARATOR . $id . '.json';
    $temporary = $path . '.tmp-' . bin2hex(random_bytes(5));
    $encoded = json_encode($record, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (file_put_contents($temporary, $encoded, LOCK_EX) === false) throw new RuntimeException('Publish request result could not be written.');
    @chmod($temporary, 0600);
    if (!rename($temporary, $path)) { @unlink($temporary); throw new RuntimeException('Publish request result could not be replaced.'); }
    @chmod($path, 0600);
}

/** @return array<string,mixed> */
function kalite_filo_admin_normalize_runner_result(array $input): array
{
    $outcome = $input['outcome'] ?? null;
    if (!in_array($outcome, ['succeeded', 'failed'], true)) throw new InvalidArgumentException('Invalid runner outcome.');
    $manifestHash = strtolower(trim((string) ($input['manifestHash'] ?? '')));
    $artifactHash = strtolower(trim((string) ($input['artifactHash'] ?? '')));
    if ($manifestHash !== '' && preg_match('/^[a-f0-9]{64}$/', $manifestHash) !== 1) throw new InvalidArgumentException('Invalid manifest hash.');
    if ($artifactHash !== '' && preg_match('/^[a-f0-9]{64}$/', $artifactHash) !== 1) throw new InvalidArgumentException('Invalid artifact hash.');
    if ($outcome === 'succeeded' && ($manifestHash === '' || $artifactHash === '')) throw new InvalidArgumentException('Successful runner result requires manifest and artifact hashes.');
    $stageNames = ['materialization', 'validation', 'build', 'release', 'deployment', 'smoke'];
    $stages = $input['stages'] ?? null;
    if (!is_array($stages) || array_keys($stages) !== $stageNames) throw new InvalidArgumentException('Invalid runner stages.');
    $normalizedStages = [];
    foreach ($stageNames as $name) {
        $status = $stages[$name] ?? null;
        if (!in_array($status, ['passed', 'failed', 'skipped'], true)) throw new InvalidArgumentException('Invalid runner stage status.');
        $normalizedStages[$name] = $status;
    }
    if ($outcome === 'succeeded' && count(array_filter($normalizedStages, static fn (string $status): bool => $status !== 'passed')) > 0) throw new InvalidArgumentException('Successful runner stages must all pass.');
    if ($outcome === 'failed' && !in_array('failed', $normalizedStages, true)) throw new InvalidArgumentException('Failed runner result requires a failed stage.');
    $summary = trim((string) ($input['summary'] ?? ''));
    $summaryLength = preg_match_all('/./us', $summary, $unused);
    if ($summaryLength === false || $summaryLength > 300 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $summary) === 1) throw new InvalidArgumentException('Invalid runner summary.');
    return ['outcome' => $outcome, 'manifestHash' => $manifestHash !== '' ? $manifestHash : null, 'artifactHash' => $artifactHash !== '' ? $artifactHash : null, 'stages' => $normalizedStages, 'summary' => $summary !== '' ? $summary : null];
}

/** @return array<string,mixed> */
function kalite_filo_admin_transition_publish_request(string $id, string $snapshotHash, string $action, array $input = [], ?string $reportedBy = null): array
{
    if (preg_match('/^[a-f0-9]{64}$/', $snapshotHash) !== 1) throw new InvalidArgumentException('Invalid snapshot hash.');
    $record = kalite_filo_admin_publish_request($id);
    if ($record === null) throw new OutOfBoundsException('Publish request was not found.');
    if (!hash_equals((string) ($record['snapshotHash'] ?? ''), $snapshotHash)) throw new InvalidArgumentException('Snapshot identity mismatch.');
    $status = $record['status'] ?? null;
    if ($action === 'start') {
        if ($status === 'running') return $record;
        if ($status !== 'awaiting_runner') throw new DomainException('Invalid publish transition.');
        $record['status'] = 'running';
        $record['startedAt'] = gmdate('c');
        kalite_filo_admin_replace_publish_request($record);
        return $record;
    }
    if ($action !== 'complete') throw new InvalidArgumentException('Invalid runner action.');
    if (!in_array($status, ['running', 'staging_succeeded', 'failed'], true)) throw new DomainException('Runner must be started before completion.');
    $result = kalite_filo_admin_normalize_runner_result($input);
    $terminalStatus = $result['outcome'] === 'succeeded' ? 'staging_succeeded' : 'failed';
    if (in_array($status, ['staging_succeeded', 'failed'], true)) {
        $storedResult = is_array($record['result'] ?? null) ? $record['result'] : [];
        unset($storedResult['reportedAt'], $storedResult['reportedBy']);
        if ($status === $terminalStatus && $storedResult === $result) return $record;
        throw new DomainException('Publish result is already final.');
    }
    $record['status'] = $terminalStatus;
    $record['completedAt'] = gmdate('c');
    $record['result'] = $result + ['reportedAt' => $record['completedAt'], 'reportedBy' => $reportedBy ?? ($_SESSION['identity']['id'] ?? null)];
    if (is_array($record['automation'] ?? null)) {
        $record['automation']['status'] = $result['outcome'] === 'succeeded' ? 'succeeded' : 'failed';
        $record['automation']['updatedAt'] = $record['completedAt'];
    }
    kalite_filo_admin_replace_publish_request($record);
    if ($terminalStatus === 'staging_succeeded') kalite_filo_admin_write_publish_baseline($record);
    return $record;
}

function kalite_filo_admin_publish_request_is_stale(array $record, ?int $now = null): bool
{
    $status = (string) ($record['status'] ?? '');
    if (!in_array($status, ['awaiting_runner', 'running'], true)) return false;
    $automation = is_array($record['automation'] ?? null) ? $record['automation'] : [];
    $timestamp = $automation['updatedAt'] ?? $record['startedAt'] ?? $record['requestedAt'] ?? null;
    if (!is_string($timestamp)) return true;
    $updatedAt = strtotime($timestamp);
    if ($updatedAt === false) return true;
    $threshold = $status === 'running' ? 45 * 60 : 20 * 60;
    return ($now ?? time()) - $updatedAt >= $threshold;
}

function kalite_filo_admin_publish_request_is_in_flight(array $record): bool
{
    if (!in_array($record['status'] ?? null, ['awaiting_runner', 'running'], true)) return false;
    $automation = is_array($record['automation'] ?? null) ? $record['automation'] : [];
    $automationStatus = $automation['status'] ?? null;
    return $automationStatus === null
        || in_array($automationStatus, ['dispatching', 'queued', 'running', 'deploying'], true);
}

/** @return array{deleted:int,deletedStale:int,preservedActive:int,preservedCurrent:int} */
function kalite_filo_admin_clear_publish_history(): array
{
    $requests = kalite_filo_admin_publish_requests();
    $currentRequestId = kalite_filo_admin_current_publish_request_id();
    foreach ($requests as $record) if (($record['id'] ?? null) === $currentRequestId && ($record['status'] ?? null) === 'staging_succeeded') { kalite_filo_admin_write_publish_baseline($record); break; }
    $deleted = 0; $deletedStale = 0; $preservedActive = 0; $preservedCurrent = 0;
    $directory = kalite_filo_admin_publish_root() . DIRECTORY_SEPARATOR . 'requests';
    foreach ($requests as $record) {
        $id = (string) ($record['id'] ?? '');
        if ($id === $currentRequestId) { $preservedCurrent++; continue; }
        if (in_array($record['status'] ?? null, ['awaiting_runner', 'running'], true) && !kalite_filo_admin_publish_request_is_stale($record)) { $preservedActive++; continue; }
        $path = $directory . DIRECTORY_SEPARATOR . $id . '.json';
        if (preg_match('/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/', $id) === 1 && is_file($path) && !is_link($path) && unlink($path)) { $deleted++; if (in_array($record['status'] ?? null, ['awaiting_runner', 'running'], true)) $deletedStale++; }
    }
    return ['deleted' => $deleted, 'deletedStale' => $deletedStale, 'preservedActive' => $preservedActive, 'preservedCurrent' => $preservedCurrent];
}

/** @return array<string,mixed>|null */
function kalite_filo_admin_current_publish_history_fallback(): ?array
{
    $baseline = kalite_filo_admin_publish_baseline_record();
    $currentRequestId = kalite_filo_admin_current_publish_request_id();
    if ($currentRequestId === null || ($baseline['requestId'] ?? null) !== $currentRequestId) return null;
    if (is_array($baseline['history'] ?? null)) return $baseline['history'];
    return ['id'=>$currentRequestId,'target'=>'staging','status'=>'staging_succeeded','changeCount'=>0,'changes'=>[],'snapshotHash'=>(string)($baseline['snapshotHash']??''),'requestedAt'=>(string)($baseline['updatedAt']??gmdate('c')),'requestedBy'=>null,'startedAt'=>null,'completedAt'=>(string)($baseline['updatedAt']??gmdate('c')),'result'=>null,'automation'=>null];
}

/** @return array{valid:bool,blockers:list<array{code:string,message:string}>,warnings:list<array{code:string,message:string}>} */
function kalite_filo_admin_validate_staging_publish_payload(array $payload): array
{
    $blockers=[];$warnings=[];
    $vehicles=is_array($payload['vehicles']??null)?$payload['vehicles']:[];
    $featured=is_array($payload['featuredVehicleIds']??null)?array_values($payload['featuredVehicleIds']):[];
    $articles=is_array($payload['articles']??null)?$payload['articles']:[];
    $media=is_array($payload['media']??null)?$payload['media']:[];
    try{kalite_filo_admin_assert_vehicle_uniqueness($vehicles);}catch(Throwable){$blockers[]=['code'=>'vehicle_identity','message'=>'Araç kimliği, sourceId veya slug değerleri benzersiz değil.'];}
    if(count($featured)!==4||count(array_unique($featured))!==4){$blockers[]=['code'=>'featured_requires_four','message'=>'Tam olarak dört farklı öne çıkan araç seçilmelidir.'];}
    else{$byId=[];foreach($vehicles as $vehicle)if(is_array($vehicle))$byId[(string)($vehicle['id']??'')]=$vehicle;foreach($featured as $id){$vehicle=$byId[(string)$id]??null;$hasGallery=is_array($vehicle['galleryMedia']??null)&&count($vehicle['galleryMedia'])>0;if(!is_array($vehicle)||($vehicle['publicationStatus']??'')!=='published'||!is_int($vehicle['priceAmountMinor']??null)||(!is_array($vehicle['coverImage']??null)&&!is_array($vehicle['draftMedia']??null)&&!$hasGallery)){$blockers[]=['code'=>'featured_vehicle_ineligible','message'=>'Öne çıkan araçların tümü yayında, fiyatlı ve görselli olmalıdır.'];break;}}}
    $mediaIds=[];foreach($media as $asset)if(is_array($asset)&&is_string($asset['id']??null))$mediaIds[$asset['id']]=true;
    foreach($articles as $article){if(!is_array($article))continue;$tr=$article['locales']['tr']??null;if(!is_array($tr))$blockers[]=['code'=>'article_tr_missing','message'=>'Her Filo Rehberi taslağında Türkçe içerik bulunmalıdır.'];$coverId=$article['coverMediaId']??null;if(is_string($coverId)&&!isset($mediaIds[$coverId]))$blockers[]=['code'=>'article_media_missing','message'=>'Bir Filo Rehberi taslağı bulunamayan bir medya kaydına bağlı.'];if(is_array($tr)&&($tr['status']??'')!=='ready')$warnings[]=['code'=>'article_draft','message'=>'Draft durumundaki Filo Rehberi içerikleri public çıktıya alınmayacaktır.'];}
    return ['valid'=>$blockers===[],'blockers'=>array_values(array_unique($blockers,SORT_REGULAR)),'warnings'=>array_values(array_unique($warnings,SORT_REGULAR))];
}

/** @return array<string,mixed> */
function kalite_filo_admin_staging_publish_payload(): array
{
    $vehicles=kalite_filo_admin_vehicle_records();
    return ['formatVersion'=>1,'vehicles'=>$vehicles,'articles'=>kalite_filo_admin_article_drafts(),'media'=>kalite_filo_admin_media_records(),'featuredVehicleIds'=>kalite_filo_admin_publish_featured_ids($vehicles),'taxonomy'=>kalite_filo_admin_taxonomy()];
}

/** @return array<string,mixed> */
function kalite_filo_admin_create_staging_publish_request(): array
{
    $changes = kalite_filo_admin_unpublished_changes();
    if (count($changes) < 1) throw new InvalidArgumentException('There are no unpublished changes.');
    $payload=kalite_filo_admin_staging_publish_payload();
    $validation=kalite_filo_admin_validate_staging_publish_payload($payload);
    if(!$validation['valid'])throw new InvalidArgumentException('Publish validation failed.');
    $previousSnapshot = kalite_filo_admin_previous_publish_snapshot();
    if ($previousSnapshot !== null) foreach ($changes as &$change) $change['details'] = kalite_filo_admin_publish_change_details((string) $change['type'], $previousSnapshot, $payload);
    unset($change);
    $encodedPayload = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $snapshotHash=hash('sha256',$encodedPayload);
    foreach (kalite_filo_admin_publish_requests() as $existing) {
        if (($existing['target'] ?? null) !== 'staging') continue;
        if (($existing['snapshotHash'] ?? null) === $snapshotHash && in_array($existing['status'] ?? null, ['awaiting_runner', 'running'], true)) return $existing;
        if (kalite_filo_admin_publish_request_is_in_flight($existing)) return $existing;
    }
    $now = gmdate('c');
    $record = [
        'schemaVersion' => 1,
        'id' => 'publish-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(6)),
        'target' => 'staging',
        'status' => 'awaiting_runner',
        'changeCount' => count($changes),
        'changes' => $changes,
        'snapshotHash' => $snapshotHash,
        'snapshot' => $payload,
        'validation' => $validation,
        'requestedAt' => $now,
        'requestedBy' => $_SESSION['identity']['id'] ?? null,
        'startedAt' => null,
        'completedAt' => null,
        'result' => null,
        'automation' => null,
    ];
    $directory = kalite_filo_admin_publish_root() . DIRECTORY_SEPARATOR . 'requests';
    kalite_filo_admin_ensure_private_directory($directory);
    $path = $directory . DIRECTORY_SEPARATOR . $record['id'] . '.json';
    $temporary = $path . '.tmp-' . bin2hex(random_bytes(5));
    if (file_put_contents($temporary, json_encode($record, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
        throw new RuntimeException('Publish request could not be written.');
    }
    @chmod($temporary, 0600);
    if (!rename($temporary, $path)) { @unlink($temporary); throw new RuntimeException('Publish request could not be replaced.'); }
    @chmod($path, 0600);
    return $record;
}

/** @return array<string,mixed> */
function kalite_filo_admin_safe_publish_request(array $record): array
{
    $safeChanges=[];
    foreach(is_array($record['changes']??null)?$record['changes']:[] as $change)if(is_array($change)){
        $details=[];
        foreach(array_slice(is_array($change['details']??null)?$change['details']:[],0,50) as $detail)if(is_array($detail)){
            $fields=[];
            foreach(array_slice(is_array($detail['fields']??null)?$detail['fields']:[],0,20) as $field)if(is_array($field))$fields[]=['label'=>kalite_filo_admin_diff_value($field['label']??''),'before'=>kalite_filo_admin_diff_value($field['before']??null),'after'=>kalite_filo_admin_diff_value($field['after']??null)];
            $details[]=['entity'=>kalite_filo_admin_diff_value($detail['entity']??''),'action'=>in_array($detail['action']??null,['created','updated','removed','reordered'],true)?$detail['action']:'updated','fields'=>$fields];
        }
        $safeChanges[]=['id'=>$change['id']??'','type'=>$change['type']??'','label'=>$change['label']??'','updatedAt'=>$change['updatedAt']??null,'details'=>$details];
    }
    return [
        'id' => $record['id'] ?? '', 'target' => $record['target'] ?? 'staging', 'status' => $record['status'] ?? 'staging_succeeded',
        'changeCount' => $record['changeCount'] ?? count($safeChanges), 'changes' => $safeChanges,
        'snapshotHash' => $record['snapshotHash'] ?? '', 'requestedAt' => $record['requestedAt'] ?? gmdate('c'),
        'requestedBy' => $record['requestedBy'] ?? null, 'startedAt' => $record['startedAt'] ?? null,
        'completedAt' => $record['completedAt'] ?? null, 'result' => $record['result'] ?? null,
        'automation' => is_array($record['automation'] ?? null) ? $record['automation'] : null,
    ];
}
