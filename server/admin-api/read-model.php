<?php
declare(strict_types=1);

const KALITE_FILO_ADMIN_CONTACT_COLUMNS = [
    'id', 'email', 'status', 'consent_source', 'consent_text_version',
    'consent_at', 'confirmed_at', 'unsubscribed_at', 'created_at',
    'updated_at', 'iys_status', 'iys_synced_at', 'recipient_type',
];
const KALITE_FILO_ADMIN_MAX_CONTACT_STORE_BYTES = 26214400;
const KALITE_FILO_ADMIN_MAX_AUDIT_FILE_BYTES = 10485760;

function kalite_filo_admin_contact_store_path(): string
{
    $configured = getenv('KALITE_FILO_CONTACT_STORE_PATH');
    if (is_string($configured) && trim($configured) !== '') {
        $path = trim($configured);
    } else {
        $config = kalite_filo_admin_config();
        $path = $config['environment'] === 'staging'
            ? (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'newsletter-contacts.csv'
            : dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'private'
                . DIRECTORY_SEPARATOR . 'kalite-filo-data'
                . DIRECTORY_SEPARATOR . 'newsletter-contacts.csv';
    }
    if (!kalite_filo_admin_is_absolute_path($path)) {
        throw new RuntimeException('Contact store path must be absolute.');
    }
    kalite_filo_admin_assert_outside_document_root($path);
    return $path;
}

/** @return array{contacts: int, approved: int, iysPending: int, unsubscribed: int} */
function kalite_filo_admin_contact_metrics(string $path): array
{
    $empty = ['contacts' => 0, 'approved' => 0, 'iysPending' => 0, 'unsubscribed' => 0];
    if (!is_file($path)) return $empty;
    $size = filesize($path);
    if (!is_int($size) || $size > KALITE_FILO_ADMIN_MAX_CONTACT_STORE_BYTES) {
        throw new RuntimeException('Contact store exceeds the dashboard read limit.');
    }
    $handle = fopen($path, 'rb');
    if ($handle === false || !flock($handle, LOCK_SH)) {
        if (is_resource($handle)) fclose($handle);
        throw new RuntimeException('Contact store could not be read.');
    }
    try {
        $header = fgetcsv($handle);
        $legacy = array_slice(KALITE_FILO_ADMIN_CONTACT_COLUMNS, 0, -1);
        if ($header !== KALITE_FILO_ADMIN_CONTACT_COLUMNS && $header !== $legacy) {
            throw new RuntimeException('Contact store schema is not recognized.');
        }
        $byEmail = [];
        while (($values = fgetcsv($handle)) !== false) {
            if ($header === $legacy && count($values) === count($legacy)) $values[] = 'BIREYSEL';
            if (count($values) !== count(KALITE_FILO_ADMIN_CONTACT_COLUMNS)) continue;
            $row = array_combine(KALITE_FILO_ADMIN_CONTACT_COLUMNS, $values);
            if (!is_array($row)) continue;
            $email = strtolower(trim((string) $row['email']));
            if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) continue;
            $state = $byEmail[$email] ?? ['approved' => false, 'iysPending' => false, 'unsubscribed' => false];
            $unsubscribed = trim((string) $row['unsubscribed_at']) !== '' || $row['status'] === 'unsubscribed';
            $state['unsubscribed'] = $state['unsubscribed'] || $unsubscribed;
            $hasEvidence = trim((string) $row['consent_at']) !== ''
                && trim((string) $row['consent_text_version']) !== '';
            if ($row['status'] === 'approved' && $hasEvidence) {
                $state['approved'] = true;
                if (in_array($row['iys_status'], ['pending', 'failed'], true)) {
                    $state['iysPending'] = true;
                }
            }
            $byEmail[$email] = $state;
        }
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
    $metrics = $empty;
    $metrics['contacts'] = count($byEmail);
    foreach ($byEmail as $state) {
        if ($state['unsubscribed']) {
            $metrics['unsubscribed']++;
            continue;
        }
        if ($state['approved']) $metrics['approved']++;
        if ($state['iysPending']) $metrics['iysPending']++;
    }
    return $metrics;
}

/** @return list<array<string, mixed>> */
function kalite_filo_admin_recent_audit(string $dataRoot, int $limit = 8): array
{
    $files = glob($dataRoot . DIRECTORY_SEPARATOR . 'audit' . DIRECTORY_SEPARATOR . 'audit-*.jsonl') ?: [];
    rsort($files, SORT_STRING);
    $records = [];
    foreach (array_slice($files, 0, 3) as $file) {
        $size = filesize($file);
        if (!is_int($size) || $size > KALITE_FILO_ADMIN_MAX_AUDIT_FILE_BYTES) continue;
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!is_array($lines)) continue;
        foreach (array_reverse($lines) as $line) {
            try {
                $record = json_decode($line, true, 8, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                continue;
            }
            if (!is_array($record)) continue;
            $records[] = [
                'id' => (string) ($record['id'] ?? ''),
                'timestamp' => (string) ($record['timestamp'] ?? ''),
                'adminId' => is_string($record['adminId'] ?? null) ? $record['adminId'] : null,
                'action' => (string) ($record['action'] ?? ''),
                'entityType' => (string) ($record['entityType'] ?? ''),
                'entityId' => is_string($record['entityId'] ?? null) ? $record['entityId'] : null,
                'result' => (string) ($record['result'] ?? ''),
            ];
            if (count($records) >= $limit) return $records;
        }
    }
    return $records;
}

/** @return array<string, mixed> */
function kalite_filo_admin_content_snapshot(): array
{
    $path = __DIR__ . DIRECTORY_SEPARATOR . '_content-snapshot.php';
    if (!is_file($path) || !is_readable($path)) {
        throw new RuntimeException('Admin content snapshot is unavailable.');
    }
    $snapshot = require $path;
    if (!is_array($snapshot) || ($snapshot['schemaVersion'] ?? null) !== 1) {
        throw new RuntimeException('Admin content snapshot is invalid.');
    }
    return $snapshot;
}
