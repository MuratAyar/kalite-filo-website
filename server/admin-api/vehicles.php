<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/vehicle-store.php';
require_once __DIR__ . '/taxonomy-store.php';
try {
    kalite_filo_admin_start_session(); kalite_filo_admin_require_authentication();
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
        $publishedIds=[];foreach(kalite_filo_admin_content_snapshot()['vehicles']['records']??[] as $source)if(is_array($source)&&is_string($source['id']??null))$publishedIds[$source['id']]=true;
        $vehicles=array_map(static fn(array $vehicle):array=>[...$vehicle,'isPublishedSource'=>isset($publishedIds[(string)($vehicle['id']??'')])],kalite_filo_admin_vehicle_records());
        kalite_filo_admin_json(['vehicles'=>$vehicles]);
    }
    kalite_filo_admin_require_method('POST'); kalite_filo_admin_require_same_origin(); kalite_filo_admin_require_csrf();
    $records = kalite_filo_admin_vehicle_records(); $body=kalite_filo_admin_read_json(); kalite_filo_admin_validate_vehicle_taxonomy($body); $vehicle = kalite_filo_admin_normalize_vehicle($body);
    $records[] = $vehicle; kalite_filo_admin_assert_vehicle_uniqueness($records); kalite_filo_admin_write_vehicle_revision('create',$vehicle); kalite_filo_admin_write_vehicle_records($records);
    kalite_filo_admin_audit('vehicle_create', 'success', ['id' => $vehicle['id']]);
    kalite_filo_admin_json(['vehicle' => $vehicle], 201);
} catch (InvalidArgumentException $e) { kalite_filo_admin_json(['error' => 'validation_failed'], 422); }
catch (KaliteFiloAdminVehicleStoreException $e) { error_log('Admin vehicles failed: '.$e->getMessage()); kalite_filo_admin_json(['error'=>$e->publicCode],503); }
catch (Throwable $e) { error_log('Admin vehicles failed: '.$e->getMessage()); kalite_filo_admin_json(['error'=>'service_unavailable'],503); }
