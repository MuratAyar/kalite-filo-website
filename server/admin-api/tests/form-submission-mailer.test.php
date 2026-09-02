<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/form-submission-mailer.php';

$message = kalite_filo_admin_form_reply_message(['id' => 'form-test', 'name' => '<Murat>', 'referenceNumber' => 'KF-123'], 'Talebiniz', '<script>alert(1)</script>\nİkinci satır');
if (!str_contains($message['html_body'], '&lt;Murat&gt;') || !str_contains($message['html_body'], '&lt;script&gt;') || str_contains($message['html_body'], '<script>')) throw new RuntimeException('Reply template escaping failed.');
if (!str_contains($message['text_body'], 'KF-123') || $message['subject'] !== 'Talebiniz') throw new RuntimeException('Reply template content failed.');
if (!str_contains($message['html_body'], 'cid:kf-admin-reply-logo') || !str_contains($message['html_body'], 'color-scheme" content="light only')) throw new RuntimeException('Reply template branding or light-mode lock failed.');
if (($message['embedded_images'][0]['cid'] ?? null) !== 'kf-admin-reply-logo' || !is_file($message['embedded_images'][0]['path'] ?? '')) throw new RuntimeException('Reply logo attachment is unavailable.');
echo "form-submission-mailer tests passed\n";
