<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

define('DATA_DIR', __DIR__ . '/../data');
define('DOC_FILE', DATA_DIR . '/documents.json');
if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
if (!file_exists(DOC_FILE)) file_put_contents(DOC_FILE, json_encode([]));

function uid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));
}

$docs = json_decode(file_get_contents(DOC_FILE), true) ?: [];
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'list') {
    usort($docs, fn($a,$b)=>$b['time']<=>$a['time']);
    echo json_encode(['ok'=>true, 'docs'=>$docs]);
} elseif ($action === 'get') {
    $id = $_GET['id'] ?? '';
    foreach ($docs as $d) if ($d['id']===$id) { echo json_encode(['ok'=>true,'doc'=>$d]); exit; }
    echo json_encode(['ok'=>false,'error'=>'不存在']);
} elseif ($action === 'save' && $method==='POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $title = $input['title'] ?? '无标题';
    $content = $input['content'] ?? '';
    $now = time();
    if ($id) {
        $found = false;
        foreach ($docs as &$d) if ($d['id']===$id) { $d['title']=$title; $d['content']=$content; $d['time']=$now; $found=true; break; }
        if (!$found) $docs[] = ['id'=>$id,'title'=>$title,'content'=>$content,'time'=>$now];
    } else {
        $id = uid();
        $docs[] = ['id'=>$id,'title'=>$title,'content'=>$content,'time'=>$now];
    }
    file_put_contents(DOC_FILE, json_encode($docs, JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok'=>true, 'id'=>$id]);
} elseif ($action === 'delete' && $method==='POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $docs = array_values(array_filter($docs, fn($d)=>$d['id']!==$id));
    file_put_contents(DOC_FILE, json_encode($docs));
    echo json_encode(['ok'=>true]);
} else {
    echo json_encode(['ok'=>false,'error'=>'无效操作']);
}