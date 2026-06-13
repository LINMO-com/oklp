<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

define('UP_DIR', __DIR__ . '/../uploads');
define('APP_ICON_DIR', __DIR__ . '/../uploads/app_icon');
$cats = ['zip','app','media','other'];
foreach ($cats as $c) if (!is_dir(UP_DIR.'/'.$c)) mkdir(UP_DIR.'/'.$c, 0755, true);
if (!is_dir(APP_ICON_DIR)) mkdir(APP_ICON_DIR, 0755, true);

// === APP 元数据（名称+图标）存储 ===
function appMetaPath($appName) {
    $base = pathinfo($appName, PATHINFO_FILENAME);
    return APP_ICON_DIR . '/' . preg_replace('/[^\w\-]/', '_', $base) . '.json';
}
function saveAppMeta($appName, $displayName, $iconFile) {
    $path = appMetaPath($appName);
    file_put_contents($path, json_encode(['display_name'=>$displayName, 'icon'=>$iconFile]));
}
function loadAppMeta($appName) {
    $path = appMetaPath($appName);
    if (!file_exists($path)) return null;
    return json_decode(file_get_contents($path), true);
}

function catOf($name) {
    $e = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (in_array($e,['zip','rar','7z','tar','gz'])) return 'zip';
    if (in_array($e,['apk','apks','xapk','ipa'])) return 'app';
    if (in_array($e,['mp3','wav','ogg','m4a','flac','mp4','webm','mov','avi','mkv','jpg','jpeg','png','gif','webp','svg'])) return 'media';
    return 'other';
}

function iconOf($name) {
    $e = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $icons = [
        'zip'=>'📦','rar'=>'📦','7z'=>'📦','tar'=>'📦','gz'=>'📦',
        'apk'=>'📱','apks'=>'📱','xapk'=>'📱','ipa'=>'📱',
        'mp3'=>'🎵','wav'=>'🎵','ogg'=>'🎵','m4a'=>'🎵','flac'=>'🎵',
        'mp4'=>'🎬','webm'=>'🎬','mov'=>'🎬','avi'=>'🎬','mkv'=>'🎬',
        'jpg'=>'🖼️','jpeg'=>'🖼️','png'=>'🖼️','gif'=>'🖼️','webp'=>'🖼️','svg'=>'🖼️',
        'pdf'=>'📄','doc'=>'📄','docx'=>'📄','txt'=>'📄','xlsx'=>'📊','pptx'=>'📊',
        'exe'=>'⚙️','dll'=>'⚙️','bat'=>'⚙️','sh'=>'⚙️'
    ];
    return $icons[$e] ?? '📄';
}

function parseName($name) {
    $ext = pathinfo($name, PATHINFO_EXTENSION);
    $base = pathinfo($name, PATHINFO_FILENAME);
    $parts = explode('_', $base);
    if (count($parts) > 1 && is_numeric(end($parts))) {
        array_pop($parts);
    }
    return implode('_', $parts) . '.' . $ext;
}

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    $out = [];
    foreach (['zip','app','media','other'] as $c) {
        $out[$c] = [];
        $d = UP_DIR.'/'.$c;
        if (is_dir($d)) foreach (scandir($d) as $f) {
            if ($f==='.'||$f==='..') continue;
            $display = parseName($f);
            $icon = iconOf($f);
            if ($c === 'app') {
                $meta = loadAppMeta($f);
                if ($meta) {
                    if (!empty($meta['display_name'])) $display = $meta['display_name'];
                    if (!empty($meta['icon'])) $icon = $meta['icon'];
                }
            }
            $out[$c][] = [
                'name'=>$f,
                'display_name'=>$display,
                'icon'=>$icon,
                'is_app_icon'=>($c==='app' && strpos($icon,'uploads/app_icon')===0),
                'type'=>strtolower(pathinfo($f, PATHINFO_EXTENSION)),
                'size'=>filesize($d.'/'.$f),
                'url'=>'uploads/'.$c.'/'.rawurlencode($f),
                'download_url'=>'api/files.php?action=download&cat='.$c.'&name='.rawurlencode($f)
            ];
        }
    }
    echo json_encode(['ok'=>true,'files'=>$out]);
} elseif ($action === 'upload' && $_SERVER['REQUEST_METHOD']==='POST') {
    if (!isset($_FILES['f'])) { echo json_encode(['ok'=>false,'error'=>'无文件']); exit; }
    $f = $_FILES['f'];
    if ($f['error']!==UPLOAD_ERR_OK) { echo json_encode(['ok'=>false,'error'=>'上传错误']); exit; }
    $cat = catOf($f['name']);
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    $clean = preg_replace('/[^\w\-.]/u','_',pathinfo($f['name'], PATHINFO_FILENAME));
    $newName = $clean . '_' . time() . '.' . $ext;
    $path = UP_DIR . '/' . $cat . '/' . $newName;
    if (!move_uploaded_file($f['tmp_name'], $path)) { echo json_encode(['ok'=>false,'error'=>'保存失败']); exit; }

    $displayName = parseName($newName);
    $iconUrl = iconOf($newName);

    // === APP/APK 特殊处理：支持自定义名称+图片 ===
    if ($cat === 'app') {
        $customName = $_POST['name'] ?? '';
        if (!empty($customName)) $displayName = trim($customName) . '.' . $ext;

        if (isset($_FILES['icon']) && $_FILES['icon']['error'] === UPLOAD_ERR_OK) {
            $iconExt = strtolower(pathinfo($_FILES['icon']['name'], PATHINFO_EXTENSION));
            if (in_array($iconExt, ['png','jpg','jpeg','gif','webp','svg'])) {
                $iconName = preg_replace('/[^\w\-]/', '_', pathinfo($newName, PATHINFO_FILENAME)) . '.' . $iconExt;
                $iconPath = APP_ICON_DIR . '/' . $iconName;
                if (move_uploaded_file($_FILES['icon']['tmp_name'], $iconPath)) {
                    $iconUrl = 'uploads/app_icon/'.$iconName;
                }
            }
        }
        saveAppMeta($newName, $displayName, $iconUrl);
    }

    echo json_encode([
        'ok'=>true,
        'name'=>$newName,
        'display_name'=>$displayName,
        'icon'=>$iconUrl,
        'cat'=>$cat,
        'url'=>'uploads/'.$cat.'/'.rawurlencode($newName),
        'size'=>filesize($path)
    ]);
} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD']==='POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $cat = $input['cat'] ?? '';
    $name = $input['name'] ?? '';
    if (!in_array($cat, $cats)) { echo json_encode(['ok'=>false,'error'=>'无效分类']); exit; }
    $path = UP_DIR.'/'.$cat.'/'.$name;
    if (file_exists($path) && unlink($path)) echo json_encode(['ok'=>true]);
    else echo json_encode(['ok'=>false,'error'=>'删除失败']);
} elseif ($action === 'download') {
    $cat = $_GET['cat'] ?? '';
    $name = $_GET['name'] ?? '';
    if (!in_array($cat, $cats)) { http_response_code(400); exit; }
    $path = UP_DIR.'/'.$cat.'/'.$name;
    if (!file_exists($path)) { http_response_code(404); exit; }

    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $mimeTypes = [
        'zip'=>'application/zip', 'rar'=>'application/x-rar-compressed', '7z'=>'application/x-7z-compressed',
        'apk'=>'application/vnd.android.package-archive', 'apks'=>'application/zip', 'xapk'=>'application/zip',
        'mp3'=>'audio/mpeg', 'wav'=>'audio/wav', 'ogg'=>'audio/ogg', 'm4a'=>'audio/mp4', 'flac'=>'audio/flac',
        'mp4'=>'video/mp4', 'webm'=>'video/webm', 'mov'=>'video/quicktime', 'avi'=>'video/x-msvideo', 'mkv'=>'video/x-matroska',
        'jpg'=>'image/jpeg', 'jpeg'=>'image/jpeg', 'png'=>'image/png', 'gif'=>'image/gif', 'webp'=>'image/webp', 'svg'=>'image/svg+xml',
        'pdf'=>'application/pdf', 'doc'=>'application/msword', 'docx'=>'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt'=>'text/plain', 'xlsx'=>'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pptx'=>'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    $filesize = filesize($path);
    $mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';
    $fileName = parseName($name);

    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Accept-Ranges: bytes');
    header('Cache-Control: public, max-age=3600');

    // --- 分块流式输出 + 断点续传 ---
    if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'], $m)) {
        $start = ($m[1] === '') ? 0 : intval($m[1]);
        $end = ($m[2] === '') ? $filesize - 1 : intval($m[2]);
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

    $chunkSize = 8192 * 16; // 128KB 块
    $remaining = $length;

    while ($remaining > 0 && !feof($handle)) {
        $read = min($chunkSize, $remaining);
        echo fread($handle, $read);
        $remaining -= $read;
        ob_flush();
        flush();
    }
    fclose($handle);
    exit;
} else {
    echo json_encode(['ok'=>false,'error'=>'无效操作']);
}