<?php
declare(strict_types=1);

$temporaryDirectory = sys_get_temp_dir() . DIRECTORY_SEPARATOR
    . 'kalite-filo-contact-store-' . bin2hex(random_bytes(8));
$storePath = $temporaryDirectory . DIRECTORY_SEPARATOR . 'contacts.csv';
putenv('KALITE_FILO_CONTACT_STORE_PATH=' . $storePath);

require_once dirname(__DIR__) . '/subscriber-store.php';

function subscriber_test_assert(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

function subscriber_test_rows(string $path): array
{
    $handle = fopen($path, 'rb');
    subscriber_test_assert($handle !== false, 'The CSV store must be readable.');
    $columns = fgetcsv($handle);
    subscriber_test_assert($columns === kalite_filo_contact_store_columns(), 'The CSV schema must remain stable.');
    $rows = [];
    while (($values = fgetcsv($handle)) !== false) {
        $row = array_combine($columns, $values);
        if (is_array($row)) $rows[] = $row;
    }
    fclose($handle);
    return $rows;
}

try {
    $newsletter = kalite_filo_store_contact([
        'email' => ' Test@Example.com ',
        'status' => 'pending',
        'consent_source' => 'website_newsletter',
        'consent_text_version' => '2026-08-27-v1',
        'consent_at' => '2026-08-27 20:42:15',
        'iys_status' => 'pending',
    ]);
    subscriber_test_assert($newsletter['id'] === '1', 'The first contact must receive ID 1.');
    subscriber_test_assert($newsletter['email'] === 'test@example.com', 'Email addresses must be normalized.');
    subscriber_test_assert($newsletter['status'] === 'pending', 'Newsletter consent must remain pending until confirmation.');

    $updated = kalite_filo_store_contact([
        'email' => 'test@example.com',
        'status' => 'active',
        'consent_source' => 'website_newsletter',
        'consent_text_version' => '2026-08-27-v1',
        'consent_at' => '2026-08-27 20:42:15',
        'confirmed_at' => '2026-08-27 20:43:02',
        'iys_status' => 'approved',
    ]);
    subscriber_test_assert($updated['id'] === '1', 'A repeated email/source pair must update its existing row.');

    kalite_filo_store_form_contact('test@example.com', 'website_quote_form');
    $rows = subscriber_test_rows($storePath);
    subscriber_test_assert(count($rows) === 2, 'The same email from a different source must retain a separate audit row.');
    subscriber_test_assert($rows[0]['confirmed_at'] === '2026-08-27 20:43:02', 'Confirmation metadata must persist.');
    subscriber_test_assert($rows[1]['status'] === 'lead_only', 'Quote form contacts must not become newsletter subscribers.');
    subscriber_test_assert($rows[1]['iys_status'] === 'not_requested', 'Quote form contacts must not imply IYS consent.');
    if (DIRECTORY_SEPARATOR === '/') {
        subscriber_test_assert(substr(sprintf('%o', fileperms($storePath)), -3) === '600', 'The contact store must be private to the account user.');
    }
} finally {
    @unlink($storePath);
    @unlink($storePath . '.lock');
    @rmdir($temporaryDirectory);
}

fwrite(STDOUT, "Subscriber store tests passed.\n");
