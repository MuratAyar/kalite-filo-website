<?php
declare(strict_types=1);
require_once __DIR__.'/auth.php';require_once __DIR__.'/read-model.php';require_once __DIR__.'/article-store.php';require_once __DIR__.'/media-store.php';
try{
    kalite_filo_admin_start_session();kalite_filo_admin_require_authentication();
    $snapshot=kalite_filo_admin_content_snapshot();$records=$snapshot['articles']['records']??null;
    if(!is_array($records))throw new RuntimeException('Article snapshot is invalid.');
    if(($_SERVER['REQUEST_METHOD']??'')==='GET'){$publicRecords=array_map(static function(array $record):array{unset($record['importDraft']);return $record;},array_values($records));kalite_filo_admin_json(['articles'=>$publicRecords,'drafts'=>kalite_filo_admin_article_drafts()]);}
    kalite_filo_admin_require_method('POST');kalite_filo_admin_require_same_origin();kalite_filo_admin_require_csrf();kalite_filo_admin_require_roles(['owner','admin','editor']);$body=kalite_filo_admin_read_json(262144);
    $lock=kalite_filo_admin_lock_article_store();try{$drafts=kalite_filo_admin_article_drafts();$article=kalite_filo_admin_normalize_article($body);kalite_filo_admin_assert_article_media_reference($article,kalite_filo_admin_media_records());$drafts[]=$article;kalite_filo_admin_assert_article_uniqueness($drafts,$records);kalite_filo_admin_write_article_revision('create',$article);kalite_filo_admin_write_article_drafts($drafts);}finally{kalite_filo_admin_unlock_article_store($lock);}kalite_filo_admin_audit('article_create','success',['id'=>$article['id']]);kalite_filo_admin_json(['article'=>$article],201);
}catch(InvalidArgumentException $e){kalite_filo_admin_json(['error'=>'validation_failed'],422);}catch(Throwable $e){error_log('Admin articles failed: '.$e->getMessage());kalite_filo_admin_json(['error'=>'service_unavailable'],503);}
