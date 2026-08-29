<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const KALITE_FILO_ADMIN_IDLE_TIMEOUT = 1800;
const KALITE_FILO_ADMIN_ABSOLUTE_TIMEOUT = 28800;
const KALITE_FILO_ADMIN_ROTATION_INTERVAL = 900;
const KALITE_FILO_ADMIN_LOGIN_WINDOW = 900;
const KALITE_FILO_ADMIN_LOGIN_MAX_FAILURES = 5;

function kalite_filo_admin_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $config = kalite_filo_admin_config();
    $sessionDirectory = (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'sessions';
    kalite_filo_admin_ensure_private_directory($sessionDirectory);

    session_name('__Host-kf_admin');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_cookies', '1');
    ini_set('session.cookie_secure', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Strict');
    ini_set('session.gc_maxlifetime', (string) KALITE_FILO_ADMIN_ABSOLUTE_TIMEOUT);
    session_save_path($sessionDirectory);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    if (!session_start()) throw new RuntimeException('Admin session could not be started.');

    $now = time();
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
    $_SESSION['issued_at'] ??= $now;
    $_SESSION['last_activity'] ??= $now;
    $_SESSION['rotated_at'] ??= $now;

    if (!empty($_SESSION['authenticated'])) {
        $idle = $now - (int) ($_SESSION['last_activity'] ?? 0);
        $age = $now - (int) ($_SESSION['issued_at'] ?? 0);
        if ($idle > KALITE_FILO_ADMIN_IDLE_TIMEOUT || $age > KALITE_FILO_ADMIN_ABSOLUTE_TIMEOUT) {
            kalite_filo_admin_end_session();
            session_start();
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            $_SESSION['issued_at'] = $now;
            $_SESSION['last_activity'] = $now;
            $_SESSION['rotated_at'] = $now;
            return;
        }
        if ($now - (int) ($_SESSION['rotated_at'] ?? 0) >= KALITE_FILO_ADMIN_ROTATION_INTERVAL) {
            session_regenerate_id(true);
            $_SESSION['rotated_at'] = $now;
        }
        $_SESSION['last_activity'] = $now;
    }
}

function kalite_filo_admin_end_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) return;
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }
    session_destroy();
}

function kalite_filo_admin_require_csrf(): void
{
    $expected = $_SESSION['csrf'] ?? '';
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($expected) || !is_string($provided) || $expected === '' || !hash_equals($expected, $provided)) {
        kalite_filo_admin_json(['error' => 'csrf_failed'], 403);
    }
}

/** @return array{id: string, username: string, displayName: string, role: string} */
function kalite_filo_admin_safe_identity(): array
{
    $identity = $_SESSION['identity'] ?? null;
    if (!is_array($identity)) throw new RuntimeException('Admin identity is invalid.');
    return [
        'id' => (string) $identity['id'],
        'username' => (string) $identity['username'],
        'displayName' => (string) $identity['displayName'],
        'role' => (string) $identity['role'],
    ];
}

function kalite_filo_admin_require_authentication(): void
{
    if (empty($_SESSION['authenticated']) || !isset($_SESSION['identity'])) {
        kalite_filo_admin_json(['error' => 'authentication_required'], 401);
    }
}

function kalite_filo_admin_login_key(string $username): string
{
    $remoteAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $config = kalite_filo_admin_config();
    return hash('sha256', $config['environment'] . '|' . $username . '|'
        . (is_string($remoteAddress) ? $remoteAddress : 'unknown'));
}

/** @return array{path: string, handle: resource, failures: list<int>} */
function kalite_filo_admin_lock_login_failures(string $username): array
{
    $config = kalite_filo_admin_config();
    $directory = (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'rate-limits';
    kalite_filo_admin_ensure_private_directory($directory);
    $path = $directory . DIRECTORY_SEPARATOR . kalite_filo_admin_login_key($username) . '.json';
    $handle = fopen($path, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) fclose($handle);
        throw new RuntimeException('Login protection store could not be locked.');
    }
    $contents = stream_get_contents($handle);
    $decoded = is_string($contents) && $contents !== '' ? json_decode($contents, true) : [];
    $now = time();
    $failures = array_values(array_filter(
        is_array($decoded) ? $decoded : [],
        static fn ($timestamp): bool => is_int($timestamp) && $timestamp > $now - KALITE_FILO_ADMIN_LOGIN_WINDOW,
    ));
    return ['path' => $path, 'handle' => $handle, 'failures' => $failures];
}

/** @param resource $handle @param list<int> $failures */
function kalite_filo_admin_write_login_failures($handle, string $path, array $failures): void
{
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($failures, JSON_THROW_ON_ERROR));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    @chmod($path, 0600);
}

/** @return array<string, mixed>|null */
function kalite_filo_admin_find_user(string $username): ?array
{
    $config = kalite_filo_admin_config();
    foreach ($config['users'] as $user) {
        if (is_array($user) && hash_equals((string) $user['username'], $username)) return $user;
    }
    return null;
}
