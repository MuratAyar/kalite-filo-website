<?php
declare(strict_types=1);

function kalite_filo_admin_publish_root(): string
{
    return (string) kalite_filo_admin_config()['data_root'] . DIRECTORY_SEPARATOR . 'publish';
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
    foreach ($sources as $source) {
        if (!is_file($source['path'])) continue;
        $modified = filemtime($source['path']);
        $changes[] = [
            'id' => hash('sha256', $source['type'] . '|' . (string) $modified),
            'type' => $source['type'],
            'label' => $source['label'],
            'updatedAt' => is_int($modified) ? gmdate('c', $modified) : null,
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
        $record = json_decode($raw, true, 30, JSON_THROW_ON_ERROR);
        if (is_array($record) && ($record['schemaVersion'] ?? null) === 1) $records[] = $record;
    }
    return $records;
}

/** @return array<string,mixed> */
function kalite_filo_admin_create_staging_publish_request(): array
{
    $changes = kalite_filo_admin_unpublished_changes();
    if (count($changes) < 1) throw new InvalidArgumentException('There are no unpublished changes.');
    $payload = [
        'vehicles' => kalite_filo_admin_vehicle_records(),
        'articles' => kalite_filo_admin_article_drafts(),
        'media' => kalite_filo_admin_media_records(),
        'featuredVehicleIds' => kalite_filo_admin_publish_featured_ids(kalite_filo_admin_vehicle_records()),
        'taxonomy' => kalite_filo_admin_taxonomy(),
    ];
    $encodedPayload = json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $now = gmdate('c');
    $record = [
        'schemaVersion' => 1,
        'id' => 'publish-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(6)),
        'target' => 'staging',
        'status' => 'awaiting_runner',
        'changeCount' => count($changes),
        'changes' => $changes,
        'snapshotHash' => hash('sha256', $encodedPayload),
        'snapshot' => $payload,
        'requestedAt' => $now,
        'requestedBy' => $_SESSION['identity']['id'] ?? null,
        'startedAt' => null,
        'completedAt' => null,
        'result' => null,
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
    return [
        'id' => $record['id'], 'target' => $record['target'], 'status' => $record['status'],
        'changeCount' => $record['changeCount'], 'changes' => $record['changes'],
        'snapshotHash' => $record['snapshotHash'], 'requestedAt' => $record['requestedAt'],
        'requestedBy' => $record['requestedBy'], 'startedAt' => $record['startedAt'],
        'completedAt' => $record['completedAt'], 'result' => $record['result'],
    ];
}
