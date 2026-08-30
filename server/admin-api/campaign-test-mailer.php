<?php
declare(strict_types=1);

const KALITE_FILO_CAMPAIGN_TEST_WINDOW = 600;
const KALITE_FILO_CAMPAIGN_TEST_MAX_SENDS = 5;

/** @return array{id: string, email: string, name: string} */
function kalite_filo_admin_campaign_test_recipient(string $id): array
{
    foreach (kalite_filo_admin_config()['campaign_test_recipients'] ?? [] as $recipient) {
        if (is_array($recipient) && hash_equals((string) $recipient['id'], $id)) return $recipient;
    }
    throw new InvalidArgumentException('Test recipient is not allowlisted.');
}

/** @return array<string, mixed> */
function kalite_filo_admin_campaign_by_id(string $id): array
{
    if (preg_match('/^campaign-[a-f0-9]{12}$/', $id) !== 1) {
        throw new InvalidArgumentException('Campaign id is invalid.');
    }
    foreach (kalite_filo_admin_campaign_records() as $campaign) {
        if (is_array($campaign) && hash_equals((string) ($campaign['id'] ?? ''), $id)) return $campaign;
    }
    throw new InvalidArgumentException('Campaign was not found.');
}

function kalite_filo_admin_assert_campaign_test_rate_limit(): void
{
    $identity = kalite_filo_admin_safe_identity();
    $config = kalite_filo_admin_config();
    $directory = (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'rate-limits';
    kalite_filo_admin_ensure_private_directory($directory);
    $key = hash('sha256', (string) $config['environment'] . '|campaign-test|' . $identity['id']);
    $path = $directory . DIRECTORY_SEPARATOR . $key . '.json';
    $handle = fopen($path, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) fclose($handle);
        throw new RuntimeException('Campaign test rate limit is unavailable.');
    }
    try {
        $raw = stream_get_contents($handle);
        $decoded = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
        $now = time();
        $timestamps = array_values(array_filter(
            is_array($decoded) ? $decoded : [],
            static fn ($timestamp): bool => is_int($timestamp) && $timestamp > $now - KALITE_FILO_CAMPAIGN_TEST_WINDOW,
        ));
        if (count($timestamps) >= KALITE_FILO_CAMPAIGN_TEST_MAX_SENDS) {
            throw new DomainException('Campaign test rate limit exceeded.');
        }
        $timestamps[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($timestamps, JSON_THROW_ON_ERROR));
        fflush($handle);
        @chmod($path, 0600);
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

/** @return array{subject: string, html_body: string, text_body: string} */
function kalite_filo_admin_campaign_test_message(array $campaign): array
{
    if (($campaign['status'] ?? null) !== 'draft') throw new InvalidArgumentException('Only draft campaigns can be tested.');
    $environment = strtoupper((string) kalite_filo_admin_config()['environment']);
    $subject = '[TEST][' . $environment . '] ' . (string) ($campaign['subject'] ?? '');
    if (preg_match('/[\r\n]/', $subject) === 1 || mb_strlen($subject) > 220) {
        throw new InvalidArgumentException('Campaign subject is invalid.');
    }
    $html = kalite_filo_admin_render_campaign_html($campaign, (string) kalite_filo_admin_config()['origin']);
    $text = html_entity_decode(trim(preg_replace('/\s+/', ' ', strip_tags($html)) ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return ['subject' => $subject, 'html_body' => $html, 'text_body' => $text];
}

function kalite_filo_admin_send_campaign_test(array $campaign, array $recipient): bool
{
    require_once dirname(__DIR__) . '/forms/quote-mailer.php';
    $message = kalite_filo_admin_campaign_test_message($campaign);
    return kalite_filo_send_customer_email($message, (string) $recipient['email'], (string) $recipient['name']);
}
