<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/article-store.php';

try {
    kalite_filo_admin_require_method('GET');
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    $config = kalite_filo_admin_config();
    $snapshot = kalite_filo_admin_content_snapshot();
    $contacts = kalite_filo_admin_contact_metrics(kalite_filo_admin_contact_store_path());
    kalite_filo_admin_json([
        'metrics' => [
            'activeVehicles' => (int) ($snapshot['vehicles']['active'] ?? 0),
            'featuredVehicles' => (int) ($snapshot['vehicles']['featured'] ?? 0),
            'articles' => (int) ($snapshot['articles']['total'] ?? 0),
            'draftArticles' => kalite_filo_admin_article_draft_count(),
            'newsletterContacts' => $contacts['contacts'],
            'approvedMarketingConsents' => $contacts['approved'],
            'iysPending' => $contacts['iysPending'],
            'unsubscribed' => $contacts['unsubscribed'],
        ],
        'recentActivity' => kalite_filo_admin_recent_audit((string) $config['data_root']),
        'publishing' => ['staging' => null, 'production' => null],
        'failures' => [],
        'snapshotGeneratedAt' => (string) ($snapshot['generatedAt'] ?? ''),
    ]);
} catch (Throwable $exception) {
    error_log('Kalite Filo admin dashboard failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
