<?php
declare(strict_types=1);
require_once __DIR__.'/auth.php';require_once __DIR__.'/article-store.php';
try{kalite_filo_admin_require_method('GET');kalite_filo_admin_start_session();kalite_filo_admin_require_authentication();kalite_filo_admin_json(['revisions'=>kalite_filo_admin_article_revisions((string)($_GET['id']??''))]);}
catch(InvalidArgumentException $e){kalite_filo_admin_json(['error'=>'validation_failed'],422);}catch(Throwable $e){error_log('Article revisions failed: '.$e->getMessage());kalite_filo_admin_json(['error'=>'service_unavailable'],503);}
