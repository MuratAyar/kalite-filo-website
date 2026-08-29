<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_csrf();
    $body = kalite_filo_admin_read_json();
    $username = strtolower(trim(is_string($body['username'] ?? null) ? $body['username'] : ''));
    $password = is_string($body['password'] ?? null) ? $body['password'] : '';
    if (preg_match('/^[a-z0-9][a-z0-9._-]{2,63}$/', $username) !== 1 || $password === '' || strlen($password) > 1024) {
        kalite_filo_admin_json(['error' => 'invalid_credentials'], 401);
    }

    $rateLimit = kalite_filo_admin_lock_login_failures($username);
    if (count($rateLimit['failures']) >= KALITE_FILO_ADMIN_LOGIN_MAX_FAILURES) {
        kalite_filo_admin_write_login_failures($rateLimit['handle'], $rateLimit['path'], $rateLimit['failures']);
        kalite_filo_admin_audit('failed_login', 'rate_limited', [
            'usernameHash' => hash('sha256', $username),
        ]);
        kalite_filo_admin_json(['error' => 'login_rate_limited'], 429);
    }

    $user = kalite_filo_admin_find_user($username);
    $config = kalite_filo_admin_config();
    $verificationUser = $user ?? $config['users'][0];
    $validPassword = password_verify($password, (string) $verificationUser['password_hash']);
    if ($user === null || !$validPassword || empty($user['enabled'])) {
        $rateLimit['failures'][] = time();
        kalite_filo_admin_write_login_failures($rateLimit['handle'], $rateLimit['path'], $rateLimit['failures']);
        kalite_filo_admin_audit('failed_login', 'rejected', [
            'usernameHash' => hash('sha256', $username),
        ]);
        kalite_filo_admin_json(['error' => 'invalid_credentials'], 401);
    }
    kalite_filo_admin_write_login_failures($rateLimit['handle'], $rateLimit['path'], []);

    session_regenerate_id(true);
    $now = time();
    $_SESSION['authenticated'] = true;
    $_SESSION['identity'] = [
        'id' => $user['id'],
        'username' => $user['username'],
        'displayName' => $user['display_name'],
        'role' => $user['role'],
    ];
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    $_SESSION['issued_at'] = $now;
    $_SESSION['last_activity'] = $now;
    $_SESSION['rotated_at'] = $now;
    kalite_filo_admin_audit('login', 'success');
    kalite_filo_admin_json([
        'authenticated' => true,
        'csrfToken' => $_SESSION['csrf'],
        'environment' => $config['environment'],
        'user' => kalite_filo_admin_safe_identity(),
    ]);
} catch (Throwable $exception) {
    error_log('Kalite Filo admin login failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
