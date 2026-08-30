<?php
declare(strict_types=1);

const KALITE_FILO_CAMPAIGN_MAX_QUEUE_FILES = 1000;
const KALITE_FILO_CAMPAIGN_MAX_ATTEMPTS = 3;

/** @return list<array<string, string>> */
function kalite_filo_admin_all_contact_rows(): array
{
    $rows = [];
    for ($page = 1; $page <= 1000; $page++) {
        $slice = kalite_filo_admin_contact_page(kalite_filo_admin_contact_store_path(), $page, 100);
        $rows = [...$rows, ...$slice['records']];
        if (!$slice['hasNext']) break;
    }
    return $rows;
}

function kalite_filo_admin_campaign_queue_directory(): string
{
    return (string) kalite_filo_admin_config()['data_root'] . DIRECTORY_SEPARATOR . 'queues';
}

/** @return resource */
function kalite_filo_admin_lock_campaign_queues()
{
    $directory = kalite_filo_admin_campaign_queue_directory();
    kalite_filo_admin_ensure_private_directory($directory);
    $handle = fopen($directory . DIRECTORY_SEPARATOR . '.queue.lock', 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) fclose($handle);
        throw new RuntimeException('Campaign queue could not be locked.');
    }
    return $handle;
}

/** @param resource $handle */
function kalite_filo_admin_unlock_campaign_queues($handle): void
{
    flock($handle, LOCK_UN);
    fclose($handle);
}

/** @return list<array<string, mixed>> */
function kalite_filo_admin_campaign_queue_records(): array
{
    $files = glob(kalite_filo_admin_campaign_queue_directory() . DIRECTORY_SEPARATOR . 'queue-*.json') ?: [];
    rsort($files, SORT_STRING);
    if (count($files) > KALITE_FILO_CAMPAIGN_MAX_QUEUE_FILES) throw new RuntimeException('Campaign queue limit exceeded.');
    $records = [];
    foreach ($files as $path) {
        $raw = file_get_contents($path);
        if (!is_string($raw) || strlen($raw) > 16777216) throw new RuntimeException('Campaign queue is invalid.');
        $record = json_decode($raw, true, 40, JSON_THROW_ON_ERROR);
        if (!is_array($record) || ($record['schemaVersion'] ?? null) !== 1) throw new RuntimeException('Campaign queue is invalid.');
        $records[] = $record;
    }
    return $records;
}

/** @param array<string, mixed> $queue */
function kalite_filo_admin_write_campaign_queue(array $queue): void
{
    $id = $queue['id'] ?? null;
    if (!is_string($id) || preg_match('/^queue-[a-f0-9]{24}$/', $id) !== 1) throw new InvalidArgumentException('Queue id is invalid.');
    $directory = kalite_filo_admin_campaign_queue_directory();
    kalite_filo_admin_ensure_private_directory($directory);
    $path = $directory . DIRECTORY_SEPARATOR . $id . '.json';
    $temporary = $path . '.tmp-' . bin2hex(random_bytes(6));
    if (file_put_contents($temporary, json_encode($queue, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
        throw new RuntimeException('Campaign queue could not be written.');
    }
    @chmod($temporary, 0600);
    if (!rename($temporary, $path)) {
        @unlink($temporary);
        throw new RuntimeException('Campaign queue could not be replaced.');
    }
    @chmod($path, 0600);
}

/** @param list<array<string, string>> $rows @return list<array<string, string>> */
function kalite_filo_admin_campaign_eligible_recipients(array $rows): array
{
    $states = [];
    foreach ($rows as $row) {
        $email = strtolower(trim((string) ($row['email'] ?? '')));
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) continue;
        $state = $states[$email] ?? ['unsubscribed' => false, 'eligibleRows' => []];
        $state['unsubscribed'] = $state['unsubscribed']
            || ($row['status'] ?? '') === 'unsubscribed'
            || trim((string) ($row['unsubscribed_at'] ?? '')) !== '';
        $hasConsent = in_array($row['status'] ?? '', ['approved', 'active'], true)
            && trim((string) ($row['consent_at'] ?? '')) !== ''
            && trim((string) ($row['consent_text_version'] ?? '')) !== '';
        $iysEligible = in_array($row['iys_status'] ?? '', ['approved', 'synced'], true);
        if ($hasConsent && $iysEligible) $state['eligibleRows'][] = $row;
        $states[$email] = $state;
    }
    $recipients = [];
    ksort($states, SORT_STRING);
    foreach ($states as $email => $state) {
        if ($state['unsubscribed'] || count($state['eligibleRows']) < 1) continue;
        $evidence = $state['eligibleRows'][0];
        $recipients[] = [
            'email' => $email,
            'recipientType' => (string) ($evidence['recipient_type'] ?? 'BIREYSEL'),
            'evidenceHash' => hash('sha256', implode('|', [
                (string) ($evidence['id'] ?? ''),
                (string) ($evidence['consent_at'] ?? ''),
                (string) ($evidence['consent_text_version'] ?? ''),
                (string) ($evidence['iys_status'] ?? ''),
            ])),
        ];
    }
    return $recipients;
}

/** @return array<string, mixed> */
function kalite_filo_admin_create_campaign_queue(array $campaign, array $rows): array
{
    $config = kalite_filo_admin_config();
    $mode = (string) $config['campaign_delivery_mode'];
    if ($mode === 'disabled') throw new DomainException('Campaign delivery is disabled.');
    if (($campaign['status'] ?? null) !== 'draft') throw new InvalidArgumentException('Only a draft campaign can be queued.');
    $eligible = kalite_filo_admin_campaign_eligible_recipients($rows);
    if (count($eligible) < 1) throw new InvalidArgumentException('Campaign audience is empty.');
    $fingerprint = hash('sha256', json_encode($eligible, JSON_THROW_ON_ERROR));
    $idempotencyKey = hash('sha256', $campaign['id'] . '|' . $campaign['revision'] . '|' . $fingerprint);
    foreach (kalite_filo_admin_campaign_queue_records() as $existing) {
        if (hash_equals((string) ($existing['idempotencyKey'] ?? ''), $idempotencyKey)) return $existing;
    }
    $now = gmdate('c');
    $recipients = array_map(static fn (array $recipient): array => [
        'id' => bin2hex(random_bytes(12)),
        'email' => $recipient['email'],
        'recipientType' => $recipient['recipientType'],
        'evidenceHash' => $recipient['evidenceHash'],
        'status' => 'pending',
        'attempts' => 0,
        'lastAttemptAt' => null,
        'sentAt' => null,
        'failureCode' => null,
    ], $eligible);
    $queue = [
        'schemaVersion' => 1,
        'id' => 'queue-' . bin2hex(random_bytes(12)),
        'idempotencyKey' => $idempotencyKey,
        'environment' => $config['environment'],
        'deliveryMode' => $mode,
        'campaignId' => $campaign['id'],
        'campaignRevision' => $campaign['revision'],
        'campaign' => $campaign,
        'audienceFingerprint' => $fingerprint,
        'status' => 'queued',
        'statistics' => ['total' => count($recipients), 'pending' => count($recipients), 'sent' => 0, 'failed' => 0, 'skipped' => 0],
        'recipients' => $recipients,
        'createdAt' => $now,
        'createdBy' => $_SESSION['identity']['id'] ?? null,
        'startedAt' => null,
        'completedAt' => null,
        'updatedAt' => $now,
    ];
    kalite_filo_admin_write_campaign_queue($queue);
    return $queue;
}

/** @return array<string, int> */
function kalite_filo_admin_campaign_queue_statistics(array $recipients): array
{
    $statistics = ['total' => count($recipients), 'pending' => 0, 'sent' => 0, 'failed' => 0, 'skipped' => 0];
    foreach ($recipients as $recipient) {
        $status = (string) ($recipient['status'] ?? 'failed');
        if ($status === 'pending' || ($status === 'failed' && (int) ($recipient['attempts'] ?? 0) < KALITE_FILO_CAMPAIGN_MAX_ATTEMPTS)) $statistics['pending']++;
        elseif (array_key_exists($status, $statistics)) $statistics[$status]++;
        else $statistics['failed']++;
    }
    return $statistics;
}
