<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once dirname(__DIR__) . '/forms/form-submission-store.php';
require_once __DIR__ . '/form-submission-mailer.php';

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_require_csrf();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    $config = kalite_filo_admin_config();
    putenv(KALITE_FILO_FORM_SUBMISSION_STORE_ENV . '=' . (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'form-submissions');
    $body = kalite_filo_admin_read_json(32768);
    $id = trim((string) ($body['id'] ?? ''));
    $subject = trim((string) ($body['subject'] ?? ''));
    $message = trim((string) ($body['message'] ?? ''));
    if (mb_strlen($subject) < 3 || mb_strlen($subject) > 180 || mb_strlen($message) < 3 || mb_strlen($message) > 5000) kalite_filo_admin_json(['error' => 'validation_failed'], 422);
    $record = kalite_filo_read_form_submission_file(kalite_filo_form_submission_path($id));
    $identity = kalite_filo_admin_safe_identity();
    if (!kalite_filo_admin_form_reply_rate_limit((string) $config['data_root'], $identity['id'])) kalite_filo_admin_json(['error' => 'rate_limited'], 429);
    if (!kalite_filo_admin_send_form_reply($record, $subject, $message)) {
        kalite_filo_admin_audit('form_submission_reply', 'failure', ['id' => $id]);
        kalite_filo_admin_json(['error' => 'delivery_failed'], 502);
    }
    $updated = kalite_filo_update_form_submission($id, static function (array $record) use ($subject, $message, $identity): array {
        $history = is_array($record['replyHistory'] ?? null) ? array_values($record['replyHistory']) : [];
        $history[] = ['id' => bin2hex(random_bytes(16)), 'sentAt' => gmdate('c'), 'adminId' => $identity['id'], 'subject' => $subject, 'message' => $message];
        $record['replyHistory'] = array_slice($history, -20);
        $record['status'] = 'replied';
        return $record;
    });
    kalite_filo_admin_audit('form_submission_reply', 'success', ['id' => $id]);
    kalite_filo_admin_json(['submission' => $updated]);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Admin form reply failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
