<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/article-store.php';
function article_test_assert(bool $condition,string $message):void{if(!$condition)throw new RuntimeException($message);}
$articleTestRoot=sys_get_temp_dir().DIRECTORY_SEPARATOR.'kalite-filo-article-test-'.getmypid().'-'.bin2hex(random_bytes(4));
function kalite_filo_admin_config():array{global $articleTestRoot;return ['data_root'=>$articleTestRoot];}
function kalite_filo_admin_ensure_private_directory(string $path):void{if(!is_dir($path)&&!mkdir($path,0700,true)&&!is_dir($path))throw new RuntimeException('Test directory failed.');}
function article_test_remove_tree(string $path):void{if(!is_dir($path))return;foreach(scandir($path)?:[] as $entry){if($entry==='.'||$entry==='..')continue;$item=$path.DIRECTORY_SEPARATOR.$entry;is_dir($item)?article_test_remove_tree($item):@unlink($item);}@rmdir($path);}
$locale=['status'=>'draft','title'=>'Test İçerik','slug'=>'test-icerik','markdown'=>"# Başlık\n\n<script>alert(1)</script>\n\n- **Madde**\n\n[Kötü](javascript:alert(1))\n\n[İyi](https://kalitefilo.com.tr/)"];
$article=kalite_filo_admin_normalize_article(['categoryId'=>'filo-yonetimi','locales'=>['tr'=>$locale,'en'=>null]]);
article_test_assert($article['schemaVersion']===1&&$article['revision']===1,'Article draft schema must be versioned.');
article_test_assert($article['locales']['en']===null,'Missing English translation must remain explicit null.');
$updated=kalite_filo_admin_normalize_article(['categoryId'=>'filo-yonetimi','locales'=>['tr'=>$locale]],$article);
article_test_assert($updated['id']===$article['id']&&$updated['revision']===2,'Article revisions must preserve identity and increment.');
$imported=kalite_filo_admin_import_published_article(['id'=>'published-one','importDraft'=>['categoryId'=>'filo-yonetimi','featured'=>true,'locales'=>['tr'=>$locale,'en'=>null]]]);
article_test_assert($imported['id']==='published-one'&&$imported['revision']===1&&$imported['featured']===true,'Published import must preserve stable identity and normalize the draft.');
$coverId=str_repeat('b',32);$withCover=[...$article,'coverMediaId'=>$coverId];kalite_filo_admin_assert_article_media_reference($withCover,[['id'=>$coverId,'usage'=>'article']]);
try{kalite_filo_admin_assert_article_media_reference($withCover,[['id'=>$coverId,'usage'=>'vehicle']]);article_test_assert(false,'Vehicle-only media must not become an article cover.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_import_published_article(['id'=>'published-two','importDraft'=>null]);article_test_assert(false,'Incomplete published import must fail closed.');}catch(InvalidArgumentException){/* expected */}
$html=kalite_filo_admin_render_markdown_preview($locale['markdown']);
article_test_assert(!str_contains($html,'<script>')&&str_contains($html,'&lt;script&gt;'),'Raw HTML must be escaped.');
article_test_assert(!str_contains($html,'javascript:'),'Unsafe link schemes must not survive preview.');
article_test_assert(str_contains($html,'href="https://kalitefilo.com.tr/"'),'HTTPS links must be preserved.');
article_test_assert(!str_contains(kalite_filo_admin_render_markdown_preview('[Dış](//example.com)'), 'href='),'Protocol-relative links must not survive preview.');
$published=[['id'=>'published-one','slug'=>'mevcut-yazi','translations'=>['en'=>['slug'=>'existing-article']]]];
kalite_filo_admin_assert_article_uniqueness([$article],$published);
try{kalite_filo_admin_assert_article_uniqueness([$article,[...$article,'id'=>'other','locales'=>['tr'=>[...$article['locales']['tr'],'slug'=>'test-icerik'],'en'=>null]]],$published);article_test_assert(false,'Duplicate draft slug must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_assert_article_uniqueness([[...$article,'locales'=>['tr'=>[...$article['locales']['tr'],'slug'=>'mevcut-yazi'],'en'=>null]]],$published);article_test_assert(false,'Published slug reuse must fail.');}catch(InvalidArgumentException){/* expected */}
$lock=kalite_filo_admin_lock_article_store();try{kalite_filo_admin_write_article_drafts([$article]);}finally{kalite_filo_admin_unlock_article_store($lock);}
article_test_assert(kalite_filo_admin_article_drafts()[0]['id']===$article['id'],'Atomic article draft store must round-trip.');
article_test_assert(kalite_filo_admin_article_draft_count()===1,'Dashboard draft metric must count the live private article store.');
kalite_filo_admin_write_article_revision('create',$article);
article_test_assert(count(glob($articleTestRoot.DIRECTORY_SEPARATOR.'revisions'.DIRECTORY_SEPARATOR.'articles'.DIRECTORY_SEPARATOR.$article['id'].DIRECTORY_SEPARATOR.'*.json')?:[])===1,'Immutable article revision must be written privately.');
$revisionSummary=kalite_filo_admin_article_revisions($article['id']);
article_test_assert(count($revisionSummary)===1&&in_array('tr.markdown',$revisionSummary[0]['changedFields'],true),'Safe article revision summary must list changed fields.');
article_test_assert(!array_key_exists('after',$revisionSummary[0]),'Article revision response must not expose Markdown bodies.');
try{kalite_filo_admin_normalize_article(['categoryId'=>'unknown','locales'=>['tr'=>$locale]]);article_test_assert(false,'Unknown categories must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_article(['categoryId'=>'filo-yonetimi','locales'=>['tr'=>[...$locale,'status'=>'ready']]]);article_test_assert(false,'Incomplete ready locale must fail.');}catch(InvalidArgumentException){/* expected */}
article_test_remove_tree($articleTestRoot);fwrite(STDOUT,"Admin article store tests passed.\n");
