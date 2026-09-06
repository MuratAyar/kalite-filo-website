<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/read-model.php';
require_once __DIR__ . '/vehicle-store.php';
require_once __DIR__ . '/vehicle-media.php';

/** @return list<string> */
function kalite_filo_vehicle_gallery_order(array $record): array
{
    if (is_array($record['galleryOrder'] ?? null)) return array_values(array_filter($record['galleryOrder'], 'is_string'));
    $order = [];
    foreach (is_array($record['galleryImages'] ?? null) ? $record['galleryImages'] : [] as $media) {
        if (is_array($media) && is_string($media['fileName'] ?? null)) $order[] = 'repo:' . $media['fileName'];
    }
    $gallery = is_array($record['galleryMedia'] ?? null) ? $record['galleryMedia'] : (is_array($record['draftMedia'] ?? null) ? [$record['draftMedia']] : []);
    foreach ($gallery as $media) if (is_array($media) && is_string($media['id'] ?? null)) $order[] = 'upload:' . $media['id'];
    return $order;
}

try {
    kalite_filo_admin_start_session();
    kalite_filo_admin_require_authentication();
    kalite_filo_admin_require_roles(['owner', 'admin', 'editor']);
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, ['POST', 'PATCH', 'DELETE'], true)) kalite_filo_admin_json(['error' => 'method_not_allowed'], 405);
    kalite_filo_admin_require_same_origin();
    kalite_filo_admin_require_csrf();
    $body = $method === 'POST' ? $_POST : kalite_filo_admin_read_json();
    $vehicleId = trim((string)($body['vehicleId'] ?? ''));
    $records = kalite_filo_admin_vehicle_records();
    $recordIndex = null;
    foreach ($records as $index => $record) if (($record['id'] ?? null) === $vehicleId) { $recordIndex = $index; break; }
    if (!is_int($recordIndex)) kalite_filo_admin_json(['error' => 'not_found'], 404);
    $record = $records[$recordIndex];
    $gallery = is_array($record['galleryMedia'] ?? null) ? array_values($record['galleryMedia']) : (is_array($record['draftMedia'] ?? null) ? [$record['draftMedia']] : []);
    $order = kalite_filo_vehicle_gallery_order($record);
    $pendingPath = null;

    if ($method === 'POST') {
        if (count($order) >= 20) throw new InvalidArgumentException('gallery_limit');
        $upload = $_FILES['image'] ?? null;
        if (!is_array($upload) || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file((string)$upload['tmp_name'])) throw new InvalidArgumentException('upload');
        $inspection = kalite_filo_admin_inspect_vehicle_image((string)$upload['tmp_name'], (int)$upload['size']);
        if ($inspection['mime'] !== 'image/webp' || $inspection['width'] !== 1600 || $inspection['height'] !== 900) throw new InvalidArgumentException('image_not_optimized');
        $id = bin2hex(random_bytes(16));
        $directory = kalite_filo_admin_vehicle_media_directory();
        kalite_filo_admin_ensure_private_directory($directory);
        $pendingPath = kalite_filo_admin_vehicle_media_path($id, 'webp');
        if (!move_uploaded_file((string)$upload['tmp_name'], $pendingPath)) throw new RuntimeException('Image could not be stored.');
        @chmod($pendingPath, 0600);
        $alt = trim((string)($body['alt'] ?? ''));
        if ($alt === '' || mb_strlen($alt) > 300) throw new InvalidArgumentException('metadata');
        $media = ['id'=>$id,'originalName'=>mb_substr(basename((string)$upload['name']),0,255),'extension'=>'webp','mime'=>'image/webp','size'=>(int)filesize($pendingPath),'width'=>1600,'height'=>900,'alt'=>$alt,'rightsBasis'=>'user-provided-for-site-use','checksum'=>hash_file('sha256',$pendingPath),'uploadedAt'=>gmdate('c'),'uploadedBy'=>$_SESSION['identity']['id']??null];
        $gallery[] = $media;
        $order[] = 'upload:' . $id;
        $action = 'vehicle_image_create';
        $summary = ['id'=>$vehicleId,'mediaId'=>$id,'fileName'=>$media['originalName'],'size'=>$media['size'],'dimensions'=>'1600x900'];
    } else {
        $token = trim((string)($body['token'] ?? ''));
        if (!in_array($token, $order, true)) kalite_filo_admin_json(['error'=>'not_found'], 404);
        if ($method === 'DELETE') {
            $order = array_values(array_filter($order, static fn(string $item): bool => $item !== $token));
            if (str_starts_with($token, 'upload:')) {
                $id = substr($token, 7); $removed = null; $remaining = [];
                foreach ($gallery as $candidate) { if (is_array($candidate) && ($candidate['id'] ?? null) === $id) $removed = $candidate; else $remaining[] = $candidate; }
                $gallery = $remaining;
                if (is_array($removed)) @unlink(kalite_filo_admin_vehicle_media_path($id, (string)$removed['extension']));
            } else {
                $fileName = substr($token, 5);
                $removedRepositoryMedia = is_array($record['removedRepositoryMedia'] ?? null) ? $record['removedRepositoryMedia'] : [];
                $removedRepositoryMedia[] = $fileName;
                $record['removedRepositoryMedia'] = array_values(array_unique(array_filter($removedRepositoryMedia, 'is_string')));
            }
            $action = 'vehicle_image_delete'; $summary = ['id'=>$vehicleId,'image'=>$token];
        } else {
            $alt = trim((string)($body['alt'] ?? ''));
            if ($alt === '' || mb_strlen($alt) > 300) throw new InvalidArgumentException('metadata');
            if (str_starts_with($token, 'upload:')) {
                $id = substr($token, 7);
                foreach ($gallery as &$candidate) if (is_array($candidate) && ($candidate['id'] ?? null) === $id) { $candidate['alt'] = $alt; break; }
                unset($candidate);
            } else {
                $fileName = substr($token, 5);
                $overrides = is_array($record['repositoryMediaAlt'] ?? null) ? $record['repositoryMediaAlt'] : [];
                $overrides[$fileName] = $alt;
                $record['repositoryMediaAlt'] = $overrides;
            }
            $direction = $body['direction'] ?? null;
            $position = array_search($token, $order, true);
            $target = $direction === 'up' ? $position - 1 : ($direction === 'down' ? $position + 1 : $position);
            if (is_int($position) && is_int($target) && $target >= 0 && $target < count($order) && $target !== $position) { [$order[$position], $order[$target]] = [$order[$target], $order[$position]]; }
            $action = 'vehicle_image_update'; $summary = ['id'=>$vehicleId,'image'=>$token,'altUpdated'=>true,'direction'=>is_string($direction)?$direction:null];
        }
    }

    $record['galleryMedia'] = $gallery;
    $record['draftMedia'] = $gallery[0] ?? null;
    $record['galleryOrder'] = $order;
    $records[$recordIndex] = $record;
    kalite_filo_admin_write_vehicle_records($records);
    $pendingPath = null;
    kalite_filo_admin_audit($action, 'success', $summary);
    kalite_filo_admin_json(['vehicle'=>$record], $method === 'POST' ? 201 : 200);
} catch (InvalidArgumentException $exception) {
    if (isset($pendingPath) && is_string($pendingPath)) @unlink($pendingPath);
    kalite_filo_admin_json(['error'=>$exception->getMessage()], 422);
} catch (Throwable $exception) {
    if (isset($pendingPath) && is_string($pendingPath)) @unlink($pendingPath);
    error_log('Vehicle image operation failed: ' . $exception->getMessage());
    kalite_filo_admin_json(['error'=>'service_unavailable'], 503);
}
