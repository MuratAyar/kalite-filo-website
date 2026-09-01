<?php
declare(strict_types=1);

const KALITE_FILO_ADMIN_CONTACT_COLUMNS = [
    'id', 'email', 'status', 'consent_source', 'consent_text_version',
    'consent_at', 'confirmed_at', 'unsubscribed_at', 'created_at',
    'updated_at', 'iys_status', 'iys_synced_at', 'recipient_type',
];
const KALITE_FILO_ADMIN_MAX_CONTACT_STORE_BYTES = 26214400;
const KALITE_FILO_ADMIN_MAX_AUDIT_FILE_BYTES = 10485760;

function kalite_filo_admin_contact_store_path(): string
{
    $configured = getenv('KALITE_FILO_CONTACT_STORE_PATH');
    if (is_string($configured) && trim($configured) !== '') {
        $path = trim($configured);
    } else {
        $config = kalite_filo_admin_config();
        $path = $config['environment'] === 'staging'
            ? (string) $config['data_root'] . DIRECTORY_SEPARATOR . 'newsletter-contacts.csv'
            : dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'private'
                . DIRECTORY_SEPARATOR . 'kalite-filo-data'
                . DIRECTORY_SEPARATOR . 'newsletter-contacts.csv';
    }
    if (!kalite_filo_admin_is_absolute_path($path)) {
        throw new RuntimeException('Contact store path must be absolute.');
    }
    kalite_filo_admin_assert_outside_document_root($path);
    return $path;
}

/** @return array{contacts: int, approved: int, iysPending: int, unsubscribed: int} */
function kalite_filo_admin_contact_metrics(string $path): array
{
    $empty = ['contacts' => 0, 'approved' => 0, 'iysPending' => 0, 'unsubscribed' => 0];
    if (!is_file($path)) return $empty;
    $size = filesize($path);
    if (!is_int($size) || $size > KALITE_FILO_ADMIN_MAX_CONTACT_STORE_BYTES) {
        throw new RuntimeException('Contact store exceeds the dashboard read limit.');
    }
    $handle = fopen($path, 'rb');
    if ($handle === false || !flock($handle, LOCK_SH)) {
        if (is_resource($handle)) fclose($handle);
        throw new RuntimeException('Contact store could not be read.');
    }
    try {
        $header = fgetcsv($handle);
        $legacy = array_slice(KALITE_FILO_ADMIN_CONTACT_COLUMNS, 0, -1);
        if ($header !== KALITE_FILO_ADMIN_CONTACT_COLUMNS && $header !== $legacy) {
            throw new RuntimeException('Contact store schema is not recognized.');
        }
        $byEmail = [];
        while (($values = fgetcsv($handle)) !== false) {
            if ($header === $legacy && count($values) === count($legacy)) $values[] = 'BIREYSEL';
            if (count($values) !== count(KALITE_FILO_ADMIN_CONTACT_COLUMNS)) continue;
            $row = array_combine(KALITE_FILO_ADMIN_CONTACT_COLUMNS, $values);
            if (!is_array($row)) continue;
            $email = strtolower(trim((string) $row['email']));
            if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) continue;
            $state = $byEmail[$email] ?? ['approved' => false, 'iysPending' => false, 'unsubscribed' => false];
            $unsubscribed = trim((string) $row['unsubscribed_at']) !== '' || $row['status'] === 'unsubscribed';
            $state['unsubscribed'] = $state['unsubscribed'] || $unsubscribed;
            $hasEvidence = trim((string) $row['consent_at']) !== ''
                && trim((string) $row['consent_text_version']) !== '';
            if ($row['status'] === 'approved' && $hasEvidence) {
                $state['approved'] = true;
                if (in_array($row['iys_status'], ['pending', 'failed'], true)) {
                    $state['iysPending'] = true;
                }
            }
            $byEmail[$email] = $state;
        }
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
    $metrics = $empty;
    $metrics['contacts'] = count($byEmail);
    foreach ($byEmail as $state) {
        if ($state['unsubscribed']) {
            $metrics['unsubscribed']++;
            continue;
        }
        if ($state['approved']) $metrics['approved']++;
        if ($state['iysPending']) $metrics['iysPending']++;
    }
    return $metrics;
}

/** @return array{records:list<array<string,string>>,page:int,limit:int,total:int,hasNext:bool} */
function kalite_filo_admin_contact_page(string $path,int $page,int $limit,string $query='',string $status='',string $iysStatus='',string $source='',string $sortField='',string $sortDirection=''):array
{
    if($page<1||$page>1000||$limit<1||$limit>100)throw new InvalidArgumentException('Invalid contact pagination.');
    $allowedStatuses=['','approved','active','lead_only','unsubscribed'];$allowedIys=['','not_requested','pending','approved','failed','synced'];$allowedSources=['','website_newsletter','website_quote_form','website_contact_form'];$sortFields=['consentAt'=>'consent_at','iysSyncedAt'=>'iys_synced_at','unsubscribedAt'=>'unsubscribed_at','createdAt'=>'created_at','updatedAt'=>'updated_at'];
    if(!in_array($status,$allowedStatuses,true)||!in_array($iysStatus,$allowedIys,true)||!in_array($source,$allowedSources,true)||mb_strlen($query)>160||($sortField!==''&&!isset($sortFields[$sortField]))||!in_array($sortDirection,['','asc','desc'],true)||(($sortField==='')!==($sortDirection==='')))throw new InvalidArgumentException('Invalid contact filter.');
    if(!is_file($path))return ['records'=>[],'page'=>$page,'limit'=>$limit,'total'=>0,'hasNext'=>false];$size=filesize($path);if(!is_int($size)||$size>KALITE_FILO_ADMIN_MAX_CONTACT_STORE_BYTES)throw new RuntimeException('Contact store exceeds the read limit.');$handle=fopen($path,'rb');if($handle===false||!flock($handle,LOCK_SH)){if(is_resource($handle))fclose($handle);throw new RuntimeException('Contact store could not be read.');}
    try{$header=fgetcsv($handle);$legacy=array_slice(KALITE_FILO_ADMIN_CONTACT_COLUMNS,0,-1);if($header!==KALITE_FILO_ADMIN_CONTACT_COLUMNS&&$header!==$legacy)throw new RuntimeException('Contact store schema is not recognized.');$matched=[];$needle=mb_strtolower(trim($query));while(($values=fgetcsv($handle))!==false){if($header===$legacy&&count($values)===count($legacy))$values[]='BIREYSEL';if(count($values)!==count(KALITE_FILO_ADMIN_CONTACT_COLUMNS))continue;$row=array_combine(KALITE_FILO_ADMIN_CONTACT_COLUMNS,$values);if(!is_array($row)||filter_var($row['email'],FILTER_VALIDATE_EMAIL)===false)continue;if($needle!==''&&!str_contains(mb_strtolower($row['email']),$needle))continue;if($status!==''&&$row['status']!==$status)continue;if($iysStatus!==''&&$row['iys_status']!==$iysStatus)continue;if($source!==''&&$row['consent_source']!==$source)continue;$matched[]=$row;}}
    finally{flock($handle,LOCK_UN);fclose($handle);}$column=$sortField!==''?$sortFields[$sortField]:'updated_at';$direction=$sortDirection!==''?$sortDirection:'desc';usort($matched,static function(array $a,array $b)use($column,$direction):int{$left=(string)($a[$column]??'');$right=(string)($b[$column]??'');if($left===$right)return strcmp((string)$a['id'],(string)$b['id']);if($left==='')return 1;if($right==='')return-1;$comparison=strcmp($left,$right);return $direction==='asc'?$comparison:-$comparison;});$total=count($matched);$offset=($page-1)*$limit;return ['records'=>array_values(array_slice($matched,$offset,$limit)),'page'=>$page,'limit'=>$limit,'total'=>$total,'hasNext'=>$offset+$limit<$total];
}

/** @return array<string,string> */
function kalite_filo_admin_update_contact_iys(string $path,string $id,string $iysStatus,string $recipientType):array
{
    $allowedIys=['not_requested','pending','failed','approved','synced'];
    $recipientType=strtoupper(trim($recipientType));
    if(preg_match('/^[1-9][0-9]{0,19}$/',$id)!==1||!in_array($iysStatus,$allowedIys,true)||!in_array($recipientType,['BIREYSEL','TACIR'],true))throw new InvalidArgumentException('Invalid IYS operation.');
    $lock=fopen($path.'.lock','c+');if($lock===false||!flock($lock,LOCK_EX)){if(is_resource($lock))fclose($lock);throw new RuntimeException('Contact store could not be locked.');}
    try{
        if(!is_file($path))throw new InvalidArgumentException('Contact was not found.');
        $input=fopen($path,'rb');if($input===false)throw new RuntimeException('Contact store could not be read.');
        $header=fgetcsv($input);$legacy=array_slice(KALITE_FILO_ADMIN_CONTACT_COLUMNS,0,-1);if($header!==KALITE_FILO_ADMIN_CONTACT_COLUMNS&&$header!==$legacy){fclose($input);throw new RuntimeException('Contact store schema is not recognized.');}
        $rows=[];$updated=null;while(($values=fgetcsv($input))!==false){if($header===$legacy&&count($values)===count($legacy))$values[]='BIREYSEL';if(count($values)!==count(KALITE_FILO_ADMIN_CONTACT_COLUMNS))continue;$row=array_combine(KALITE_FILO_ADMIN_CONTACT_COLUMNS,$values);if(!is_array($row))continue;if($row['id']===$id){$hasConsent=$row['status']==='approved'&&trim($row['consent_at'])!==''&&trim($row['consent_text_version'])!==''&&trim($row['unsubscribed_at'])==='';if(in_array($iysStatus,['pending','failed','approved','synced'],true)&&!$hasConsent){fclose($input);throw new InvalidArgumentException('IYS status requires valid consent evidence.');}$row['iys_status']=$iysStatus;$row['iys_synced_at']=in_array($iysStatus,['approved','synced'],true)?gmdate('Y-m-d H:i:s'):'';$row['recipient_type']=$recipientType;$row['updated_at']=gmdate('Y-m-d H:i:s');$updated=$row;}$rows[]=$row;}
        fclose($input);if($updated===null)throw new InvalidArgumentException('Contact was not found.');
        $temporary=$path.'.tmp-'.bin2hex(random_bytes(6));$output=fopen($temporary,'xb');if($output===false)throw new RuntimeException('Temporary contact store could not be created.');fputcsv($output,KALITE_FILO_ADMIN_CONTACT_COLUMNS);foreach($rows as $row)fputcsv($output,array_map(static fn(string $column):string=>(string)$row[$column],KALITE_FILO_ADMIN_CONTACT_COLUMNS));fflush($output);fclose($output);@chmod($temporary,0600);if(!rename($temporary,$path)){@unlink($temporary);throw new RuntimeException('Contact store could not be replaced atomically.');}@chmod($path,0600);return $updated;
    }finally{flock($lock,LOCK_UN);fclose($lock);}
}

function kalite_filo_admin_normalize_contact_datetime(mixed $value):string
{
    if(!is_string($value)||trim($value)==='')return '';$value=trim($value);$date=DateTimeImmutable::createFromFormat('!Y-m-d\TH:i',$value,new DateTimeZone('UTC'));if(!$date)$date=DateTimeImmutable::createFromFormat('!Y-m-d H:i:s',$value,new DateTimeZone('UTC'));if(!$date)throw new InvalidArgumentException('Invalid contact date.');return $date->format('Y-m-d H:i:s');
}

/** @param array<string,mixed> $changes @return array{record:array<string,string>,changedFields:list<string>,before:array<string,string>,after:array<string,string>} */
function kalite_filo_admin_correct_contact(string $path,string $id,array $changes):array
{
    $status=$changes['status']??null;$source=$changes['consentSource']??null;$iysStatus=$changes['iysStatus']??null;$recipientType=strtoupper(trim((string)($changes['recipientType']??'')));
    if(preg_match('/^[1-9][0-9]{0,19}$/',$id)!==1||!is_string($status)||!in_array($status,['approved','active','lead_only','unsubscribed'],true)||!is_string($source)||!in_array($source,['website_newsletter','website_quote_form','website_contact_form'],true)||!is_string($iysStatus)||!in_array($iysStatus,['not_requested','pending','failed','approved','synced'],true)||!in_array($recipientType,['BIREYSEL','TACIR'],true))throw new InvalidArgumentException('Invalid contact correction.');
    $consentVersion=trim((string)($changes['consentTextVersion']??''));if(strlen($consentVersion)>160||preg_match('/[\r\n]/',$consentVersion)===1)throw new InvalidArgumentException('Invalid consent version.');$consentAt=kalite_filo_admin_normalize_contact_datetime($changes['consentAt']??'');$confirmedAt=kalite_filo_admin_normalize_contact_datetime($changes['confirmedAt']??'');$unsubscribedAt=kalite_filo_admin_normalize_contact_datetime($changes['unsubscribedAt']??'');
    $hasConsent=$status==='approved'&&$consentVersion!==''&&$consentAt!==''&&$unsubscribedAt==='';if($status==='unsubscribed'&&$unsubscribedAt==='')throw new InvalidArgumentException('Unsubscribe date is required.');if($status!=='unsubscribed'&&$unsubscribedAt!=='')throw new InvalidArgumentException('Unsubscribe state is inconsistent.');if(in_array($iysStatus,['pending','failed','approved','synced'],true)&&!$hasConsent)throw new InvalidArgumentException('IYS state requires consent evidence.');
    $lock=fopen($path.'.lock','c+');if($lock===false||!flock($lock,LOCK_EX)){if(is_resource($lock))fclose($lock);throw new RuntimeException('Contact store could not be locked.');}
    try{if(!is_file($path))throw new InvalidArgumentException('Contact was not found.');$input=fopen($path,'rb');if($input===false)throw new RuntimeException('Contact store could not be read.');$header=fgetcsv($input);$legacy=array_slice(KALITE_FILO_ADMIN_CONTACT_COLUMNS,0,-1);if($header!==KALITE_FILO_ADMIN_CONTACT_COLUMNS&&$header!==$legacy){fclose($input);throw new RuntimeException('Contact store schema is not recognized.');}$rows=[];$updated=null;$changedFields=[];$before=[];$after=[];while(($values=fgetcsv($input))!==false){if($header===$legacy&&count($values)===count($legacy))$values[]='BIREYSEL';if(count($values)!==count(KALITE_FILO_ADMIN_CONTACT_COLUMNS))continue;$row=array_combine(KALITE_FILO_ADMIN_CONTACT_COLUMNS,$values);if(!is_array($row))continue;if($row['id']===$id){$next=['status'=>$status,'consent_source'=>$source,'consent_text_version'=>$consentVersion,'consent_at'=>$consentAt,'confirmed_at'=>$confirmedAt,'unsubscribed_at'=>$unsubscribedAt,'iys_status'=>$iysStatus,'iys_synced_at'=>in_array($iysStatus,['approved','synced'],true)?gmdate('Y-m-d H:i:s'):'','recipient_type'=>$recipientType];$before=array_intersect_key($row,$next);foreach($next as $field=>$value)if($row[$field]!==$value)$changedFields[]=$field;$row=[...$row,...$next,'updated_at'=>gmdate('Y-m-d H:i:s')];$after=array_intersect_key($row,$next);$updated=$row;}$rows[]=$row;}fclose($input);if($updated===null)throw new InvalidArgumentException('Contact was not found.');$temporary=$path.'.tmp-'.bin2hex(random_bytes(6));$output=fopen($temporary,'xb');if($output===false)throw new RuntimeException('Temporary contact store could not be created.');fputcsv($output,KALITE_FILO_ADMIN_CONTACT_COLUMNS);foreach($rows as $row)fputcsv($output,array_map(static fn(string $column):string=>(string)$row[$column],KALITE_FILO_ADMIN_CONTACT_COLUMNS));fflush($output);fclose($output);@chmod($temporary,0600);if(!rename($temporary,$path)){@unlink($temporary);throw new RuntimeException('Contact store could not be replaced atomically.');}@chmod($path,0600);return ['record'=>$updated,'changedFields'=>array_values(array_unique($changedFields)),'before'=>$before,'after'=>$after];}finally{flock($lock,LOCK_UN);fclose($lock);}
}

/** @return array{counts:array{pending:int,failed:int,synced:int,approved:int,notRequested:int},records:list<array<string,string>>,exports:list<array<string,mixed>>,lastExportedAt:?string} */
function kalite_filo_admin_iys_overview(string $path):array
{
    $counts=['pending'=>0,'failed'=>0,'synced'=>0,'approved'=>0,'notRequested'=>0];$records=[];
    for($pageNumber=1;$pageNumber<=1000;$pageNumber++){$page=kalite_filo_admin_contact_page($path,$pageNumber,100);foreach($page['records'] as $row){$state=(string)$row['iys_status'];if($state==='pending')$counts['pending']++;elseif($state==='failed')$counts['failed']++;elseif($state==='synced')$counts['synced']++;elseif($state==='approved')$counts['approved']++;elseif($state==='not_requested')$counts['notRequested']++;if(in_array($state,['pending','failed','synced','approved'],true)&&count($records)<200)$records[]=$row;}if(!$page['hasNext'])break;}
    $directory=dirname($path);$exports=[];foreach(array_slice(array_reverse(glob($directory.DIRECTORY_SEPARATOR.'iys-email-permissions-????-??-??.csv')?:[]),0,50) as $file){$name=basename($file);if(preg_match('/^iys-email-permissions-\d{4}-\d{2}-\d{2}\.csv$/',$name)!==1)continue;$size=filesize($file);$modified=filemtime($file);if(!is_int($size)||!is_int($modified))continue;$exports[]=['id'=>$name,'fileName'=>$name,'size'=>$size,'createdAt'=>gmdate('c',$modified)];}
    $last=null;$statePath=$directory.DIRECTORY_SEPARATOR.'iys-export-state.json';if(is_file($statePath)){$decoded=json_decode((string)file_get_contents($statePath),true);if(is_array($decoded)&&is_string($decoded['last_exported_at_utc']??null))$last=$decoded['last_exported_at_utc'];}
    return ['counts'=>$counts,'records'=>$records,'exports'=>$exports,'lastExportedAt'=>$last];
}

/** @return list<array<string, mixed>> */
function kalite_filo_admin_recent_audit(string $dataRoot, int $limit = 8): array
{
    $files = glob($dataRoot . DIRECTORY_SEPARATOR . 'audit' . DIRECTORY_SEPARATOR . 'audit-*.jsonl') ?: [];
    rsort($files, SORT_STRING);
    $records = [];
    foreach (array_slice($files, 0, 3) as $file) {
        $size = filesize($file);
        if (!is_int($size) || $size > KALITE_FILO_ADMIN_MAX_AUDIT_FILE_BYTES) continue;
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!is_array($lines)) continue;
        foreach (array_reverse($lines) as $line) {
            try {
                $record = json_decode($line, true, 8, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                continue;
            }
            if (!is_array($record)) continue;
            $records[] = [
                'id' => (string) ($record['id'] ?? ''),
                'timestamp' => (string) ($record['timestamp'] ?? ''),
                'adminId' => is_string($record['adminId'] ?? null) ? $record['adminId'] : null,
                'action' => (string) ($record['action'] ?? ''),
                'entityType' => (string) ($record['entityType'] ?? ''),
                'entityId' => is_string($record['entityId'] ?? null) ? $record['entityId'] : null,
                'result' => (string) ($record['result'] ?? ''),
            ];
            if (count($records) >= $limit) return $records;
        }
    }
    return $records;
}

/** @return array{records:list<array<string,mixed>>,page:int,limit:int,hasNext:bool} */
function kalite_filo_admin_audit_page(string $dataRoot, int $page, int $limit, string $action = '', string $result = ''): array
{
    if ($page < 1 || $page > 1000 || $limit < 1 || $limit > 50) throw new InvalidArgumentException('Invalid audit pagination.');
    if (($action !== '' && preg_match('/^[a-z0-9_]{1,64}$/', $action) !== 1)
        || ($result !== '' && preg_match('/^[a-z0-9_]{1,32}$/', $result) !== 1)) {
        throw new InvalidArgumentException('Invalid audit filter.');
    }
    $files = glob($dataRoot . DIRECTORY_SEPARATOR . 'audit' . DIRECTORY_SEPARATOR . 'audit-*.jsonl') ?: [];
    rsort($files, SORT_STRING);
    $offset = ($page - 1) * $limit;
    $matched = 0;
    $records = [];
    foreach (array_slice($files, 0, 24) as $file) {
        $size = filesize($file);
        if (!is_int($size) || $size > KALITE_FILO_ADMIN_MAX_AUDIT_FILE_BYTES) continue;
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!is_array($lines)) continue;
        foreach (array_reverse($lines) as $line) {
            try { $record = json_decode($line, true, 8, JSON_THROW_ON_ERROR); }
            catch (JsonException) { continue; }
            if (!is_array($record)) continue;
            $recordAction = (string) ($record['action'] ?? '');
            $recordResult = (string) ($record['result'] ?? '');
            if (($action !== '' && $recordAction !== $action) || ($result !== '' && $recordResult !== $result)) continue;
            if ($matched++ < $offset) continue;
            $records[] = [
                'id'=>(string)($record['id']??''),'timestamp'=>(string)($record['timestamp']??''),
                'adminId'=>is_string($record['adminId']??null)?$record['adminId']:null,
                'role'=>is_string($record['role']??null)?$record['role']:null,
                'action'=>$recordAction,'entityType'=>(string)($record['entityType']??''),
                'entityId'=>is_string($record['entityId']??null)?$record['entityId']:null,'result'=>$recordResult,
            ];
            if (count($records) > $limit) break 2;
        }
    }
    $hasNext = count($records) > $limit;
    if ($hasNext) array_pop($records);
    return ['records'=>$records,'page'=>$page,'limit'=>$limit,'hasNext'=>$hasNext];
}

/** @return array<string, mixed> */
function kalite_filo_admin_content_snapshot(): array
{
    $path = __DIR__ . DIRECTORY_SEPARATOR . '_content-snapshot.php';
    if (!is_file($path) || !is_readable($path)) {
        throw new RuntimeException('Admin content snapshot is unavailable.');
    }
    $snapshot = require $path;
    if (!is_array($snapshot) || ($snapshot['schemaVersion'] ?? null) !== 1) {
        throw new RuntimeException('Admin content snapshot is invalid.');
    }
    return $snapshot;
}
