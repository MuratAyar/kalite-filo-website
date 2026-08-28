<?php
declare(strict_types=1);

$temporaryDirectory = sys_get_temp_dir() . DIRECTORY_SEPARATOR
    . 'kalite-filo-iys-export-' . bin2hex(random_bytes(8));
$storePath = $temporaryDirectory . DIRECTORY_SEPARATOR . 'newsletter-contacts.csv';
putenv('KALITE_FILO_CONTACT_STORE_PATH=' . $storePath);

require_once dirname(__DIR__) . '/subscriber-store.php';
require_once dirname(__DIR__) . '/export-iys-daily.php';

function iys_test_assert(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

try {
    kalite_filo_store_contact([
        'email' => 'person@example.com',
        'status' => 'approved',
        'consent_source' => 'website_newsletter',
        'consent_at' => '2026-08-28 10:00:00',
        'iys_status' => 'pending',
        'recipient_type' => 'BIREYSEL',
    ]);
    kalite_filo_store_contact([
        'email' => 'person@example.com',
        'status' => 'approved',
        'consent_source' => 'website_quote_form',
        'consent_at' => '2026-08-28 11:00:00',
        'iys_status' => 'pending',
        'recipient_type' => 'TACIR',
    ]);
    kalite_filo_store_form_contact('lead@example.com', 'website_contact_form');

    $now = new DateTimeImmutable('2026-08-28 17:00:00', new DateTimeZone('UTC'));
    $outputPath = kalite_filo_export_iys_daily($now);
    iys_test_assert(is_string($outputPath) && is_file($outputPath), 'A dated IYS CSV must be created when new consents exist.');
    iys_test_assert(str_ends_with($outputPath, 'iys-email-permissions-2026-08-28.csv'), 'The filename must include the Istanbul date.');

    $handle = fopen($outputPath, 'rb');
    iys_test_assert($handle !== false, 'The IYS CSV must be readable.');
    $header = fgetcsv($handle);
    if (is_array($header)) $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]) ?? $header[0];
    $row = fgetcsv($handle);
    $extra = fgetcsv($handle);
    fclose($handle);
    iys_test_assert($header === ['recipient', 'consentDate', 'type', 'recipientType', 'source'], 'The IYS CSV schema must remain stable.');
    iys_test_assert(is_array($row) && $row[0] === 'person@example.com', 'Only consented addresses may be exported.');
    iys_test_assert($row[3] === 'TACIR', 'The latest same-day consent must determine recipient type.');
    iys_test_assert($extra === false, 'Duplicate email addresses must be collapsed into one IYS row.');

    $secondOutput = kalite_filo_export_iys_daily(new DateTimeImmutable('2026-08-28 18:00:00', new DateTimeZone('UTC')));
    iys_test_assert($secondOutput === null, 'No file may be created when there are no new consent records.');
} finally {
    foreach ([
        $storePath,
        $storePath . '.lock',
        $temporaryDirectory . DIRECTORY_SEPARATOR . 'iys-email-permissions-2026-08-28.csv',
        $temporaryDirectory . DIRECTORY_SEPARATOR . 'iys-export-state.json',
        $temporaryDirectory . DIRECTORY_SEPARATOR . 'iys-export.lock',
    ] as $path) {
        @unlink($path);
    }
    @rmdir($temporaryDirectory);
}

fwrite(STDOUT, "IYS export tests passed.\n");
