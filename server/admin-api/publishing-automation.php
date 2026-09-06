<?php
declare(strict_types=1);

const KALITE_FILO_RUNNER_MAX_CHUNK_BYTES = 1048576;
const KALITE_FILO_RUNNER_MAX_CHUNKS = 128;
const KALITE_FILO_RUNNER_MAX_ARTIFACT_BYTES = 134217728;

function kalite_filo_admin_github_tls_stream_available(): bool
{
    return function_exists('stream_socket_client')
        && extension_loaded('openssl')
        && in_array('tls', stream_get_transports(), true);
}

/** @return array{enabled:bool,ready:bool,provider:string,missing:list<string>} */
function kalite_filo_admin_publishing_automation_status(): array
{
    $automation = kalite_filo_admin_config()['publishing_automation'];
    $missing = [];
    if ($automation['enabled'] === true && !function_exists('curl_init') && !kalite_filo_admin_github_tls_stream_available()) $missing[] = 'https_transport';
    if ($automation['enabled'] === true && !class_exists('PharData')) $missing[] = 'php_phar';
    return ['enabled' => $automation['enabled'] === true, 'ready' => $automation['enabled'] === true && $missing === [], 'provider' => 'github_actions', 'missing' => $missing];
}

/** @return array{runId:?string,runUrl:?string} */
function kalite_filo_admin_dispatch_publish_workflow(array $record): array
{
    $automation = kalite_filo_admin_config()['publishing_automation'];
    $status = kalite_filo_admin_publishing_automation_status();
    if ($automation['enabled'] !== true || $status['ready'] !== true) throw new RuntimeException('Publishing automation is unavailable.');
    $repository = rawurlencode((string) $automation['repository']);
    $repository = str_replace('%2F', '/', $repository);
    $workflow = rawurlencode((string) $automation['workflow']);
    $url = 'https://api.github.com/repos/' . $repository . '/actions/workflows/' . $workflow . '/dispatches';
    $payload = json_encode([
        'ref' => $automation['ref'],
        'inputs' => ['request_id' => $record['id'], 'snapshot_hash' => $record['snapshotHash']],
    ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    $headers = [
        'Accept: application/vnd.github+json',
        'Authorization: Bearer ' . $automation['github_token'],
        'Content-Type: application/json',
        'User-Agent: kalite-filo-admin-publisher',
        'X-GitHub-Api-Version: 2022-11-28',
    ];
    if (function_exists('curl_init')) {
        [$statusCode, $response, $transportError] = kalite_filo_admin_github_dispatch_with_curl($url, $headers, $payload);
    } else {
        [$statusCode, $response, $transportError] = kalite_filo_admin_github_dispatch_with_tls_stream($url, $headers, $payload);
    }
    if (!is_string($response) || !in_array($statusCode, [200, 204], true)) {
        error_log('GitHub workflow dispatch failed [HTTP ' . $statusCode . '; transport=' . ($transportError ? 'error' : 'ok') . '].');
        throw new RuntimeException('GitHub workflow dispatch failed.');
    }
    $decoded = $response !== '' ? json_decode($response, true) : [];
    $workflowUrl = 'https://github.com/' . $automation['repository'] . '/actions/workflows/' . rawurlencode((string) $automation['workflow']);
    return [
        'runId' => is_array($decoded) && is_int($decoded['workflow_run_id'] ?? null) ? (string) $decoded['workflow_run_id'] : null,
        'runUrl' => is_array($decoded) && is_string($decoded['html_url'] ?? null) && str_starts_with($decoded['html_url'], 'https://github.com/') ? $decoded['html_url'] : $workflowUrl,
    ];
}

/** @param list<string> $headers @return array{int,string|false,bool} */
function kalite_filo_admin_github_dispatch_with_curl(string $url, array $headers, string $payload): array
{
    $curl = curl_init($url);
    if ($curl === false) throw new RuntimeException('GitHub dispatch could not be initialized.');
    curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false, CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 25, CURLOPT_FOLLOWLOCATION => false, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
    if (defined('CURLOPT_PROTOCOLS') && defined('CURLPROTO_HTTPS')) curl_setopt($curl, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
    $response = curl_exec($curl);
    $statusCode = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $transportError = curl_error($curl) !== '';
    curl_close($curl);
    return [$statusCode, $response, $transportError];
}

/** @param list<string> $headers @return array{int,string|false,bool} */
function kalite_filo_admin_github_dispatch_with_tls_stream(string $url, array $headers, string $payload): array
{
    if (!kalite_filo_admin_github_tls_stream_available()) return [0, false, true];
    $parts = parse_url($url);
    if (!is_array($parts) || ($parts['scheme'] ?? null) !== 'https' || ($parts['host'] ?? null) !== 'api.github.com' || !is_string($parts['path'] ?? null)) return [0, false, true];
    $context = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => 'api.github.com',
        'SNI_enabled' => true,
        'disable_compression' => true,
    ]]);
    $socket = @stream_socket_client('tls://api.github.com:443', $errorCode, $errorMessage, 10, STREAM_CLIENT_CONNECT, $context);
    if (!is_resource($socket)) return [0, false, true];
    stream_set_timeout($socket, 25);
    $requestHeaders = [...$headers, 'Host: api.github.com', 'Content-Length: ' . strlen($payload), 'Connection: close'];
    $request = 'POST ' . $parts['path'] . " HTTP/1.1\r\n" . implode("\r\n", $requestHeaders) . "\r\n\r\n" . $payload;
    $written = 0;
    while ($written < strlen($request)) {
        $count = fwrite($socket, substr($request, $written));
        if (!is_int($count) || $count < 1) { fclose($socket); return [0, false, true]; }
        $written += $count;
    }
    $raw = '';
    while (!feof($socket) && strlen($raw) <= 65536) {
        $chunk = fread($socket, 8192);
        if (!is_string($chunk)) { fclose($socket); return [0, false, true]; }
        $raw .= $chunk;
        $metadata = stream_get_meta_data($socket);
        if (($metadata['timed_out'] ?? false) === true) { fclose($socket); return [0, false, true]; }
    }
    fclose($socket);
    if (strlen($raw) > 65536) return [0, false, true];
    return kalite_filo_admin_parse_github_dispatch_response($raw);
}

/** @return array{int,string|false,bool} */
function kalite_filo_admin_parse_github_dispatch_response(string $raw): array
{
    if (preg_match_all('/^HTTP\/\d(?:\.\d)?\s+(\d{3})\b/im', $raw, $matches) < 1) return [0, false, true];
    $statusCode = (int)end($matches[1]);
    $separator = strrpos($raw, "\r\n\r\n");
    $response = $separator === false ? '' : substr($raw, $separator + 4);
    return [$statusCode, $response, false];
}

function kalite_filo_admin_runner_bearer_token(): string
{
    $custom = $_SERVER['HTTP_X_KALITE_RUNNER_TOKEN'] ?? '';
    if (is_string($custom) && preg_match('/^[A-Za-z0-9._~-]{32,255}$/D', trim($custom)) === 1) return trim($custom);
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!is_string($header) || preg_match('/^Bearer ([A-Za-z0-9._~-]{32,255})$/D', trim($header), $matches) !== 1) {
        kalite_filo_admin_json(['error' => 'runner_authentication_required'], 401);
    }
    return $matches[1];
}

function kalite_filo_admin_require_runner_authentication(): void
{
    $automation = kalite_filo_admin_config()['publishing_automation'];
    if ($automation['enabled'] !== true) kalite_filo_admin_json(['error' => 'automation_disabled'], 503);
    $providedHash = hash('sha256', kalite_filo_admin_runner_bearer_token());
    if (!hash_equals((string) $automation['runner_token_hash'], $providedHash)) {
        usleep(250000);
        kalite_filo_admin_json(['error' => 'runner_authentication_failed'], 401);
    }
}

function kalite_filo_admin_runner_run_id(): string
{
    $value = trim((string) ($_SERVER['HTTP_X_KALITE_RUNNER_RUN_ID'] ?? ''));
    if (preg_match('/^[1-9][0-9]{0,19}$/', $value) !== 1) kalite_filo_admin_json(['error' => 'invalid_runner_identity'], 400);
    return $value;
}

/** @return array<string,mixed> */
function kalite_filo_admin_set_publish_automation(array $record, string $status, array $values = []): array
{
    if (!in_array($status, ['dispatching', 'queued', 'dispatch_failed', 'running', 'deploying', 'succeeded', 'failed'], true)) throw new InvalidArgumentException('Invalid automation status.');
    $current = is_array($record['automation'] ?? null) ? $record['automation'] : [];
    $record['automation'] = array_merge($current, [
        'provider' => 'github_actions',
        'status' => $status,
        'updatedAt' => gmdate('c'),
    ], $values);
    kalite_filo_admin_replace_publish_request($record);
    return $record;
}

/** @return array<string,mixed> */
function kalite_filo_admin_claim_publish_request(string $id, string $snapshotHash, string $runId): array
{
    $record = kalite_filo_admin_publish_request($id);
    if ($record === null) throw new OutOfBoundsException('Publish request was not found.');
    if (!hash_equals((string) ($record['snapshotHash'] ?? ''), $snapshotHash)) throw new InvalidArgumentException('Snapshot identity mismatch.');
    $status = $record['status'] ?? null;
    $claimedRunId = (string) ($record['automation']['runId'] ?? '');
    if ($status === 'running' && $claimedRunId === $runId) return $record;
    if ($status !== 'awaiting_runner' || ($claimedRunId !== '' && $claimedRunId !== $runId)) throw new DomainException('Publish request is already claimed.');
    $record['status'] = 'running';
    $record['startedAt'] = gmdate('c');
    return kalite_filo_admin_set_publish_automation($record, 'running', ['runId' => $runId, 'startedAt' => $record['startedAt']]);
}

/** @return array<string,mixed> */
function kalite_filo_admin_require_claimed_publish_request(string $id, string $snapshotHash, string $runId): array
{
    $record = kalite_filo_admin_publish_request($id);
    if ($record === null) throw new OutOfBoundsException('Publish request was not found.');
    if (!hash_equals((string) ($record['snapshotHash'] ?? ''), $snapshotHash)) throw new InvalidArgumentException('Snapshot identity mismatch.');
    if (($record['status'] ?? null) !== 'running' || !hash_equals((string) ($record['automation']['runId'] ?? ''), $runId)) throw new DomainException('Publish request is not claimed by this runner.');
    return $record;
}

function kalite_filo_admin_publish_deploy_root(): string
{
    $root = kalite_filo_admin_publish_root() . DIRECTORY_SEPARATOR . 'deploy';
    kalite_filo_admin_ensure_private_directory($root);
    return $root;
}

function kalite_filo_admin_publish_upload_root(string $requestId, string $artifactHash): string
{
    if (preg_match('/^publish-\d{8}-\d{6}-[a-f0-9]{12}$/', $requestId) !== 1 || preg_match('/^[a-f0-9]{64}$/', $artifactHash) !== 1) throw new InvalidArgumentException('Invalid upload identity.');
    return kalite_filo_admin_publish_deploy_root() . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $requestId . '-' . substr($artifactHash, 0, 12);
}
