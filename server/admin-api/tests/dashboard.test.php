<?php
declare(strict_types=1);

function dashboard_test_assert(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

function dashboard_test_remove_tree(string $path): void
{
    if (!is_dir($path)) return;
    foreach (scandir($path) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        $resolved = $path . DIRECTORY_SEPARATOR . $entry;
        is_dir($resolved) ? dashboard_test_remove_tree($resolved) : @unlink($resolved);
    }
    @rmdir($path);
}

$root = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kalite-filo-dashboard-test-'
    . getmypid() . '-' . bin2hex(random_bytes(4));
$contactPath = $root . DIRECTORY_SEPARATOR . 'newsletter-contacts.csv';
$auditDirectory = $root . DIRECTORY_SEPARATOR . 'audit';
mkdir($auditDirectory, 0700, true);

try {
    require_once dirname(__DIR__) . '/bootstrap.php';
    require_once dirname(__DIR__) . '/read-model.php';

    $handle = fopen($contactPath, 'wb');
    if ($handle === false) throw new RuntimeException('Test contact store could not be created.');
    fputcsv($handle, KALITE_FILO_ADMIN_CONTACT_COLUMNS);
    $rows = [
        ['1', 'approved@example.com', 'approved', 'website_newsletter', 'v1', '2026-08-20 10:00:00', '', '', '2026-08-20 10:00:00', '2026-08-20 10:00:00', 'pending', '', 'BIREYSEL'],
        ['2', 'lead@example.com', 'lead_only', 'website_quote_form', '', '', '', '', '2026-08-20 11:00:00', '2026-08-20 11:00:00', 'not_requested', '', 'BIREYSEL'],
        ['3', 'removed@example.com', 'approved', 'website_newsletter', 'v1', '2026-08-20 12:00:00', '', '2026-08-21 09:00:00', '2026-08-20 12:00:00', '2026-08-21 09:00:00', 'pending', '', 'BIREYSEL'],
        ['4', 'approved@example.com', 'lead_only', 'website_contact_form', '', '', '', '', '2026-08-22 11:00:00', '2026-08-22 11:00:00', 'not_requested', '', 'BIREYSEL'],
    ];
    foreach ($rows as $row) fputcsv($handle, $row);
    fclose($handle);

    $metrics = kalite_filo_admin_contact_metrics($contactPath);
    dashboard_test_assert($metrics === [
        'contacts' => 3,
        'approved' => 1,
        'iysPending' => 1,
        'unsubscribed' => 1,
    ], 'Dashboard contact metrics must deduplicate and fail closed on unsubscribe.');

    $auditPath = $auditDirectory . DIRECTORY_SEPARATOR . 'audit-2026-08.jsonl';
    file_put_contents($auditPath, implode("\n", [
        json_encode(['id' => 'one', 'timestamp' => '2026-08-20T10:00:00Z', 'adminId' => 'owner', 'action' => 'login', 'entityType' => 'authentication', 'entityId' => null, 'result' => 'success'], JSON_THROW_ON_ERROR),
        '{malformed',
        json_encode(['id' => 'two', 'timestamp' => '2026-08-21T10:00:00Z', 'adminId' => 'owner', 'action' => 'logout', 'entityType' => 'authentication', 'entityId' => null, 'result' => 'success', 'summary' => ['secret' => 'not returned']], JSON_THROW_ON_ERROR),
    ]) . "\n");
    $activity = kalite_filo_admin_recent_audit($root, 2);
    dashboard_test_assert(count($activity) === 2, 'Dashboard must return the requested number of valid audit rows.');
    dashboard_test_assert($activity[0]['action'] === 'logout', 'Dashboard activity must be newest first.');
    dashboard_test_assert(!array_key_exists('summary', $activity[0]), 'Dashboard activity must expose only safe fields.');

    fwrite(STDOUT, "Admin dashboard read-model tests passed.\n");
} finally {
    dashboard_test_remove_tree($root);
}
