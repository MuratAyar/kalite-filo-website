<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';

function kalite_filo_admin_contact_validation_code(InvalidArgumentException $exception): string
{
    return match ($exception->getMessage()) {
        'Correction reason is required.' => 'correction_reason_required',
        'Invalid contact date.' => 'invalid_contact_date',
        'Unsubscribe date is required.' => 'unsubscribe_date_required',
        'Unsubscribe state is inconsistent.' => 'unsubscribe_date_must_be_empty',
        'IYS state requires consent evidence.' => 'iys_requires_consent',
        'Invalid consent version.' => 'invalid_consent_version',
        'Contact was not found.' => 'not_found',
        default => 'validation_failed',
    };
}

try {
    kalite_filo_admin_require_method('POST');
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    kalite_filo_admin_require_csrf();
    kalite_filo_admin_require_roles(['owner', 'admin', 'marketing']);
    $body = kalite_filo_admin_read_json();
    $operation = $body['operation'] ?? null;

    if ($operation === 'unsubscribe') {
        $email = $body['email'] ?? null;
        if (!is_string($email)) throw new InvalidArgumentException('Invalid operation.');
        putenv('KALITE_FILO_CONTACT_STORE_PATH=' . kalite_filo_admin_contact_store_path());
        require_once dirname(__DIR__) . '/forms/unsubscribe-store.php';
        $changed = kalite_filo_suppress_contact_email($email);
        if (!$changed) kalite_filo_admin_json(['error' => 'not_found'], 404);
        kalite_filo_admin_audit('subscriber_unsubscribe', 'success', [
            'id' => hash('sha256', strtolower(trim($email))),
        ]);
        kalite_filo_admin_json(['updated' => true]);
    }

    if ($operation === 'update_iys') {
        $id = $body['id'] ?? null;
        $status = $body['iysStatus'] ?? null;
        $recipientType = $body['recipientType'] ?? null;
        if (!is_string($id) || !is_string($status) || !is_string($recipientType)) {
            throw new InvalidArgumentException('Invalid operation.');
        }
        $updated = kalite_filo_admin_update_contact_iys(
            kalite_filo_admin_contact_store_path(), $id, $status, $recipientType,
        );
        kalite_filo_admin_audit('subscriber_iys_update', 'success', [
            'id' => hash('sha256', strtolower(trim($updated['email']))),
            'recordId' => $id, 'iysStatus' => $status, 'recipientType' => $recipientType,
        ]);
        kalite_filo_admin_json(['updated' => true, 'record' => $updated]);
    }

    if ($operation === 'correct_record') {
        kalite_filo_admin_require_roles(['owner', 'admin']);
        $id = $body['id'] ?? null;
        $reason = $body['reason'] ?? null;
        if (!is_string($id) || !is_string($reason)
            || mb_strlen(trim($reason)) < 10 || mb_strlen($reason) > 500) {
            throw new InvalidArgumentException('Correction reason is required.');
        }
        $result = kalite_filo_admin_correct_contact(
            kalite_filo_admin_contact_store_path(), $id, $body,
        );
        $record = $result['record'];
        kalite_filo_admin_audit('subscriber_record_correction', 'success', [
            'id' => hash('sha256', strtolower(trim($record['email']))),
            'recordId' => $id,
            'changedFields' => $result['changedFields'],
            'before' => $result['before'],
            'after' => $result['after'],
            'reason' => trim($reason),
        ]);
        kalite_filo_admin_json(['updated' => true, 'record' => $record]);
    }

    throw new InvalidArgumentException('Invalid operation.');
} catch (InvalidArgumentException $exception) {
    kalite_filo_admin_json(['error' => kalite_filo_admin_contact_validation_code($exception)], 422);
} catch (Throwable $exception) {
    error_log('Subscriber operation failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error' => 'service_unavailable'], 503);
}
