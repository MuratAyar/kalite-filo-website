<?php
declare(strict_types=1);

// Documentation only. Copy this file outside every document root and replace
// every placeholder there. This file is never loaded automatically or released.
return [
    'environment' => 'staging',
    'data_root' => '/absolute/private/path/kalite-filo-admin/staging/data',
    'users' => [[
        'id' => 'owner',
        'username' => 'replace-with-private-username',
        'display_name' => 'Site Owner',
        'password_hash' => 'REPLACE_WITH_A_STRONG_PASSWORD_HASH',
        'role' => 'owner',
        'enabled' => true,
    ]],
];
