<?php
declare(strict_types=1);

const KALITE_FILO_ARTICLE_CATEGORIES = ['uzun-donem-kiralama','maliyet-ve-finans','arac-rehberi','filo-yonetimi','elektrikli-araclar','bakim-ve-hasar'];
const KALITE_FILO_ARTICLE_LOCALES = ['tr','en'];

function kalite_filo_admin_article_store_path(): string
{
    return (string)kalite_filo_admin_config()['data_root'].DIRECTORY_SEPARATOR.'drafts'.DIRECTORY_SEPARATOR.'articles.json';
}

/** @return resource */
function kalite_filo_admin_lock_article_store()
{
    $path=kalite_filo_admin_article_store_path();kalite_filo_admin_ensure_private_directory(dirname($path));$handle=fopen($path.'.lock','c+');
    if($handle===false||!flock($handle,LOCK_EX)){if(is_resource($handle))fclose($handle);throw new RuntimeException('Article store could not be locked.');}@chmod($path.'.lock',0600);return $handle;
}

/** @param resource $handle */
function kalite_filo_admin_unlock_article_store($handle): void{flock($handle,LOCK_UN);fclose($handle);}

/** @return list<array<string,mixed>> */
function kalite_filo_admin_article_drafts(): array
{
    $path=kalite_filo_admin_article_store_path();if(!is_file($path))return [];$raw=file_get_contents($path);
    if(!is_string($raw)||strlen($raw)>8388608)throw new RuntimeException('Article draft store is invalid.');
    $data=json_decode($raw,true,20,JSON_THROW_ON_ERROR);if(!is_array($data)||($data['schemaVersion']??null)!==1||!is_array($data['records']??null))throw new RuntimeException('Article draft store is invalid.');return array_values($data['records']);
}

/** @param list<array<string,mixed>> $records */
function kalite_filo_admin_write_article_drafts(array $records): void
{
    $path=kalite_filo_admin_article_store_path();kalite_filo_admin_ensure_private_directory(dirname($path));$temporary=$path.'.tmp-'.bin2hex(random_bytes(6));
    if(file_put_contents($temporary,json_encode(['schemaVersion'=>1,'records'=>array_values($records)],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),LOCK_EX)===false)throw new RuntimeException('Article drafts could not be written.');@chmod($temporary,0600);
    if(!rename($temporary,$path)){@unlink($temporary);throw new RuntimeException('Article drafts could not be replaced.');}
}

/** @param list<array<string,mixed>> $drafts @param list<array<string,mixed>> $published */
function kalite_filo_admin_assert_article_uniqueness(array $drafts,array $published): void
{
    $ids=[];$slugs=['tr'=>[],'en'=>[]];
    foreach($published as $record){$id=(string)($record['id']??'');if($id==='')continue;$ids[$id]='published';$tr=(string)($record['slug']??'');$en=is_array($record['translations']['en']??null)?(string)($record['translations']['en']['slug']??''):'';if($tr!=='')$slugs['tr'][$tr]=$id;if($en!=='')$slugs['en'][$en]=$id;}
    $draftIds=[];foreach($drafts as $draft){$id=(string)($draft['id']??'');if($id===''||isset($draftIds[$id]))throw new InvalidArgumentException('Duplicate article identity.');$draftIds[$id]=true;
        foreach(KALITE_FILO_ARTICLE_LOCALES as $locale){$content=$draft['locales'][$locale]??null;if(!is_array($content))continue;$slug=(string)($content['slug']??'');if($slug===''||isset($slugs[$locale][$slug])&&$slugs[$locale][$slug]!==$id)throw new InvalidArgumentException('Duplicate article slug.');$slugs[$locale][$slug]=$id;}}
}

function kalite_filo_admin_write_article_revision(string $action,array $article,?array $before=null): void
{
    $id=(string)($article['id']??'');if(preg_match('/^[a-z0-9][a-z0-9_-]{1,63}$/',$id)!==1)throw new InvalidArgumentException('Invalid article id.');
    $directory=(string)kalite_filo_admin_config()['data_root'].DIRECTORY_SEPARATOR.'revisions'.DIRECTORY_SEPARATOR.'articles'.DIRECTORY_SEPARATOR.$id;kalite_filo_admin_ensure_private_directory($directory);
    $revision=['schemaVersion'=>1,'id'=>bin2hex(random_bytes(16)),'timestamp'=>gmdate('c'),'action'=>$action,'actorId'=>$_SESSION['identity']['id']??null,'articleId'=>$id,'before'=>$before,'after'=>$article];$path=$directory.DIRECTORY_SEPARATOR.gmdate('Ymd-His').'-'.$revision['id'].'.json';
    if(file_put_contents($path,json_encode($revision,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),LOCK_EX)===false)throw new RuntimeException('Article revision could not be written.');@chmod($path,0600);
}

/** @return list<array<string,mixed>> */
function kalite_filo_admin_article_revisions(string $articleId,int $limit=20): array
{
    if(preg_match('/^[a-z0-9][a-z0-9_-]{1,63}$/',$articleId)!==1)throw new InvalidArgumentException('Invalid article id.');
    $directory=(string)kalite_filo_admin_config()['data_root'].DIRECTORY_SEPARATOR.'revisions'.DIRECTORY_SEPARATOR.'articles'.DIRECTORY_SEPARATOR.$articleId;if(!is_dir($directory))return [];$files=glob($directory.DIRECTORY_SEPARATOR.'*.json')?:[];rsort($files,SORT_STRING);$result=[];
    foreach(array_slice($files,0,max(1,min($limit,50))) as $path){$raw=file_get_contents($path);if(!is_string($raw)||strlen($raw)>1048576)continue;$revision=json_decode($raw,true);if(!is_array($revision)||($revision['articleId']??null)!==$articleId)continue;$before=is_array($revision['before']??null)?$revision['before']:[];$after=is_array($revision['after']??null)?$revision['after']:[];$changed=[];
        foreach(['categoryId','featured','coverMediaId'] as $field)if(($before[$field]??null)!==($after[$field]??null))$changed[]=$field;
        foreach(KALITE_FILO_ARTICLE_LOCALES as $locale)foreach(['status','title','slug','excerpt','coverAlt','publishedAt','readingMinutes','seoTitle','metaDescription','markdown'] as $field)if(($before['locales'][$locale][$field]??null)!==($after['locales'][$locale][$field]??null))$changed[]=$locale.'.'.$field;
        $result[]=['id'=>(string)($revision['id']??''),'timestamp'=>(string)($revision['timestamp']??''),'action'=>(string)($revision['action']??''),'actorId'=>is_string($revision['actorId']??null)?$revision['actorId']:null,'revision'=>(int)($after['revision']??0),'changedFields'=>$changed];}
    return $result;
}

function kalite_filo_admin_article_text(mixed $value, int $maximum, bool $required): string
{
    if (!is_string($value)) { if ($required) throw new InvalidArgumentException('Missing article text.'); return ''; }
    $value=trim($value);if($required&&$value==='')throw new InvalidArgumentException('Missing article text.');
    if(mb_strlen($value)>$maximum)throw new InvalidArgumentException('Article text is too long.');return $value;
}

function kalite_filo_admin_article_slug(mixed $value): string
{
    $slug=kalite_filo_admin_article_text($value,120,true);
    if(preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/',$slug)!==1)throw new InvalidArgumentException('Invalid article slug.');return $slug;
}

/** @return array<string,mixed> */
function kalite_filo_admin_normalize_article_locale(array $input, string $locale): array
{
    if(!in_array($locale,KALITE_FILO_ARTICLE_LOCALES,true))throw new InvalidArgumentException('Invalid article locale.');
    $status=in_array($input['status']??null,['draft','ready'],true)?$input['status']:'draft';$ready=$status==='ready';
    $date=kalite_filo_admin_article_text($input['publishedAt']??'',10,$ready);
    if($date!==''&&(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))))throw new InvalidArgumentException('Invalid article date.');
    $minutes=is_numeric($input['readingMinutes']??null)?(int)$input['readingMinutes']:null;
    if(($ready&&$minutes===null)||($minutes!==null&&($minutes<1||$minutes>120)))throw new InvalidArgumentException('Invalid reading time.');
    return ['status'=>$status,'title'=>kalite_filo_admin_article_text($input['title']??'',160,true),'slug'=>kalite_filo_admin_article_slug($input['slug']??''),'excerpt'=>kalite_filo_admin_article_text($input['excerpt']??'',600,$ready),'coverAlt'=>kalite_filo_admin_article_text($input['coverAlt']??'',300,$ready),'publishedAt'=>$date,'readingMinutes'=>$minutes,'seoTitle'=>kalite_filo_admin_article_text($input['seoTitle']??'',180,$ready),'metaDescription'=>kalite_filo_admin_article_text($input['metaDescription']??'',320,$ready),'markdown'=>kalite_filo_admin_article_text($input['markdown']??'',120000,true)];
}

/** @return array<string,mixed> */
function kalite_filo_admin_normalize_article(array $input, ?array $existing=null): array
{
    $category=(string)($input['categoryId']??'');if(!in_array($category,KALITE_FILO_ARTICLE_CATEGORIES,true))throw new InvalidArgumentException('Invalid article category.');
    $locales=$input['locales']??null;if(!is_array($locales)||!is_array($locales['tr']??null))throw new InvalidArgumentException('Turkish article content is required.');
    $normalized=['tr'=>kalite_filo_admin_normalize_article_locale($locales['tr'],'tr'),'en'=>null];
    if(array_key_exists('en',$locales)&&$locales['en']!==null){if(!is_array($locales['en']))throw new InvalidArgumentException('Invalid English article content.');$normalized['en']=kalite_filo_admin_normalize_article_locale($locales['en'],'en');}
    $coverMediaId=$input['coverMediaId']??null;if($coverMediaId!==null&&(!is_string($coverMediaId)||preg_match('/^[a-f0-9]{32}$/',$coverMediaId)!==1))throw new InvalidArgumentException('Invalid cover media.');
    $id=$existing['id']??('article-'.bin2hex(random_bytes(6)));$now=gmdate('c');
    return ['schemaVersion'=>1,'id'=>$id,'categoryId'=>$category,'featured'=>(bool)($input['featured']??false),'coverMediaId'=>$coverMediaId,'locales'=>$normalized,'revision'=>(int)($existing['revision']??0)+1,'createdAt'=>$existing['createdAt']??$now,'updatedAt'=>$now,'updatedBy'=>$_SESSION['identity']['id']??null];
}

/** @param array<string,mixed> $published @return array<string,mixed> */
function kalite_filo_admin_import_published_article(array $published): array
{
    $id=(string)($published['id']??'');$input=$published['importDraft']??null;
    if(preg_match('/^[a-z0-9][a-z0-9_-]{1,63}$/',$id)!==1||!is_array($input))throw new InvalidArgumentException('Published article cannot be imported.');
    return kalite_filo_admin_normalize_article($input,['id'=>$id,'revision'=>0,'createdAt'=>gmdate('c')]);
}

/** @param array<string,mixed> $article @param list<array<string,mixed>> $media */
function kalite_filo_admin_assert_article_media_reference(array $article,array $media):void
{
    $id=$article['coverMediaId']??null;if($id===null)return;
    foreach($media as $record)if(is_array($record)&&($record['id']??null)===$id&&in_array($record['usage']??null,['article','general'],true))return;
    throw new InvalidArgumentException('Article cover media is unavailable.');
}

function kalite_filo_admin_article_inline(string $value): string
{
    $escaped=htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
    $escaped=preg_replace('/\*\*([^*\n]+)\*\*/','<strong>$1</strong>',$escaped)??$escaped;
    return preg_replace_callback('/\[([^\]\n]+)\]\(([^)\s]+)\)/',static function(array $match):string{$url=html_entity_decode($match[2],ENT_QUOTES|ENT_HTML5,'UTF-8');$local=str_starts_with($url,'/')&&!str_starts_with($url,'//')&&!str_contains($url,'\\');if(!$local&&filter_var($url,FILTER_VALIDATE_URL)===false)return $match[1];$scheme=parse_url($url,PHP_URL_SCHEME);if(is_string($scheme)&&!in_array(strtolower($scheme),['http','https'],true))return $match[1];return '<a href="'.htmlspecialchars($url,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8').'" rel="noopener noreferrer">'.$match[1].'</a>';},$escaped)??$escaped;
}

function kalite_filo_admin_render_markdown_preview(string $markdown): string
{
    if(strlen($markdown)>120000)throw new InvalidArgumentException('Markdown is too long.');
    $lines=preg_split('/\R/',str_replace("\0",'',$markdown))?:[];$html=[];$listOpen=false;
    foreach($lines as $line){$trim=trim($line);if(preg_match('/^[-*]\s+(.+)$/',$trim,$match)){if(!$listOpen){$html[]='<ul>';$listOpen=true;}$html[]='<li>'.kalite_filo_admin_article_inline($match[1]).'</li>';continue;}if($listOpen){$html[]='</ul>';$listOpen=false;}if($trim==='')continue;if(preg_match('/^(#{1,3})\s+(.+)$/',$trim,$match)){$level=strlen($match[1]);$html[]="<h{$level}>".kalite_filo_admin_article_inline($match[2])."</h{$level}>";}elseif(str_starts_with($trim,'> ')){$html[]='<blockquote>'.kalite_filo_admin_article_inline(substr($trim,2)).'</blockquote>';}else{$html[]='<p>'.kalite_filo_admin_article_inline($trim).'</p>';}}
    if($listOpen)$html[]='</ul>';return implode("\n",$html);
}
