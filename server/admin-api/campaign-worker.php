<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/campaign-store.php';
require_once __DIR__ . '/campaign-queue-store.php';
require_once dirname(__DIR__) . '/forms/quote-mailer.php';

$config = kalite_filo_admin_config();
$contactStore = kalite_filo_admin_contact_store_path();
putenv('KALITE_FILO_CONTACT_STORE_PATH=' . $contactStore);
require_once dirname(__DIR__) . '/forms/unsubscribe-store.php';

$directory = kalite_filo_admin_campaign_queue_directory();
kalite_filo_admin_ensure_private_directory($directory);
$workerLock = fopen($directory . DIRECTORY_SEPARATOR . '.worker.lock', 'c+');
if ($workerLock === false || !flock($workerLock, LOCK_EX | LOCK_NB)) {
    fwrite(STDOUT, "Campaign worker is already running.\n");
    exit(0);
}

try {
    $queueLock = kalite_filo_admin_lock_campaign_queues();
    try {
        $queue = null;
        foreach (array_reverse(kalite_filo_admin_campaign_queue_records()) as $candidate) {
            if (in_array($candidate['status'] ?? '', ['queued', 'sending'], true)) {
                $queue = $candidate;
                break;
            }
        }
        if (!is_array($queue)) {
            fwrite(STDOUT, "No campaign queue is ready.\n");
            exit(0);
        }
        if (($queue['environment'] ?? null) !== $config['environment'] || ($queue['deliveryMode'] ?? null) !== $config['campaign_delivery_mode']) {
            throw new RuntimeException('Queue environment or delivery mode changed.');
        }
        $queue['status'] = 'sending';
        $queue['startedAt'] ??= gmdate('c');
        kalite_filo_admin_write_campaign_queue($queue);
    } finally {
        kalite_filo_admin_unlock_campaign_queues($queueLock);
    }

    $eligibleNow = [];
    foreach (kalite_filo_admin_campaign_eligible_recipients(kalite_filo_admin_all_contact_rows()) as $recipient) {
        $eligibleNow[$recipient['email']] = true;
    }
    $processed = 0;
    $batchSize = (int) $config['campaign_batch_size'];
    foreach ($queue['recipients'] as &$recipient) {
        $status = (string) ($recipient['status'] ?? 'failed');
        $attempts = (int) ($recipient['attempts'] ?? 0);
        if ($processed >= $batchSize || ($status !== 'pending' && !($status === 'failed' && $attempts < KALITE_FILO_CAMPAIGN_MAX_ATTEMPTS))) continue;
        $processed++;
        $recipient['attempts'] = $attempts + 1;
        $recipient['lastAttemptAt'] = gmdate('c');
        $email = (string) $recipient['email'];
        if (!isset($eligibleNow[$email])) {
            $recipient['status'] = 'skipped';
            $recipient['failureCode'] = 'suppressed_or_ineligible';
            continue;
        }
        if ($config['campaign_delivery_mode'] === 'dry_run') {
            $recipient['status'] = 'skipped';
            $recipient['failureCode'] = 'dry_run';
            continue;
        }
        $token = kalite_filo_issue_unsubscribe_token($email);
        $campaign = $queue['campaign'];
        $html = kalite_filo_admin_render_campaign_html($campaign, (string) $config['origin']);
        $unsubscribeUrl = (string) $config['origin'] . '/forms/unsubscribe.php?token=' . rawurlencode($token);
        $footer = '<p style="font-size:12px;text-align:center"><a href="'
            . htmlspecialchars($unsubscribeUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
            . '">Abonelikten ayrıl</a></p>';
        $html = str_replace('</body>', $footer . '</body>', $html);
        $text = html_entity_decode(trim(preg_replace('/\s+/', ' ', strip_tags($html)) ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8')
            . "\nAbonelikten ayrıl: " . $unsubscribeUrl;
        $sent = kalite_filo_send_customer_email([
            'subject' => (string) $campaign['subject'],
            'html_body' => $html,
            'text_body' => $text,
        ], $email, 'Kalite Filo Abonesi');
        if ($sent) {
            $recipient['status'] = 'sent';
            $recipient['sentAt'] = gmdate('c');
            $recipient['failureCode'] = null;
        } else {
            $recipient['status'] = 'failed';
            $recipient['failureCode'] = 'smtp_failed';
        }
    }
    unset($recipient);

    $queue['statistics'] = kalite_filo_admin_campaign_queue_statistics($queue['recipients']);
    $queue['updatedAt'] = gmdate('c');
    if ($queue['statistics']['pending'] === 0) {
        $queue['status'] = $queue['statistics']['failed'] > 0 ? 'partially_failed' : 'completed';
        $queue['completedAt'] = gmdate('c');
    } else {
        $queue['status'] = 'queued';
    }
    $queueLock = kalite_filo_admin_lock_campaign_queues();
    try {
        kalite_filo_admin_write_campaign_queue($queue);
    } finally {
        kalite_filo_admin_unlock_campaign_queues($queueLock);
    }

    $campaignLock = kalite_filo_admin_lock_campaign_store();
    try {
        $campaigns = kalite_filo_admin_campaign_records();
        foreach ($campaigns as &$campaign) {
            if (($campaign['id'] ?? null) !== $queue['campaignId']) continue;
            $campaign['status'] = $queue['status'];
            $campaign['statistics'] = $queue['statistics'] + ['unsubscribed' => $queue['statistics']['skipped']];
            $campaign['startedAt'] = $queue['startedAt'];
            $campaign['completedAt'] = $queue['completedAt'];
            $campaign['updatedAt'] = gmdate('c');
            break;
        }
        unset($campaign);
        kalite_filo_admin_write_campaign_records($campaigns);
    } finally {
        kalite_filo_admin_unlock_campaign_store($campaignLock);
    }
    kalite_filo_admin_audit('campaign_worker_batch', 'success', [
        'id' => $queue['campaignId'],
        'queueId' => $queue['id'],
        'processed' => $processed,
        'status' => $queue['status'],
    ]);
    fwrite(STDOUT, "Processed {$processed} campaign recipients; queue status: {$queue['status']}.\n");
} catch (Throwable $exception) {
    error_log('Campaign worker failed [' . get_class($exception) . '].');
    fwrite(STDERR, "Campaign worker failed.\n");
    exit(1);
} finally {
    flock($workerLock, LOCK_UN);
    fclose($workerLock);
}
