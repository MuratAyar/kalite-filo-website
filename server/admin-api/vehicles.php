<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/vehicle-store.php';
try {
    kalite_filo_admin_start_session(); kalite_filo_admin_require_authentication();
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') kalite_filo_admin_json(['vehicles' => kalite_filo_admin_vehicle_records()]);
    kalite_filo_admin_require_method('POST'); kalite_filo_admin_require_same_origin(); kalite_filo_admin_require_csrf();
    $records = kalite_filo_admin_vehicle_records(); $vehicle = kalite_filo_admin_normalize_vehicle(kalite_filo_admin_read_json());
    $records[] = $vehicle; kalite_filo_admin_write_vehicle_records($records);
    kalite_filo_admin_audit('vehicle_create', 'success', ['id' => $vehicle['id']]);
    kalite_filo_admin_json(['vehicle' => $vehicle], 201);
} catch (InvalidArgumentException $e) { kalite_filo_admin_json(['error' => 'validation_failed'], 422); }
catch (Throwable $e) { error_log('Admin vehicles failed: '.$e->getMessage()); kalite_filo_admin_json(['error'=>'service_unavailable'],503); }
