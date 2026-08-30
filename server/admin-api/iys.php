<?php
declare(strict_types=1);
require_once __DIR__.'/auth.php';require_once __DIR__.'/read-model.php';
try{kalite_filo_admin_require_method('GET');kalite_filo_admin_start_session();kalite_filo_admin_require_authentication();kalite_filo_admin_json(kalite_filo_admin_iys_overview(kalite_filo_admin_contact_store_path()));}catch(Throwable $e){error_log('Admin IYS overview failed: '.$e->getMessage());kalite_filo_admin_json(['error'=>'service_unavailable'],503);}
