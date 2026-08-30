<?php
declare(strict_types=1);

$root = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kalite-filo-queue-' . bin2hex(random_bytes(5));
function kalite_filo_admin_config(): array
{
    global $root;
    return ['data_root' => $root, 'environment' => 'staging', 'campaign_delivery_mode' => 'dry_run', 'campaign_batch_size' => 2];
}
function kalite_filo_admin_ensure_private_directory(string $path): void
{
    if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) throw new RuntimeException('directory');
}
function queue_test_assert(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}
function queue_test_remove(string $path): void
{
    if (!is_dir($path)) return;
    foreach (scandir($path) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        $item = $path . DIRECTORY_SEPARATOR . $entry;
        is_dir($item) ? queue_test_remove($item) : @unlink($item);
    }
    @rmdir($path);
}

require_once dirname(__DIR__) . '/campaign-store.php';
require_once dirname(__DIR__) . '/campaign-queue-store.php';

try {
    $_SESSION['identity'] = ['id' => 'owner'];
    $campaign = kalite_filo_admin_normalize_campaign([
        'name' => 'Queue test',
        'subject' => 'Subject',
        'content' => [['type' => 'text', 'text' => 'Body']],
    ]);
    $rows = [
        ['id' => '1', 'email' => 'eligible@example.test', 'status' => 'approved', 'consent_at' => '2026-08-01', 'consent_text_version' => 'v1', 'iys_status' => 'synced', 'unsubscribed_at' => '', 'recipient_type' => 'BIREYSEL'],
        ['id' => '2', 'email' => 'blocked@example.test', 'status' => 'approved', 'consent_at' => '2026-08-01', 'consent_text_version' => 'v1', 'iys_status' => 'pending', 'unsubscribed_at' => '', 'recipient_type' => 'BIREYSEL'],
        ['id' => '3', 'email' => 'removed@example.test', 'status' => 'approved', 'consent_at' => '2026-08-01', 'consent_text_version' => 'v1', 'iys_status' => 'approved', 'unsubscribed_at' => '', 'recipient_type' => 'BIREYSEL'],
        ['id' => '4', 'email' => 'removed@example.test', 'status' => 'unsubscribed', 'consent_at' => '', 'consent_text_version' => '', 'iys_status' => 'approved', 'unsubscribed_at' => '2026-08-02', 'recipient_type' => 'BIREYSEL'],
    ];
    $eligible = kalite_filo_admin_campaign_eligible_recipients($rows);
    queue_test_assert(count($eligible) === 1 && $eligible[0]['email'] === 'eligible@example.test', 'Audience freeze must fail closed and let unsubscribe override consent.');
    $lock = kalite_filo_admin_lock_campaign_queues();
    try {
        $first = kalite_filo_admin_create_campaign_queue($campaign, $rows);
        $second = kalite_filo_admin_create_campaign_queue($campaign, $rows);
    } finally {
        kalite_filo_admin_unlock_campaign_queues($lock);
    }
    queue_test_assert($first['id'] === $second['id'], 'The same campaign revision and audience must be idempotent.');
    queue_test_assert($first['statistics']['pending'] === 1 && $first['deliveryMode'] === 'dry_run', 'Queue must freeze its environment mode and pending ledger.');
    $recipient = $first['recipients'][0];
    $recipient['status'] = 'failed';
    $recipient['attempts'] = 2;
    $stats = kalite_filo_admin_campaign_queue_statistics([$recipient]);
    queue_test_assert($stats['pending'] === 1 && $stats['failed'] === 0, 'A controlled retry must remain pending before the attempt limit.');
    $recipient['attempts'] = 3;
    $stats = kalite_filo_admin_campaign_queue_statistics([$recipient]);
    queue_test_assert($stats['pending'] === 0 && $stats['failed'] === 1, 'A recipient must become terminal after three attempts.');
} finally {
    queue_test_remove($root);
}
fwrite(STDOUT, "Admin campaign queue tests passed.\n");
