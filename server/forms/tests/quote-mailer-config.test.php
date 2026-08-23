<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/quote-mailer.php';

function assert_true(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function assert_invalid_config(array $config, string $message): void
{
    try {
        kalite_filo_validate_mail_config($config);
    } catch (RuntimeException) {
        return;
    }

    throw new RuntimeException($message);
}

$base = [
    'host' => 'smtp.example.test',
    'port' => 465,
    'encryption' => 'smtps',
    'username' => 'smtp-user@example.test',
    'password' => 'test-only-password',
    'from_address' => 'sender@example.test',
    'from_name' => 'Test Sender',
    'recipient_address' => 'recipient@example.test',
    'recipient_name' => 'Test Recipient',
];

$smtps = kalite_filo_validate_mail_config($base);
assert_true($smtps['port'] === 465 && $smtps['encryption'] === 'smtps', 'SMTPS/465 must be accepted.');
assert_true($smtps['username'] !== $smtps['from_address'], 'SMTP username and From identity must remain independent.');
assert_true($smtps['from_address'] !== $smtps['recipient_address'], 'From and recipient identities must remain independent.');

$withContact = kalite_filo_validate_mail_config([
    ...$base,
    'contact_recipient_address' => 'contact@example.test',
    'contact_recipient_name' => 'Contact Recipient',
]);
assert_true(
    $withContact['contact_recipient_address'] === 'contact@example.test',
    'The separately configured contact recipient must be accepted.',
);
assert_invalid_config(
    [...$base, 'contact_recipient_address' => "bad\n@example.test", 'contact_recipient_name' => 'Contact'],
    'A malformed contact recipient must be rejected.',
);

$startTls = kalite_filo_validate_mail_config([
    ...$base,
    'port' => 587,
    'encryption' => 'starttls',
]);
assert_true($startTls['port'] === 587 && $startTls['encryption'] === 'starttls', 'STARTTLS/587 must be accepted.');

assert_invalid_config([...$base, 'encryption' => 'none'], 'Unknown encryption must be rejected.');
assert_invalid_config([...$base, 'port' => 587], 'SMTPS with port 587 must be rejected.');
assert_invalid_config([...$base, 'port' => 25], 'Unapproved SMTP ports must be rejected.');

$productionFallback = kalite_filo_resolve_mail_config_path(null, '/home/account/public_html/forms');
$stagingFallback = kalite_filo_resolve_mail_config_path(null, '/home/account/staging.kalitefilo.com.tr/forms');
$productionFallback = str_replace('\\', '/', $productionFallback);
$stagingFallback = str_replace('\\', '/', $stagingFallback);
assert_true(
    $productionFallback === '/home/account/private/' . KALITE_FILO_MAIL_CONFIG_FILENAME,
    'Production fallback must resolve outside public_html.',
);
assert_true(
    $stagingFallback === '/home/account/private/' . KALITE_FILO_MAIL_CONFIG_FILENAME,
    'Staging fallback must resolve outside the staging document root.',
);
try {
    kalite_filo_resolve_mail_config_path('../private/mail.php', '/home/account/public_html/forms');
    throw new RuntimeException('A relative environment config path must be rejected.');
} catch (RuntimeException $exception) {
    assert_true(
        $exception->getMessage() === 'Mail configuration path must be absolute.',
        'The relative-path rejection must be deterministic.',
    );
}

$temporaryConfig = tempnam(sys_get_temp_dir(), 'kf-mail-test-');
if ($temporaryConfig === false) {
    throw new RuntimeException('Could not create a temporary test configuration.');
}

$exported = '<?php return ' . var_export($base, true) . ';';
file_put_contents($temporaryConfig, $exported);
putenv(KALITE_FILO_MAIL_CONFIG_ENV . '=' . $temporaryConfig);
try {
    $loaded = kalite_filo_load_mail_config();
    assert_true($loaded['host'] === 'smtp.example.test', 'The absolute environment config path must be loaded.');
} finally {
    putenv(KALITE_FILO_MAIL_CONFIG_ENV);
    unlink($temporaryConfig);
}

fwrite(STDOUT, "Quote mail configuration tests passed.\n");
