<?php
declare(strict_types=1);

const KALITE_FILO_ARTICLE_IMAGE_MAX_BYTES = 5242880;

function kalite_filo_admin_article_media_root(): string
{
    // Keep the established private path so existing article covers remain available after the Media UI removal.
    return (string)kalite_filo_admin_config()['data_root'] . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'library';
}
function kalite_filo_admin_article_media_catalog_path(): string{return kalite_filo_admin_article_media_root().DIRECTORY_SEPARATOR.'library.json';}
/** @return resource */
function kalite_filo_admin_lock_article_media_store(){kalite_filo_admin_ensure_private_directory(kalite_filo_admin_article_media_root());$handle=fopen(kalite_filo_admin_article_media_catalog_path().'.lock','c+');if($handle===false||!flock($handle,LOCK_EX)){if(is_resource($handle))fclose($handle);throw new RuntimeException('Article media store could not be locked.');}@chmod(kalite_filo_admin_article_media_catalog_path().'.lock',0600);return $handle;}
/** @param resource $handle */
function kalite_filo_admin_unlock_article_media_store($handle):void{flock($handle,LOCK_UN);fclose($handle);}
/** @return list<array<string,mixed>> */
function kalite_filo_admin_article_media_records():array{$path=kalite_filo_admin_article_media_catalog_path();if(!is_file($path))return [];$raw=file_get_contents($path);if(!is_string($raw)||strlen($raw)>8388608)throw new RuntimeException('Article media catalog is invalid.');$data=json_decode($raw,true,20,JSON_THROW_ON_ERROR);if(!is_array($data)||($data['schemaVersion']??null)!==1||!is_array($data['records']??null))throw new RuntimeException('Article media catalog is invalid.');return array_values(array_filter($data['records'],static fn(mixed $record):bool=>is_array($record)&&in_array($record['usage']??'article',['article','general'],true)));}
/** @param list<array<string,mixed>> $records */
function kalite_filo_admin_write_article_media_records(array $records):void{$path=kalite_filo_admin_article_media_catalog_path();kalite_filo_admin_ensure_private_directory(dirname($path));$temporary=$path.'.tmp-'.bin2hex(random_bytes(6));if(file_put_contents($temporary,json_encode(['schemaVersion'=>1,'records'=>array_values($records)],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),LOCK_EX)===false)throw new RuntimeException('Article media catalog could not be written.');@chmod($temporary,0600);if(!rename($temporary,$path)){@unlink($temporary);throw new RuntimeException('Article media catalog could not be replaced.');}}
function kalite_filo_admin_article_media_path(string $id,string $extension):string{if(preg_match('/^[a-f0-9]{32}$/',$id)!==1||!in_array($extension,['jpg','png','webp'],true))throw new InvalidArgumentException('invalid_media');return kalite_filo_admin_article_media_root().DIRECTORY_SEPARATOR.$id.'.'.$extension;}
/** @return array{mime:string,extension:string,width:int,height:int} */
function kalite_filo_admin_inspect_article_image(string $path,int $size):array{if($size<1||$size>KALITE_FILO_ARTICLE_IMAGE_MAX_BYTES)throw new InvalidArgumentException('image_size');$info=@getimagesize($path);if(!is_array($info)||($info['mime']??null)!=='image/webp'||($info[0]??null)!==1600||($info[1]??null)!==900)throw new InvalidArgumentException('image_not_optimized');return ['mime'=>'image/webp','extension'=>'webp','width'=>1600,'height'=>900];}
