<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once dirname(__DIR__) . '/forms/form-submission-store.php';

try {
    kalite_filo_admin_require_method('PATCH');
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_require_csrf();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    $config = kalite_filo_admin_config();
    putenv(KALITE_FILO_FORM_SUBMISSION_STORE_ENV . '=' . (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'form-submissions');
    $body = kalite_filo_admin_read_json();
    $id = trim((string) ($body['id'] ?? ''));
    $status = trim((string) ($body['status'] ?? ''));
    if (!in_array($status, ['new', 'in_progress', 'replied', 'closed'], true)) kalite_filo_admin_json(['error' => 'validation_failed'], 422);
    $record = kalite_filo_update_form_submission($id, static function (array $record) use ($status): array {
        $record['status'] = $status;
        return $record;
    });
    kalite_filo_admin_audit('form_submission_status', 'success', ['id' => $id, 'status' => $status]);
    kalite_filo_admin_json(['submission' => $record]);
} catch (OutOfBoundsException) {
    kalite_filo_admin_json(['error' => 'not_found'], 404);
} catch (InvalidArgumentException) {
    kalite_filo_admin_json(['error' => 'validation_failed'], 422);
} catch (Throwable $exception) {
    error_log('Admin form submission update failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
