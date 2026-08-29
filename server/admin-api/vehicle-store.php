<?php
declare(strict_types=1);

function kalite_filo_admin_vehicle_store_path(): string
{
    return (string) kalite_filo_admin_config()['data_root'] . DIRECTORY_SEPARATOR . 'drafts'
        . DIRECTORY_SEPARATOR . 'vehicles.json';
}

/** @return list<array<string, mixed>> */
function kalite_filo_admin_vehicle_records(): array
{
    $snapshot = kalite_filo_admin_content_snapshot();
    $base = $snapshot['vehicles']['records'] ?? [];
    if (!is_array($base)) throw new RuntimeException('Vehicle snapshot is invalid.');
    $path = kalite_filo_admin_vehicle_store_path();
    if (!is_file($path)) return array_values($base);
    $raw = file_get_contents($path);
    $draft = is_string($raw) ? json_decode($raw, true, 12, JSON_THROW_ON_ERROR) : null;
    if (!is_array($draft) || ($draft['schemaVersion'] ?? null) !== 1 || !is_array($draft['records'] ?? null)) {
        throw new RuntimeException('Vehicle draft store is invalid.');
    }
    return array_values($draft['records']);
}

/** @param list<array<string, mixed>> $records */
function kalite_filo_admin_write_vehicle_records(array $records): void
{
    $path = kalite_filo_admin_vehicle_store_path();
    $directory = dirname($path);
    kalite_filo_admin_ensure_private_directory($directory);
    $temporary = $path . '.tmp-' . bin2hex(random_bytes(6));
    file_put_contents($temporary, json_encode(['schemaVersion' => 1, 'records' => $records], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    @chmod($temporary, 0600);
    if (!rename($temporary, $path)) { @unlink($temporary); throw new RuntimeException('Vehicle store could not be replaced.'); }
}

/** @return array<string, mixed> */
function kalite_filo_admin_normalize_vehicle(array $input, ?array $existing = null): array
{
    $required = ['make','model','trim','modelYearLabel','categoryLabel','segmentLabel','fuelLabel','transmissionLabel','slug','summary'];
    foreach ($required as $key) {
        if (!is_string($input[$key] ?? null) || trim($input[$key]) === '') throw new InvalidArgumentException("Missing {$key}.");
    }
    $slug = strtolower(trim((string) $input['slug']));
    if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) !== 1) throw new InvalidArgumentException('Invalid slug.');
    $id = $existing['id'] ?? ('vehicle-' . bin2hex(random_bytes(6)));
    return array_merge($existing ?? [], $input, [
        'id' => $id, 'slug' => $slug,
        'sourceId' => $existing['sourceId'] ?? ('ADMIN-' . strtoupper(substr(hash('sha256', $id), 0, 8))),
        'publicationStatus' => in_array($input['publicationStatus'] ?? '', ['published','unpublished'], true) ? $input['publicationStatus'] : 'unpublished',
        'sourceStatus' => ($input['publicationStatus'] ?? '') === 'published' ? 'active' : 'archived',
        'featured' => (bool) ($input['featured'] ?? false),
        'powerHp' => is_numeric($input['powerHp'] ?? null) ? (int) $input['powerHp'] : null,
        'seats' => is_numeric($input['seats'] ?? null) ? (int) $input['seats'] : null,
        'featureLabels' => array_values(array_filter(array_map('trim', is_array($input['featureLabels'] ?? null) ? $input['featureLabels'] : []))),
        'updatedAt' => gmdate('c'),
    ]);
}
