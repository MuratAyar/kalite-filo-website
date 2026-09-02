import { createHash } from "node:crypto";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const vehicleFields=["id","sourceId","contentStatus","sourceStatus","priority","featured","make","model","trim","modelYearLabel","categoryLabel","segmentLabel","fuelLabel","transmissionLabel","powerHp","seats","slug","summary","featureLabels","dataConfidence","editorialReviewRequired","priceStatus"];
const articleCategories=new Map([["uzun-donem-kiralama","long-term-leasing"],["maliyet-ve-finans","cost-and-finance"],["arac-rehberi","vehicle-guide"],["filo-yonetimi","fleet-management"],["elektrikli-araclar","electric-vehicles"],["bakim-ve-hasar","maintenance-and-damage"]]);

function fail(message){throw new Error(`Admin snapshot materialization failed: ${message}`);}
function hashSnapshot(snapshot){return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");}
function text(value){return typeof value==="string"?value.trim():"";}
function validateMediaRecord(record){
  if(!record||typeof record!=="object"||!text(record.vehicleId)||!/^[a-z0-9][a-z0-9-]*\.(?:jpg|jpeg|png|webp)$/.test(text(record.fileName))||!Number.isSafeInteger(record.width)||record.width<=0||!Number.isSafeInteger(record.height)||record.height<=0||(record.sortOrder!==undefined&&(!Number.isSafeInteger(record.sortOrder)||record.sortOrder<1))||!["alt","creator","licenseName","localDerivativeNote"].every((field)=>text(record[field]))||(record.rightsBasis==="user-provided-for-site-use"?(record.sourcePage!==undefined||record.licenseUrl!==undefined):(!/^https:\/\//.test(record.sourcePage)||!/^https:\/\//.test(record.licenseUrl)))||!/^[a-f0-9]{64}$/.test(record.checksum))fail("invalid vehicle media record");
  return record;
}
function createMediaMaterialization(snapshot,published,source){
  if(source?.schemaVersion!==2||!Array.isArray(source.records))fail("unsupported vehicle media contract");
  const base=new Map();for(const record of source.records){validateMediaRecord(record);const records=base.get(record.vehicleId)??[];if(records.some((item)=>item.fileName===record.fileName))fail("duplicate vehicle media record");records.push({...record,sortOrder:Number.isSafeInteger(record.sortOrder)?record.sortOrder:records.length+1});records.sort((left,right)=>left.sortOrder-right.sortOrder);base.set(record.vehicleId,records);}
  const records=published.flatMap((vehicle)=>{
    const uploads=Array.isArray(vehicle.galleryMedia)&&vehicle.galleryMedia.length?vehicle.galleryMedia:(vehicle.draftMedia?[vehicle.draftMedia]:[]);
    if(uploads.length){
      return uploads.map((media,index)=>{const extension=text(media.extension).toLowerCase();const record={vehicleId:vehicle.id,fileName:`${vehicle.id}-${text(media.checksum).slice(0,12)}.${extension}`,width:media.width,height:media.height,alt:text(media.alt),creator:text(media.creator),sourcePage:text(media.sourcePage),licenseName:text(media.licenseName),licenseUrl:text(media.licenseUrl),localDerivativeNote:"Yönetim paneline yüklenen doğrulanmış yerel dosya.",checksum:text(media.checksum),size:media.size,sourceKind:"admin-upload",sourceMediaId:text(media.id),sourceExtension:extension,sortOrder:index+1};return validateMediaRecord(record);});
    }
    return (base.get(vehicle.id)??[]).map((record)=>({...record,sourceKind:"repository"}));
  });
  const mediaIds=new Set(records.map((record)=>record.vehicleId));
  for(const id of snapshot.featuredVehicleIds)if(!mediaIds.has(id))fail(`featured vehicle ${id} has no materializable media`);
  return{schemaVersion:2,records};
}
function normalizeLibraryMedia(record){
  if(!record||typeof record!=="object"||!/^[a-f0-9]{32}$/.test(text(record.id))||!['jpg','png','webp'].includes(text(record.extension))||!/^[a-f0-9]{64}$/.test(text(record.checksum))||!Number.isSafeInteger(record.size)||record.size<1||record.size>5242880||!Number.isSafeInteger(record.width)||record.width<400||record.width>4096||!Number.isSafeInteger(record.height)||record.height<225||record.height>4096||!['article','general'].includes(record.usage)||!record.alt||typeof record.alt!=="object"||!text(record.alt.tr))fail("invalid article cover media");
  return{id:record.id,extension:record.extension,checksum:record.checksum,size:record.size,width:record.width,height:record.height,alt:{tr:text(record.alt.tr),en:text(record.alt.en)},usage:record.usage,creator:text(record.creator),sourcePage:text(record.sourcePage),licenseName:text(record.licenseName),licenseUrl:text(record.licenseUrl),fileName:`article-${record.id}-${record.checksum.slice(0,12)}.${record.extension}`,publicPath:`/images/filo-rehberi/article-${record.id}-${record.checksum.slice(0,12)}.${record.extension}`};
}
function articleText(value,field,maximum){const result=text(value);if(!result||result.length>maximum||result.includes("\0"))fail(`invalid article ${field}`);return result;}
function normalizeArticleLocale(value,locale){
  if(!value||typeof value!=="object"||value.status!=="ready")fail(`article ${locale} locale is not ready`);
  const result={status:"ready",title:articleText(value.title,`${locale} title`,160),slug:articleText(value.slug,`${locale} slug`,120),excerpt:articleText(value.excerpt,`${locale} excerpt`,600),coverAlt:articleText(value.coverAlt,`${locale} cover alt`,300),publishedAt:articleText(value.publishedAt,`${locale} published date`,10),readingMinutes:value.readingMinutes,seoTitle:articleText(value.seoTitle,`${locale} SEO title`,180),metaDescription:articleText(value.metaDescription,`${locale} meta description`,320),markdown:articleText(value.markdown,`${locale} Markdown`,120000)};
  const dateMatch=result.publishedAt.match(/^(\d{4})-(\d{2})-(\d{2})$/);const date=dateMatch?new Date(Date.UTC(Number(dateMatch[1]),Number(dateMatch[2])-1,Number(dateMatch[3]))):null;const validDate=date!==null&&date.toISOString().slice(0,10)===result.publishedAt;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug)||!validDate||!Number.isSafeInteger(result.readingMinutes)||result.readingMinutes<1||result.readingMinutes>120)fail(`invalid article ${locale} locale`);
  return result;
}
function articleFrontmatter(article,locale,content){
  const fields=[['article_id',article.id],['locale',locale],['title',content.title],['slug',content.slug],['category_id',article.categoryId],['featured',article.featured===true],['publication_status','ready'],['published_at',content.publishedAt],['reading_minutes',content.readingMinutes],['cover_alt',content.coverAlt],...(article.coverMediaId?[['cover_media_id',article.coverMediaId]]:[]),['seo_title',content.seoTitle],['meta_description',content.metaDescription]];
  return `---\n${fields.map(([key,value])=>`${key}: ${typeof value==="string"?JSON.stringify(value):String(value)}`).join("\n")}\n---\n\n${content.markdown.trim()}\n`;
}
export function createArticleMaterialization(request){
  const snapshot=validatePublishRequest(request);if(!Array.isArray(snapshot.articles)||!Array.isArray(snapshot.media))fail("unsupported article snapshot");
  const availableMedia=new Map();for(const media of snapshot.media){if(!media||typeof media!=="object"||typeof media.id!=="string"||availableMedia.has(media.id))fail("invalid or duplicate central media identity");availableMedia.set(media.id,media);}const ids=new Set(),slugs={tr:new Set(),en:new Set()},records=[],files=[];
  for(const article of [...snapshot.articles].sort((left,right)=>String(left?.id).localeCompare(String(right?.id),"en"))){
    if(!article||typeof article!=="object"||!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(text(article.id))||ids.has(article.id)||!articleCategories.has(article.categoryId)||!article.locales||typeof article.locales!=="object")fail("invalid or duplicate article identity");ids.add(article.id);const englishCategoryId=articleCategories.get(article.categoryId);
    if(article.coverMediaId!==null&&article.coverMediaId!==undefined&&!availableMedia.has(article.coverMediaId))fail(`article ${article.id} cover media is unavailable`);const cover=article.coverMediaId!==null&&article.coverMediaId!==undefined?normalizeLibraryMedia(availableMedia.get(article.coverMediaId)):null;
    if(article.locales.tr?.status!=="ready")continue;
    const tr=normalizeArticleLocale(article.locales.tr,"tr");if(slugs.tr.has(tr.slug))fail("duplicate Turkish article slug");slugs.tr.add(tr.slug);
    const locales={tr:{...tr,categoryId:article.categoryId,routePath:`/filo-rehberi/${article.categoryId}/${tr.slug}/`,contentPath:`src/content/filo-rehberi/${tr.slug}.md`},en:null};files.push({path:locales.tr.contentPath,content:articleFrontmatter(article,"tr",tr)});
    if(article.locales.en!==null&&article.locales.en!==undefined){
      if(article.locales.en.status==="ready"){const en=normalizeArticleLocale(article.locales.en,"en");if(slugs.en.has(en.slug))fail("duplicate English article slug");slugs.en.add(en.slug);locales.en={...en,categoryId:englishCategoryId,routePath:`/en/fleet-guide/${englishCategoryId}/${en.slug}/`,contentPath:`src/content/filo-rehberi/${en.slug}-en.md`};files.push({path:locales.en.contentPath,content:articleFrontmatter(article,"en",en)});}
      else if(article.locales.en.status!=="draft")fail(`article ${article.id} has an invalid English state`);
    }
    records.push({id:article.id,categoryId:article.categoryId,featured:article.featured===true,coverMediaId:article.coverMediaId??null,cover,revision:Number.isSafeInteger(article.revision)?article.revision:null,locales});
  }
  files.sort((left,right)=>left.path.localeCompare(right.path,"en"));return{manifest:{schemaVersion:1,records,featuredArticles:snapshot.featuredArticles??null},files};
}

function uniqueRegistry(records,identityField,label){
  if(!Array.isArray(records))fail(`invalid ${label} source`);const identities=new Set(),slugs=new Set();
  for(const record of records){const identity=text(record?.[identityField]),slug=text(record?.slug);if(!identity||!slug||identities.has(identity)||slugs.has(slug))fail(`invalid or duplicate ${label} source`);identities.add(identity);slugs.add(slug);}
}
function registryCover(record,locale,existing){return record.cover?{src:record.cover.publicPath,alt:locale.coverAlt,width:record.cover.width,height:record.cover.height}:existing?.coverImage??null;}
export function createArticleRegistryMaterialization(articleMaterialization,turkishSource=[],englishSource=[]){
  if(!articleMaterialization?.manifest||!Array.isArray(articleMaterialization.manifest.records))fail("invalid article materialization");uniqueRegistry(turkishSource,"id","Turkish article registry");uniqueRegistry(englishSource,"sourceArticleId","English article registry");
  const turkish=new Map(turkishSource.map((record)=>[record.id,record])),english=new Map(englishSource.map((record)=>[record.sourceArticleId,record]));
  for(const record of articleMaterialization.manifest.records){const tr=record.locales.tr,existing=turkish.get(record.id);turkish.set(record.id,{id:record.id,slug:tr.slug,title:tr.title,excerpt:tr.excerpt,categoryId:record.categoryId,tagIds:Array.isArray(existing?.tagIds)?existing.tagIds:[],publishedAt:tr.publishedAt,readingMinutes:tr.readingMinutes,featured:record.featured,coverAlt:tr.coverAlt,coverImage:registryCover(record,tr,existing),contentKey:tr.slug,seo:{title:tr.seoTitle,description:tr.metaDescription}});if(record.locales.en){const en=record.locales.en,existingEnglish=english.get(record.id);english.set(record.id,{sourceArticleId:record.id,slug:en.slug,title:en.title,excerpt:en.excerpt,categoryId:en.categoryId,publishedAt:en.publishedAt,readingMinutes:en.readingMinutes,featured:record.featured,coverAlt:en.coverAlt,coverImage:registryCover(record,en,existingEnglish),contentKey:`${en.slug}-en`,seo:{title:en.seoTitle,description:en.metaDescription}});}}
  const selection=articleMaterialization.manifest.featuredArticles;const mainId=text(selection?.mainArticleId),categoryIds=selection?.categoryArticleIds&&typeof selection.categoryArticleIds==="object"?selection.categoryArticleIds:{};
  if(mainId){if(!turkish.has(mainId))fail("main featured article is unavailable");for(const [id,record] of turkish)turkish.set(id,{...record,featured:id===mainId});for(const [id,record] of english)english.set(id,{...record,featured:id===mainId});}
  for(const [category,id] of Object.entries(categoryIds)){const record=turkish.get(id);if(!record||record.categoryId!==category)fail(`category featured article is unavailable: ${category}`);}
  for(const [id,record] of turkish)turkish.set(id,{...record,categoryFeatured:categoryIds[record.categoryId]===id});
  for(const [id,record] of english){const tr=turkish.get(id);english.set(id,{...record,categoryFeatured:tr?.categoryFeatured===true});}
  const trRecords=[...turkish.values()].sort((left,right)=>Number(right.featured)-Number(left.featured)||String(right.publishedAt).localeCompare(String(left.publishedAt),"en")||left.id.localeCompare(right.id,"en"));const enRecords=[...english.values()].sort((left,right)=>left.sourceArticleId.localeCompare(right.sourceArticleId,"en"));uniqueRegistry(trRecords,"id","materialized Turkish article registry");uniqueRegistry(enRecords,"sourceArticleId","materialized English article registry");return{turkish:trRecords,english:enRecords};
}

export function validatePublishRequest(request){
  if(!request||typeof request!=="object"||request.schemaVersion!==1||request.target!=="staging"||!request.snapshot||typeof request.snapshot!=="object")fail("invalid publish request envelope");
  if(typeof request.snapshotHash!=="string"||request.snapshotHash!==hashSnapshot(request.snapshot))fail("snapshot hash mismatch");
  const snapshot=request.snapshot;
  if(snapshot.formatVersion!==1||!Array.isArray(snapshot.vehicles)||!Array.isArray(snapshot.featuredVehicleIds))fail("unsupported snapshot format");
  if(snapshot.featuredVehicleIds.length!==4||new Set(snapshot.featuredVehicleIds).size!==4)fail("featured order must contain four unique ids");
  const identities=new Set(),sourceIds=new Set(),slugs=new Set();
  for(const vehicle of snapshot.vehicles){
    if(!vehicle||typeof vehicle!=="object"||typeof vehicle.id!=="string"||typeof vehicle.sourceId!=="string"||typeof vehicle.slug!=="string")fail("invalid vehicle identity");
    if(identities.has(vehicle.id)||sourceIds.has(vehicle.sourceId)||slugs.has(vehicle.slug))fail("duplicate vehicle identity");
    identities.add(vehicle.id);sourceIds.add(vehicle.sourceId);slugs.add(vehicle.slug);
    if(vehicle.publicationStatus==="published"&&(!Number.isSafeInteger(vehicle.priceAmountMinor)||vehicle.priceAmountMinor<=0||vehicle.priceAmountMinor%100!==0))fail(`published vehicle ${vehicle.id} has no valid price`);
  }
  if(snapshot.featuredVehicleIds.some((id)=>!identities.has(id)))fail("featured order references an unknown vehicle");
  return snapshot;
}

export function createVehicleMaterialization(request,priceSourceMetadata,vehicleMediaSource={schemaVersion:2,records:[]}){
  const snapshot=validatePublishRequest(request);
  const order=new Map(snapshot.featuredVehicleIds.map((id,index)=>[id,index]));
  const published=snapshot.vehicles.filter((vehicle)=>vehicle.publicationStatus==="published").sort((left,right)=>{
    const leftOrder=order.get(left.id),rightOrder=order.get(right.id);
    if(leftOrder!==undefined||rightOrder!==undefined)return(leftOrder??Number.MAX_SAFE_INTEGER)-(rightOrder??Number.MAX_SAFE_INTEGER);
    return String(left.sourceId).localeCompare(String(right.sourceId),"en");
  });
  const records=published.map((vehicle)=>Object.fromEntries(vehicleFields.map((field)=>[field,field==="featured"?order.has(vehicle.id):vehicle[field]])));
  const amountsMinor=Object.fromEntries(published.map((vehicle)=>[vehicle.sourceId,vehicle.priceAmountMinor]));
  return {records,prices:{source:priceSourceMetadata,amountsMinor},featuredVehicleIds:[...snapshot.featuredVehicleIds],media:createMediaMaterialization(snapshot,published,vehicleMediaSource)};
}

export function writeVehicleMaterialization(outputRoot,materialization){
  const root=path.resolve(outputRoot);const dataRoot=path.join(root,"src","data");mkdirSync(dataRoot,{recursive:true});
  for(const [name,value] of [["vehicle-portfolio.json",materialization.records],["vehicle-list-prices.json",materialization.prices],["featured-vehicle-ids.json",materialization.featuredVehicleIds],["vehicle-media.json",materialization.media]])writeFileSync(path.join(dataRoot,name),`${JSON.stringify(value,null,2)}\n`,"utf8");
  return dataRoot;
}

export function writeArticleMaterialization(outputRoot,materialization,turkishSource=[],englishSource=[]){
  const root=path.resolve(outputRoot),dataRoot=path.join(root,"src","data"),contentRoot=path.join(root,"src","content","filo-rehberi");mkdirSync(dataRoot,{recursive:true});mkdirSync(contentRoot,{recursive:true});
  const registry=createArticleRegistryMaterialization(materialization,turkishSource,englishSource);writeFileSync(path.join(dataRoot,"article-records.json"),`${JSON.stringify(registry.turkish,null,2)}\n`,"utf8");writeFileSync(path.join(dataRoot,"article-admin-records.en.json"),`${JSON.stringify(registry.english,null,2)}\n`,"utf8");
  for(const file of materialization.files){const target=path.resolve(root,file.path);if(!target.startsWith(`${root}${path.sep}`)||path.dirname(target)!==contentRoot)fail("article output escaped the review directory");writeFileSync(target,file.content,"utf8");}
  return contentRoot;
}

function hashFile(file){return createHash("sha256").update(readFileSync(file)).digest("hex");}
function containedFile(root,segments){const resolvedRoot=realpathSync(root),candidate=path.resolve(resolvedRoot,...segments);if(!candidate.startsWith(`${resolvedRoot}${path.sep}`)||!existsSync(candidate)||!statSync(candidate).isFile())fail("private media source is unavailable");const realCandidate=realpathSync(candidate);if(!realCandidate.startsWith(`${resolvedRoot}${path.sep}`))fail("private media source escaped its root");return realCandidate;}
function verifyPrivateSource(source,checksum,size){if(statSync(source).size!==size||hashFile(source)!==checksum)fail("private media checksum or size mismatch");}
function copyVerified(source,destination,checksum,size,outputRoot){mkdirSync(path.dirname(destination),{recursive:true});const realOutput=realpathSync(outputRoot),realParent=realpathSync(path.dirname(destination));if(!realParent.startsWith(`${realOutput}${path.sep}`)||!path.resolve(destination).startsWith(`${realOutput}${path.sep}`)||existsSync(destination)&&lstatSync(destination).isSymbolicLink())fail("media output escaped the review directory");copyFileSync(source,destination);if(statSync(destination).size!==size||hashFile(destination)!==checksum)fail("copied media checksum or size mismatch");}
export function copyPrivateMediaBinaries(outputRoot,privateDataRoot,vehicleMaterialization,articleMaterialization){
  const output=path.resolve(outputRoot),privateRoot=path.resolve(privateDataRoot);if(!existsSync(output)||!statSync(output).isDirectory()||!existsSync(privateRoot)||!statSync(privateRoot).isDirectory())fail("media roots are unavailable");const plan=[];
  for(const record of vehicleMaterialization.media.records.filter((item)=>item.sourceKind==="admin-upload").sort((left,right)=>left.vehicleId.localeCompare(right.vehicleId,"en"))){if(!/^[a-f0-9]{32}$/.test(text(record.sourceMediaId))||!['jpg','png','webp'].includes(record.sourceExtension)||!Number.isSafeInteger(record.size)||record.size<1||record.size>5242880)fail("invalid private vehicle media source");const source=containedFile(privateRoot,["media","vehicles",`${record.sourceMediaId}.${record.sourceExtension}`]);for(const relative of [["public","images","vehicles",record.fileName],["public","images","vehicles","cards",record.fileName]])plan.push({kind:"vehicle",sourceId:record.sourceMediaId,source,relative,checksum:record.checksum,size:record.size});}
  const covers=new Map();for(const article of articleMaterialization.manifest.records)if(article.cover)covers.set(article.cover.id,article.cover);
  for(const cover of [...covers.values()].sort((left,right)=>left.id.localeCompare(right.id,"en"))){const source=containedFile(privateRoot,["media","library",`${cover.id}.${cover.extension}`]),relative=["public","images","filo-rehberi",cover.fileName];plan.push({kind:"article",sourceId:cover.id,source,relative,checksum:cover.checksum,size:cover.size});}
  const destinations=new Set();for(const item of plan){const destination=item.relative.join("/");if(destinations.has(destination))fail("duplicate media output path");destinations.add(destination);verifyPrivateSource(item.source,item.checksum,item.size);}
  return plan.map((item)=>{const destination=path.resolve(output,...item.relative);copyVerified(item.source,destination,item.checksum,item.size,output);return{kind:item.kind,sourceId:item.sourceId,path:item.relative.join("/"),checksum:item.checksum,size:item.size};});
}

const reviewManifestPath="review-manifest.json";
function reviewFiles(root,directory=root,prefix=""){
  const files=[];
  for(const entry of readdirSync(directory,{withFileTypes:true}).sort((left,right)=>left.name.localeCompare(right.name,"en"))){
    const relative=prefix?`${prefix}/${entry.name}`:entry.name,target=path.join(directory,entry.name);
    if(entry.isSymbolicLink())fail("review output contains a symbolic link");
    if(entry.isDirectory())files.push(...reviewFiles(root,target,relative));
    else if(entry.isFile()&&relative!==reviewManifestPath)files.push(relative);
    else if(!entry.isFile())fail("review output contains an unsupported entry");
  }
  return files;
}
function expectedReviewPaths(articleMaterialization,copied){
  const paths=["src/data/vehicle-portfolio.json","src/data/vehicle-list-prices.json","src/data/featured-vehicle-ids.json","src/data/vehicle-media.json","src/data/article-records.json","src/data/article-admin-records.en.json",...articleMaterialization.files.map((file)=>file.path),...copied.map((file)=>file.path)];
  const normalized=paths.map((value)=>String(value).replaceAll("\\","/"));
  if(normalized.some((value)=>!value||value.startsWith("/")||value.split("/").includes(".."))||new Set(normalized).size!==normalized.length)fail("invalid or duplicate expected review output");
  return normalized.sort((left,right)=>left.localeCompare(right,"en"));
}
function reviewRecord(root,relative){
  const target=path.resolve(root,...relative.split("/"));
  if(!target.startsWith(`${root}${path.sep}`)||!existsSync(target)||!lstatSync(target).isFile()||lstatSync(target).isSymbolicLink())fail(`review output is unavailable: ${relative}`);
  return{path:relative,size:statSync(target).size,sha256:hashFile(target)};
}
function assertReviewFileSet(root,expected){
  const actual=reviewFiles(root);
  if(actual.length!==expected.length||actual.some((value,index)=>value!==expected[index]))fail("review output file set mismatch");
}
export function writeReviewManifest(outputRoot,snapshotHash,articleMaterialization,copied){
  const root=path.resolve(outputRoot);if(!existsSync(root)||!statSync(root).isDirectory()||!/^[a-f0-9]{64}$/.test(snapshotHash))fail("invalid review manifest inputs");
  const expected=expectedReviewPaths(articleMaterialization,copied);assertReviewFileSet(root,expected);
  const manifest={schemaVersion:1,snapshotHash,files:expected.map((relative)=>reviewRecord(root,relative))};
  writeFileSync(path.join(root,reviewManifestPath),`${JSON.stringify(manifest,null,2)}\n`,"utf8");return manifest;
}
export function verifyReviewManifest(outputRoot,expectedSnapshotHash){
  const root=path.resolve(outputRoot),manifestTarget=path.join(root,reviewManifestPath);
  if(!existsSync(manifestTarget)||!lstatSync(manifestTarget).isFile()||lstatSync(manifestTarget).isSymbolicLink())fail("review manifest is unavailable");
  let manifest;try{manifest=JSON.parse(readFileSync(manifestTarget,"utf8"));}catch{fail("review manifest is malformed");}
  if(!manifest||manifest.schemaVersion!==1||manifest.snapshotHash!==expectedSnapshotHash||!Array.isArray(manifest.files))fail("review manifest identity mismatch");
  const expected=[];for(const record of manifest.files){if(!record||typeof record.path!=="string"||!Number.isSafeInteger(record.size)||record.size<0||!/^[a-f0-9]{64}$/.test(record.sha256))fail("invalid review manifest record");expected.push(record.path);}
  const sorted=[...expected].sort((left,right)=>left.localeCompare(right,"en"));if(new Set(expected).size!==expected.length||expected.some((value,index)=>value!==sorted[index]))fail("invalid review manifest ordering");
  assertReviewFileSet(root,expected);
  for(const record of manifest.files){const actual=reviewRecord(root,record.path);if(actual.size!==record.size||actual.sha256!==record.sha256)fail(`review output checksum mismatch: ${record.path}`);}
  return manifest;
}

function argument(name){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:undefined;}
const invokedPath=process.argv[1]?path.resolve(process.argv[1]):"";
if(invokedPath===path.resolve(fileURLToPath(import.meta.url))){
  const requestPath=argument("--request"),outputRoot=argument("--output"),priceSourcePath=argument("--price-source"),mediaSourcePath=argument("--media-source"),articleSourcePath=argument("--article-source"),articleEnglishSourcePath=argument("--article-en-source"),privateDataRoot=argument("--private-data-root");
  if(!requestPath||!outputRoot||!priceSourcePath||!mediaSourcePath||!articleSourcePath||!articleEnglishSourcePath||!privateDataRoot)fail("use --request, --output, --price-source, --media-source, --article-source, --article-en-source and --private-data-root");
  const request=JSON.parse(readFileSync(path.resolve(requestPath),"utf8"));const priceSource=JSON.parse(readFileSync(path.resolve(priceSourcePath),"utf8"));const mediaSource=JSON.parse(readFileSync(path.resolve(mediaSourcePath),"utf8"));const articleSource=JSON.parse(readFileSync(path.resolve(articleSourcePath),"utf8"));const articleEnglishSource=JSON.parse(readFileSync(path.resolve(articleEnglishSourcePath),"utf8"));
  const vehicleMaterialization=createVehicleMaterialization(request,priceSource.source,mediaSource),articleMaterialization=createArticleMaterialization(request);const vehicleTarget=writeVehicleMaterialization(outputRoot,vehicleMaterialization),articleTarget=writeArticleMaterialization(outputRoot,articleMaterialization,articleSource,articleEnglishSource),copied=copyPrivateMediaBinaries(outputRoot,privateDataRoot,vehicleMaterialization,articleMaterialization),manifest=writeReviewManifest(outputRoot,request.snapshotHash,articleMaterialization,copied);verifyReviewManifest(outputRoot,request.snapshotHash);
  process.stdout.write(`Admin materialization written to ${vehicleTarget} and ${articleTarget}; ${copied.length} private binaries and ${manifest.files.length} manifested outputs verified\n`);
}
