<?php
declare(strict_types=1);

const KALITE_FILO_CONTACT_STORE_ENV = 'KALITE_FILO_CONTACT_STORE_PATH';
const KALITE_FILO_CONTACT_STORE_FILENAME = 'newsletter-contacts.csv';

function kalite_filo_contact_store_columns(): array
{
    return [
        'id', 'email', 'status', 'consent_source', 'consent_text_version',
        'consent_at', 'confirmed_at', 'unsubscribed_at', 'created_at',
        'updated_at', 'iys_status', 'iys_synced_at', 'recipient_type',
    ];
}

function kalite_filo_contact_store_path(): string
{
    $configured = getenv(KALITE_FILO_CONTACT_STORE_ENV);
    if (is_string($configured) && trim($configured) !== '') {
        if (!str_starts_with($configured, '/') && preg_match('/^[A-Za-z]:[\\\\\/]/', $configured) !== 1) {
            throw new RuntimeException('Contact store path must be absolute.');
        }
        return $configured;
    }

    $accountRoot = dirname(__DIR__, 2);
    return $accountRoot . DIRECTORY_SEPARATOR . 'private'
        . DIRECTORY_SEPARATOR . 'kalite-filo-data'
        . DIRECTORY_SEPARATOR . KALITE_FILO_CONTACT_STORE_FILENAME;
}

function kalite_filo_store_contact(array $record): array
{
    $email = strtolower(trim((string) ($record['email'] ?? '')));
    $source = trim((string) ($record['consent_source'] ?? ''));
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || preg_match('/[\r\n]/', $email) === 1) {
        throw new InvalidArgumentException('A valid email address is required.');
    }
    if (!in_array($source, ['website_newsletter', 'website_quote_form', 'website_contact_form'], true)) {
        throw new InvalidArgumentException('Unknown contact source.');
    }

    $path = kalite_filo_contact_store_path();
    $directory = dirname($path);
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Contact store directory could not be created.');
    }

    $lock = fopen($path . '.lock', 'c+');
    if ($lock === false || !flock($lock, LOCK_EX)) {
        if (is_resource($lock)) fclose($lock);
        throw new RuntimeException('Contact store could not be locked.');
    }

    try {
        $columns = kalite_filo_contact_store_columns();
        $rows = [];
        $nextId = 1;
        if (is_file($path)) {
            $input = fopen($path, 'rb');
            if ($input === false) throw new RuntimeException('Contact store could not be read.');
            $header = fgetcsv($input);
            $legacyColumns = array_slice($columns, 0, -1);
            if ($header !== false && $header !== $columns && $header !== $legacyColumns) {
                fclose($input);
                throw new RuntimeException('Contact store schema is not recognized.');
            }
            while (($values = fgetcsv($input)) !== false) {
                if ($header === $legacyColumns && count($values) === count($legacyColumns)) {
                    $values[] = 'BIREYSEL';
                }
                if (count($values) !== count($columns)) continue;
                $row = array_combine($columns, $values);
                if (!is_array($row)) continue;
                $rows[] = $row;
                $nextId = max($nextId, ((int) $row['id']) + 1);
            }
            fclose($input);
        }

        $now = gmdate('Y-m-d H:i:s');
        $incoming = [
            'email' => $email,
            'status' => (string) ($record['status'] ?? 'lead_only'),
            'consent_source' => $source,
            'consent_text_version' => (string) ($record['consent_text_version'] ?? ''),
            'consent_at' => (string) ($record['consent_at'] ?? ''),
            'confirmed_at' => (string) ($record['confirmed_at'] ?? ''),
            'unsubscribed_at' => (string) ($record['unsubscribed_at'] ?? ''),
            'updated_at' => $now,
            'iys_status' => (string) ($record['iys_status'] ?? 'not_requested'),
            'iys_synced_at' => (string) ($record['iys_synced_at'] ?? ''),
            'recipient_type' => strtoupper((string) ($record['recipient_type'] ?? 'BIREYSEL')),
        ];
        if (!in_array($incoming['recipient_type'], ['BIREYSEL', 'TACIR'], true)) {
            throw new InvalidArgumentException('Unknown IYS recipient type.');
        }

        $stored = null;
        foreach ($rows as &$row) {
            if (strtolower($row['email']) === $email && $row['consent_source'] === $source) {
                if ($row['status'] === 'approved' && $incoming['status'] === 'lead_only') {
                    $stored = $row;
                    break;
                }
                $row = ['id' => $row['id'], ...$incoming, 'created_at' => $row['created_at']];
                $stored = $row;
                break;
            }
        }
        unset($row);
        if ($stored === null) {
            $stored = ['id' => (string) $nextId, ...$incoming, 'created_at' => $now];
            $rows[] = $stored;
        }

        $temporary = $path . '.tmp-' . bin2hex(random_bytes(6));
        $output = fopen($temporary, 'xb');
        if ($output === false) throw new RuntimeException('Temporary contact store could not be created.');
        fputcsv($output, $columns);
        foreach ($rows as $row) {
            fputcsv($output, array_map(static fn (string $column): string => (string) $row[$column], $columns));
        }
        fflush($output);
        fclose($output);
        @chmod($temporary, 0600);
        if (!rename($temporary, $path)) {
            @unlink($temporary);
            throw new RuntimeException('Contact store could not be replaced atomically.');
        }
        @chmod($path, 0600);
        return $stored;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function kalite_filo_store_form_contact(string $email, string $source, string $recipientType = 'BIREYSEL'): void
{
    kalite_filo_store_contact([
        'email' => $email,
        'status' => 'lead_only',
        'consent_source' => $source,
        'iys_status' => 'not_requested',
        'recipient_type' => $recipientType,
    ]);
}

function kalite_filo_store_commercial_email_consent(string $email, string $source, string $recipientType = 'BIREYSEL'): void
{
    kalite_filo_store_contact([
        'email' => $email,
        'status' => 'approved',
        'consent_source' => $source,
        'consent_text_version' => 'commercial-email-consent-2026-08-v1',
        'consent_at' => gmdate('Y-m-d H:i:s'),
        'iys_status' => 'pending',
        'recipient_type' => $recipientType,
    ]);
}
