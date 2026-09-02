<?php
declare(strict_types=1);

function admin_test_assert(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

function admin_test_remove_tree(string $path): void
{
    if (!is_dir($path)) return;
    foreach (scandir($path) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        $resolved = $path . DIRECTORY_SEPARATOR . $entry;
        is_dir($resolved) ? admin_test_remove_tree($resolved) : @unlink($resolved);
    }
    @rmdir($path);
}

$temporaryRoot = sys_get_temp_dir() . DIRECTORY_SEPARATOR
    . 'kalite-filo-admin-test-' . getmypid() . '-' . bin2hex(random_bytes(4));
$dataRoot = $temporaryRoot . DIRECTORY_SEPARATOR . 'data';
$configPath = $temporaryRoot . DIRECTORY_SEPARATOR . 'config.php';
mkdir($temporaryRoot, 0700, true);
$passwordHash = password_hash('correct horse battery staple', PASSWORD_DEFAULT);
$configSource = "\xEF\xBB\xBF<?php\nreturn " . var_export([
    'environment' => 'staging',
    'data_root' => $dataRoot,
    'campaign_test_recipients' => [[
        'id' => 'owner-test',
        'email' => 'owner@example.test',
        'name' => 'Test Owner',
    ]],
    'users' => [[
        'id' => 'owner',
        'username' => 'owner.test',
        'display_name' => 'Test Owner',
        'password_hash' => $passwordHash,
        'role' => 'owner',
        'enabled' => true,
    ]],
], true) . ";\n";
file_put_contents($configPath, $configSource, LOCK_EX);
chmod($configPath, 0600);

putenv('KALITE_FILO_ADMIN_TARGET=staging');
putenv('KALITE_FILO_ADMIN_CONFIG=' . $configPath);
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '192.0.2.10';

try {
    require_once dirname(__DIR__) . '/auth.php';
    require_once dirname(__DIR__) . '/read-model.php';
    require_once dirname(__DIR__) . '/campaign-store.php';
    require_once dirname(__DIR__) . '/campaign-test-mailer.php';

    $config = kalite_filo_admin_config();
    admin_test_assert(!headers_sent(), 'A UTF-8 BOM in private config must not leak into the response.');
    admin_test_assert($config['environment'] === 'staging', 'Admin environment must be isolated to staging.');
    admin_test_assert($config['data_root'] === $dataRoot, 'Private data root must come from private config.');
    admin_test_assert(password_verify('correct horse battery staple', $config['users'][0]['password_hash']), 'Configured password hash must verify.');
    admin_test_assert(
        kalite_filo_admin_contact_store_path() === $dataRoot . DIRECTORY_SEPARATOR . 'newsletter-contacts.csv',
        'Staging dashboard contacts must default to the isolated staging data root.',
    );
    admin_test_assert(kalite_filo_admin_find_user('owner.test') !== null, 'Configured owner must be found.');
    admin_test_assert(kalite_filo_admin_find_user('missing') === null, 'Unknown users must not resolve.');
    admin_test_assert($config['campaign_test_recipients'][0]['id'] === 'owner-test', 'Private test recipient allowlist must validate.');
    $publishingAutomation = kalite_filo_admin_validate_publishing_automation([
        'enabled' => true,
        'repository' => 'MuratAyar/kalite-filo-website',
        'workflow' => 'admin-staging-publish.yml',
        'ref' => 'main',
        'github_token' => str_repeat('g', 40),
        'runner_token_hash' => str_repeat('a', 64),
    ], 'staging');
    admin_test_assert($publishingAutomation['enabled'] === true, 'Valid staging publishing automation must normalize.');
    try {
        kalite_filo_admin_validate_publishing_automation($publishingAutomation, 'production');
        admin_test_assert(false, 'Publishing automation must not silently enable in production.');
    } catch (RuntimeException) {
        // Expected.
    }
    try {
        kalite_filo_admin_validate_test_recipients([['id' => 'unsafe', 'email' => "bad@example.test\nBcc:x", 'name' => 'Unsafe']]);
        admin_test_assert(false, 'Header injection in a test recipient must fail.');
    } catch (RuntimeException) {
        // Expected.
    }

    kalite_filo_admin_start_session();
    $cookie = session_get_cookie_params();
    admin_test_assert($cookie['secure'] === true, 'Admin session cookie must be Secure.');
    admin_test_assert($cookie['httponly'] === true, 'Admin session cookie must be HttpOnly.');
    admin_test_assert($cookie['samesite'] === 'Strict', 'Admin session cookie must be SameSite Strict.');
    admin_test_assert(strlen((string) $_SESSION['csrf']) === 64, 'Session must receive a strong CSRF token.');

    $_SESSION['authenticated'] = true;
    $_SESSION['identity'] = [
        'id' => 'owner',
        'username' => 'owner.test',
        'displayName' => 'Test Owner',
        'role' => 'owner',
    ];
    $identity = kalite_filo_admin_safe_identity();
    admin_test_assert($identity['role'] === 'owner', 'Safe session identity must preserve the role.');
    $recipient = kalite_filo_admin_campaign_test_recipient('owner-test');
    admin_test_assert($recipient['email'] === 'owner@example.test', 'Only an allowlisted test recipient id may resolve.');
    try {
        kalite_filo_admin_campaign_test_recipient('arbitrary');
        admin_test_assert(false, 'An arbitrary recipient must not resolve.');
    } catch (InvalidArgumentException) {
        // Expected.
    }
    $testMessage = kalite_filo_admin_campaign_test_message([
        'status' => 'draft',
        'subject' => 'Test subject',
        'preheader' => 'Preheader',
        'content' => [['type' => 'text', 'heading' => '', 'text' => '<script>alert(1)</script>']],
    ]);
    admin_test_assert(str_starts_with($testMessage['subject'], '[TEST][STAGING]'), 'Test subject must identify its environment.');
    admin_test_assert(!str_contains($testMessage['html_body'], '<script>'), 'Test HTML must escape authored markup.');
    kalite_filo_admin_assert_campaign_test_rate_limit();

    $rateLimit = kalite_filo_admin_lock_login_failures('owner.test');
    kalite_filo_admin_write_login_failures(
        $rateLimit['handle'],
        $rateLimit['path'],
        array_fill(0, KALITE_FILO_ADMIN_LOGIN_MAX_FAILURES, time()),
    );
    $lockedAgain = kalite_filo_admin_lock_login_failures('owner.test');
    admin_test_assert(
        count($lockedAgain['failures']) === KALITE_FILO_ADMIN_LOGIN_MAX_FAILURES,
        'Recent failed logins must persist for rate limiting.',
    );
    kalite_filo_admin_write_login_failures($lockedAgain['handle'], $lockedAgain['path'], []);

    kalite_filo_admin_audit('login', 'success', ['test' => true]);
    $auditFiles = glob($dataRoot . DIRECTORY_SEPARATOR . 'audit' . DIRECTORY_SEPARATOR . '*.jsonl');
    admin_test_assert(is_array($auditFiles) && count($auditFiles) === 1, 'Authentication audit log must be written privately.');
    $auditRecord = json_decode((string) file_get_contents($auditFiles[0]), true, 8, JSON_THROW_ON_ERROR);
    admin_test_assert($auditRecord['adminId'] === 'owner', 'Audit record must contain safe admin identity.');
    admin_test_assert(!array_key_exists('password', $auditRecord), 'Audit record must never contain a password.');

    kalite_filo_admin_end_session();
    admin_test_assert(session_status() !== PHP_SESSION_ACTIVE, 'Logout must destroy the active session.');

    foreach (glob(dirname(__DIR__) . DIRECTORY_SEPARATOR . '*.php') ?: [] as $phpFile) {
        $command = escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($phpFile);
        exec($command, $output, $status);
        admin_test_assert($status === 0, basename($phpFile) . ' must pass PHP syntax validation.');
        $output = [];
    }

    fwrite(STDOUT, "Admin authentication foundation tests passed.\n");
} finally {
    if (session_status() === PHP_SESSION_ACTIVE) kalite_filo_admin_end_session();
    putenv('KALITE_FILO_ADMIN_TARGET');
    putenv('KALITE_FILO_ADMIN_CONFIG');
    admin_test_remove_tree($temporaryRoot);
}
