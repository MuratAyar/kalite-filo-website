<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/forms/quote-mailer.php';

function kalite_filo_admin_form_reply_rate_limit(string $dataRoot, string $adminId): bool
{
    $directory = $dataRoot . DIRECTORY_SEPARATOR . 'rate-limits';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Reply rate-limit directory could not be created.');
    $path = $directory . DIRECTORY_SEPARATOR . 'form-reply-' . hash('sha256', $adminId) . '.json';
    $handle = fopen($path, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) { if (is_resource($handle)) fclose($handle); throw new RuntimeException('Reply rate limit could not be locked.'); }
    try {
        $raw = stream_get_contents($handle);
        $decoded = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
        $now = time();
        $attempts = array_values(array_filter(is_array($decoded) ? $decoded : [], static fn ($value): bool => is_int($value) && $value > $now - 600));
        if (count($attempts) >= 20) return false;
        $attempts[] = $now;
        ftruncate($handle, 0); rewind($handle);
        fwrite($handle, json_encode($attempts, JSON_THROW_ON_ERROR)); fflush($handle); @chmod($path, 0600);
        return true;
    } finally { flock($handle, LOCK_UN); fclose($handle); }
}

/** @return array{subject:string,html_body:string,text_body:string} */
function kalite_filo_admin_form_reply_message(array $record, string $subject, string $message): array
{
    $name = trim((string) ($record['name'] ?? ''));
    $reference = trim((string) ($record['referenceNumber'] ?? $record['id'] ?? ''));
    $safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    $safeReference = htmlspecialchars($reference, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $html = '<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,sans-serif;color:#14213d">'
        . '<table role="presentation" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">'
        . '<tr><td style="padding:28px;background:#14213d;color:#fff;border-bottom:5px solid #f59e0b"><div style="font-size:24px;font-weight:700">Kalite Filo</div><div style="margin-top:6px;color:#cbd5e1">Talebiniz hakkında</div></td></tr>'
        . '<tr><td style="padding:28px"><p style="margin:0 0 18px">Sayın ' . $safeName . ',</p><div style="line-height:1.65">' . $safeMessage . '</div>'
        . '<p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e5e7eb;color:#64748b;font-size:13px">Referans: ' . $safeReference . '</p></td></tr>'
        . '<tr><td style="padding:18px 28px;background:#f8fafc;color:#64748b;font-size:12px">Bu ileti Kalite Filo yönetim panelinden talebinize yanıt olarak gönderilmiştir.</td></tr>'
        . '</table></body></html>';
    return [
        'subject' => $subject,
        'html_body' => $html,
        'text_body' => "Sayın {$name},\n\n{$message}\n\nReferans: {$reference}\nKalite Filo",
    ];
}

function kalite_filo_admin_send_form_reply(array $record, string $subject, string $message): bool
{
    return kalite_filo_send_customer_email(
        kalite_filo_admin_form_reply_message($record, $subject, $message),
        (string) ($record['email'] ?? ''),
        (string) ($record['name'] ?? ''),
    );
}
