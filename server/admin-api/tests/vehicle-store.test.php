<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/auth.php';
require_once dirname(__DIR__).'/vehicle-store.php';
function vehicle_test_assert(bool $condition,string $message):void{if(!$condition)throw new RuntimeException($message);}
$base=['make'=>'Renault','model'=>'Clio','trim'=>'Evolution','modelYearLabel'=>'2025/2026','categoryLabel'=>'Binek','segmentLabel'=>'B Hatchback','fuelLabel'=>'Benzin','transmissionLabel'=>'Otomatik','slug'=>'renault-clio','summary'=>'Test aracı','publicationStatus'=>'unpublished','powerHp'=>'90','seats'=>'5','priceAmountTry'=>'40200'];
$vehicle=kalite_filo_admin_normalize_vehicle($base);
vehicle_test_assert($vehicle['powerHp']===90&&$vehicle['seats']===5,'Numeric technical fields must normalize.');
vehicle_test_assert($vehicle['priceAmountMinor']===4020000,'Whole TRY price must normalize to integer minor units.');
vehicle_test_assert(!array_key_exists('priceAmountTry',$vehicle),'Transport-only price input must not enter the store.');
kalite_filo_admin_assert_vehicle_uniqueness([$vehicle]);
try{kalite_filo_admin_assert_vehicle_uniqueness([$vehicle,[...$vehicle,'id'=>'other','sourceId'=>'OTHER']]);vehicle_test_assert(false,'Duplicate slug must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_vehicle([...$base,'powerHp'=>5000]);vehicle_test_assert(false,'Unsafe power must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_vehicle([...$base,'priceAmountTry'=>'40.200,50']);vehicle_test_assert(false,'Grouped price input must fail.');}catch(InvalidArgumentException){/* expected */}
try{kalite_filo_admin_normalize_vehicle([...$base,'publicationStatus'=>'published','priceAmountTry'=>'']);vehicle_test_assert(false,'Published vehicle without price must fail.');}catch(InvalidArgumentException){/* expected */}
fwrite(STDOUT,"Admin vehicle store tests passed.\n");
