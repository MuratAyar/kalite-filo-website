<?php
declare(strict_types=1);

const KALITE_FILO_FORM_SUBMISSION_STORE_ENV = 'KALITE_FILO_FORM_SUBMISSION_STORE_PATH';
const KALITE_FILO_FORM_SUBMISSION_MAX_RECORD_BYTES = 262144;

function kalite_filo_form_submission_root(): string
{
    $configured = getenv(KALITE_FILO_FORM_SUBMISSION_STORE_ENV);
    if (is_string($configured) && trim($configured) !== '') {
        $path = rtrim(trim($configured), DIRECTORY_SEPARATOR);
        if (!str_starts_with($path, '/') && preg_match('~^[A-Za-z]:[\\\\/]~', $path) !== 1) {
            throw new RuntimeException('Form submission store path must be absolute.');
        }
        return $path;
    }
    $accountRoot = dirname(__DIR__, 2);
    $host = strtolower((string) ($_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'] ?? ''));
    $host = preg_replace('/:\d+$/', '', trim($host)) ?? '';
    if ($host === 'staging.kalitefilo.com.tr') {
        return $accountRoot . DIRECTORY_SEPARATOR . 'private' . DIRECTORY_SEPARATOR
            . 'kalite-filo-admin' . DIRECTORY_SEPARATOR . 'staging' . DIRECTORY_SEPARATOR
            . 'data' . DIRECTORY_SEPARATOR . 'form-submissions';
    }
    return $accountRoot . DIRECTORY_SEPARATOR . 'private' . DIRECTORY_SEPARATOR
        . 'kalite-filo-admin' . DIRECTORY_SEPARATOR . 'production' . DIRECTORY_SEPARATOR
        . 'data' . DIRECTORY_SEPARATOR . 'form-submissions';
}

function kalite_filo_form_submission_id(): string
{
    return 'form-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(8));
}

function kalite_filo_form_submission_path(string $id): string
{
    if (preg_match('/^form-\d{8}-\d{6}-[a-f0-9]{16}$/', $id) !== 1) {
        throw new InvalidArgumentException('Invalid form submission id.');
    }
    return kalite_filo_form_submission_root() . DIRECTORY_SEPARATOR . $id . '.json';
}

/** @param array<string,mixed> $record @return array<string,mixed> */
function kalite_filo_store_form_submission(array $record): array
{
    $kind = $record['kind'] ?? null;
    $formType = $record['formType'] ?? null;
    $email = strtolower(trim((string) ($record['email'] ?? '')));
    $name = trim((string) ($record['name'] ?? ''));
    if (!in_array($kind, ['quote', 'contact'], true)
        || ($kind === 'quote' && !in_array($formType, ['individual', 'corporate', 'cart'], true))
        || ($kind === 'contact' && $formType !== 'contact')
        || filter_var($email, FILTER_VALIDATE_EMAIL) === false
        || preg_match('/[\r\n]/', $email) === 1
        || $name === '' || mb_strlen($name) > 200) {
        throw new InvalidArgumentException('Invalid form submission.');
    }
    $directory = kalite_filo_form_submission_root();
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Form submission directory could not be created.');
    }
    @chmod($directory, 0700);
    $id = kalite_filo_form_submission_id();
    $now = gmdate('c');
    $stored = [
        'schemaVersion' => 1,
        'id' => $id,
        'kind' => $kind,
        'formType' => $formType,
        'referenceNumber' => is_string($record['referenceNumber'] ?? null) ? mb_substr(trim($record['referenceNumber']), 0, 64) : null,
        'status' => 'new',
        'name' => $name,
        'email' => $email,
        'phone' => is_string($record['phone'] ?? null) ? mb_substr(trim($record['phone']), 0, 40) : '',
        'locale' => ($record['locale'] ?? 'tr') === 'en' ? 'en' : 'tr',
        'details' => is_array($record['details'] ?? null) ? $record['details'] : [],
        'createdAt' => $now,
        'updatedAt' => $now,
        'replyHistory' => [],
    ];
    $encoded = json_encode($stored, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (strlen($encoded) > KALITE_FILO_FORM_SUBMISSION_MAX_RECORD_BYTES) {
        throw new RuntimeException('Form submission exceeds the storage limit.');
    }
    $path = kalite_filo_form_submission_path($id);
    $temporary = $path . '.tmp-' . bin2hex(random_bytes(5));
    if (file_put_contents($temporary, $encoded, LOCK_EX) === false) throw new RuntimeException('Form submission could not be written.');
    @chmod($temporary, 0600);
    if (!rename($temporary, $path)) { @unlink($temporary); throw new RuntimeException('Form submission could not be stored atomically.'); }
    @chmod($path, 0600);
    return $stored;
}

/** @return array<string,mixed> */
function kalite_filo_read_form_submission_file(string $path): array
{
    if (!is_file($path) || is_link($path)) throw new OutOfBoundsException('Form submission was not found.');
    $size = filesize($path);
    if (!is_int($size) || $size < 2 || $size > KALITE_FILO_FORM_SUBMISSION_MAX_RECORD_BYTES) throw new RuntimeException('Form submission size is invalid.');
    $decoded = json_decode((string) file_get_contents($path), true, 12, JSON_THROW_ON_ERROR);
    if (!is_array($decoded) || ($decoded['schemaVersion'] ?? null) !== 1 || !is_string($decoded['id'] ?? null)) {
        throw new RuntimeException('Form submission schema is invalid.');
    }
    return $decoded;
}

/** @return list<array<string,mixed>> */
function kalite_filo_form_submissions(): array
{
    $directory = kalite_filo_form_submission_root();
    if (!is_dir($directory)) return [];
    $records = [];
    foreach (glob($directory . DIRECTORY_SEPARATOR . 'form-*.json') ?: [] as $path) {
        try { $records[] = kalite_filo_read_form_submission_file($path); }
        catch (Throwable $exception) { error_log('Kalite Filo form submission read failed: ' . $exception->getMessage()); }
    }
    usort($records, static fn(array $left, array $right): int => strcmp((string) $right['createdAt'], (string) $left['createdAt']));
    return $records;
}

/** @param callable(array<string,mixed>):array<string,mixed> $mutator @return array<string,mixed> */
function kalite_filo_update_form_submission(string $id, callable $mutator): array
{
    $path = kalite_filo_form_submission_path($id);
    $lockPath = kalite_filo_form_submission_root() . DIRECTORY_SEPARATOR . '.store.lock';
    $lock = fopen($lockPath, 'c+');
    if ($lock === false || !flock($lock, LOCK_EX)) { if (is_resource($lock)) fclose($lock); throw new RuntimeException('Form submission store could not be locked.'); }
    try {
        $record = kalite_filo_read_form_submission_file($path);
        $updated = $mutator($record);
        if (!is_array($updated) || ($updated['id'] ?? null) !== $id) throw new RuntimeException('Form submission update is invalid.');
        $updated['updatedAt'] = gmdate('c');
        $encoded = json_encode($updated, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (strlen($encoded) > KALITE_FILO_FORM_SUBMISSION_MAX_RECORD_BYTES) throw new RuntimeException('Form submission exceeds the storage limit.');
        $temporary = $path . '.tmp-' . bin2hex(random_bytes(5));
        if (file_put_contents($temporary, $encoded, LOCK_EX) === false) throw new RuntimeException('Form submission update could not be written.');
        @chmod($temporary, 0600);
        if (!rename($temporary, $path)) { @unlink($temporary); throw new RuntimeException('Form submission update could not be stored.'); }
        @chmod($path, 0600);
        return $updated;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
        @chmod($lockPath, 0600);
    }
}
