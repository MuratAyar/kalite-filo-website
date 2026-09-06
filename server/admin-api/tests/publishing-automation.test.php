<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/publishing-automation.php';

function publishing_automation_test_assert(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

publishing_automation_test_assert(
    kalite_filo_admin_github_tls_stream_available()
        === (function_exists('stream_socket_client') && extension_loaded('openssl') && in_array('tls', stream_get_transports(), true)),
    'TLS stream capability detection must reflect the PHP runtime.',
);

[$statusCode, $body, $transportError] = kalite_filo_admin_parse_github_dispatch_response(
    "HTTP/1.1 204 No Content\r\nDate: Sun, 06 Sep 2026 12:00:00 GMT\r\n\r\n",
);
publishing_automation_test_assert($statusCode === 204, 'A valid GitHub dispatch response must expose its HTTP status.');
publishing_automation_test_assert($body === '', 'A 204 GitHub dispatch response must expose an empty body.');
publishing_automation_test_assert($transportError === false, 'A valid GitHub dispatch response must not be a transport error.');

[$statusCode, $body, $transportError] = kalite_filo_admin_parse_github_dispatch_response('not-an-http-response');
publishing_automation_test_assert($statusCode === 0, 'A malformed response must not expose an HTTP status.');
publishing_automation_test_assert($body === false, 'A malformed response must not expose a response body.');
publishing_automation_test_assert($transportError === true, 'A malformed response must be a transport error.');

echo "publishing-automation.test.php: ok\n";
