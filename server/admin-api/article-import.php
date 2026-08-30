<?php
declare(strict_types=1);
require_once __DIR__.'/auth.php';require_once __DIR__.'/read-model.php';require_once __DIR__.'/article-store.php';
try{
    kalite_filo_admin_start_session();kalite_filo_admin_require_authentication();kalite_filo_admin_require_method('POST');kalite_filo_admin_require_same_origin();kalite_filo_admin_require_csrf();kalite_filo_admin_require_roles(['owner','admin','editor']);
    $body=kalite_filo_admin_read_json();$id=$body['id']??null;if(!is_string($id)||preg_match('/^[a-z0-9][a-z0-9_-]{1,63}$/',$id)!==1)throw new InvalidArgumentException('Invalid article id.');
    $snapshot=kalite_filo_admin_content_snapshot();$records=$snapshot['articles']['records']??null;if(!is_array($records))throw new RuntimeException('Article snapshot is invalid.');
    $published=null;foreach($records as $record)if(is_array($record)&&($record['id']??null)===$id){$published=$record;break;}if(!is_array($published))kalite_filo_admin_json(['error'=>'not_found'],404);
    $lock=kalite_filo_admin_lock_article_store();try{$drafts=kalite_filo_admin_article_drafts();foreach($drafts as $draft)if(($draft['id']??null)===$id)kalite_filo_admin_json(['error'=>'already_imported'],409);$article=kalite_filo_admin_import_published_article($published);$drafts[]=$article;kalite_filo_admin_assert_article_uniqueness($drafts,$records);kalite_filo_admin_write_article_revision('import',$article);kalite_filo_admin_write_article_drafts($drafts);}finally{kalite_filo_admin_unlock_article_store($lock);}
    kalite_filo_admin_audit('article_import','success',['id'=>$article['id']]);kalite_filo_admin_json(['article'=>$article],201);
}catch(InvalidArgumentException $e){kalite_filo_admin_json(['error'=>'validation_failed'],422);}catch(Throwable $e){error_log('Admin article import failed: '.$e->getMessage());kalite_filo_admin_json(['error'=>'service_unavailable'],503);}
