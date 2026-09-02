<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/form-submission-mailer.php';

$message = kalite_filo_admin_form_reply_message(['id' => 'form-test', 'name' => '<Murat>', 'referenceNumber' => 'KF-123'], 'Talebiniz', '<script>alert(1)</script>\nİkinci satır');
if (!str_contains($message['html_body'], '&lt;Murat&gt;') || !str_contains($message['html_body'], '&lt;script&gt;') || str_contains($message['html_body'], '<script>')) throw new RuntimeException('Reply template escaping failed.');
if (!str_contains($message['text_body'], 'KF-123') || $message['subject'] !== 'Talebiniz') throw new RuntimeException('Reply template content failed.');
echo "form-submission-mailer tests passed\n";
