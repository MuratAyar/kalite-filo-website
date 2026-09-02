<?php
declare(strict_types=1);
require_once __DIR__.'/auth.php';
require_once __DIR__.'/read-model.php';
require_once __DIR__.'/article-store.php';
require_once __DIR__.'/featured-article-store.php';

try {
    kalite_filo_admin_start_session();kalite_filo_admin_require_authentication();
    $published=kalite_filo_admin_content_snapshot()['articles']['records']??[];$drafts=kalite_filo_admin_article_drafts();$byId=[];
    foreach(is_array($published)?$published:[] as $record)if(is_array($record)&&is_string($record['id']??null))$byId[$record['id']]=['id'=>$record['id'],'categoryId'=>$record['categoryId'],'title'=>$record['title'],'status'=>'published'];
    foreach($drafts as $draft){if(!is_array($draft)||($draft['locales']['tr']['status']??null)!=='ready')continue;$byId[(string)$draft['id']]=['id'=>$draft['id'],'categoryId'=>$draft['categoryId'],'title'=>$draft['locales']['tr']['title'],'status'=>'draft'];}
    if(($_SERVER['REQUEST_METHOD']??'')==='GET')kalite_filo_admin_json(['selection'=>kalite_filo_admin_featured_articles_selection(),'articles'=>array_values($byId),'categories'=>KALITE_FILO_ARTICLE_CATEGORIES]);
    kalite_filo_admin_require_method('POST');kalite_filo_admin_require_same_origin();kalite_filo_admin_require_csrf();kalite_filo_admin_require_roles(['owner','admin','editor']);$body=kalite_filo_admin_read_json();
    $main=$body['mainArticleId']??null;$categoryIds=$body['categoryArticleIds']??null;if(!is_string($main)||!isset($byId[$main])||!is_array($categoryIds)||array_keys($categoryIds)!==KALITE_FILO_ARTICLE_CATEGORIES)throw new InvalidArgumentException('featured_articles_incomplete');
    foreach(KALITE_FILO_ARTICLE_CATEGORIES as $category){$id=$categoryIds[$category]??null;if(!is_string($id)||!isset($byId[$id])||($byId[$id]['categoryId']??null)!==$category)throw new InvalidArgumentException('featured_article_ineligible');}
    $selection=['mainArticleId'=>$main,'categoryArticleIds'=>$categoryIds];kalite_filo_admin_write_featured_articles_selection($selection);kalite_filo_admin_audit('featured_article_change','success',['mainArticleId'=>$main,'categoryArticleIds'=>$categoryIds]);kalite_filo_admin_json(['selection'=>$selection]);
} catch(InvalidArgumentException $e){kalite_filo_admin_json(['error'=>$e->getMessage()],422);}catch(Throwable $e){error_log('Featured articles failed: '.$e->getMessage());kalite_filo_admin_json(['error'=>'service_unavailable'],503);}
