<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/article-store.php';
require_once __DIR__ . '/vehicle-store.php';
require_once dirname(__DIR__) . '/forms/form-submission-store.php';

try {
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    $config = kalite_filo_admin_config();
    $snapshot = kalite_filo_admin_content_snapshot();
    $range = trim((string) ($_GET['range'] ?? 'day'));
    $since = kalite_filo_admin_dashboard_range_start($range);
    $contacts = kalite_filo_admin_contact_metrics(kalite_filo_admin_contact_store_path());
    putenv(KALITE_FILO_FORM_SUBMISSION_STORE_ENV . '=' . (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'form-submissions');
    $forms = kalite_filo_admin_dashboard_form_metrics(kalite_filo_form_submissions(), $since);
    $vehicles = kalite_filo_admin_vehicle_records();
    $draftVehicles = count(array_filter($vehicles, static fn(array $vehicle): bool => ($vehicle['publicationStatus'] ?? '') !== 'published'));
    $draftArticles = kalite_filo_admin_article_draft_count();
    kalite_filo_admin_json([
        'range' => $range,
        'metrics' => [
            'activeVehicles' => (int) ($snapshot['vehicles']['active'] ?? 0),
            'totalVehicles' => count($vehicles),
            'draftVehicles' => $draftVehicles,
            'featuredVehicles' => (int) ($snapshot['vehicles']['featured'] ?? 0),
            'articles' => (int) ($snapshot['articles']['total'] ?? 0),
            'draftArticles' => $draftArticles,
            'pendingQuotes' => $forms['quote']['new'] + $forms['quote']['inProgress'],
            'pendingContacts' => $forms['contact']['new'] + $forms['contact']['inProgress'],
            'pendingContent' => $draftVehicles + $draftArticles,
            'newsletterContacts' => $contacts['contacts'],
            'approvedMarketingConsents' => $contacts['approved'],
            'iysPending' => $contacts['iysPending'],
            'unsubscribed' => $contacts['unsubscribed'],
        ],
        'forms' => $forms,
        'recentActivity' => kalite_filo_admin_recent_audit((string) $config['data_root'], 8, $since),
        'publishing' => ['staging' => null, 'production' => null],
        'failures' => [],
        'snapshotGeneratedAt' => (string) ($snapshot['generatedAt'] ?? ''),
    ]);
} catch (Throwable $exception) {
    error_log('Kalite Filo admin dashboard failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
