<?php
declare(strict_types=1);
function article_media_test_assert(bool $condition,string $message):void{if(!$condition)throw new RuntimeException($message);}
$articleMediaTestRoot=sys_get_temp_dir().DIRECTORY_SEPARATOR.'kalite-filo-article-media-test-'.getmypid().'-'.bin2hex(random_bytes(4));
function kalite_filo_admin_config():array{global $articleMediaTestRoot;return ['data_root'=>$articleMediaTestRoot];}
function kalite_filo_admin_ensure_private_directory(string $path):void{if(!is_dir($path)&&!mkdir($path,0700,true)&&!is_dir($path))throw new RuntimeException('directory');}
require_once dirname(__DIR__).'/article-media-store.php';
function article_media_test_remove_tree(string $path):void{if(!is_dir($path))return;foreach(scandir($path)?:[] as $entry){if($entry==='.'||$entry==='..')continue;$item=$path.DIRECTORY_SEPARATOR.$entry;is_dir($item)?article_media_test_remove_tree($item):@unlink($item);}@rmdir($path);}
$stored=['id'=>str_repeat('a',32),'articleId'=>'article-one','extension'=>'webp','mime'=>'image/webp','size'=>100,'width'=>1600,'height'=>900,'checksum'=>str_repeat('b',64),'alt'=>['tr'=>'Blog kapağı','en'=>''],'usage'=>'article'];
$lock=kalite_filo_admin_lock_article_media_store();try{kalite_filo_admin_write_article_media_records([$stored]);}finally{kalite_filo_admin_unlock_article_media_store($lock);}
article_media_test_assert(kalite_filo_admin_article_media_records()[0]['id']===str_repeat('a',32),'Article cover catalog must round-trip atomically.');
article_media_test_assert(str_ends_with(kalite_filo_admin_article_media_path(str_repeat('a',32),'webp'),str_repeat('a',32).'.webp'),'Article cover path must use the opaque identity.');
try{kalite_filo_admin_article_media_path('../escape','webp');article_media_test_assert(false,'Path traversal identity must fail.');}catch(InvalidArgumentException){/* expected */}
article_media_test_remove_tree($articleMediaTestRoot);fwrite(STDOUT,"Admin article media store tests passed.\n");
