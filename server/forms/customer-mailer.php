<?php
declare(strict_types=1);

require_once __DIR__ . '/quote-mailer.php';

function kalite_filo_customer_mail_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** @return list<array{title: string, subtitle: string, image: string, href: string}> */
function kalite_filo_welcome_vehicles(string $locale): array
{
    $english = $locale === 'en';
    return [
        [
            'title' => 'Renault Clio',
            'subtitle' => 'Evolution 1.0 TCe X-Tronic 90',
            'image' => 'https://kalitefilo.com.tr/images/vehicles/cards/renault-clio.jpg',
            'href' => 'https://kalitefilo.com.tr/' . ($english ? 'en/vehicles/' : 'arac-listesi/') . 'renault-clio-evolution-1-0-tce-x-tronic-90/',
        ],
        [
            'title' => 'Hyundai i20',
            'subtitle' => '1.0 T-GDI 90 7DCT Jump',
            'image' => 'https://kalitefilo.com.tr/images/vehicles/cards/hyundai-i20.jpg',
            'href' => 'https://kalitefilo.com.tr/' . ($english ? 'en/vehicles/' : 'arac-listesi/') . 'hyundai-i20-1-0-t-gdi-90-7dct-jump/',
        ],
    ];
}

/** @return list<array{title: string, subtitle: string, image: string, href: string}> */
function kalite_filo_welcome_articles(string $locale): array
{
    if ($locale === 'en') {
        return [
            [
                'title' => 'What Is Operational Vehicle Leasing?',
                'subtitle' => 'A comprehensive guide for companies',
                'image' => 'https://kalitefilo.com.tr/images/filo-rehberi/01-operasyonel-arac-kiralama.webp',
                'href' => 'https://kalitefilo.com.tr/en/fleet-guide/long-term-leasing/what-is-operational-vehicle-leasing/',
            ],
            [
                'title' => 'How to Calculate Fleet Costs',
                'subtitle' => 'Seeing the true cost with TCO',
                'image' => 'https://kalitefilo.com.tr/images/filo-rehberi/02-filo-tco-maliyet.webp',
                'href' => 'https://kalitefilo.com.tr/en/fleet-guide/cost-and-finance/calculating-fleet-total-cost-of-ownership/',
            ],
        ];
    }

    return [
        [
            'title' => 'Operasyonel Araç Kiralama Nedir?',
            'subtitle' => 'Şirketler için kapsamlı rehber',
            'image' => 'https://kalitefilo.com.tr/images/filo-rehberi/01-operasyonel-arac-kiralama.webp',
            'href' => 'https://kalitefilo.com.tr/filo-rehberi/uzun-donem-kiralama/operasyonel-arac-kiralama-nedir/',
        ],
        [
            'title' => 'Filo Maliyetleri Nasıl Hesaplanır?',
            'subtitle' => 'TCO ile gerçek araç maliyetini görmek',
            'image' => 'https://kalitefilo.com.tr/images/filo-rehberi/02-filo-tco-maliyet.webp',
            'href' => 'https://kalitefilo.com.tr/filo-rehberi/maliyet-ve-finans/filo-toplam-sahip-olma-maliyeti-tco/',
        ],
    ];
}

/** @param array{title: string, subtitle: string, image: string, href: string} $item */
function kalite_filo_welcome_card(array $item, string $action): string
{
    return '<td style="width:50%;padding:8px;vertical-align:top">'
        . '<table role="presentation" style="width:100%;height:100%;border-collapse:collapse;border:1px solid #d8dee9;border-radius:12px;overflow:hidden;background:#ffffff">'
        . '<tr><td><img alt="" src="' . kalite_filo_customer_mail_escape($item['image']) . '" style="display:block;width:100%;height:132px;object-fit:cover"></td></tr>'
        . '<tr><td style="padding:16px"><h3 style="margin:0;color:#182136;font-size:17px;line-height:1.3">' . kalite_filo_customer_mail_escape($item['title']) . '</h3>'
        . '<p style="margin:8px 0 16px;color:#657087;font-size:13px;line-height:1.5">' . kalite_filo_customer_mail_escape($item['subtitle']) . '</p>'
        . '<a href="' . kalite_filo_customer_mail_escape($item['href']) . '" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#ffb343;color:#182136;font-size:13px;font-weight:700;text-decoration:none">' . kalite_filo_customer_mail_escape($action) . '</a>'
        . '</td></tr></table></td>';
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
    $homeUrl = $english ? 'https://kalitefilo.com.tr/en/' : 'https://kalitefilo.com.tr/';
    $privacyUrl = $english ? 'https://kalitefilo.com.tr/en/privacy-notice/' : 'https://kalitefilo.com.tr/aydinlatma-metni/';
    $unsubscribeUrl = 'mailto:contact@kalitefilo.com.tr?subject=' . rawurlencode($english ? 'Unsubscribe from commercial emails' : 'Ticari elektronik ileti aboneliğinden çıkış');

    $html = '<!doctype html><html lang="' . $locale . '"><body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;color:#182136">'
        . '<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 12px">'
        . '<table role="presentation" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #d8dee9">'
        . '<tr><td style="padding:28px;background:#182136;text-align:center"><a href="' . $homeUrl . '" style="color:#ffffff;font-size:26px;font-weight:700;text-decoration:none">KALİTE <span style="color:#ffb343">FİLO</span></a></td></tr>'
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
            kalite_filo_welcome_vehicles($locale),
        );
        $articleCards = array_map(
            static fn (array $item): string => kalite_filo_welcome_card($item, $english ? 'Read Article' : 'Yazıyı Oku'),
            kalite_filo_welcome_articles($locale),
        );
        $html .= '<h2 style="margin:32px 0 8px;color:#182136;font-size:21px">' . ($english ? 'Featured Vehicles' : 'Öne Çıkan Araçlar') . '</h2>'
            . '<table role="presentation" style="width:100%;margin:0 -8px;border-collapse:collapse"><tr>' . implode('', $vehicleCards) . '</tr></table>'
            . '<h2 style="margin:32px 0 8px;color:#182136;font-size:21px">' . ($english ? 'From the Fleet Guide' : 'Filo Rehberi’nden') . '</h2>'
            . '<table role="presentation" style="width:100%;margin:0 -8px;border-collapse:collapse"><tr>' . implode('', $articleCards) . '</tr></table>';
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
    ], $email, $safeName);
}
