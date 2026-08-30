<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/campaign-store.php';
require_once __DIR__ . '/campaign-test-mailer.php';

try {
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    kalite_filo_admin_require_roles(['owner', 'admin', 'marketing']);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
        $options = array_map(
            static fn (array $recipient): array => [
                'id' => $recipient['id'],
                'label' => $recipient['name'] . ' (' . $recipient['email'] . ')',
            ],
            kalite_filo_admin_config()['campaign_test_recipients'],
        );
        kalite_filo_admin_json(['recipients' => $options, 'configured' => count($options) > 0]);
    }
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_require_csrf();
    $body = kalite_filo_admin_read_json();
    $campaignId = $body['campaignId'] ?? null;
    $recipientId = $body['recipientId'] ?? null;
    if (!is_string($campaignId) || !is_string($recipientId)) throw new InvalidArgumentException('Invalid test request.');
    $campaign = kalite_filo_admin_campaign_by_id($campaignId);
    $recipient = kalite_filo_admin_campaign_test_recipient($recipientId);
    kalite_filo_admin_assert_campaign_test_rate_limit();
    $sent = kalite_filo_admin_send_campaign_test($campaign, $recipient);
    kalite_filo_admin_audit('campaign_test_send', $sent ? 'success' : 'failure', [
        'id' => $campaign['id'],
        'recipientId' => $recipient['id'],
    ]);
    if (!$sent) kalite_filo_admin_json(['error' => 'delivery_failed'], 502);
    kalite_filo_admin_json(['sent' => true]);
} catch (DomainException) {
    kalite_filo_admin_json(['error' => 'rate_limited'], 429);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Campaign test mail failed [' . get_class($exception) . '].');
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
