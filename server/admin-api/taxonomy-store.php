<?php
declare(strict_types=1);

final class KaliteFiloAdminTaxonomyStoreException extends RuntimeException
{
    public function __construct(public readonly string $publicCode,string $internalMessage){parent::__construct($internalMessage);}
}

const KALITE_FILO_TAXONOMY_FIELDS=['make','model','categoryLabel','segmentLabel','fuelLabel'];
function kalite_filo_admin_taxonomy_path():string{return (string)kalite_filo_admin_config()['data_root'].DIRECTORY_SEPARATOR.'drafts'.DIRECTORY_SEPARATOR.'vehicle-taxonomy.json';}
function kalite_filo_admin_taxonomy_id(string $field,string $value):string{return substr(hash('sha256',$field."\0".$value),0,24);}
/** @return array<string,list<array{id:string,value:string,custom:bool,usageCount:int}>> */
function kalite_filo_admin_read_custom_taxonomy():array
{
    $path=kalite_filo_admin_taxonomy_path();if(!is_file($path))return[];
    if(!is_readable($path))throw new KaliteFiloAdminTaxonomyStoreException('taxonomy_store_unreadable','Taxonomy store exists but is not readable.');
    $contents=file_get_contents($path);if(!is_string($contents))throw new KaliteFiloAdminTaxonomyStoreException('taxonomy_store_unreadable','Taxonomy store could not be read.');
    if(strlen($contents)>1048576)throw new KaliteFiloAdminTaxonomyStoreException('taxonomy_store_too_large','Taxonomy store exceeds the 1 MiB limit.');
    $contents=preg_replace('/^\xEF\xBB\xBF/','',$contents)??$contents;
    try{$raw=json_decode($contents,true,8,JSON_THROW_ON_ERROR);}catch(JsonException $exception){throw new KaliteFiloAdminTaxonomyStoreException('taxonomy_store_invalid_json','Taxonomy JSON is invalid: '.$exception->getMessage());}
    if(!is_array($raw)||($raw['schemaVersion']??null)!==1||!is_array($raw['values']??null))throw new KaliteFiloAdminTaxonomyStoreException('taxonomy_store_invalid_schema','Taxonomy store schema is invalid.');
    $values=[];foreach(KALITE_FILO_TAXONOMY_FIELDS as $field){$group=$raw['values'][$field]??[];if(!is_array($group))throw new KaliteFiloAdminTaxonomyStoreException('taxonomy_store_invalid_schema','Taxonomy group is invalid.');$values[$field]=array_values(array_filter($group,static fn($value):bool=>is_string($value)&&trim($value)!==''));}
    return $values;
}
function kalite_filo_admin_taxonomy():array{$records=kalite_filo_admin_vehicle_records();$custom=kalite_filo_admin_read_custom_taxonomy();$result=[];foreach(KALITE_FILO_TAXONOMY_FIELDS as $field){$values=[];foreach($records as $vehicle){$value=trim((string)($vehicle[$field]??''));if($value!=='')$values[$value]=($values[$value]??0)+1;}foreach(($custom[$field]??[]) as $value)if(is_string($value)&&trim($value)!=='')$values[trim($value)]??=0;ksort($values,SORT_NATURAL|SORT_FLAG_CASE);$result[$field]=[];foreach($values as $value=>$count){$label=(string)$value;$result[$field][]=['id'=>kalite_filo_admin_taxonomy_id($field,$label),'value'=>$label,'custom'=>in_array($label,$custom[$field]??[],true),'usageCount'=>$count];}}return $result;}
/** @param array<string,list<string>> $values */
function kalite_filo_admin_write_taxonomy(array $values):void{$path=kalite_filo_admin_taxonomy_path();kalite_filo_admin_ensure_private_directory(dirname($path));$tmp=$path.'.tmp-'.bin2hex(random_bytes(5));file_put_contents($tmp,json_encode(['schemaVersion'=>1,'values'=>$values],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),LOCK_EX);@chmod($tmp,0600);if(!rename($tmp,$path)){@unlink($tmp);throw new RuntimeException('Taxonomy store could not be replaced.');}}
/** @return array<string,list<string>> */
function kalite_filo_admin_custom_taxonomy():array{return kalite_filo_admin_read_custom_taxonomy();}

function kalite_filo_admin_validate_vehicle_taxonomy(array $vehicle):void
{
    $groups=kalite_filo_admin_taxonomy();
    foreach(KALITE_FILO_TAXONOMY_FIELDS as $field){
        $value=trim((string)($vehicle[$field]??''));
        $allowed=array_column($groups[$field]??[],'value');
        if($value===''||!in_array($value,$allowed,true))throw new InvalidArgumentException('invalid_taxonomy');
    }
}
