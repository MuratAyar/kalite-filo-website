<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/forms/customer-mailer.php';

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

/** @return array{subject:string,html_body:string,text_body:string,embedded_images:list<array{path:string,cid:string,name:string}>} */
function kalite_filo_admin_form_reply_message(array $record, string $subject, string $message): array
{
    $name = trim((string) ($record['name'] ?? ''));
    $reference = trim((string) ($record['referenceNumber'] ?? $record['id'] ?? ''));
    $safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    $safeReference = htmlspecialchars($reference, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $html = '<!doctype html><html lang="tr">' . kalite_filo_customer_mail_light_head() . '<body class="kf-mail-canvas" bgcolor="#f2f4f7" style="margin:0;padding:24px;background:#f2f4f7!important;font-family:Arial,sans-serif;color:#14213d!important">'
        . '<table class="kf-mail-card" bgcolor="#ffffff" role="presentation" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#ffffff!important;color:#14213d!important;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">'
        . '<tr><td class="kf-mail-navy" bgcolor="#182136" style="padding:24px;background:#182136!important;color:#ffffff!important;border-bottom:5px solid #f59e0b;text-align:center"><table bgcolor="#ffffff" role="presentation" style="margin:0 auto;background:#ffffff!important;border-radius:10px"><tr><td style="padding:10px 20px"><img alt="Kalite Filo" src="cid:kf-admin-reply-logo" width="210" style="display:block;width:210px;max-width:100%;height:auto;border:0"></td></tr></table><div style="margin-top:12px;color:#cbd5e1!important">Talebiniz hakkında</div></td></tr>'
        . '<tr><td bgcolor="#ffffff" style="padding:28px;background:#ffffff!important;color:#14213d!important"><p style="margin:0 0 18px;color:#14213d!important">Sayın ' . $safeName . ',</p><div style="line-height:1.65;color:#14213d!important">' . $safeMessage . '</div>'
        . '<p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e5e7eb;color:#64748b;font-size:13px">Referans: ' . $safeReference . '</p></td></tr>'
        . '<tr><td bgcolor="#f8fafc" style="padding:18px 28px;background:#f8fafc!important;color:#64748b!important;font-size:12px">Bu ileti Kalite Filo yönetim panelinden talebinize yanıt olarak gönderilmiştir.</td></tr>'
        . '</table></body></html>';
    return [
        'subject' => $subject,
        'html_body' => $html,
        'text_body' => "Sayın {$name},\n\n{$message}\n\nReferans: {$reference}\nKalite Filo",
        'embedded_images' => [
            ['path' => kalite_filo_customer_mail_asset('images/brand/kalite-filo-logo.png'), 'cid' => 'kf-admin-reply-logo', 'name' => 'kalite-filo-logo.png'],
        ],
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
