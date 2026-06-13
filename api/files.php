<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

define('UP_DIR', __DIR__ . '/../uploads');
define('APP_ICON_DIR', __DIR__ . '/../uploads/app_icon');
$cats = ['zip','app','video','audio','image','other'];
foreach ($cats as $c) if (!is_dir(UP_DIR.'/'.$c)) mkdir(UP_DIR.'/'.$c, 0755, true);
if (!is_dir(APP_ICON_DIR)) mkdir(APP_ICON_DIR, 0755, true);

// ============== 类型识别 ==============
$VIDEOS = ['mp4','webm','mov','avi','mkv','flv','3gp','ogv'];
$AUDIOS = ['mp3','wav','ogg','m4a','flac','aac','opus','wma'];
$IMAGES = ['jpg','jpeg','png','gif','webp','svg','bmp','ico','avif'];
$APPS   = ['apk','apks','xapk','ipa'];
$ZIPS   = ['zip','rar','7z','tar','gz'];

function fileKind($name){
    global $VIDEOS,$AUDIOS,$IMAGES,$APPS,$ZIPS;
    $e = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (in_array($e, $VIDEOS)) return 'video';
    if (in_array($e, $AUDIOS)) return 'audio';
    if (in_array($e, $IMAGES)) return 'image';
    if (in_array($e, $APPS))   return 'app';
    if (in_array($e, $ZIPS))   return 'zip';
    return 'other';
}
function catOf($name){ return fileKind($name); }

function iconOf($name) {
    $e = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $icons = [
        'zip'=>'📦','rar'=>'📦','7z'=>'📦','tar'=>'📦','gz'=>'📦',
        'apk'=>'📱','apks'=>'📱','xapk'=>'📱','ipa'=>'📱',
        'mp3'=>'🎵','wav'=>'🎵','ogg'=>'🎵','m4a'=>'🎵','flac'=>'🎵','aac'=>'🎵','opus'=>'🎵',
        'mp4'=>'🎬','webm'=>'🎬','mov'=>'🎬','avi'=>'🎬','mkv'=>'🎬','flv'=>'🎬',
        'jpg'=>'🖼️','jpeg'=>'🖼️','png'=>'🖼️','gif'=>'🖼️','webp'=>'🖼️','svg'=>'🖼️','bmp'=>'🖼️','avif'=>'🖼️',
        'pdf'=>'📄','doc'=>'📄','docx'=>'📄','txt'=>'📄','xlsx'=>'📊','pptx'=>'📊',
        'exe'=>'⚙️','dll'=>'⚙️','bat'=>'⚙️','sh'=>'⚙️'
    ];
    return $icons[$e] ?? '📄';
}

function parseName($name) {
    $ext = pathinfo($name, PATHINFO_EXTENSION);
    $base = pathinfo($name, PATHINFO_FILENAME);
    $parts = explode('_', $base);
    if (count($parts) > 1 && is_numeric(end($parts))) array_pop($parts);
    return implode('_', $parts) . '.' . $ext;
}

// ============== APP 元数据 ==============
function appMetaPath($appName) {
    $base = pathinfo($appName, PATHINFO_FILENAME);
    return APP_ICON_DIR . '/' . preg_replace('/[^\w\-]/', '_', $base) . '.json';
}
function saveAppMeta($appName, $displayName, $iconFile) {
    file_put_contents(appMetaPath($appName), json_encode(['display_name'=>$displayName, 'icon'=>$iconFile]));
}
function loadAppMeta($appName) {
    $p = appMetaPath($appName); if (!file_exists($p)) return null;
    return json_decode(file_get_contents($p), true);
}

// ============== 路由 ==============
$action = $_GET['action'] ?? '';

if ($action === 'list') {
    $out = ['zip'=>[],'app'=>[],'video'=>[],'audio'=>[],'image'=>[],'other'=>[]];
    foreach (['zip','app','video','audio','image','other'] as $c) {
        $d = UP_DIR.'/'.$c;
        if (!is_dir($d)) continue;
        foreach (scandir($d) as $f) {
            if ($f==='.'||$f==='..') continue;
            $display = parseName($f);
            $icon = iconOf($f);
            $thumb = '';
            $isAppIcon = false;
            if ($c === 'app') {
                $meta = loadAppMeta($f);
                if ($meta) {
                    if (!empty($meta['display_name'])) $display = $meta['display_name'];
                    if (!empty($meta['icon'])) { $icon = $meta['icon']; $isAppIcon = (strpos($meta['icon'],'uploads/app_icon')===0); }
                }
                $thumb = $icon;
            } elseif ($c === 'image') {
                $thumb = 'uploads/'.$c.'/'.rawurlencode($f);
            } elseif ($c === 'video') {
                $thumb = 'uploads/'.$c.'/'.rawurlencode($f); // 前端用 <video preload="metadata"> 取第一帧
            } elseif ($c === 'audio') {
                $thumb = ''; // 音频无缩略，播放器带波形
            } else {
                $thumb = '';
            }
            $out[$c][] = [
                'name'=>$f,
                'display_name'=>$display,
                'icon'=>$icon,
                'thumbnail'=>$thumb,
                'is_app_icon'=>$isAppIcon,
                'kind'=>$c,
                'type'=>strtolower(pathinfo($f, PATHINFO_EXTENSION)),
                'size'=>filesize($d.'/'.$f),
                'url'=>'uploads/'.$c.'/'.rawurlencode($f),
                'download_url'=>'api/files.php?action=download&cat='.$c.'&name='.rawurlencode($f)
            ];
        }
    }
    echo json_encode(['ok'=>true,'files'=>$out]);
    exit;
}

// ============== 上传 ==============
if ($action === 'upload' && $_SERVER['REQUEST_METHOD']==='POST') {
    if (!isset($_FILES['f'])) { echo json_encode(['ok'=>false,'error'=>'无文件']); exit; }
    $f = $_FILES['f'];
    if ($f['error']!==UPLOAD_ERR_OK) { echo json_encode(['ok'=>false,'error'=>'上传错误']); exit; }
    $cat = fileKind($f['name']);
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    $clean = preg_replace('/[^\w\-.]/u','_',pathinfo($f['name'], PATHINFO_FILENAME));
    $newName = $clean . '_' . time() . '.' . $ext;
    $path = UP_DIR . '/' . $cat . '/' . $newName;
    if (!move_uploaded_file($f['tmp_name'], $path)) { echo json_encode(['ok'=>false,'error'=>'保存失败']); exit; }

    $displayName = parseName($newName);
    $iconUrl = iconOf($newName);

    if ($cat === 'app') {
        $customName = $_POST['name'] ?? '';
        if (!empty($customName)) $displayName = trim($customName);
        if (isset($_FILES['icon']) && $_FILES['icon']['error'] === UPLOAD_ERR_OK) {
            $iconExt = strtolower(pathinfo($_FILES['icon']['name'], PATHINFO_EXTENSION));
            if (in_array($iconExt, ['png','jpg','jpeg','gif','webp','svg'])) {
                $iconName = preg_replace('/[^\w\-]/', '_', pathinfo($newName, PATHINFO_FILENAME)) . '.' . $iconExt;
                $iconPath = APP_ICON_DIR . '/' . $iconName;
                if (move_uploaded_file($_FILES['icon']['tmp_name'], $iconPath)) $iconUrl = 'uploads/app_icon/'.$iconName;
            }
        }
        saveAppMeta($newName, $displayName, $iconUrl);
    }

    $thumb = '';
    if ($cat === 'image' || $cat === 'app') $thumb = ($cat==='app')?$iconUrl:'uploads/'.$cat.'/'.rawurlencode($newName);
    elseif ($cat === 'video') $thumb = 'uploads/'.$cat.'/'.rawurlencode($newName);

    echo json_encode([
        'ok'=>true,'name'=>$newName,'display_name'=>$displayName,'icon'=>$iconUrl,'thumbnail'=>$thumb,
        'kind'=>$cat,'url'=>'uploads/'.$cat.'/'.rawurlencode($newName),
        'download_url'=>'api/files.php?action=download&cat='.$cat.'&name='.rawurlencode($newName),
        'size'=>filesize($path)
    ]);
    exit;
}

// ============== 删除 ==============
if ($action === 'delete' && $_SERVER['REQUEST_METHOD']==='POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $cat = $input['cat'] ?? ''; $name = $input['name'] ?? '';
    if (!in_array($cat, $cats)) { echo json_encode(['ok'=>false,'error'=>'无效分类']); exit; }
    $path = UP_DIR.'/'.$cat.'/'.$name; $ok = true;
    if (file_exists($path)) { if (!unlink($path)) $ok = false; }
    if ($cat === 'app') {
        $meta = appMetaPath($name);
        if (file_exists($meta)) {
            $m = json_decode(file_get_contents($meta), true);
            if (!empty($m['icon']) && strpos($m['icon'],'uploads/app_icon')===0) {
                $ip = __DIR__.'/../'.str_replace('uploads/', 'uploads/', $m['icon']);
                if (file_exists($ip)) unlink($ip);
            }
            unlink($meta);
        }
    }
    echo json_encode(['ok'=>$ok]);
    exit;
}

// ============== 下载（分块+断点续传） ==============
if ($action === 'download') {
    $cat = $_GET['cat'] ?? ''; $name = $_GET['name'] ?? '';
    if (!in_array($cat, $cats)) { http_response_code(400); exit; }
    $path = UP_DIR.'/'.$cat.'/'.$name;
    if (!file_exists($path)) { http_response_code(404); exit; }

    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $mimeTypes = [
        'zip'=>'application/zip','rar'=>'application/x-rar-compressed','7z'=>'application/x-7z-compressed',
        'apk'=>'application/vnd.android.package-archive','apks'=>'application/zip','xapk'=>'application/zip',
        'mp3'=>'audio/mpeg','wav'=>'audio/wav','ogg'=>'audio/ogg','m4a'=>'audio/mp4','flac'=>'audio/flac','aac'=>'audio/aac','opus'=>'audio/ogg',
        'mp4'=>'video/mp4','webm'=>'video/webm','mov'=>'video/quicktime','avi'=>'video/x-msvideo','mkv'=>'video/x-matroska','flv'=>'video/x-flv','3gp'=>'video/3gpp',
        'jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','gif'=>'image/gif','webp'=>'image/webp','svg'=>'image/svg+xml','bmp'=>'image/bmp','avif'=>'image/avif',
        'pdf'=>'application/pdf','doc'=>'application/msword','docx'=>'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt'=>'text/plain','xlsx'=>'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pptx'=>'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    $filesize = filesize($path);
    $mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';
    $fileName = parseName($name);

    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Accept-Ranges: bytes');
    header('Cache-Control: public, max-age=3600');

    if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'], $mm)) {
        $start = ($mm[1] === '') ? 0 : intval($mm[1]);
        $end = ($mm[2] === '') ? $filesize - 1 : intval($mm[2]);
        if ($start > $end || $start >= $filesize) { $start = 0; $end = $filesize - 1; }
        $length = $end - $start + 1;
        header('HTTP/1.1 206 Partial Content');
        header('Content-Length: ' . $length);
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $filesize);
    } else {
        $start = 0; $length = $filesize;
        header('Content-Length: ' . $filesize);
    }

    $handle = fopen($path, 'rb');
    if ($handle === false) { http_response_code(500); exit; }
    fseek($handle, $start);
    $chunkSize = 8192 * 16; $remaining = $length;
    while ($remaining > 0 && !feof($handle)) {
        $read = min($chunkSize, $remaining);
        echo fread($handle, $read);
        $remaining -= $read;
        @ob_flush(); @flush();
    }
    fclose($handle);
    exit;
}

echo json_encode(['ok'=>false,'error'=>'无效操作']);
