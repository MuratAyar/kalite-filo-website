<?php
declare(strict_types=1);
const KALITE_FILO_RUNNER_MAX_CHUNK_BYTES = 1048576;
const KALITE_FILO_RUNNER_MAX_ARTIFACT_BYTES = 134217728;
require_once dirname(__DIR__) . '/publishing-deployment.php';

function deployment_assert(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function deployment_remove(string $path): void {
    if (!is_dir($path)) return;
    foreach (scandir($path) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        $target = $path . DIRECTORY_SEPARATOR . $entry;
        is_dir($target) && !is_link($target) ? deployment_remove($target) : @unlink($target);
    }
    @rmdir($path);
}

$root = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kalite-filo-deployment-' . bin2hex(random_bytes(5));
try {
    mkdir($root . '/admin', 0700, true);
    mkdir($root . '/admin-api', 0700, true);
    file_put_contents($root . '/index.html', 'home');
    file_put_contents($root . '/admin/index.html', 'admin');
    file_put_contents($root . '/admin-api/session.php', '<?php');
    $identity = [
        'requestId' => 'publish-20260901-120000-abcdef123456',
        'snapshotHash' => str_repeat('a', 64),
        'manifestHash' => str_repeat('b', 64),
    ];
    file_put_contents($root . '/kalite-filo-release.json', json_encode(['schemaVersion' => 1, 'target' => 'staging'] + $identity, JSON_THROW_ON_ERROR));
    $paths = ['admin-api/session.php', 'admin/index.html', 'index.html', 'kalite-filo-release.json'];
    $files = [];
    foreach ($paths as $relative) {
        $target = $root . '/' . $relative;
        $files[] = ['path' => $relative, 'size' => filesize($target), 'sha256' => hash_file('sha256', $target)];
    }
    file_put_contents($root . '/kalite-filo-release-manifest.json', json_encode(['schemaVersion' => 1, 'target' => 'staging'] + $identity + ['files' => $files], JSON_THROW_ON_ERROR));
    $validated = kalite_filo_admin_validate_extracted_release($root, $identity);
    deployment_assert(count($validated) === 4, 'Every manifested release file must validate.');
    file_put_contents($root . '/index.html', 'tampered');
    try {
        kalite_filo_admin_validate_extracted_release($root, $identity);
        throw new RuntimeException('Tampered release must fail.');
    } catch (RuntimeException $exception) {
        deployment_assert($exception->getMessage() !== 'Tampered release must fail.', 'Tampered release must fail.');
    }
    try {
        kalite_filo_admin_safe_release_relative_path('../escape');
        throw new RuntimeException('Traversal path must fail.');
    } catch (RuntimeException $exception) {
        deployment_assert($exception->getMessage() !== 'Traversal path must fail.', 'Traversal path must fail.');
    }
    fwrite(STDOUT, "Admin publishing deployment validation tests passed.\n");
} finally { deployment_remove($root); }
