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
    'users' => [[
        'id' => 'owner',
        'username' => 'replace-with-private-username',
        'display_name' => 'Site Owner',
        'password_hash' => 'REPLACE_WITH_A_STRONG_PASSWORD_HASH',
        'role' => 'owner',
        'enabled' => true,
    ]],
];
