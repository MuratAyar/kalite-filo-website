<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/form-submission-store.php';

function assert_form(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function remove_form_test_tree(string $path): void { if (!is_dir($path)) return; foreach (scandir($path) ?: [] as $name) { if ($name === '.' || $name === '..') continue; $item = $path . DIRECTORY_SEPARATOR . $name; is_dir($item) ? remove_form_test_tree($item) : unlink($item); } rmdir($path); }

$root = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kf-form-store-' . bin2hex(random_bytes(6));
putenv(KALITE_FILO_FORM_SUBMISSION_STORE_ENV . '=' . $root);
try {
    $stored = kalite_filo_store_form_submission(['kind' => 'quote', 'formType' => 'individual', 'referenceNumber' => 'KF-TEST', 'name' => 'Test Kullanıcı', 'email' => 'TEST@example.com', 'phone' => '+90 555 000 00 00', 'details' => ['vehicleMake' => 'BMW']]);
    assert_form($stored['status'] === 'new', 'New form status was not initialized.');
    assert_form($stored['email'] === 'test@example.com', 'Email was not normalized.');
    assert_form(count(kalite_filo_form_submissions()) === 1, 'Stored form was not listed.');
    $updated = kalite_filo_update_form_submission($stored['id'], static function (array $record): array { $record['status'] = 'replied'; $record['replyHistory'][] = ['id' => 'reply', 'sentAt' => gmdate('c'), 'adminId' => 'owner', 'subject' => 'Konu', 'message' => 'Yanıt']; return $record; });
    assert_form($updated['status'] === 'replied' && count($updated['replyHistory']) === 1, 'Form update was not persisted.');
    try { kalite_filo_form_submission_path('../escape'); throw new RuntimeException('Invalid id was accepted.'); } catch (InvalidArgumentException) {}
    echo "form-submission-store tests passed\n";
} finally { putenv(KALITE_FILO_FORM_SUBMISSION_STORE_ENV); remove_form_test_tree($root); }
