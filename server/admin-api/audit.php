<?php
declare(strict_types=1);
require_once __DIR__.'/auth.php';require_once __DIR__.'/read-model.php';
try{
    kalite_filo_admin_require_method('GET');kalite_filo_admin_start_session();kalite_filo_admin_require_authentication();
    $page=filter_input(INPUT_GET,'page',FILTER_VALIDATE_INT)?:1;$limit=filter_input(INPUT_GET,'limit',FILTER_VALIDATE_INT)?:20;
    $config=kalite_filo_admin_config();kalite_filo_admin_json(kalite_filo_admin_audit_page((string)$config['data_root'],$page,$limit,trim((string)($_GET['action']??'')),trim((string)($_GET['result']??''))));
}catch(InvalidArgumentException $e){kalite_filo_admin_json(['error'=>'validation_failed'],422);}
catch(Throwable $e){error_log('Admin audit view failed: '.$e->getMessage());kalite_filo_admin_json(['error'=>'service_unavailable'],503);}
