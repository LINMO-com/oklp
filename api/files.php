<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

define('UP_DIR', __DIR__ . '/../uploads');
$cats = ['zip','app','media','other'];
foreach ($cats as $c) if (!is_dir(UP_DIR.'/'.$c)) mkdir(UP_DIR.'/'.$c, 0755, true);

function catOf($name) {
    $e = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (in_array($e,['zip','rar','7z','tar','gz'])) return 'zip';
    if (in_array($e,['apk','apks','xapk','ipa'])) return 'app';
    if (in_array($e,['mp3','wav','ogg','m4a','flac','mp4','webm','mov','avi','mkv','jpg','jpeg','png','gif','webp','svg'])) return 'media';
    return 'other';
}

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    $out = [];
    foreach (['zip','app','media','other'] as $c) {
        $out[$c] = [];
        $d = UP_DIR.'/'.$c;
        if (is_dir($d)) foreach (scandir($d) as $f) {
            if ($f==='.'||$f==='..') continue;
            $out[$c][] = ['name'=>$f,'size'=>filesize($d.'/'.$f),'url'=>'uploads/'.$c.'/'.rawurlencode($f)];
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
    if (move_uploaded_file($f['tmp_name'], $path)) {
        echo json_encode(['ok'=>true,'name'=>$newName,'cat'=>$cat,'url'=>'uploads/'.$cat.'/'.rawurlencode($newName),'size'=>filesize($path)]);
    } else { echo json_encode(['ok'=>false,'error'=>'保存失败']); }
} elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD']==='POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $cat = $input['cat'] ?? '';
    $name = $input['name'] ?? '';
    if (!in_array($cat, $cats)) { echo json_encode(['ok'=>false,'error'=>'无效分类']); exit; }
    $path = UP_DIR.'/'.$cat.'/'.$name;
    if (file_exists($path) && unlink($path)) echo json_encode(['ok'=>true]);
    else echo json_encode(['ok'=>false,'error'=>'删除失败']);
} else {
    echo json_encode(['ok'=>false,'error'=>'无效操作']);
}