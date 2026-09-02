<?php
declare(strict_types=1);

// Documentation only. Copy this file outside every document root and replace
// every placeholder there. This file is never loaded automatically or released.
return [
    'environment' => 'staging',
    'data_root' => '/absolute/private/path/kalite-filo-admin/staging/data',
    // Optional. Test mail can only target entries in this environment-specific list.
    'campaign_test_recipients' => [[
        'id' => 'owner-test',
        'email' => 'owner@example.invalid',
        'name' => 'Site Owner',
    ]],
    // disabled: no queue; dry_run: ledger only/no SMTP; live: production only.
    'campaign_delivery_mode' => 'disabled',
    'campaign_batch_size' => 20,
    // Optional staging-only GitHub Actions publishing automation. Keep the raw
    // runner token only in GitHub; store its SHA-256 hash here.
    'publishing_automation' => [
        'enabled' => false,
        'repository' => 'MuratAyar/kalite-filo-website',
        'workflow' => 'admin-staging-publish.yml',
        'ref' => 'main',
        'github_token' => 'REPLACE_WITH_FINE_GRAINED_ACTIONS_WRITE_TOKEN',
        'runner_token_hash' => 'REPLACE_WITH_SHA256_OF_GITHUB_RUNNER_TOKEN',
    ],
    'users' => [[
        'id' => 'owner',
        'username' => 'replace-with-private-username',
        'display_name' => 'Site Owner',
        'password_hash' => 'REPLACE_WITH_A_STRONG_PASSWORD_HASH',
        'role' => 'owner',
        'enabled' => true,
    ]],
];
