<?php
declare(strict_types=1);

require_once __DIR__ . '/subscriber-store.php';
require_once __DIR__ . '/customer-mailer.php';

const NEWSLETTER_CONSENT_VERSION = '2026-08-28-v2';
const NEWSLETTER_MAX_BODY_BYTES = 4096;

function newsletter_respond(string $result, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['result' => $result], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function newsletter_origin_is_allowed(): bool
{
    $allowed = ['https://kalitefilo.com.tr', 'https://staging.kalitefilo.com.tr'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (is_string($origin) && in_array($origin, $allowed, true)) return true;
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if (!is_string($referer) || $referer === '') return false;
    $scheme = parse_url($referer, PHP_URL_SCHEME);
    $host = parse_url($referer, PHP_URL_HOST);
    return is_string($scheme) && is_string($host) && in_array($scheme . '://' . $host, $allowed, true);
}

header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    newsletter_respond('method_not_allowed', 405);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > NEWSLETTER_MAX_BODY_BYTES) newsletter_respond('too_large', 413);
if (!str_starts_with(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'application/x-www-form-urlencoded')) {
    newsletter_respond('unsupported_media', 415);
}
if (!newsletter_origin_is_allowed()) newsletter_respond('forbidden', 403);
if (trim((string) ($_POST['website'] ?? '')) !== '') newsletter_respond('basarili');

$email = strtolower(trim((string) ($_POST['email'] ?? '')));
$consent = (string) ($_POST['consent'] ?? '');
$version = (string) ($_POST['consent_text_version'] ?? '');
$locale = (string) ($_POST['locale'] ?? 'tr');
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || preg_match('/[\r\n]/', $email) === 1) {
    newsletter_respond('gecersiz_email', 422);
}
if ($consent !== 'onaylandi' || $version !== NEWSLETTER_CONSENT_VERSION) {
    newsletter_respond('onay_gerekli', 422);
}

try {
    kalite_filo_store_contact([
        'email' => $email,
        'status' => 'approved',
        'consent_source' => 'website_newsletter',
        'consent_text_version' => NEWSLETTER_CONSENT_VERSION,
        'consent_at' => gmdate('Y-m-d H:i:s'),
        'iys_status' => 'pending',
        'recipient_type' => 'BIREYSEL',
    ]);
} catch (Throwable $exception) {
    error_log('Kalite Filo newsletter storage failed: ' . $exception->getMessage());
    newsletter_respond('kayit_hatasi', 500);
}
if (!kalite_filo_send_customer_confirmation($email, '', 'newsletter', true, $locale)) {
    error_log('Kalite Filo newsletter confirmation delivery failed.');
}
newsletter_respond('basarili');
