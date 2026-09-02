<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once dirname(__DIR__) . '/forms/form-submission-store.php';

try {
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_roles(['owner', 'admin']);
    $config = kalite_filo_admin_config();
    putenv(KALITE_FILO_FORM_SUBMISSION_STORE_ENV . '=' . (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'form-submissions');
    $kind = trim((string) ($_GET['kind'] ?? ''));
    $type = trim((string) ($_GET['type'] ?? ''));
    $status = trim((string) ($_GET['status'] ?? ''));
    $query = mb_strtolower(mb_substr(trim((string) ($_GET['q'] ?? '')), 0, 120));
    $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
    $limit = filter_var($_GET['limit'] ?? 100, FILTER_VALIDATE_INT);
    if (!in_array($kind, ['quote', 'contact'], true)
        || ($type !== '' && !in_array($type, ['individual', 'corporate', 'cart', 'contact'], true))
        || ($status !== '' && !in_array($status, ['new', 'in_progress', 'replied', 'closed'], true))
        || !is_int($page) || $page < 1 || !is_int($limit) || $limit < 1 || $limit > 100) {
        kalite_filo_admin_json(['error' => 'validation_failed'], 422);
    }
    $records = array_values(array_filter(kalite_filo_form_submissions(), static function (array $record) use ($kind, $type, $status, $query): bool {
        if (($record['kind'] ?? null) !== $kind || ($type !== '' && ($record['formType'] ?? null) !== $type) || ($status !== '' && ($record['status'] ?? null) !== $status)) return false;
        if ($query === '') return true;
        $haystack = mb_strtolower(implode(' ', [(string) ($record['name'] ?? ''), (string) ($record['email'] ?? ''), (string) ($record['phone'] ?? ''), (string) ($record['referenceNumber'] ?? '')]));
        return str_contains($haystack, $query);
    }));
    $total = count($records);
    kalite_filo_admin_json(['submissions' => array_slice($records, ($page - 1) * $limit, $limit), 'total' => $total, 'page' => $page, 'limit' => $limit]);
} catch (Throwable $exception) {
    error_log('Admin form submissions failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
