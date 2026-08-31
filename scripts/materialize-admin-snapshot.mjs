import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const vehicleFields=["id","sourceId","contentStatus","sourceStatus","priority","featured","make","model","trim","modelYearLabel","categoryLabel","segmentLabel","fuelLabel","transmissionLabel","powerHp","seats","slug","summary","featureLabels","dataConfidence","editorialReviewRequired","priceStatus"];

function fail(message){throw new Error(`Admin snapshot materialization failed: ${message}`);}
function hashSnapshot(snapshot){return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");}

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

export function createVehicleMaterialization(request,priceSourceMetadata){
  const snapshot=validatePublishRequest(request);
  const order=new Map(snapshot.featuredVehicleIds.map((id,index)=>[id,index]));
  const published=snapshot.vehicles.filter((vehicle)=>vehicle.publicationStatus==="published").sort((left,right)=>{
    const leftOrder=order.get(left.id),rightOrder=order.get(right.id);
    if(leftOrder!==undefined||rightOrder!==undefined)return(leftOrder??Number.MAX_SAFE_INTEGER)-(rightOrder??Number.MAX_SAFE_INTEGER);
    return String(left.sourceId).localeCompare(String(right.sourceId),"en");
  });
  const records=published.map((vehicle)=>Object.fromEntries(vehicleFields.map((field)=>[field,field==="featured"?order.has(vehicle.id):vehicle[field]])));
  const amountsMinor=Object.fromEntries(published.map((vehicle)=>[vehicle.sourceId,vehicle.priceAmountMinor]));
  return {records,prices:{source:priceSourceMetadata,amountsMinor},featuredVehicleIds:[...snapshot.featuredVehicleIds]};
}

export function writeVehicleMaterialization(outputRoot,materialization){
  const root=path.resolve(outputRoot);const dataRoot=path.join(root,"src","data");mkdirSync(dataRoot,{recursive:true});
  for(const [name,value] of [["vehicle-portfolio.json",materialization.records],["vehicle-list-prices.json",materialization.prices],["featured-vehicle-ids.json",materialization.featuredVehicleIds]])writeFileSync(path.join(dataRoot,name),`${JSON.stringify(value,null,2)}\n`,"utf8");
  return dataRoot;
}

function argument(name){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:undefined;}
const invokedPath=process.argv[1]?path.resolve(process.argv[1]):"";
if(invokedPath===path.resolve(fileURLToPath(import.meta.url))){
  const requestPath=argument("--request"),outputRoot=argument("--output"),priceSourcePath=argument("--price-source");
  if(!requestPath||!outputRoot||!priceSourcePath)fail("use --request, --output and --price-source");
  const request=JSON.parse(readFileSync(path.resolve(requestPath),"utf8"));const priceSource=JSON.parse(readFileSync(path.resolve(priceSourcePath),"utf8"));
  const target=writeVehicleMaterialization(outputRoot,createVehicleMaterialization(request,priceSource.source));
  process.stdout.write(`Vehicle materialization written to ${target}\n`);
}
