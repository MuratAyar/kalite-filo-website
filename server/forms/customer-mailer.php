<?php
declare(strict_types=1);

require_once __DIR__ . '/quote-mailer.php';

function kalite_filo_customer_mail_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function kalite_filo_customer_mail_origin(): string
{
    $allowed = [
        'https://kalitefilo.com.tr',
        'https://staging.kalitefilo.com.tr',
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (is_string($origin) && in_array($origin, $allowed, true)) return $origin;

    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if (is_string($referer) && $referer !== '') {
        $scheme = parse_url($referer, PHP_URL_SCHEME);
        $host = parse_url($referer, PHP_URL_HOST);
        $candidate = is_string($scheme) && is_string($host) ? $scheme . '://' . $host : '';
        if (in_array($candidate, $allowed, true)) return $candidate;
    }

    return 'https://kalitefilo.com.tr';
}

function kalite_filo_customer_mail_asset(string $relativePath): string
{
    $relativePath = ltrim($relativePath, '/');
    $deployedPath = dirname(__DIR__) . '/' . $relativePath;
    if (is_file($deployedPath)) return $deployedPath;

    return dirname(__DIR__, 2) . '/public/' . $relativePath;
}

/** @return list<array{label: string, mark: string, href: string}> */
function kalite_filo_customer_mail_social_links(): array
{
    return [
        ['label' => 'Facebook', 'mark' => 'f', 'href' => 'https://www.facebook.com/share/1GXNob81Eb/?mibextid=wwXIfr'],
        ['label' => 'Instagram', 'mark' => '◎', 'href' => 'https://www.instagram.com/kalitefilo?igsi=MTI4MWRpaXJ0ZXUxNg%3D%3D&utm_source=qr'],
        ['label' => 'Threads', 'mark' => '@', 'href' => 'https://www.threads.com/@kalitefilo?igshid=NTc4MTIwNjQ2YQ=='],
        ['label' => 'TikTok', 'mark' => '♪', 'href' => 'https://www.tiktok.com/@kalitefilo?_r=1&_t=ZS-99DAihq1RaO'],
        ['label' => 'X', 'mark' => 'X', 'href' => 'https://x.com/kalitefilo?s=11'],
        ['label' => 'Pinterest', 'mark' => 'P', 'href' => 'https://pin.it/7v4phb43o'],
    ];
}

function kalite_filo_customer_mail_social_section(bool $english): string
{
    $cells = [];
    foreach (kalite_filo_customer_mail_social_links() as $social) {
        $cells[] = '<td width="33.33%" style="padding:5px;vertical-align:top">'
            . '<a href="' . kalite_filo_customer_mail_escape($social['href']) . '" target="_blank" style="display:block;padding:10px 6px;border:1px solid #34415c;border-radius:8px;color:#ffffff;text-align:center;text-decoration:none">'
            . '<span style="display:inline-block;width:24px;height:24px;border-radius:12px;background:#ffb343;color:#182136;font-size:14px;font-weight:700;line-height:24px;text-align:center;vertical-align:middle">' . kalite_filo_customer_mail_escape($social['mark']) . '</span>'
            . '<span style="display:inline-block;padding-left:6px;color:#ffffff;font-size:12px;font-weight:700;line-height:24px;vertical-align:middle">' . kalite_filo_customer_mail_escape($social['label']) . '</span>'
            . '</a></td>';
    }

    $rows = '';
    foreach (array_chunk($cells, 3) as $row) $rows .= '<tr>' . implode('', $row) . '</tr>';

    return '<table role="presentation" style="width:100%;margin-top:32px;border-collapse:separate;border-spacing:0;background:#182136;border-radius:12px">'
        . '<tr><td style="padding:24px 20px 6px;text-align:center">'
        . '<h2 style="margin:0;color:#ffffff;font-size:19px;line-height:1.35">' . ($english ? 'Follow Kalite Filo' : 'Kalite Filo’yu Takip Edin') . '</h2>'
        . '<p style="margin:8px 0 0;color:#b8c2d6;font-size:13px;line-height:1.5">' . ($english ? 'Stay connected with us on social media.' : 'Sosyal medya hesaplarımızdan bizi takip edebilirsiniz.') . '</p>'
        . '</td></tr><tr><td style="padding:10px 15px 19px"><table role="presentation" style="width:100%;border-collapse:collapse">'
        . $rows . '</table></td></tr></table>';
}

/** @return list<array{title: string, subtitle: string, image: string, href: string}> */
function kalite_filo_welcome_vehicles(string $locale, string $origin): array
{
    $english = $locale === 'en';
    return [
        [
            'title' => 'Renault Clio',
            'subtitle' => 'Evolution 1.0 TCe X-Tronic 90',
            'image' => 'cid:kf-vehicle-clio',
            'href' => $origin . '/' . ($english ? 'en/vehicles/' : 'arac-listesi/') . 'renault-clio-evolution-1-0-tce-x-tronic-90/',
        ],
        [
            'title' => 'Hyundai i20',
            'subtitle' => '1.0 T-GDI 90 7DCT Jump',
            'image' => 'cid:kf-vehicle-i20',
            'href' => $origin . '/' . ($english ? 'en/vehicles/' : 'arac-listesi/') . 'hyundai-i20-1-0-t-gdi-90-7dct-jump/',
        ],
    ];
}

/** @return list<array{title: string, subtitle: string, image: string, href: string}> */
function kalite_filo_welcome_articles(string $locale, string $origin): array
{
    if ($locale === 'en') {
        return [
            [
                'title' => 'What Is Operational Vehicle Leasing?',
                'subtitle' => 'A comprehensive guide for companies',
                'image' => 'cid:kf-article-operational-leasing',
                'href' => $origin . '/en/fleet-guide/long-term-leasing/what-is-operational-vehicle-leasing/',
            ],
            [
                'title' => 'How to Calculate Fleet Costs',
                'subtitle' => 'Seeing the true cost with TCO',
                'image' => 'cid:kf-article-tco',
                'href' => $origin . '/en/fleet-guide/cost-and-finance/calculating-fleet-total-cost-of-ownership/',
            ],
        ];
    }

    return [
        [
            'title' => 'Operasyonel Araç Kiralama Nedir?',
            'subtitle' => 'Şirketler için kapsamlı rehber',
            'image' => 'cid:kf-article-operational-leasing',
            'href' => $origin . '/filo-rehberi/uzun-donem-kiralama/operasyonel-arac-kiralama-nedir/',
        ],
        [
            'title' => 'Filo Maliyetleri Nasıl Hesaplanır?',
            'subtitle' => 'TCO ile gerçek araç maliyetini görmek',
            'image' => 'cid:kf-article-tco',
            'href' => $origin . '/filo-rehberi/maliyet-ve-finans/filo-toplam-sahip-olma-maliyeti-tco/',
        ],
    ];
}

/** @param array{title: string, subtitle: string, image: string, href: string} $item */
function kalite_filo_welcome_card(array $item, string $action): string
{
    return '<td style="width:50%;padding:8px;vertical-align:top">'
        . '<a href="' . kalite_filo_customer_mail_escape($item['href']) . '" style="display:block;height:100%;color:#182136;text-decoration:none">'
        . '<table role="presentation" style="width:100%;height:100%;border-collapse:collapse;border:1px solid #d8dee9;border-radius:12px;overflow:hidden;background:#ffffff">'
        . '<tr><td><img alt="" src="' . kalite_filo_customer_mail_escape($item['image']) . '" style="display:block;width:100%;height:132px;object-fit:cover"></td></tr>'
        . '<tr><td style="padding:16px"><h3 style="margin:0;color:#182136;font-size:17px;line-height:1.3">' . kalite_filo_customer_mail_escape($item['title']) . '</h3>'
        . '<p style="margin:8px 0 16px;color:#657087;font-size:13px;line-height:1.5">' . kalite_filo_customer_mail_escape($item['subtitle']) . '</p>'
        . '<span style="display:inline-block;padding:10px 14px;border-radius:8px;background:#ffb343;color:#182136;font-size:13px;font-weight:700">' . kalite_filo_customer_mail_escape($action) . '</span>'
        . '</td></tr></table></a></td>';
}

/**
 * @param 'contact'|'newsletter'|'quote' $kind
 */
function kalite_filo_send_customer_confirmation(
    string $email,
    string $name,
    string $kind,
    bool $commercialConsent,
    string $locale = 'tr',
    ?string $reference = null,
): bool {
    $locale = $locale === 'en' ? 'en' : 'tr';
    $english = $locale === 'en';
    $safeName = trim($name) !== '' ? trim($name) : ($english ? 'Valued Visitor' : 'Değerli Ziyaretçimiz');

    $subject = match ($kind) {
        'newsletter' => $english ? 'Welcome to the Kalite Filo newsletter' : 'Kalite Filo e-bültenine hoş geldiniz',
        'quote' => $english ? 'We have received your quotation request' : 'Teklif talebinizi aldık',
        default => $english ? 'We have received your message' : 'Mesajınızı aldık',
    };
    $lead = match ($kind) {
        'newsletter' => $english
            ? 'Your newsletter subscription and commercial email consent have been received.'
            : 'E-bülten kaydınız ve ticari elektronik ileti onayınız alınmıştır.',
        'quote' => $english
            ? 'Thank you for contacting Kalite Filo. Our team will review your quotation request and contact you.'
            : 'Kalite Filo ile iletişime geçtiğiniz için teşekkür ederiz. Ekibimiz teklif talebinizi inceleyerek sizinle iletişime geçecektir.',
        default => $english
            ? 'Thank you for contacting Kalite Filo. Your message has reached our team.'
            : 'Kalite Filo ile iletişime geçtiğiniz için teşekkür ederiz. Mesajınız ekibimize ulaşmıştır.',
    };
    $showHighlights = $kind === 'newsletter' || $commercialConsent;
    $origin = kalite_filo_customer_mail_origin();
    $homeUrl = $origin . ($english ? '/en/' : '/');
    $privacyUrl = $origin . ($english ? '/en/privacy-notice/' : '/aydinlatma-metni/');
    $unsubscribeUrl = 'mailto:contact@kalitefilo.com.tr?subject=' . rawurlencode($english ? 'Unsubscribe from commercial emails' : 'Ticari elektronik ileti aboneliğinden çıkış');

    $html = '<!doctype html><html lang="' . $locale . '"><body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;color:#182136">'
        . '<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 12px">'
        . '<table role="presentation" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #d8dee9">'
        . '<tr><td style="padding:22px;background:#182136;text-align:center"><table role="presentation" style="margin:0 auto;border-collapse:separate;border-spacing:0"><tr><td style="padding:12px 22px;border-bottom:3px solid #ffb343;border-radius:10px;background:#ffffff;text-align:center">'
        . '<a href="' . $homeUrl . '" style="display:inline-block;text-decoration:none"><img alt="Kalite Filo" src="cid:kf-brand-logo" width="210" style="display:block;width:210px;max-width:100%;height:auto;margin:0 auto;border:0"></a>'
        . '</td></tr></table></td></tr>'
        . '<tr><td style="padding:32px 28px"><p style="margin:0 0 12px;color:#014499;font-size:14px;font-weight:700">' . kalite_filo_customer_mail_escape($english ? 'WELCOME' : 'HOŞ GELDİNİZ') . '</p>'
        . '<h1 style="margin:0;color:#182136;font-size:26px;line-height:1.25">' . kalite_filo_customer_mail_escape($english ? "Hello {$safeName}," : "Merhaba {$safeName},") . '</h1>'
        . '<p style="margin:18px 0 0;color:#4c5870;font-size:16px;line-height:1.7">' . kalite_filo_customer_mail_escape($lead) . '</p>';

    if ($reference !== null && trim($reference) !== '') {
        $html .= '<p style="margin:18px 0 0;padding:14px 16px;border-left:4px solid #ffb343;background:#f5f7fa;color:#182136;font-size:14px">'
            . kalite_filo_customer_mail_escape(($english ? 'Reference: ' : 'Referans: ') . $reference) . '</p>';
    }

    if ($showHighlights) {
        $vehicleCards = array_map(
            static fn (array $item): string => kalite_filo_welcome_card($item, $english ? 'View Vehicle' : 'Aracı İncele'),
            kalite_filo_welcome_vehicles($locale, $origin),
        );
        $articleCards = array_map(
            static fn (array $item): string => kalite_filo_welcome_card($item, $english ? 'Read Article' : 'Yazıyı Oku'),
            kalite_filo_welcome_articles($locale, $origin),
        );
        $html .= '<h2 style="margin:32px 0 8px;color:#182136;font-size:21px">' . ($english ? 'Featured Vehicles of the Week' : 'Haftanın Öne Çıkan Araçları') . '</h2>'
            . '<table role="presentation" style="width:100%;margin:0 -8px;border-collapse:collapse"><tr>' . implode('', $vehicleCards) . '</tr></table>'
            . '<h2 style="margin:32px 0 8px;color:#182136;font-size:21px">' . ($english ? 'From the Fleet Guide' : 'Filo Rehberi’nden') . '</h2>'
            . '<table role="presentation" style="width:100%;margin:0 -8px;border-collapse:collapse"><tr>' . implode('', $articleCards) . '</tr></table>'
            . kalite_filo_customer_mail_social_section($english);
    }

    $html .= '<p style="margin:32px 0 0;color:#657087;font-size:13px;line-height:1.6">'
        . ($english ? 'You can review how we process personal data in our ' : 'Kişisel verilerinizi nasıl işlediğimizi ')
        . '<a href="' . $privacyUrl . '" style="color:#014499">' . ($english ? 'Privacy Notice' : 'Aydınlatma Metni') . '</a>'
        . ($english ? '.' : ' üzerinden inceleyebilirsiniz.') . '</p>';
    if ($showHighlights) {
        $html .= '<p style="margin:12px 0 0;color:#657087;font-size:13px;line-height:1.6">'
            . ($english ? 'To stop receiving commercial emails, ' : 'Ticari elektronik ileti aboneliğinizi sonlandırmak için ')
            . '<a href="' . $unsubscribeUrl . '" style="color:#014499">' . ($english ? 'send us an unsubscribe request' : 'çıkış talebinizi iletin') . '</a>.</p>';
    }
    $html .= '</td></tr><tr><td style="padding:20px 28px;background:#182136;color:#b8c2d6;font-size:12px;line-height:1.6">'
        . ($english ? 'This message was sent automatically by Kalite Filo. Please do not reply.' : 'Bu ileti Kalite Filo tarafından otomatik gönderilmiştir. Lütfen bu e-postayı yanıtlamayın.')
        . '</td></tr></table></td></tr></table></body></html>';

    $text = ($english ? "Hello {$safeName},\n\n" : "Merhaba {$safeName},\n\n") . $lead;
    if ($reference !== null && trim($reference) !== '') $text .= "\n" . ($english ? 'Reference: ' : 'Referans: ') . $reference;
    if ($showHighlights) {
        $text .= "\n\n" . ($english ? 'Featured vehicles and Fleet Guide: ' : 'Öne çıkan araçlar ve Filo Rehberi: ') . $homeUrl;
        $text .= "\n" . ($english ? 'Unsubscribe: ' : 'Abonelikten çıkış: ') . $unsubscribeUrl;
    }
    $text .= "\n\n" . ($english ? 'Privacy Notice: ' : 'Aydınlatma Metni: ') . $privacyUrl;

    return kalite_filo_send_customer_email([
        'subject' => $subject,
        'html_body' => $html,
        'text_body' => $text,
        'embedded_images' => [
            ['path' => kalite_filo_customer_mail_asset('images/brand/kalite-filo-logo.png'), 'cid' => 'kf-brand-logo', 'name' => 'kalite-filo-logo.png'],
            ['path' => kalite_filo_customer_mail_asset('images/vehicles/cards/renault-clio.jpg'), 'cid' => 'kf-vehicle-clio', 'name' => 'renault-clio.jpg'],
            ['path' => kalite_filo_customer_mail_asset('images/vehicles/cards/hyundai-i20.jpg'), 'cid' => 'kf-vehicle-i20', 'name' => 'hyundai-i20.jpg'],
            ['path' => kalite_filo_customer_mail_asset('images/filo-rehberi/01-operasyonel-arac-kiralama.webp'), 'cid' => 'kf-article-operational-leasing', 'name' => 'operasyonel-arac-kiralama.webp'],
            ['path' => kalite_filo_customer_mail_asset('images/filo-rehberi/02-filo-tco-maliyet.webp'), 'cid' => 'kf-article-tco', 'name' => 'filo-tco-maliyet.webp'],
        ],
    ], $email, $safeName);
}
