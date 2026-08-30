<?php
declare(strict_types=1);

const KALITE_FILO_ADMIN_CONFIG_ENV = 'KALITE_FILO_ADMIN_CONFIG';
const KALITE_FILO_ADMIN_TARGET_ENV = 'KALITE_FILO_ADMIN_TARGET';
const KALITE_FILO_ADMIN_MAX_JSON_BYTES = 16384;

/** @return array{target: 'production'|'staging', origin: string} */
function kalite_filo_admin_environment(): array
{
    $configuredTarget = getenv(KALITE_FILO_ADMIN_TARGET_ENV);
    if (is_string($configuredTarget) && $configuredTarget !== '') {
        $target = strtolower(trim($configuredTarget));
    } else {
        $host = strtolower((string) ($_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'] ?? ''));
        $host = preg_replace('/:\d+$/', '', trim($host)) ?? '';
        $target = match ($host) {
            'kalitefilo.com.tr' => 'production',
            'staging.kalitefilo.com.tr', 'localhost', '127.0.0.1' => 'staging',
            default => '',
        };
    }

    return match ($target) {
        'production' => ['target' => 'production', 'origin' => 'https://kalitefilo.com.tr'],
        'staging' => ['target' => 'staging', 'origin' => 'https://staging.kalitefilo.com.tr'],
        default => throw new RuntimeException('Admin environment is not configured.'),
    };
}

function kalite_filo_admin_is_absolute_path(string $path): bool
{
    return $path !== ''
        && !str_contains($path, "\0")
        && (
            str_starts_with($path, '/')
            || str_starts_with($path, '\\\\')
            || preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1
        );
}

function kalite_filo_admin_assert_outside_document_root(string $path): void
{
    $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if (!is_string($documentRoot) || !kalite_filo_admin_is_absolute_path($documentRoot)) return;
    $normalize = static fn (string $value): string => strtolower(
        rtrim(str_replace('\\', '/', $value), '/'),
    );
    $privatePath = $normalize($path);
    $publicRoot = $normalize($documentRoot);
    if ($privatePath === $publicRoot || str_starts_with($privatePath, $publicRoot . '/')) {
        throw new RuntimeException('Private admin path must remain outside the document root.');
    }
}

/** @return mixed */
function kalite_filo_admin_load_private_config(string $configPath)
{
    ob_start();
    try {
        $raw = require $configPath;
        $output = (string) ob_get_clean();
    } catch (Throwable $exception) {
        ob_end_clean();
        throw $exception;
    }

    // Editors on shared hosting can save PHP files with a UTF-8 BOM or trailing
    // whitespace. Neither is configuration data and neither may reach HTTP
    // output, because doing so breaks JSON and secure session cookie rotation.
    $ignorableOutput = preg_replace('/^\xEF\xBB\xBF/', '', $output) ?? $output;
    if (trim($ignorableOutput) !== '') {
        throw new RuntimeException('Private admin configuration produced unexpected output.');
    }
    return $raw;
}

/** @return array<string, mixed> */
function kalite_filo_admin_config(): array
{
    static $config = null;
    if (is_array($config)) return $config;

    $environment = kalite_filo_admin_environment();
    $configuredPath = getenv(KALITE_FILO_ADMIN_CONFIG_ENV);
    if (is_string($configuredPath) && trim($configuredPath) !== '') {
        $configPath = trim($configuredPath);
        if (!kalite_filo_admin_is_absolute_path($configPath)) {
            throw new RuntimeException('Admin configuration path must be absolute.');
        }
    } else {
        $accountRoot = dirname(__DIR__, 2);
        $configPath = $accountRoot . DIRECTORY_SEPARATOR . 'private'
            . DIRECTORY_SEPARATOR . 'kalite-filo-admin'
            . DIRECTORY_SEPARATOR . $environment['target']
            . DIRECTORY_SEPARATOR . 'config.php';
    }

    if (!is_file($configPath) || !is_readable($configPath)) {
        throw new RuntimeException('Private admin configuration is unavailable.');
    }
    kalite_filo_admin_assert_outside_document_root($configPath);
    $raw = kalite_filo_admin_load_private_config($configPath);
    if (!is_array($raw) || ($raw['environment'] ?? null) !== $environment['target']) {
        throw new RuntimeException('Private admin configuration is invalid.');
    }

    $dataRoot = $raw['data_root'] ?? dirname($configPath) . DIRECTORY_SEPARATOR . 'data';
    if (!is_string($dataRoot) || !kalite_filo_admin_is_absolute_path($dataRoot)) {
        throw new RuntimeException('Private admin data root is invalid.');
    }
    kalite_filo_admin_assert_outside_document_root($dataRoot);
    $users = $raw['users'] ?? null;
    if (!is_array($users) || count($users) < 1 || count($users) > 20) {
        throw new RuntimeException('Private admin user configuration is invalid.');
    }

    $validatedUsers = [];
    $usernames = [];
    $ids = [];
    $roles = ['owner', 'admin', 'editor', 'marketing', 'read_only'];
    foreach ($users as $user) {
        if (!is_array($user)) throw new RuntimeException('Private admin user configuration is invalid.');
        $id = $user['id'] ?? null;
        $username = $user['username'] ?? null;
        $displayName = $user['display_name'] ?? null;
        $passwordHash = $user['password_hash'] ?? null;
        $role = $user['role'] ?? null;
        $enabled = $user['enabled'] ?? null;
        if (
            !is_string($id) || preg_match('/^[a-z0-9][a-z0-9_-]{1,63}$/', $id) !== 1
            || !is_string($username) || preg_match('/^[a-z0-9][a-z0-9._-]{2,63}$/', $username) !== 1
            || !is_string($displayName) || trim($displayName) === '' || strlen($displayName) > 120
            || !is_string($passwordHash) || password_get_info($passwordHash)['algo'] === null
            || !is_string($role) || !in_array($role, $roles, true)
            || !is_bool($enabled)
            || isset($usernames[$username]) || isset($ids[$id])
        ) {
            throw new RuntimeException('Private admin user configuration is invalid.');
        }
        $usernames[$username] = true;
        $ids[$id] = true;
        $validatedUsers[] = [
            'id' => $id,
            'username' => $username,
            'display_name' => trim($displayName),
            'password_hash' => $passwordHash,
            'role' => $role,
            'enabled' => $enabled,
        ];
    }

    $config = [
        'environment' => $environment['target'],
        'origin' => $environment['origin'],
        'config_path' => $configPath,
        'data_root' => rtrim($dataRoot, DIRECTORY_SEPARATOR),
        'users' => $validatedUsers,
        'campaign_test_recipients' => kalite_filo_admin_validate_test_recipients(
            $raw['campaign_test_recipients'] ?? [],
        ),
        'campaign_delivery_mode' => kalite_filo_admin_validate_campaign_delivery_mode(
            $raw['campaign_delivery_mode'] ?? 'disabled',
            $environment['target'],
        ),
        'campaign_batch_size' => kalite_filo_admin_validate_campaign_batch_size(
            $raw['campaign_batch_size'] ?? 20,
        ),
    ];
    return $config;
}

function kalite_filo_admin_validate_campaign_delivery_mode(mixed $mode, string $environment): string
{
    if (!is_string($mode) || !in_array($mode, ['disabled', 'dry_run', 'live'], true)) {
        throw new RuntimeException('Campaign delivery mode is invalid.');
    }
    if ($environment === 'staging' && $mode === 'live') {
        throw new RuntimeException('Live campaign delivery is forbidden in staging.');
    }
    return $mode;
}

function kalite_filo_admin_validate_campaign_batch_size(mixed $size): int
{
    if (!is_int($size) || $size < 1 || $size > 50) {
        throw new RuntimeException('Campaign batch size is invalid.');
    }
    return $size;
}

/** @return list<array{id: string, email: string, name: string}> */
function kalite_filo_admin_validate_test_recipients(mixed $input): array
{
    if (!is_array($input) || count($input) > 10) {
        throw new RuntimeException('Campaign test recipient configuration is invalid.');
    }
    $result = [];
    $ids = [];
    $emails = [];
    foreach ($input as $recipient) {
        if (!is_array($recipient)) throw new RuntimeException('Campaign test recipient configuration is invalid.');
        $id = $recipient['id'] ?? null;
        $email = $recipient['email'] ?? null;
        $name = $recipient['name'] ?? null;
        if (
            !is_string($id) || preg_match('/^[a-z0-9][a-z0-9_-]{1,63}$/', $id) !== 1
            || !is_string($email) || filter_var($email, FILTER_VALIDATE_EMAIL) === false
            || preg_match('/[\r\n]/', $email) === 1
            || !is_string($name) || trim($name) === '' || mb_strlen($name) > 120
            || preg_match('/[\r\n]/', $name) === 1
            || isset($ids[$id]) || isset($emails[strtolower($email)])
        ) {
            throw new RuntimeException('Campaign test recipient configuration is invalid.');
        }
        $ids[$id] = true;
        $emails[strtolower($email)] = true;
        $result[] = ['id' => $id, 'email' => strtolower(trim($email)), 'name' => trim($name)];
    }
    return $result;
}

function kalite_filo_admin_ensure_private_directory(string $path): void
{
    if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) {
        throw new RuntimeException('Private admin storage could not be created.');
    }
    @chmod($path, 0700);
}

function kalite_filo_admin_security_headers(): void
{
    header('Cache-Control: no-store, no-cache, max-age=0, must-revalidate, private');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-Robots-Tag: noindex, nofollow, noarchive, nosnippet');
    header('Referrer-Policy: no-referrer');
    header('Permissions-Policy: camera=(), geolocation=(), microphone=()');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
}

/** @param array<string, mixed> $payload */
function kalite_filo_admin_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function kalite_filo_admin_require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        kalite_filo_admin_json(['error' => 'method_not_allowed'], 405);
    }
}

function kalite_filo_admin_require_same_origin(): void
{
    $config = kalite_filo_admin_config();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!is_string($origin) || !hash_equals((string) $config['origin'], $origin)) {
        kalite_filo_admin_json(['error' => 'forbidden'], 403);
    }
}

/** @return array<string, mixed> */
function kalite_filo_admin_read_json(int $maximumBytes = KALITE_FILO_ADMIN_MAX_JSON_BYTES): array
{
    if ($maximumBytes < 1 || $maximumBytes > 524288) throw new InvalidArgumentException('Invalid JSON size limit.');
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength <= 0 || $contentLength > $maximumBytes) {
        kalite_filo_admin_json(['error' => 'invalid_request'], 413);
    }
    $contentType = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    if ($contentType !== 'application/json') {
        kalite_filo_admin_json(['error' => 'unsupported_media_type'], 415);
    }
    $body = file_get_contents('php://input', false, null, 0, $maximumBytes + 1);
    if (!is_string($body) || strlen($body) > $maximumBytes) {
        kalite_filo_admin_json(['error' => 'invalid_request'], 400);
    }
    try {
        $decoded = json_decode($body, true, 8, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        kalite_filo_admin_json(['error' => 'invalid_request'], 400);
    }
    if (!is_array($decoded)) kalite_filo_admin_json(['error' => 'invalid_request'], 400);
    return $decoded;
}

/** @param array<string, mixed> $summary */
function kalite_filo_admin_audit(string $action, string $result, array $summary = []): void
{
    try {
        $config = kalite_filo_admin_config();
        $directory = (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'audit';
        kalite_filo_admin_ensure_private_directory($directory);
        $path = $directory . DIRECTORY_SEPARATOR . 'audit-' . gmdate('Y-m') . '.jsonl';
        $handle = fopen($path, 'ab');
        if ($handle === false || !flock($handle, LOCK_EX)) {
            if (is_resource($handle)) fclose($handle);
            throw new RuntimeException('Audit log could not be locked.');
        }
        $entityType = str_starts_with($action, 'vehicle_tag_') ? 'vehicle_taxonomy'
            : ((str_starts_with($action, 'vehicle_') || $action === 'featured_vehicle_change') ? 'vehicle' : (str_starts_with($action,'article_')?'article':(str_starts_with($action,'campaign_')?'campaign':'authentication')));
        $entityId = in_array($entityType,['vehicle','article'],true) && is_string($summary['id'] ?? null) ? $summary['id'] : null;
        $record = [
            'id' => bin2hex(random_bytes(16)),
            'timestamp' => gmdate('c'),
            'adminId' => $_SESSION['identity']['id'] ?? null,
            'role' => $_SESSION['identity']['role'] ?? null,
            'action' => $action,
            'entityType' => $entityType,
            'entityId' => $entityId,
            'summary' => $summary,
            'result' => $result,
        ];
        fwrite($handle, json_encode($record, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . "\n");
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
        @chmod($path, 0600);
    } catch (Throwable $exception) {
        error_log('Kalite Filo admin audit write failed: ' . $exception->getMessage());
    }
}

kalite_filo_admin_security_headers();
