<?php
declare(strict_types=1);

const KALITE_FILO_VEHICLE_IMAGE_MAX_BYTES = 5242880;
const KALITE_FILO_VEHICLE_IMAGE_MIN_WIDTH = 400;
const KALITE_FILO_VEHICLE_IMAGE_MIN_HEIGHT = 225;
const KALITE_FILO_VEHICLE_IMAGE_MAX_DIMENSION = 4096;

function kalite_filo_admin_vehicle_media_directory(): string
{
    return (string) kalite_filo_admin_config()['data_root'] . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'vehicles';
}

/** @return array{mime:string,extension:string,width:int,height:int} */
function kalite_filo_admin_inspect_vehicle_image(string $path, int $size): array
{
    if ($size < 1 || $size > KALITE_FILO_VEHICLE_IMAGE_MAX_BYTES) throw new InvalidArgumentException('image_size');
    $info = @getimagesize($path);
    if (!is_array($info) || !isset($info[0], $info[1], $info['mime'])) throw new InvalidArgumentException('image_type');
    $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $mime = strtolower((string) $info['mime']);
    if (!isset($types[$mime])) throw new InvalidArgumentException('image_type');
    $width = (int) $info[0]; $height = (int) $info[1];
    if ($width < KALITE_FILO_VEHICLE_IMAGE_MIN_WIDTH || $height < KALITE_FILO_VEHICLE_IMAGE_MIN_HEIGHT
        || $width > KALITE_FILO_VEHICLE_IMAGE_MAX_DIMENSION || $height > KALITE_FILO_VEHICLE_IMAGE_MAX_DIMENSION) {
        throw new InvalidArgumentException('image_dimensions');
    }
    return ['mime'=>$mime,'extension'=>$types[$mime],'width'=>$width,'height'=>$height];
}

function kalite_filo_admin_vehicle_media_path(string $mediaId, string $extension): string
{
    if (preg_match('/^[a-f0-9]{32}$/', $mediaId) !== 1 || !in_array($extension, ['jpg','png','webp'], true)) throw new InvalidArgumentException('invalid_media');
    return kalite_filo_admin_vehicle_media_directory() . DIRECTORY_SEPARATOR . $mediaId . '.' . $extension;
}
