<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/campaign-store.php';
require_once __DIR__ . '/campaign-test-mailer.php';
require_once __DIR__ . '/campaign-queue-store.php';

try {
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
        $queues = array_map(static fn (array $queue): array => [
            'id' => $queue['id'],
            'campaignId' => $queue['campaignId'],
            'campaignRevision' => $queue['campaignRevision'],
            'status' => $queue['status'],
            'deliveryMode' => $queue['deliveryMode'],
            'statistics' => $queue['statistics'],
            'createdAt' => $queue['createdAt'],
            'startedAt' => $queue['startedAt'],
            'completedAt' => $queue['completedAt'],
        ], array_slice(kalite_filo_admin_campaign_queue_records(), 0, 100));
        kalite_filo_admin_json([
            'queues' => $queues,
            'deliveryMode' => kalite_filo_admin_config()['campaign_delivery_mode'],
        ]);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'PATCH') {
        kalite_filo_admin_require_same_origin();
        kalite_filo_admin_require_csrf();
        $body = kalite_filo_admin_read_json();
        $queueId = $body['queueId'] ?? null;
        if (!is_string($queueId) || preg_match('/^queue-[a-f0-9]{24}$/', $queueId) !== 1 || ($body['action'] ?? null) !== 'cancel') {
            throw new InvalidArgumentException('Queue cancellation is invalid.');
        }
        $lock = kalite_filo_admin_lock_campaign_queues();
        try {
            $queue = null;
            foreach (kalite_filo_admin_campaign_queue_records() as $candidate) {
                if (($candidate['id'] ?? null) === $queueId) { $queue = $candidate; break; }
            }
            if (!is_array($queue) || ($queue['status'] ?? null) !== 'queued') throw new InvalidArgumentException('Only a queued campaign can be cancelled.');
            foreach ($queue['recipients'] as &$recipient) {
                if (($recipient['status'] ?? null) === 'pending' || (($recipient['status'] ?? null) === 'failed' && (int) ($recipient['attempts'] ?? 0) < KALITE_FILO_CAMPAIGN_MAX_ATTEMPTS)) {
                    $recipient['status'] = 'skipped';
                    $recipient['failureCode'] = 'cancelled';
                }
            }
            unset($recipient);
            $queue['statistics'] = kalite_filo_admin_campaign_queue_statistics($queue['recipients']);
            $queue['status'] = 'cancelled';
            $queue['completedAt'] = gmdate('c');
            $queue['updatedAt'] = gmdate('c');
            kalite_filo_admin_write_campaign_queue($queue);
        } finally {
            kalite_filo_admin_unlock_campaign_queues($lock);
        }
        $campaignLock = kalite_filo_admin_lock_campaign_store();
        try {
            $campaigns = kalite_filo_admin_campaign_records();
            foreach ($campaigns as &$storedCampaign) if (($storedCampaign['id'] ?? null) === $queue['campaignId']) {
                $storedCampaign['status'] = 'cancelled';
                $storedCampaign['statistics'] = $queue['statistics'] + ['unsubscribed' => 0];
                $storedCampaign['completedAt'] = $queue['completedAt'];
                $storedCampaign['updatedAt'] = gmdate('c');
                break;
            }
            unset($storedCampaign);
            kalite_filo_admin_write_campaign_records($campaigns);
        } finally {
            kalite_filo_admin_unlock_campaign_store($campaignLock);
        }
        kalite_filo_admin_audit('campaign_queue_cancel', 'success', ['id' => $queue['campaignId'], 'queueId' => $queue['id']]);
        kalite_filo_admin_json(['cancelled' => true]);
    }
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_require_csrf();
    $body = kalite_filo_admin_read_json();
    $campaignId = $body['campaignId'] ?? null;
    $confirmation = $body['confirmation'] ?? null;
    if (!is_string($campaignId) || !is_string($confirmation)) throw new InvalidArgumentException('Queue request is invalid.');
    $campaign = kalite_filo_admin_campaign_by_id($campaignId);
    if (!hash_equals((string) $campaign['name'], trim($confirmation))) throw new InvalidArgumentException('Campaign confirmation is invalid.');
    $lock = kalite_filo_admin_lock_campaign_queues();
    try {
        $queue = kalite_filo_admin_create_campaign_queue($campaign, kalite_filo_admin_all_contact_rows());
    } finally {
        kalite_filo_admin_unlock_campaign_queues($lock);
    }
    $campaignLock = kalite_filo_admin_lock_campaign_store();
    try {
        $campaigns = kalite_filo_admin_campaign_records();
        foreach ($campaigns as &$storedCampaign) {
            if (($storedCampaign['id'] ?? null) !== $campaign['id']) continue;
            $storedCampaign['status'] = 'queued';
            $storedCampaign['statistics'] = $queue['statistics'] + ['unsubscribed' => 0];
            $storedCampaign['updatedAt'] = gmdate('c');
            break;
        }
        unset($storedCampaign);
        kalite_filo_admin_write_campaign_records($campaigns);
    } finally {
        kalite_filo_admin_unlock_campaign_store($campaignLock);
    }
    kalite_filo_admin_audit('campaign_queue_create', 'success', [
        'id' => $campaign['id'],
        'queueId' => $queue['id'],
        'recipientCount' => $queue['statistics']['total'],
        'deliveryMode' => $queue['deliveryMode'],
    ]);
    kalite_filo_admin_json(['queue' => [
        'id' => $queue['id'],
        'status' => $queue['status'],
        'statistics' => $queue['statistics'],
        'deliveryMode' => $queue['deliveryMode'],
    ]], 201);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'delivery_disabled'], 409);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Campaign queue failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
