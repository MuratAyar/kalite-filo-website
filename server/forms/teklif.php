<?php
declare(strict_types=1);

require_once __DIR__ . '/quote-mailer.php';

const MAX_BODY_BYTES = 32768;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function request_wants_json(): bool
{
    $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));
    return str_contains($accept, 'application/json');
}

function respond_result(string $result, ?string $quoteNumber = null, array $fieldErrors = []): never
{
    if (request_wants_json()) {
        $status = $result === 'basarili' ? 200 : ($result === 'dogrulama' ? 422 : 503);
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(
            ['result' => $result, 'quoteNumber' => $quoteNumber, 'fieldErrors' => $fieldErrors],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE,
        );
        exit;
    }

    header('Location: /teklif-al/?sonuc=' . rawurlencode($result), true, 303);
    exit;
}

function create_quote_number(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $bytes = random_bytes(10);
    $number = '';
    for ($index = 0; $index < 10; $index++) {
        $number .= $alphabet[ord($bytes[$index]) % strlen($alphabet)];
    }
    return $number;
}

function reject_request(int $status): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'İstek işlenemedi.';
    exit;
}

function normalized_field(string $name, int $maxBytes, bool $required = false): string
{
    $value = $_POST[$name] ?? '';
    if (!is_string($value)) {
        respond_result('dogrulama', null, [$name => '*Bu alan geçerli formatta doldurulmalıdır.']);
    }

    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $value = preg_replace('/[\t ]+/u', ' ', trim($value)) ?? '';

    if (($required && $value === '') || strlen($value) > $maxBytes) {
        respond_result('dogrulama', null, [$name => $value === '' ? '*Bu alan boş bırakılamaz.' : '*Bu alan geçerli formatta doldurulmalıdır.']);
    }

    return $value;
}

function validated_integer(string $name, int $minimum, int $maximum): int
{
    $value = filter_input(INPUT_POST, $name, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => $minimum, 'max_range' => $maximum],
    ]);

    if (!is_int($value)) {
        respond_result('dogrulama', null, [$name => '*Bu alan izin verilen sayı aralığında olmalıdır.']);
    }

    return $value;
}

function digits_only(string $value): string
{
    return preg_replace('/\D+/', '', $value) ?? '';
}

function is_valid_turkish_identity_number(string $value): bool
{
    if (preg_match('/^[1-9][0-9]{10}$/', $value) !== 1) {
        return false;
    }

    $digits = array_map('intval', str_split($value));
    $oddTotal = $digits[0] + $digits[2] + $digits[4] + $digits[6] + $digits[8];
    $evenTotal = $digits[1] + $digits[3] + $digits[5] + $digits[7];
    $tenth = (($oddTotal * 7) - $evenTotal) % 10;
    if ($tenth < 0) {
        $tenth += 10;
    }

    return $digits[9] === $tenth
        && $digits[10] === array_sum(array_slice($digits, 0, 10)) % 10;
}

function request_origin_is_allowed(): bool
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
    if (!is_string($scheme) || !is_string($host)) {
        return false;
    }

    return in_array($scheme . '://' . $host, $allowedOrigins, true);
}

function rate_limit_allows_request(): bool
{
    $remoteAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = hash('sha256', 'kalite-filo-quote-v1|' . (is_string($remoteAddress) ? $remoteAddress : 'unknown'));
    $filePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'kf-quote-' . $key . '.json';
    $handle = @fopen($filePath, 'c+');

    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) {
            fclose($handle);
        }
        return false;
    }

    $now = time();
    $contents = stream_get_contents($handle);
    $timestamps = is_string($contents) ? json_decode($contents, true) : [];
    if (!is_array($timestamps)) {
        $timestamps = [];
    }
    $timestamps = array_values(array_filter(
        $timestamps,
        static fn ($timestamp): bool => is_int($timestamp) && $timestamp > $now - RATE_LIMIT_WINDOW_SECONDS,
    ));

    $allowed = count($timestamps) < RATE_LIMIT_MAX_ATTEMPTS;
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

function email_row(string $label, string $value): string
{
    return '<tr><th style="padding:10px 12px;text-align:left;vertical-align:top;color:#657087;font-weight:600;border-bottom:1px solid #e5e7eb;width:34%">'
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
    reject_request(405);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength <= 0 || $contentLength > MAX_BODY_BYTES) {
    reject_request(413);
}

$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if (!str_starts_with($contentType, 'application/x-www-form-urlencoded')) {
    reject_request(415);
}

if (!request_origin_is_allowed()) {
    reject_request(403);
}

if (normalized_field('website', 200) !== '') {
    respond_result('basarili', create_quote_number());
}

if (!rate_limit_allows_request()) {
    respond_result('limit');
}

$formType = normalized_field('form_turu', 16, true);
if ($formType !== 'kurumsal' && $formType !== 'bireysel' && $formType !== 'sepet') {
    respond_result('dogrulama');
}

$isCart = $formType === 'sepet';
$isCorporate = $formType === 'kurumsal' || $isCart;
$firstName = normalized_field('ad', 160, true);
$lastName = normalized_field('soyad', 160, true);
$countryCode = digits_only(normalized_field('ulke_kodu', 4, true));
$phone = normalized_field('telefon', 32, true);
$email = normalized_field('eposta', 254, true);
$title = normalized_field('unvan', 240, false);
$identityNumber = digits_only(normalized_field('tc_kimlik_no', 11, !$isCorporate));

$city = normalized_field('il', 160, $isCorporate);
$district = normalized_field('ilce', 160, $isCorporate);
$companyWebsite = normalized_field('firma_web_sitesi', 400, false);
$companyType = normalized_field('sirket_tipi', 160, $isCorporate);
$companyTitle = normalized_field('sirket_unvani', 400, $isCorporate);
$taxCity = normalized_field('vergi_dairesi_ili', 160, $isCorporate);
$taxOffice = normalized_field('vergi_dairesi', 240, $isCorporate);
$taxNumber = digits_only(normalized_field('vergi_numarasi', 10, $isCorporate));

$vehicleMake = normalized_field('arac_markasi', 200, !$isCart);
$vehicleModel = normalized_field('arac_modeli', 240, !$isCart);
$note = normalized_field('not', 4000, false);
$campaignCode = normalized_field('kampanya_kodu', 120, false);
$duration = $isCart ? 0 : validated_integer('kiralama_suresi', 12, 120);
$vehicleCount = $isCart ? 0 : validated_integer('arac_sayisi', 1, 999);
$annualDistance = $isCart ? 0 : validated_integer('yillik_km', 1000, 500000);
$cartItems = [];

if ($isCart) {
    $cartJson = normalized_field('sepet_json', 20000, true);
    try {
        $decodedCart = json_decode($cartJson, true, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        respond_result('dogrulama', null, ['sepet' => '*Sepet bilgileri geçerli değil. Lütfen araçları yeniden ekleyiniz.']);
    }
    if (!is_array($decodedCart) || count($decodedCart) < 1 || count($decodedCart) > 32) {
        respond_result('dogrulama', null, ['sepet' => '*Teklif göndermek için sepetinizde en az bir araç bulunmalıdır.']);
    }
    foreach ($decodedCart as $item) {
        if (!is_array($item)) {
            respond_result('dogrulama', null, ['sepet' => '*Sepet bilgileri geçerli değil.']);
        }
        $make = trim((string) ($item['make'] ?? ''));
        $model = trim((string) ($item['model'] ?? ''));
        $trim = trim((string) ($item['trim'] ?? ''));
        $slug = trim((string) ($item['slug'] ?? ''));
        $itemDuration = filter_var($item['durationMonths'] ?? null, FILTER_VALIDATE_INT);
        $itemDistance = filter_var($item['annualKilometres'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
        if (
            $make === '' || strlen($make) > 100 || $model === '' || strlen($model) > 120
            || strlen($trim) > 200 || preg_match('/^[a-z0-9-]+$/', $slug) !== 1
            || !in_array($itemDuration, [12, 18, 24, 30, 36], true)
            || !in_array($itemDistance, [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000], true)
            || !is_int($quantity) || $quantity < 1 || $quantity > 99
        ) {
            respond_result('dogrulama', null, ['sepet' => '*Sepetteki araç bilgilerinden biri geçerli değil.']);
        }
        $cartItems[] = [
            'make' => $make, 'model' => $model, 'trim' => $trim, 'slug' => $slug,
            'duration' => $itemDuration, 'distance' => $itemDistance, 'quantity' => $quantity,
        ];
    }
}

$phoneDigits = digits_only($phone);
if ($countryCode === '90' && strlen($phoneDigits) === 11 && str_starts_with($phoneDigits, '0')) {
    $phoneDigits = substr($phoneDigits, 1);
}
if ($countryCode === '90' && strlen($phoneDigits) === 12 && str_starts_with($phoneDigits, '90')) {
    $phoneDigits = substr($phoneDigits, 2);
}

$allowedCountryCodes = [
    '1', '7', '30', '31', '32', '33', '34', '39', '40', '41', '43', '44', '49',
    '90', '359', '380', '966', '971', '994', '995',
];
$internationalPhone = $countryCode . $phoneDigits;

$fieldErrors = [];
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || preg_match('/[\r\n]/', $email) === 1) {
    $fieldErrors['eposta'] = '*Geçersiz e-posta adresi.';
}
if (preg_match("/^[\\p{L}][\\p{L}' -]*$/u", $firstName) !== 1) {
    $fieldErrors['ad'] = '*Ad yalnızca harf, boşluk, kesme işareti ve kısa çizgi içerebilir.';
}
if (preg_match("/^[\\p{L}][\\p{L}' -]*$/u", $lastName) !== 1) {
    $fieldErrors['soyad'] = '*Soyad yalnızca harf, boşluk, kesme işareti ve kısa çizgi içerebilir.';
}
if (
    !in_array($countryCode, $allowedCountryCodes, true)
    || preg_match('/^[0-9]{6,14}$/', $phoneDigits) !== 1
    || strlen($internationalPhone) > 15
) {
    $fieldErrors['telefon'] = '*Geçerli bir telefon numarası giriniz.';
}
if (!$isCorporate && !is_valid_turkish_identity_number($identityNumber)) {
    $fieldErrors['tc_kimlik_no'] = '*Geçerli bir T.C. kimlik numarası giriniz.';
}
if ($isCorporate && preg_match('/^[0-9]{10}$/', $taxNumber) !== 1) {
    $fieldErrors['vergi_numarasi'] = '*Vergi numarası 10 rakamdan oluşmalıdır.';
}
if ($fieldErrors !== []) {
    respond_result('dogrulama', null, $fieldErrors);
}

$quoteNumber = create_quote_number();
$emailFields = [
    ['Teklif numarası', $quoteNumber],
    ['Teklif türü', $isCart ? 'Sepet' : ($isCorporate ? 'Kurumsal' : 'Bireysel')],
    ['Ad soyad', $firstName . ' ' . $lastName],
    ['Telefon', '+' . $countryCode . ' ' . $phoneDigits],
    ['E-posta', $email],
];

if ($isCorporate) {
    $emailFields[] = ['Unvan', $title !== '' ? $title : 'Belirtilmedi'];
    $emailFields[] = ['İl / İlçe', $city . ' / ' . $district];
    $emailFields[] = ['Firma web sitesi', $companyWebsite !== '' ? $companyWebsite : 'Belirtilmedi'];
    $emailFields[] = ['Şirket tipi', $companyType];
    $emailFields[] = ['Şirket unvanı', $companyTitle];
    $emailFields[] = ['Vergi dairesi', $taxCity . ' / ' . $taxOffice];
    $emailFields[] = ['Vergi numarası', $taxNumber];
} else {
    $emailFields[] = ['T.C. kimlik numarası', $identityNumber];
}

if ($isCart) {
    foreach ($cartItems as $index => $item) {
        $emailFields[] = [
            'Sepet aracı ' . ($index + 1),
            $item['make'] . ' ' . $item['model'] . ($item['trim'] !== '' ? ' — ' . $item['trim'] : '')
            . "\n" . $item['duration'] . ' ay · ' . number_format($item['distance'], 0, ',', '.') . ' km/yıl · ' . $item['quantity'] . ' adet',
        ];
    }
} else {
    $emailFields[] = ['Araç markası', $vehicleMake];
    $emailFields[] = ['Araç modeli', $vehicleModel];
    $emailFields[] = ['Araç sayısı', (string) $vehicleCount];
    $emailFields[] = ['Kiralama süresi', (string) $duration . ' ay'];
    $emailFields[] = ['Yıllık kilometre', number_format($annualDistance, 0, ',', '.') . ' km'];
}
$emailFields[] = ['Not', $note !== '' ? $note : 'Belirtilmedi'];
if (!$isCorporate) {
    $emailFields[] = ['Kampanya kodu', $campaignCode !== '' ? $campaignCode : 'Belirtilmedi'];
}

$rows = array_map(
    static fn (array $field): string => email_row($field[0], $field[1]),
    $emailFields,
);
$body = '<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,sans-serif">'
    . '<table role="presentation" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb">'
    . '<tr><td style="padding:24px;background:#14213d;color:#fff"><h1 style="margin:0;font-size:22px">Yeni teklif talebi</h1>'
    . '<p style="margin:8px 0 0;color:#cbd5e1">Kalite Filo web sitesi</p></td></tr>'
    . '<tr><td style="padding:16px 20px"><table style="width:100%;border-collapse:collapse">'
    . implode('', $rows)
    . '</table></td></tr></table></body></html>';

$subjectText = 'Yeni teklif talebi ' . $quoteNumber . ' - ' . $firstName . ' ' . $lastName;
$plainBody = "Yeni teklif talebi\nKalite Filo web sitesi\n\n" . implode(
    "\n",
    array_map(
        static fn (array $field): string => $field[0] . ': ' . $field[1],
        $emailFields,
    ),
);

$sent = kalite_filo_send_quote_email([
    'subject' => $subjectText,
    'html_body' => $body,
    'text_body' => $plainBody,
    'reply_to_address' => $email,
    'reply_to_name' => $firstName . ' ' . $lastName,
]);
respond_result($sent ? 'basarili' : 'gonderilemedi', $sent ? $quoteNumber : null);
