<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/customer-mailer.php';

function assert_customer_mail(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

$_SERVER['HTTP_ORIGIN'] = 'https://staging.kalitefilo.com.tr';
unset($_SERVER['HTTP_REFERER']);
assert_customer_mail(
    kalite_filo_customer_mail_origin() === 'https://staging.kalitefilo.com.tr',
    'The allowlisted staging origin must be retained.',
);

$_SERVER['HTTP_ORIGIN'] = 'https://example.invalid';
$_SERVER['HTTP_REFERER'] = 'https://staging.kalitefilo.com.tr/iletisim/';
assert_customer_mail(
    kalite_filo_customer_mail_origin() === 'https://staging.kalitefilo.com.tr',
    'An allowlisted staging referer must be used when Origin is unavailable.',
);

$_SERVER['HTTP_ORIGIN'] = 'https://example.invalid';
$_SERVER['HTTP_REFERER'] = 'https://example.invalid/phishing';
assert_customer_mail(
    kalite_filo_customer_mail_origin() === 'https://kalitefilo.com.tr',
    'An untrusted request must fall back to the production origin.',
);

$vehicles = kalite_filo_welcome_vehicles('tr', 'https://staging.kalitefilo.com.tr');
assert_customer_mail(
    str_starts_with($vehicles[0]['href'], 'https://staging.kalitefilo.com.tr/arac-listesi/'),
    'Vehicle links must use the selected deployment origin.',
);
assert_customer_mail($vehicles[0]['image'] === 'cid:kf-vehicle-clio', 'Vehicle images must use CID URLs.');

$articles = kalite_filo_welcome_articles('tr', 'https://staging.kalitefilo.com.tr');
assert_customer_mail(
    str_starts_with($articles[0]['href'], 'https://staging.kalitefilo.com.tr/filo-rehberi/'),
    'Article links must use the selected deployment origin.',
);
assert_customer_mail(str_starts_with($articles[0]['image'], 'cid:'), 'Article images must use CID URLs.');

$card = kalite_filo_welcome_card($vehicles[0], 'Aracı İncele');
assert_customer_mail(substr_count($card, '<a href=') === 1, 'The whole card must use one valid link.');
assert_customer_mail(str_contains($card, '<span style='), 'The visual CTA must not create a nested link.');

$socialSection = kalite_filo_customer_mail_social_section(false);
assert_customer_mail(substr_count($socialSection, '<a href=') === 6, 'Every verified social account must be linked.');
assert_customer_mail(str_contains($socialSection, 'Kalite Filo’yu Takip Edin'), 'The Turkish social heading is missing.');
assert_customer_mail(!str_contains($socialSection, ':hover'), 'The social section must not depend on hover support.');

foreach ([
    'images/brand/kalite-filo-logo.png',
    'images/vehicles/cards/renault-clio.jpg',
    'images/vehicles/cards/hyundai-i20.jpg',
    'images/filo-rehberi/01-operasyonel-arac-kiralama.webp',
    'images/filo-rehberi/02-filo-tco-maliyet.webp',
] as $asset) {
    assert_customer_mail(is_file(kalite_filo_customer_mail_asset($asset)), "Missing embedded image asset: {$asset}");
}

echo "customer-mailer tests passed\n";
