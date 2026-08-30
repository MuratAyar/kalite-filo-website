<?php
declare(strict_types=1);
require_once __DIR__.'/auth.php';require_once __DIR__.'/article-store.php';
try{kalite_filo_admin_require_method('POST');kalite_filo_admin_require_same_origin();kalite_filo_admin_start_session();kalite_filo_admin_require_authentication();kalite_filo_admin_require_csrf();$body=kalite_filo_admin_read_json(131072);$markdown=$body['markdown']??null;if(!is_string($markdown))throw new InvalidArgumentException('Invalid Markdown.');kalite_filo_admin_json(['html'=>kalite_filo_admin_render_markdown_preview($markdown)]);}
catch(InvalidArgumentException $e){kalite_filo_admin_json(['error'=>'validation_failed'],422);}catch(Throwable $e){error_log('Article preview failed: '.$e->getMessage());kalite_filo_admin_json(['error'=>'service_unavailable'],503);}
