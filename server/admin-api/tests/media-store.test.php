<?php
declare(strict_types=1);
function media_test_assert(bool $condition,string $message):void{if(!$condition)throw new RuntimeException($message);}
$mediaTestRoot=sys_get_temp_dir().DIRECTORY_SEPARATOR.'kalite-filo-media-test-'.getmypid().'-'.bin2hex(random_bytes(4));
function kalite_filo_admin_config():array{global $mediaTestRoot;return ['data_root'=>$mediaTestRoot];}
function kalite_filo_admin_ensure_private_directory(string $path):void{if(!is_dir($path)&&!mkdir($path,0700,true)&&!is_dir($path))throw new RuntimeException('directory');}
require_once dirname(__DIR__).'/media-store.php';
function media_test_remove_tree(string $path):void{if(!is_dir($path))return;foreach(scandir($path)?:[] as $entry){if($entry==='.'||$entry==='..')continue;$item=$path.DIRECTORY_SEPARATOR.$entry;is_dir($item)?media_test_remove_tree($item):@unlink($item);}@rmdir($path);}
$record=kalite_filo_admin_normalize_media_metadata(['altTr'=>'Araç görseli','altEn'=>'Vehicle image','usage'=>'article','creator'=>'Test','sourcePage'=>'https://example.com/source','licenseName'=>'CC','licenseUrl'=>'https://example.com/license']);
media_test_assert($record['usage']==='article'&&$record['alt']['tr']==='Araç görseli','Localized media metadata must normalize.');
$stored=[...$record,'id'=>str_repeat('a',32),'extension'=>'webp','mime'=>'image/webp'];$lock=kalite_filo_admin_lock_media_store();try{kalite_filo_admin_write_media_records([$stored]);}finally{kalite_filo_admin_unlock_media_store($lock);}
media_test_assert(kalite_filo_admin_media_records()[0]['id']===str_repeat('a',32),'Atomic media catalog must round-trip.');
media_test_assert(str_ends_with(kalite_filo_admin_media_path(str_repeat('a',32),'webp'),str_repeat('a',32).'.webp'),'Generated media path must use the opaque identity.');
try{kalite_filo_admin_media_path('../escape','webp');media_test_assert(false,'Path traversal identity must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_media_metadata(['altTr'=>'','usage'=>'article']);media_test_assert(false,'Turkish alt text must be required.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_media_metadata(['altTr'=>'Test','sourcePage'=>'javascript:alert(1)']);media_test_assert(false,'Unsafe source URL must fail.');}catch(InvalidArgumentException){/* expected */}
media_test_remove_tree($mediaTestRoot);fwrite(STDOUT,"Admin media store tests passed.\n");
