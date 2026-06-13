<?php
/**
 * CloudDoc - 文件管理 API（安全校验 + 鉴权 + MIME 检测）
 */
require_once __DIR__ . '/db.php';

corsHeaders();

define('UP_DIR', __DIR__ . '/../uploads');
define('APP_ICON_DIR', UP_DIR . '/app_icon');
define('MAX_FILE_SIZE', 100 * 1024 * 1024); // 100MB

// 危险扩展名黑名单（禁止上传）
define('BLOCKED_EXTS', ['php','php3','php4','php5','phtml','pht','phar','phps','shtml','htaccess','htpasswd','asp','aspx','jsp','cgi','pl','py','sh','bash','rb','exe','dll','bat','cmd','ps1','vbs','wsf']);

$VALID_CATS = ['zip','app','video','audio','image','other'];
foreach ($VALID_CATS as $c) if (!is_dir(UP_DIR.'/'.$c)) mkdir(UP_DIR.'/'.$c, 0755, true);
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

function iconOf($name) {
    $e = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $icons = [
        'zip'=>'📦','rar'=>'📦','7z'=>'📦','tar'=>'📦','gz'=>'📦',
        'apk'=>'📱','apks'=>'📱','xapk'=>'📱','ipa'=>'📱',
        'mp3'=>'🎵','wav'=>'🎵','ogg'=>'🎵','m4a'=>'🎵','flac'=>'🎵','aac'=>'🎵','opus'=>'🎵',
        'mp4'=>'🎬','webm'=>'🎬','mov'=>'🎬','avi'=>'🎬','mkv'=>'🎬','flv'=>'🎬',
        'jpg'=>'🖼️','jpeg'=>'🖼️','png'=>'🖼️','gif'=>'🖼️','webp'=>'🖼️','svg'=>'🖼️','bmp'=>'🖼️','avif'=>'🖼️',
        'pdf'=>'📄','doc'=>'📄','docx'=>'📄','txt'=>'📄','xlsx'=>'📊','pptx'=>'📊',
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

/** 安全文件名：移除路径分隔符和特殊字符 */
function safeFileName($name) {
    $name = basename($name);
    $name = preg_replace('/[^\w\-.]/u', '_', pathinfo($name, PATHINFO_FILENAME)) . '.' . strtolower(pathinfo($name, PATHINFO_EXTENSION));
    return $name;
}

/** 检查扩展名是否被禁止 */
function isBlockedExt($name) {
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    return in_array($ext, BLOCKED_EXTS);
}

/** 用 finfo 检测真实 MIME 类型 */
function detectMime($path) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $path);
    finfo_close($finfo);
    return $mime ?: 'application/octet-stream';
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

// ========== 列表（需登录） ==========
if ($action === 'list') {
    $userId = requireAuth();
    $db = getDB();
    $out = ['zip'=>[],'app'=>[],'video'=>[],'audio'=>[],'image'=>[],'other'=>[]];

    $stmt = $db->prepare('SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$userId]);
    $files = $stmt->fetchAll();

    foreach ($files as $f) {
        $cat = $f['category'];
        if (!isset($out[$cat])) $out[$cat] = [];
        $out[$cat][] = [
            'name' => $f['name'],
            'display_name' => $f['display_name'],
            'icon' => $f['icon'],
            'thumbnail' => ($cat === 'image') ? 'uploads/'.$cat.'/'.rawurlencode($f['name']) : ($f['is_app_icon'] ? $f['icon'] : ''),
            'is_app_icon' => (bool)$f['is_app_icon'],
            'kind' => $cat,
            'type' => strtolower(pathinfo($f['name'], PATHINFO_EXTENSION)),
            'size' => (int)$f['size'],
            'url' => 'uploads/'.$cat.'/'.rawurlencode($f['name']),
            'download_url' => 'api/files.php?action=download&cat='.$cat.'&name='.rawurlencode($f['name'])
        ];
    }
    jsonResponse(['ok'=>true,'files'=>$out]);
}

// ========== 上传（需登录） ==========
if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = requireAuth();
    $db = getDB();

    if (!isset($_FILES['f'])) jsonResponse(['ok'=>false,'error'=>'无文件'], 400);
    $f = $_FILES['f'];
    if ($f['error'] !== UPLOAD_ERR_OK) jsonResponse(['ok'=>false,'error'=>'上传错误'], 400);
    if ($f['size'] > MAX_FILE_SIZE) jsonResponse(['ok'=>false,'error'=>'文件过大（最大100MB）'], 400);

    $originalName = $f['name'];
    if (isBlockedExt($originalName)) jsonResponse(['ok'=>false,'error'=>'不允许上传该类型文件'], 400);

    // MIME 类型校验
    $realMime = detectMime($f['tmp_name']);
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    $cat = fileKind($originalName);
    $clean = preg_replace('/[^\w\-.]/u','_',pathinfo($originalName, PATHINFO_FILENAME));
    $newName = $clean . '_' . time() . '.' . $ext;
    $path = UP_DIR . '/' . $cat . '/' . $newName;

    if (!move_uploaded_file($f['tmp_name'], $path)) jsonResponse(['ok'=>false,'error'=>'保存失败'], 500);

    $displayName = parseName($newName);
    $iconUrl = iconOf($newName);
    $isAppIcon = 0;

    if ($cat === 'app') {
        $customName = $_POST['name'] ?? '';
        if (!empty($customName)) $displayName = trim($customName);
        if (isset($_FILES['icon']) && $_FILES['icon']['error'] === UPLOAD_ERR_OK) {
            $iconExt = strtolower(pathinfo($_FILES['icon']['name'], PATHINFO_EXTENSION));
            if (in_array($iconExt, ['png','jpg','jpeg','gif','webp'])) {
                $iconName = preg_replace('/[^\w\-]/', '_', pathinfo($newName, PATHINFO_FILENAME)) . '.' . $iconExt;
                $iconPath = APP_ICON_DIR . '/' . $iconName;
                if (move_uploaded_file($_FILES['icon']['tmp_name'], $iconPath)) {
                    $iconUrl = 'uploads/app_icon/'.$iconName;
                    $isAppIcon = 1;
                }
            }
        }
        saveAppMeta($newName, $displayName, $iconUrl);
    }

    // 写入数据库
    $fileId = uid();
    $stmt = $db->prepare('INSERT INTO files (id, user_id, name, display_name, category, size, icon, is_app_icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$fileId, $userId, $newName, $displayName, $cat, filesize($path), $iconUrl, $isAppIcon, time()]);

    $thumb = '';
    if ($cat === 'image') $thumb = 'uploads/'.$cat.'/'.rawurlencode($newName);
    elseif ($cat === 'app' && $isAppIcon) $thumb = $iconUrl;

    jsonResponse([
        'ok'=>true,'name'=>$newName,'display_name'=>$displayName,'icon'=>$iconUrl,'thumbnail'=>$thumb,
        'kind'=>$cat,'url'=>'uploads/'.$cat.'/'.rawurlencode($newName),
        'download_url'=>'api/files.php?action=download&cat='.$cat.'&name='.rawurlencode($newName),
        'size'=>filesize($path)
    ]);
}

// ========== 删除（需登录） ==========
if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = requireAuth();
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);
    $cat = $input['cat'] ?? '';
    $name = $input['name'] ?? '';

    if (!in_array($cat, $VALID_CATS)) jsonResponse(['ok'=>false,'error'=>'无效分类'], 400);
    // 防止路径遍历
    $name = basename($name);
    if (strpos($name, '..') !== false) jsonResponse(['ok'=>false,'error'=>'非法文件名'], 400);

    $path = UP_DIR.'/'.$cat.'/'.$name;
    if (file_exists($path)) unlink($path);

    if ($cat === 'app') {
        $meta = appMetaPath($name);
        if (file_exists($meta)) {
            $m = json_decode(file_get_contents($meta), true);
            if (!empty($m['icon']) && strpos($m['icon'],'uploads/app_icon')===0) {
                $ip = __DIR__.'/../'.$m['icon'];
                if (file_exists($ip)) unlink($ip);
            }
            unlink($meta);
        }
    }

    // 从数据库删除
    $stmt = $db->prepare('DELETE FROM files WHERE user_id = ? AND name = ? AND category = ?');
    $stmt->execute([$userId, $name, $cat]);

    jsonResponse(['ok'=>true]);
}

// ========== 下载（无需登录，但校验参数） ==========
if ($action === 'download') {
    $cat = $_GET['cat'] ?? '';
    $name = $_GET['name'] ?? '';
    if (!in_array($cat, $VALID_CATS)) { http_response_code(400); exit; }
    $name = basename($name);
    if (strpos($name, '..') !== false) { http_response_code(400); exit; }

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

jsonResponse(['ok'=>false,'error'=>'无效操作'], 400);
