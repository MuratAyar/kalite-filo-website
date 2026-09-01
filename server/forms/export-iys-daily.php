<?php
declare(strict_types=1);

require_once __DIR__ . '/subscriber-store.php';

const KALITE_FILO_IYS_EXPORT_STATE = 'iys-export-state.json';

/** @return list<array<string, string>> */
function kalite_filo_read_contact_rows(string $storePath): array
{
    if (!is_file($storePath)) return [];
    $handle = fopen($storePath, 'rb');
    if ($handle === false || !flock($handle, LOCK_SH)) {
        if (is_resource($handle)) fclose($handle);
        throw new RuntimeException('Contact store could not be read for IYS export.');
    }

    try {
        $header = fgetcsv($handle);
        $columns = kalite_filo_contact_store_columns();
        $legacyColumns = array_slice($columns, 0, -1);
        if ($header !== $columns && $header !== $legacyColumns) {
            throw new RuntimeException('Contact store schema is not recognized for IYS export.');
        }
        $rows = [];
        while (($values = fgetcsv($handle)) !== false) {
            if ($header === $legacyColumns && count($values) === count($legacyColumns)) $values[] = 'BIREYSEL';
            if (count($values) !== count($columns)) continue;
            $row = array_combine($columns, $values);
            if (is_array($row)) $rows[] = $row;
        }
        return $rows;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function kalite_filo_iys_last_export_at(string $statePath, DateTimeImmutable $now): DateTimeImmutable
{
    $existingExports = glob(dirname($statePath) . DIRECTORY_SEPARATOR . 'iys-email-permissions-????-??-??.csv') ?: [];
    if (is_file($statePath) && $existingExports !== []) {
        $decoded = json_decode((string) file_get_contents($statePath), true);
        $value = is_array($decoded) ? ($decoded['last_exported_at_utc'] ?? null) : null;
        if (is_string($value)) {
            $parsed = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $value, new DateTimeZone('UTC'));
            if ($parsed instanceof DateTimeImmutable) return $parsed;
        }
    }

    // A newly provisioned environment must include every still-pending consent,
    // including records created before the current day or migrated into staging.
    return new DateTimeImmutable('@0');
}

/** @return list<array{recipient: string, consentDate: string, type: string, recipientType: string, source: string}> */
function kalite_filo_collect_iys_rows(array $contacts, DateTimeImmutable $from, DateTimeImmutable $until): array
{
    $unique = [];
    $utc = new DateTimeZone('UTC');
    $istanbul = new DateTimeZone('Europe/Istanbul');

    foreach ($contacts as $contact) {
        if (($contact['status'] ?? '') !== 'approved' || !in_array(($contact['iys_status'] ?? ''), ['pending', 'failed'], true)) continue;
        $email = strtolower(trim((string) ($contact['email'] ?? '')));
        $consentAt = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', (string) ($contact['consent_at'] ?? ''), $utc);
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || !$consentAt || $consentAt <= $from || $consentAt > $until) continue;

        $existing = $unique[$email]['timestamp'] ?? null;
        if ($existing instanceof DateTimeImmutable && $existing >= $consentAt) continue;
        $recipientType = strtoupper((string) ($contact['recipient_type'] ?? 'BIREYSEL'));
        $unique[$email] = [
            'timestamp' => $consentAt,
            'row' => [
                'recipient' => $email,
                'consentDate' => $consentAt->setTimezone($istanbul)->format('Y-m-d H:i:s'),
                'type' => 'EPOSTA',
                'recipientType' => in_array($recipientType, ['BIREYSEL', 'TACIR'], true) ? $recipientType : 'BIREYSEL',
                'source' => 'WEB',
            ],
        ];
    }

    ksort($unique, SORT_STRING);
    return array_values(array_map(static fn (array $item): array => $item['row'], $unique));
}

function kalite_filo_export_iys_daily(?DateTimeImmutable $now = null): ?string
{
    $utc = new DateTimeZone('UTC');
    $istanbul = new DateTimeZone('Europe/Istanbul');
    $now = ($now ?? new DateTimeImmutable('now', $utc))->setTimezone($utc);
    $storePath = kalite_filo_contact_store_path();
    $directory = dirname($storePath);
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('IYS export directory could not be created.');
    }

    $lock = fopen($directory . DIRECTORY_SEPARATOR . 'iys-export.lock', 'c+');
    if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
        if (is_resource($lock)) fclose($lock);
        throw new RuntimeException('Another IYS export is already running.');
    }

    try {
        $statePath = $directory . DIRECTORY_SEPARATOR . KALITE_FILO_IYS_EXPORT_STATE;
        $from = kalite_filo_iys_last_export_at($statePath, $now);
        $rows = kalite_filo_collect_iys_rows(kalite_filo_read_contact_rows($storePath), $from, $now);
        $outputPath = null;

        if ($rows !== []) {
            $date = $now->setTimezone($istanbul)->format('Y-m-d');
            $outputPath = $directory . DIRECTORY_SEPARATOR . "iys-email-permissions-{$date}.csv";
            $temporary = $outputPath . '.tmp-' . bin2hex(random_bytes(6));
            $handle = fopen($temporary, 'xb');
            if ($handle === false) throw new RuntimeException('IYS export file could not be created.');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['recipient', 'consentDate', 'type', 'recipientType', 'source']);
            foreach ($rows as $row) fputcsv($handle, $row);
            fflush($handle);
            fclose($handle);
            @chmod($temporary, 0600);
            if (!rename($temporary, $outputPath)) {
                @unlink($temporary);
                throw new RuntimeException('IYS export file could not be finalized.');
            }
            @chmod($outputPath, 0600);
        }

        $stateTemporary = $statePath . '.tmp-' . bin2hex(random_bytes(6));
        file_put_contents($stateTemporary, json_encode([
            'last_exported_at_utc' => $now->format('Y-m-d H:i:s'),
        ], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT) . "\n", LOCK_EX);
        @chmod($stateTemporary, 0600);
        if (!rename($stateTemporary, $statePath)) {
            @unlink($stateTemporary);
            throw new RuntimeException('IYS export state could not be finalized.');
        }
        @chmod($statePath, 0600);
        return $outputPath;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
    try {
        $output = kalite_filo_export_iys_daily();
        fwrite(STDOUT, $output === null ? "No new IYS permissions.\n" : "Created {$output}\n");
    } catch (Throwable $exception) {
        error_log('Kalite Filo IYS export failed: ' . $exception->getMessage());
        fwrite(STDERR, "IYS export failed.\n");
        exit(1);
    }
}
