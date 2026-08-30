<?php
declare(strict_types=1);

const KALITE_FILO_MEDIA_MAX_BYTES=5242880;
const KALITE_FILO_MEDIA_MIN_WIDTH=400;
const KALITE_FILO_MEDIA_MIN_HEIGHT=225;
const KALITE_FILO_MEDIA_MAX_DIMENSION=4096;

function kalite_filo_admin_media_root():string{return (string)kalite_filo_admin_config()['data_root'].DIRECTORY_SEPARATOR.'media'.DIRECTORY_SEPARATOR.'library';}
function kalite_filo_admin_media_catalog_path():string{return kalite_filo_admin_media_root().DIRECTORY_SEPARATOR.'library.json';}
/** @return resource */
function kalite_filo_admin_lock_media_store(){kalite_filo_admin_ensure_private_directory(kalite_filo_admin_media_root());$handle=fopen(kalite_filo_admin_media_catalog_path().'.lock','c+');if($handle===false||!flock($handle,LOCK_EX)){if(is_resource($handle))fclose($handle);throw new RuntimeException('Media store could not be locked.');}@chmod(kalite_filo_admin_media_catalog_path().'.lock',0600);return $handle;}
/** @param resource $handle */
function kalite_filo_admin_unlock_media_store($handle):void{flock($handle,LOCK_UN);fclose($handle);}
/** @return list<array<string,mixed>> */
function kalite_filo_admin_media_records():array{$path=kalite_filo_admin_media_catalog_path();if(!is_file($path))return [];$raw=file_get_contents($path);if(!is_string($raw)||strlen($raw)>8388608)throw new RuntimeException('Media catalog is invalid.');$data=json_decode($raw,true,20,JSON_THROW_ON_ERROR);if(!is_array($data)||($data['schemaVersion']??null)!==1||!is_array($data['records']??null))throw new RuntimeException('Media catalog is invalid.');return array_values($data['records']);}
/** @param list<array<string,mixed>> $records */
function kalite_filo_admin_write_media_records(array $records):void{$path=kalite_filo_admin_media_catalog_path();kalite_filo_admin_ensure_private_directory(dirname($path));$temporary=$path.'.tmp-'.bin2hex(random_bytes(6));$payload=['schemaVersion'=>1,'records'=>array_values($records)];if(file_put_contents($temporary,json_encode($payload,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),LOCK_EX)===false)throw new RuntimeException('Media catalog could not be written.');@chmod($temporary,0600);if(!rename($temporary,$path)){@unlink($temporary);throw new RuntimeException('Media catalog could not be replaced.');}}
/** @return array{mime:string,extension:string,width:int,height:int} */
function kalite_filo_admin_inspect_media_image(string $path,int $size):array{if($size<1||$size>KALITE_FILO_MEDIA_MAX_BYTES)throw new InvalidArgumentException('image_size');$info=@getimagesize($path);if(!is_array($info)||!isset($info[0],$info[1],$info['mime']))throw new InvalidArgumentException('image_type');$types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];$mime=strtolower((string)$info['mime']);if(!isset($types[$mime]))throw new InvalidArgumentException('image_type');$width=(int)$info[0];$height=(int)$info[1];if($width<KALITE_FILO_MEDIA_MIN_WIDTH||$height<KALITE_FILO_MEDIA_MIN_HEIGHT||$width>KALITE_FILO_MEDIA_MAX_DIMENSION||$height>KALITE_FILO_MEDIA_MAX_DIMENSION)throw new InvalidArgumentException('image_dimensions');return ['mime'=>$mime,'extension'=>$types[$mime],'width'=>$width,'height'=>$height];}
function kalite_filo_admin_media_path(string $id,string $extension):string{if(preg_match('/^[a-f0-9]{32}$/',$id)!==1||!in_array($extension,['jpg','png','webp'],true))throw new InvalidArgumentException('invalid_media');return kalite_filo_admin_media_root().DIRECTORY_SEPARATOR.$id.'.'.$extension;}
function kalite_filo_admin_media_text(mixed $value,int $maximum,bool $required=false):string{if(!is_string($value)){if($required)throw new InvalidArgumentException('metadata');return '';}$value=trim($value);if($required&&$value==='')throw new InvalidArgumentException('metadata');if(mb_strlen($value)>$maximum)throw new InvalidArgumentException('metadata');return $value;}
function kalite_filo_admin_media_url(mixed $value):string{$url=kalite_filo_admin_media_text($value,500);if($url!==''&&filter_var($url,FILTER_VALIDATE_URL)===false)throw new InvalidArgumentException('metadata');return $url;}
/** @param array<string,mixed> $input @return array<string,mixed> */
function kalite_filo_admin_normalize_media_metadata(array $input,?array $existing=null):array{$usage=in_array($input['usage']??null,['article','vehicle','general'],true)?$input['usage']:'general';return [...($existing??[]),'alt'=>['tr'=>kalite_filo_admin_media_text($input['altTr']??'',300,true),'en'=>kalite_filo_admin_media_text($input['altEn']??'',300)],'usage'=>$usage,'creator'=>kalite_filo_admin_media_text($input['creator']??'',200),'sourcePage'=>kalite_filo_admin_media_url($input['sourcePage']??''),'licenseName'=>kalite_filo_admin_media_text($input['licenseName']??'',200),'licenseUrl'=>kalite_filo_admin_media_url($input['licenseUrl']??''),'status'=>'draft','updatedAt'=>gmdate('c'),'updatedBy'=>$_SESSION['identity']['id']??null];}
