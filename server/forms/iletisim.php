<?php
declare(strict_types=1);

require_once __DIR__ . '/quote-mailer.php';
require_once __DIR__ . '/subscriber-store.php';
require_once __DIR__ . '/customer-mailer.php';

const CONTACT_MAX_BODY_BYTES = 16384;
const CONTACT_RATE_LIMIT_WINDOW_SECONDS = 600;
const CONTACT_RATE_LIMIT_MAX_ATTEMPTS = 5;

function contact_respond(string $result, array $fieldErrors = []): never
{
    $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
    if (str_contains($accept, 'application/json')) {
        $status = $result === 'basarili' ? 200 : ($result === 'dogrulama' ? 422 : 503);
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(
            ['result' => $result, 'fieldErrors' => $fieldErrors],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE,
        );
        exit;
    }

    header('Location: /iletisim/?sonuc=' . rawurlencode($result), true, 303);
    exit;
}

function contact_reject(int $status): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'İstek işlenemedi.';
    exit;
}

function contact_field(string $name, int $maxBytes, bool $required = false): string
{
    $value = $_POST[$name] ?? '';
    if (!is_string($value)) {
        contact_respond('dogrulama', [$name => '*Bu alan geçerli formatta doldurulmalıdır.']);
    }

    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $value = preg_replace('/[\t ]+/u', ' ', trim($value)) ?? '';
    if (($required && $value === '') || strlen($value) > $maxBytes) {
        contact_respond('dogrulama', [
            $name => $value === ''
                ? '*Bu alan boş bırakılamaz.'
                : '*Bu alan geçerli formatta doldurulmalıdır.',
        ]);
    }

    return $value;
}

function contact_origin_is_allowed(): bool
{
    $allowedOrigins = [
        'https://kalitefilo.com.tr',
        'https://staging.kalitefilo.com.tr',
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (is_string($origin) && in_array($origin, $allowedOrigins, true)) {
        return true;
    }

    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if (!is_string($referer) || $referer === '') {
        return false;
    }

    $scheme = parse_url($referer, PHP_URL_SCHEME);
    $host = parse_url($referer, PHP_URL_HOST);
    return is_string($scheme)
        && is_string($host)
        && in_array($scheme . '://' . $host, $allowedOrigins, true);
}

function contact_rate_limit_allows_request(): bool
{
    $remoteAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = hash('sha256', 'kalite-filo-contact-v1|' . (is_string($remoteAddress) ? $remoteAddress : 'unknown'));
    $filePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'kf-contact-' . $key . '.json';
    $handle = @fopen($filePath, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) fclose($handle);
        return false;
    }

    $now = time();
    $contents = stream_get_contents($handle);
    $timestamps = is_string($contents) ? json_decode($contents, true) : [];
    if (!is_array($timestamps)) $timestamps = [];
    $timestamps = array_values(array_filter(
        $timestamps,
        static fn ($timestamp): bool => is_int($timestamp)
            && $timestamp > $now - CONTACT_RATE_LIMIT_WINDOW_SECONDS,
    ));
    $allowed = count($timestamps) < CONTACT_RATE_LIMIT_MAX_ATTEMPTS;
    if ($allowed) {
        $timestamps[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($timestamps, JSON_THROW_ON_ERROR));
        fflush($handle);
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    return $allowed;
}

function contact_email_row(string $label, string $value): string
{
    return '<tr><th style="padding:10px 12px;text-align:left;vertical-align:top;color:#657087;font-weight:600;border-bottom:1px solid #e5e7eb;width:30%">'
        . htmlspecialchars($label, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
        . '</th><td style="padding:10px 12px;color:#14213d;border-bottom:1px solid #e5e7eb">'
        . nl2br(htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'))
        . '</td></tr>';
}

header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    contact_reject(405);
}
$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength <= 0 || $contentLength > CONTACT_MAX_BODY_BYTES) contact_reject(413);
$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if (!str_starts_with($contentType, 'application/x-www-form-urlencoded')) contact_reject(415);
if (!contact_origin_is_allowed()) contact_reject(403);

if (contact_field('website', 200) !== '') contact_respond('basarili');
if (!contact_rate_limit_allows_request()) contact_respond('limit');

$name = contact_field('isim', 180, true);
$email = contact_field('eposta', 254, true);
$message = contact_field('mesaj', 5000, false);
$commercialEmailConsent = contact_field('ticari_iletisim_onayi', 20, false);
$locale = contact_field('locale', 2, false) === 'en' ? 'en' : 'tr';
$fieldErrors = [];
if (preg_match("/^[\\p{L}][\\p{L}' -]*$/u", $name) !== 1) {
    $fieldErrors['isim'] = '*İsim yalnızca harf, boşluk, kesme işareti ve kısa çizgi içerebilir.';
}
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || preg_match('/[\r\n]/', $email) === 1) {
    $fieldErrors['eposta'] = '*Geçersiz e-posta adresi.';
}
if ($commercialEmailConsent !== '' && $commercialEmailConsent !== 'onaylandi') {
    $fieldErrors['ticari_iletisim_onayi'] = '*Ticari elektronik ileti tercihi geçerli değildir.';
}
if ($fieldErrors !== []) contact_respond('dogrulama', $fieldErrors);

$fields = [
    ['İsim soyisim', $name],
    ['E-posta', $email],
    ['Mesaj', $message !== '' ? $message : 'Belirtilmedi'],
];
$rows = array_map(
    static fn (array $field): string => contact_email_row($field[0], $field[1]),
    $fields,
);
$htmlBody = '<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,sans-serif">'
    . '<table role="presentation" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb">'
    . '<tr><td style="padding:24px;background:#14213d;color:#fff"><h1 style="margin:0;font-size:22px">Yeni iletişim mesajı</h1>'
    . '<p style="margin:8px 0 0;color:#cbd5e1">Kalite Filo web sitesi</p></td></tr>'
    . '<tr><td style="padding:16px 20px"><table style="width:100%;border-collapse:collapse">'
    . implode('', $rows)
    . '</table></td></tr></table></body></html>';
$textBody = "Yeni iletişim mesajı\nKalite Filo web sitesi\n\n" . implode(
    "\n",
    array_map(static fn (array $field): string => $field[0] . ': ' . $field[1], $fields),
);

$sent = kalite_filo_send_email([
    'subject' => 'Yeni iletişim mesajı - ' . $name,
    'html_body' => $htmlBody,
    'text_body' => $textBody,
    'reply_to_address' => $email,
    'reply_to_name' => $name,
], 'contact');
if ($sent) {
    try {
        kalite_filo_store_form_contact($email, 'website_contact_form');
        if ($commercialEmailConsent === 'onaylandi') {
            kalite_filo_store_commercial_email_consent($email, 'website_contact_form');
        }
    } catch (Throwable $exception) {
        error_log('Kalite Filo contact storage failed: ' . $exception->getMessage());
    }
    if (!kalite_filo_send_customer_confirmation($email, $name, 'contact', $commercialEmailConsent === 'onaylandi', $locale)) {
        error_log('Kalite Filo contact confirmation delivery failed.');
    }
}
contact_respond($sent ? 'basarili' : 'gonderilemedi');
