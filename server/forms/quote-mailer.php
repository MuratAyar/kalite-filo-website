<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

const KALITE_FILO_MAIL_CONFIG_ENV = 'KALITE_FILO_MAIL_CONFIG';
const KALITE_FILO_MAIL_CONFIG_FILENAME = 'kalite-filo-mail.php';

/** @return array<string, int|string> */
function kalite_filo_load_mail_config(): array
{
    $configuredPath = getenv(KALITE_FILO_MAIL_CONFIG_ENV);
    $configPath = kalite_filo_resolve_mail_config_path(
        is_string($configuredPath) ? $configuredPath : null,
        __DIR__,
    );

    if (!is_file($configPath) || !is_readable($configPath)) {
        throw new RuntimeException('Private mail configuration is unavailable.');
    }

    $rawConfig = require $configPath;
    if (!is_array($rawConfig)) {
        throw new RuntimeException('Private mail configuration is invalid.');
    }

    return kalite_filo_validate_mail_config($rawConfig);
}

function kalite_filo_resolve_mail_config_path(?string $configuredPath, string $formsDirectory): string
{
    if ($configuredPath !== null && trim($configuredPath) !== '') {
        $configPath = trim($configuredPath);
        if (!kalite_filo_is_absolute_path($configPath)) {
            throw new RuntimeException('Mail configuration path must be absolute.');
        }

        return $configPath;
    }

    // Deployed as <document-root>/forms/*.php. Going up twice reaches the
    // shared cPanel account home for both public_html and the staging root.
    return dirname($formsDirectory, 2)
        . DIRECTORY_SEPARATOR
        . 'private'
        . DIRECTORY_SEPARATOR
        . KALITE_FILO_MAIL_CONFIG_FILENAME;
}

function kalite_filo_is_absolute_path(string $path): bool
{
    if ($path === '' || str_contains($path, "\0")) {
        return false;
    }

    return str_starts_with($path, '/')
        || str_starts_with($path, '\\\\')
        || preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1;
}

/**
 * @param array<mixed> $rawConfig
 * @return array<string, int|string>
 */
function kalite_filo_validate_mail_config(array $rawConfig): array
{
    $requiredStringKeys = [
        'host',
        'encryption',
        'username',
        'password',
        'from_address',
        'from_name',
        'recipient_address',
        'recipient_name',
    ];

    foreach ($requiredStringKeys as $key) {
        if (!isset($rawConfig[$key]) || !is_string($rawConfig[$key]) || trim($rawConfig[$key]) === '') {
            throw new RuntimeException('Private mail configuration is invalid.');
        }
    }

    if (!isset($rawConfig['port']) || !is_int($rawConfig['port'])) {
        throw new RuntimeException('Private mail configuration is invalid.');
    }

    $encryption = strtolower(trim($rawConfig['encryption']));
    $port = $rawConfig['port'];
    if (
        ($encryption !== 'smtps' || $port !== 465)
        && ($encryption !== 'starttls' || $port !== 587)
    ) {
        throw new RuntimeException('Private mail configuration is invalid.');
    }

    foreach (['username', 'from_address', 'recipient_address'] as $emailKey) {
        $address = trim($rawConfig[$emailKey]);
        if (
            filter_var($address, FILTER_VALIDATE_EMAIL) === false
            || preg_match('/[\r\n]/', $address) === 1
        ) {
            throw new RuntimeException('Private mail configuration is invalid.');
        }
    }

    $config = [
        'host' => trim($rawConfig['host']),
        'port' => $port,
        'encryption' => $encryption,
        'username' => trim($rawConfig['username']),
        'password' => $rawConfig['password'],
        'from_address' => trim($rawConfig['from_address']),
        'from_name' => trim($rawConfig['from_name']),
        'recipient_address' => trim($rawConfig['recipient_address']),
        'recipient_name' => trim($rawConfig['recipient_name']),
    ];

    $contactAddress = $rawConfig['contact_recipient_address'] ?? null;
    $contactName = $rawConfig['contact_recipient_name'] ?? null;
    if ($contactAddress !== null || $contactName !== null) {
        if (
            !is_string($contactAddress)
            || filter_var(trim($contactAddress), FILTER_VALIDATE_EMAIL) === false
            || preg_match('/[\r\n]/', $contactAddress) === 1
            || !is_string($contactName)
            || trim($contactName) === ''
        ) {
            throw new RuntimeException('Private mail configuration is invalid.');
        }
        $config['contact_recipient_address'] = trim($contactAddress);
        $config['contact_recipient_name'] = trim($contactName);
    }

    return $config;
}

/**
 * @param array{subject: string, html_body: string, text_body: string, reply_to_address: string, reply_to_name: string} $message
 */
function kalite_filo_send_email(array $message, string $recipientType = 'quote'): bool
{
    try {
        // Keep configuration validation independently testable, while requiring
        // the Composer runtime before the delivery boundary is entered.
        require_once __DIR__ . '/vendor/autoload.php';
        $config = kalite_filo_load_mail_config();
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->SMTPAuth = true;
        $mail->Host = (string) $config['host'];
        $mail->Port = (int) $config['port'];
        $mail->Username = (string) $config['username'];
        $mail->Password = (string) $config['password'];
        $mail->SMTPSecure = $config['encryption'] === 'smtps'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Timeout = 15;
        $mail->SMTPDebug = 0;
        $mail->CharSet = PHPMailer::CHARSET_UTF8;

        $mail->setFrom((string) $config['from_address'], (string) $config['from_name']);
        $recipientAddressKey = $recipientType === 'contact'
            ? 'contact_recipient_address'
            : 'recipient_address';
        $recipientNameKey = $recipientType === 'contact'
            ? 'contact_recipient_name'
            : 'recipient_name';
        if (!isset($config[$recipientAddressKey], $config[$recipientNameKey])) {
            throw new RuntimeException('Requested mail recipient is unavailable.');
        }
        $mail->addAddress((string) $config[$recipientAddressKey], (string) $config[$recipientNameKey]);
        $mail->addReplyTo($message['reply_to_address'], $message['reply_to_name']);

        $mail->isHTML(true);
        $mail->Subject = $message['subject'];
        $mail->Body = $message['html_body'];
        $mail->AltBody = $message['text_body'];

        return $mail->send();
    } catch (Throwable $exception) {
        error_log('Kalite Filo SMTP delivery failed [' . get_class($exception) . '].');
        return false;
    }
}

/**
 * @param array{subject: string, html_body: string, text_body: string, reply_to_address: string, reply_to_name: string} $message
 */
function kalite_filo_send_quote_email(array $message): bool
{
    return kalite_filo_send_email($message, 'quote');
}
