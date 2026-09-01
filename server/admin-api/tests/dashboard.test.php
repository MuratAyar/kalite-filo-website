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
    require_once dirname(__DIR__) . '/vehicle-media.php';

    try { kalite_filo_admin_vehicle_media_path('../escape', 'php'); dashboard_test_assert(false, 'Unsafe media path must fail.'); }
    catch (InvalidArgumentException) { /* expected */ }

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
    $contactPage=kalite_filo_admin_contact_page($contactPath,1,2,'','approved');
    dashboard_test_assert($contactPage['total']===2&&count($contactPage['records'])===2,'Contact page must filter exact stored status without rewriting consent.');
    $leadPage=kalite_filo_admin_contact_page($contactPath,1,20,'lead@','lead_only','not_requested','website_quote_form');
    dashboard_test_assert($leadPage['total']===1&&$leadPage['records'][0]['email']==='lead@example.com','Contact filters must preserve lead-only semantics.');
    try{kalite_filo_admin_contact_page($contactPath,1,20,'','','','../unsafe');dashboard_test_assert(false,'Unsafe contact source filter must fail.');}catch(InvalidArgumentException){/* expected */}
    file_put_contents(dirname($contactPath).DIRECTORY_SEPARATOR.'iys-email-permissions-2026-08-30.csv',"recipient,consentDate,type,recipientType,source\n");
    file_put_contents(dirname($contactPath).DIRECTORY_SEPARATOR.'iys-export-state.json',json_encode(['last_exported_at_utc'=>'2026-08-30 12:00:00'],JSON_THROW_ON_ERROR));
    $iys=kalite_filo_admin_iys_overview($contactPath);dashboard_test_assert($iys['counts']['pending']===2&&$iys['counts']['notRequested']===2,'IYS overview must preserve exact row states.');dashboard_test_assert(count($iys['exports'])===1&&$iys['lastExportedAt']==='2026-08-30 12:00:00','IYS overview must expose bounded manual export history.');
    $updatedIys=kalite_filo_admin_update_contact_iys($contactPath,'1','approved','TACIR');
    dashboard_test_assert($updatedIys['iys_status']==='approved'&&$updatedIys['recipient_type']==='TACIR'&&$updatedIys['iys_synced_at']!==''&&$updatedIys['consent_at']==='2026-08-20 10:00:00'&&$updatedIys['consent_text_version']==='v1','Controlled IYS updates must preserve consent evidence and record a sync timestamp.');
    try{kalite_filo_admin_update_contact_iys($contactPath,'2','approved','BIREYSEL');dashboard_test_assert(false,'Lead-only records must not be administratively promoted to approved IYS.');}catch(InvalidArgumentException){/* expected */}

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

    $firstPage = kalite_filo_admin_audit_page($root, 1, 1);
    dashboard_test_assert(count($firstPage['records']) === 1 && $firstPage['hasNext'] === true, 'Audit pagination must return a bounded first page.');
    dashboard_test_assert($firstPage['records'][0]['action'] === 'logout', 'Audit pagination must remain newest first.');
    dashboard_test_assert(!array_key_exists('summary', $firstPage['records'][0]), 'Audit API must never expose stored summaries.');
    $secondPage = kalite_filo_admin_audit_page($root, 2, 1);
    dashboard_test_assert($secondPage['records'][0]['action'] === 'login' && $secondPage['hasNext'] === false, 'Audit pagination must expose the next valid row exactly once.');
    $filtered = kalite_filo_admin_audit_page($root, 1, 20, 'login', 'success');
    dashboard_test_assert(count($filtered['records']) === 1 && $filtered['records'][0]['id'] === 'one', 'Audit filters must be exact and fail closed.');
    try { kalite_filo_admin_audit_page($root, 1, 20, '../unsafe'); dashboard_test_assert(false, 'Unsafe audit filters must fail.'); }
    catch (InvalidArgumentException) { /* expected */ }

    fwrite(STDOUT, "Admin dashboard read-model tests passed.\n");
} finally {
    dashboard_test_remove_tree($root);
}
