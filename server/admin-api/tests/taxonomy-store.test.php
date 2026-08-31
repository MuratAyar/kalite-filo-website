<?php
declare(strict_types=1);

$root=sys_get_temp_dir().DIRECTORY_SEPARATOR.'kalite-filo-taxonomy-'.bin2hex(random_bytes(6));
function kalite_filo_admin_config():array{global $root;return['data_root'=>$root];}
function kalite_filo_admin_ensure_private_directory(string $path):void{if(!is_dir($path)&&!mkdir($path,0700,true)&&!is_dir($path))throw new RuntimeException('directory');}
function kalite_filo_admin_vehicle_records():array{return[
    ['make'=>'Renault','model'=>'Clio','categoryLabel'=>'Binek','segmentLabel'=>'B Hatchback','fuelLabel'=>'Benzin'],
    ['make'=>'Toyota','model'=>'Corolla','categoryLabel'=>'Binek','segmentLabel'=>'C Sedan','fuelLabel'=>'Tam Hybrid'],
    ['make'=>'Renault','model'=>'Megane','categoryLabel'=>'Binek','segmentLabel'=>'C Sedan','fuelLabel'=>'Benzin'],
];}
function taxonomy_assert(bool $condition,string $message):void{if(!$condition)throw new RuntimeException($message);}
function taxonomy_remove(string $path):void{if(!is_dir($path))return;foreach(scandir($path)?:[]as$entry){if($entry==='.'||$entry==='..')continue;$item=$path.DIRECTORY_SEPARATOR.$entry;is_dir($item)?taxonomy_remove($item):@unlink($item);}@rmdir($path);}
require_once dirname(__DIR__).'/taxonomy-store.php';

try{
    $groups=kalite_filo_admin_taxonomy();
    taxonomy_assert(count($groups['make'])===2&&$groups['make'][0]['usageCount']===2,'Vehicle values must seed taxonomy when no custom file exists.');
    kalite_filo_admin_write_taxonomy(['make'=>['Ford'],'model'=>[],'categoryLabel'=>[],'segmentLabel'=>[],'fuelLabel'=>['Elektrik']]);
    $groups=kalite_filo_admin_taxonomy();
    taxonomy_assert(count($groups['make'])===3&&$groups['make'][0]['value']==='Ford'&&$groups['make'][0]['custom']===true,'Custom values must merge with seeded values.');
    file_put_contents(kalite_filo_admin_taxonomy_path(),'{broken');
    try{kalite_filo_admin_taxonomy();taxonomy_assert(false,'Malformed taxonomy JSON must fail safely.');}
    catch(KaliteFiloAdminTaxonomyStoreException $exception){taxonomy_assert($exception->publicCode==='taxonomy_store_invalid_json','Malformed JSON must have a safe diagnostic code.');}
}finally{taxonomy_remove($root);}
fwrite(STDOUT,"Admin taxonomy store tests passed.\n");
