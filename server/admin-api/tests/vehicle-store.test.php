<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth.php';
require_once dirname(__DIR__).'/vehicle-store.php';
function vehicle_test_assert(bool $condition,string $message):void{if(!$condition)throw new RuntimeException($message);}
vehicle_test_assert(is_subclass_of(KaliteFiloAdminVehicleStoreException::class, RuntimeException::class),'Vehicle store diagnostics must remain safely typed.');
$base=['make'=>'Renault','model'=>'Clio','trim'=>'Evolution','modelYearLabel'=>'2025/2026','categoryLabel'=>'Binek','segmentLabel'=>'B Hatchback','fuelLabel'=>'Benzin','transmissionLabel'=>'Otomatik','slug'=>'renault-clio','summary'=>'Test aracı','publicationStatus'=>'unpublished','powerHp'=>'90','seats'=>'5','priceAmountTry'=>'40200'];
$vehicle=kalite_filo_admin_normalize_vehicle($base);
vehicle_test_assert($vehicle['powerHp']===90&&$vehicle['seats']===5,'Numeric technical fields must normalize.');
vehicle_test_assert($vehicle['priceAmountMinor']===4020000,'Whole TRY price must normalize to integer minor units.');
vehicle_test_assert(is_string($vehicle['createdAt'])&&$vehicle['createdAt']!=='','New vehicles must retain a creation timestamp for period metrics.');
vehicle_test_assert(!array_key_exists('priceAmountTry',$vehicle),'Transport-only price input must not enter the store.');
kalite_filo_admin_assert_vehicle_uniqueness([$vehicle]);
try{kalite_filo_admin_assert_vehicle_uniqueness([$vehicle,[...$vehicle,'id'=>'other','sourceId'=>'OTHER']]);vehicle_test_assert(false,'Duplicate slug must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_vehicle([...$base,'powerHp'=>5000]);vehicle_test_assert(false,'Unsafe power must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_vehicle([...$base,'priceAmountTry'=>'40.200,50']);vehicle_test_assert(false,'Grouped price input must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_vehicle([...$base,'publicationStatus'=>'published','priceAmountTry'=>'']);vehicle_test_assert(false,'Published vehicle without price must fail.');}catch(InvalidArgumentException){/* expected */}
$sourceGallery=['galleryImages'=>[
    ['fileName'=>'cover.jpg','src'=>'/images/vehicles/cover.jpg','alt'=>'Cover'],
    ['fileName'=>'interior.jpg','src'=>'/images/vehicles/interior.jpg','alt'=>'Interior'],
    ['fileName'=>'road.webp','src'=>'/images/vehicles/road.webp','alt'=>'Road'],
],'coverImage'=>['src'=>'/images/vehicles/cards/cover.jpg','alt'=>'Cover']];
$legacyDraft=['id'=>'vehicle-one','galleryImages'=>[$sourceGallery['galleryImages'][0]],'galleryOrder'=>['repo:cover.jpg'],'galleryMedia'=>[['id'=>str_repeat('a',32),'alt'=>'Upload']]];
$hydrated=kalite_filo_admin_hydrate_vehicle_gallery($legacyDraft,$sourceGallery);
vehicle_test_assert(count($hydrated['galleryImages'])===3,'Current repository gallery images must replace a stale private snapshot.');
vehicle_test_assert($hydrated['galleryOrder']===['repo:cover.jpg','repo:interior.jpg','repo:road.webp','upload:'.str_repeat('a',32)],'Previously unknown repository and uploaded images must be appended to the editable gallery.');
$removed=kalite_filo_admin_hydrate_vehicle_gallery([...$legacyDraft,'removedRepositoryMedia'=>['interior.jpg']],$sourceGallery);
vehicle_test_assert($removed['galleryOrder']===['repo:cover.jpg','repo:road.webp','upload:'.str_repeat('a',32)],'Explicitly removed repository images must remain absent after hydration.');
fwrite(STDOUT,"Admin vehicle store tests passed.\n");
