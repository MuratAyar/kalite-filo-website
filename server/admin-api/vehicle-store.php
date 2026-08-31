<?php
declare(strict_types=1);

final class KaliteFiloAdminVehicleStoreException extends RuntimeException
{
    public function __construct(public readonly string $publicCode, string $internalMessage)
    {
        parent::__construct($internalMessage);
    }
}

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
    if (!is_readable($path)) {
        throw new KaliteFiloAdminVehicleStoreException(
            'vehicle_draft_unreadable',
            'Vehicle draft store exists but is not readable.',
        );
    }
    $raw = file_get_contents($path);
    if (!is_string($raw)) {
        throw new KaliteFiloAdminVehicleStoreException(
            'vehicle_draft_unreadable',
            'Vehicle draft store could not be read.',
        );
    }
    if (strlen($raw) > 16777216) {
        throw new KaliteFiloAdminVehicleStoreException(
            'vehicle_draft_too_large',
            'Vehicle draft store exceeds the 16 MiB read limit.',
        );
    }
    $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw) ?? $raw;
    try {
        $draft = json_decode($raw, true, 12, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        throw new KaliteFiloAdminVehicleStoreException(
            'vehicle_draft_invalid_json',
            'Vehicle draft JSON is invalid: ' . $exception->getMessage(),
        );
    }
    if (!is_array($draft) || ($draft['schemaVersion'] ?? null) !== 1 || !is_array($draft['records'] ?? null)) {
        throw new KaliteFiloAdminVehicleStoreException(
            'vehicle_draft_invalid_schema',
            'Vehicle draft store must contain schemaVersion 1 and a records array.',
        );
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

/** @param list<array<string, mixed>> $records */
function kalite_filo_admin_assert_vehicle_uniqueness(array $records): void
{
    $ids=[];$sourceIds=[];$slugs=[];
    foreach($records as $record){
        $id=strtolower(trim((string)($record['id']??'')));
        $sourceId=strtolower(trim((string)($record['sourceId']??'')));
        $slug=strtolower(trim((string)($record['slug']??'')));
        if($id===''||$sourceId===''||$slug===''||isset($ids[$id])||isset($sourceIds[$sourceId])||isset($slugs[$slug]))throw new InvalidArgumentException('duplicate_vehicle_identity');
        $ids[$id]=true;$sourceIds[$sourceId]=true;$slugs[$slug]=true;
    }
}

function kalite_filo_admin_write_vehicle_revision(string $action,array $vehicle,?array $before=null):void
{
    $directory=(string)kalite_filo_admin_config()['data_root'].DIRECTORY_SEPARATOR.'revisions'.DIRECTORY_SEPARATOR.'vehicles'.DIRECTORY_SEPARATOR.(string)$vehicle['id'];
    kalite_filo_admin_ensure_private_directory($directory);
    $revision=['schemaVersion'=>1,'id'=>bin2hex(random_bytes(16)),'timestamp'=>gmdate('c'),'action'=>$action,'actorId'=>$_SESSION['identity']['id']??null,'vehicleId'=>$vehicle['id'],'before'=>$before,'after'=>$vehicle];
    $path=$directory.DIRECTORY_SEPARATOR.gmdate('Ymd-His').'-'.$revision['id'].'.json';
    if(file_put_contents($path,json_encode($revision,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),LOCK_EX)===false)throw new RuntimeException('Vehicle revision could not be written.');
    @chmod($path,0600);
}

function kalite_filo_admin_parse_price_minor(mixed $value): ?int
{
    if ($value === null || (is_string($value) && trim($value) === '')) return null;
    if (!is_string($value) && !is_int($value) && !is_float($value)) throw new InvalidArgumentException('Invalid vehicle price.');
    $normalized = trim((string) $value);
    if (preg_match('/^\d{1,9}$/', $normalized) !== 1) throw new InvalidArgumentException('Vehicle price must be whole TRY without grouping separators.');
    $minor = (int) $normalized * 100;
    if ($minor < 100 || $minor > 10000000000) throw new InvalidArgumentException('Vehicle price is outside the supported range.');
    return $minor;
}

/** @return list<array<string, mixed>> */
function kalite_filo_admin_vehicle_revisions(string $vehicleId, int $limit = 20): array
{
    if (preg_match('/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/', $vehicleId) !== 1) throw new InvalidArgumentException('Invalid vehicle id.');
    $directory = (string) kalite_filo_admin_config()['data_root'] . DIRECTORY_SEPARATOR . 'revisions' . DIRECTORY_SEPARATOR . 'vehicles' . DIRECTORY_SEPARATOR . $vehicleId;
    if (!is_dir($directory)) return [];
    $files = glob($directory . DIRECTORY_SEPARATOR . '*.json') ?: [];
    rsort($files, SORT_STRING);
    $result = [];
    foreach (array_slice($files, 0, max(1, min($limit, 50))) as $path) {
        $raw = file_get_contents($path);
        if (!is_string($raw) || strlen($raw) > 1048576) continue;
        $revision = json_decode($raw, true);
        if (!is_array($revision) || ($revision['vehicleId'] ?? null) !== $vehicleId) continue;
        $before = is_array($revision['before'] ?? null) ? $revision['before'] : [];
        $after = is_array($revision['after'] ?? null) ? $revision['after'] : [];
        $changed = [];
        foreach (array_unique([...array_keys($before), ...array_keys($after)]) as $field) if (($before[$field] ?? null) !== ($after[$field] ?? null)) $changed[] = (string) $field;
        $result[] = ['id'=>(string)($revision['id']??''),'timestamp'=>(string)($revision['timestamp']??''),'action'=>(string)($revision['action']??''),'actorId'=>is_string($revision['actorId']??null)?$revision['actorId']:null,'changedFields'=>$changed,'priceAmountMinor'=>is_int($after['priceAmountMinor']??null)?$after['priceAmountMinor']:null];
    }
    return $result;
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
    $power=is_numeric($input['powerHp']??null)?(int)$input['powerHp']:null;
    $seats=is_numeric($input['seats']??null)?(int)$input['seats']:null;
    if($power!==null&&($power<20||$power>2000))throw new InvalidArgumentException('Invalid power.');
    if($seats!==null&&($seats<1||$seats>100))throw new InvalidArgumentException('Invalid seats.');
    if(strlen((string)$input['summary'])>2000)throw new InvalidArgumentException('Summary is too long.');
    $priceMinor = array_key_exists('priceAmountTry', $input) ? kalite_filo_admin_parse_price_minor($input['priceAmountTry']) : (is_int($input['priceAmountMinor'] ?? null) ? $input['priceAmountMinor'] : null);
    $publicationStatus = in_array($input['publicationStatus'] ?? '', ['published','unpublished'], true) ? $input['publicationStatus'] : 'unpublished';
    if ($publicationStatus === 'published' && $priceMinor === null) throw new InvalidArgumentException('Published vehicles require a monthly list-net price.');
    unset($input['priceAmountTry']);
    return array_merge($existing ?? [], $input, [
        'id' => $id, 'slug' => $slug,
        'sourceId' => $existing['sourceId'] ?? ('ADMIN-' . strtoupper(substr(hash('sha256', $id), 0, 8))),
        'publicationStatus' => $publicationStatus,
        'sourceStatus' => $publicationStatus === 'published' ? 'active' : 'archived',
        'priceAmountMinor' => $priceMinor,
        'priceStatus' => $priceMinor === null ? 'not_set' : 'owner-approved-list-net',
        'featured' => (bool) ($input['featured'] ?? false),
        'powerHp' => $power,
        'seats' => $seats,
        'featureLabels' => array_values(array_filter(array_map('trim', is_array($input['featureLabels'] ?? null) ? $input['featureLabels'] : []))),
        'updatedAt' => gmdate('c'),
    ]);
}
