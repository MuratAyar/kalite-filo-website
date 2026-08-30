<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php'; require_once __DIR__ . '/read-model.php'; require_once __DIR__ . '/vehicle-store.php'; require_once __DIR__ . '/taxonomy-store.php';
try {
    kalite_filo_admin_require_method('PATCH'); kalite_filo_admin_require_same_origin(); kalite_filo_admin_start_session(); kalite_filo_admin_require_authentication(); kalite_filo_admin_require_csrf();
    $id = (string) ($_GET['id'] ?? ''); $records = kalite_filo_admin_vehicle_records(); $found = false; $body = kalite_filo_admin_read_json();
    foreach ($records as &$record) if (($record['id'] ?? '') === $id) { $before=$record;$merged=array_merge($record,$body); kalite_filo_admin_validate_vehicle_taxonomy($merged); $record = kalite_filo_admin_normalize_vehicle($merged, $record); $vehicle=$record; $found=true; break; } unset($record);
    if (!$found) kalite_filo_admin_json(['error'=>'not_found'],404);
    kalite_filo_admin_assert_vehicle_uniqueness($records); kalite_filo_admin_write_vehicle_revision('update',$vehicle,$before); kalite_filo_admin_write_vehicle_records($records); kalite_filo_admin_audit('vehicle_update','success',['id'=>$id]); kalite_filo_admin_json(['vehicle'=>$vehicle]);
} catch (InvalidArgumentException $e) { kalite_filo_admin_json(['error'=>'validation_failed'],422); }
catch (Throwable $e) { error_log('Admin vehicle failed: '.$e->getMessage()); kalite_filo_admin_json(['error'=>'service_unavailable'],503); }
