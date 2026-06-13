<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

define('DOC_DIR', __DIR__ . '/../data');
define('SHARE_FILE', DOC_DIR . '/shares.json');
define('GEN_DIR', __DIR__ . '/../generated');

if (!is_dir(DOC_DIR)) mkdir(DOC_DIR, 0755, true);
if (!is_dir(GEN_DIR)) mkdir(GEN_DIR, 0755, true);
if (!file_exists(SHARE_FILE)) file_put_contents(SHARE_FILE, json_encode([]));

function uid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));
}

$action = $_GET['action'] ?? '';

if ($action === 'create' || $action === 'share') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? uid();
    $title = $input['title'] ?? '无标题';
    $html = $input['html'] ?? '';
    $fname = 'doc_' . $id . '.html';
    $path = GEN_DIR . '/' . $fname;
    $wrapped = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>' . htmlspecialchars($title) . '</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#333;line-height:1.8;padding:40px 20px;min-height:100vh}.c{max-width:800px;margin:0 auto;background:#fff;border-radius:16px;padding:48px;box-shadow:0 10px 40px rgba(0,0,0,.2)}.b{display:inline-block;padding:6px 16px;background:#1E90FF;color:#fff;border-radius:20px;font-size:12px;margin-bottom:20px}h1{font-size:28px;margin-bottom:8px;color:#1E90FF;border-bottom:2px solid #1E90FF;padding-bottom:16px}.m{color:#999;font-size:13px;margin-bottom:28px}.editor-btn{display:inline-block;padding:10px 20px;margin:4px;cursor:pointer;text-decoration:none;font-size:14px;border:none;transition:.2s}.editor-btn:hover{opacity:.85;transform:translateY(-1px)}.editor-btn-primary{background:#1E90FF;color:#fff;border-radius:4px}.editor-btn-outline{background:transparent;color:#1E90FF;border:2px solid #1E90FF;border-radius:4px}.editor-btn-dashed{background:transparent;color:#1E90FF;border:2px dashed #1E90FF;border-radius:4px}.editor-btn-gradient{background:linear-gradient(135deg,#1E90FF,#9B59B6);color:#fff;border-radius:4px}.editor-btn-rounded{background:#1E90FF;color:#fff;border-radius:12px}.editor-btn-pill{background:#1E90FF;color:#fff;border-radius:50px}.editor-btn-shadow{background:#1E90FF;color:#fff;border-radius:4px;box-shadow:0 4px 12px rgba(30,144,255,.4)}.editor-btn-glow{background:#1E90FF;color:#fff;border-radius:4px;box-shadow:0 0 20px rgba(30,144,255,.6)}.editor-copy-box{padding:16px;background:#f3f4f6;border:2px dashed #1E90FF;border-radius:8px;margin:8px 0;cursor:pointer}.editor-copy-box:hover{background:#e5e7eb}.editor-file-link{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#f3f4f6;border-radius:6px;color:#1E90FF;text-decoration:none;margin:4px}.editor-file-link:hover{background:#e5e7eb}.f{margin-top:48px;padding-top:24px;border-top:1px solid #e5e7eb;text-align:center;color:#999;font-size:12px}</style></head><body><div class="c"><div class="b">只读分享</div><h1>' . htmlspecialchars($title) . '</h1><div class="m">' . date('Y-m-d H:i:s') . '</div><div class="content">' . $html . '</div><div class="f">云文档分享</div></div><script>document.querySelectorAll(".editor-copy-box").forEach(b=>{b.onclick=()=>{var t=b.getAttribute("data-copy-content")||b.textContent;if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>alert("已复制"));else{var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");alert("已复制")}catch(e){}document.body.removeChild(ta)}}});document.querySelectorAll(".editor-btn").forEach(b=>{b.onclick=()=>{var u=b.getAttribute("data-url")||b.getAttribute("href");if(u&&u!=="#")window.open(u,"_blank")}});</script></body></html>';

    if (file_put_contents($path, $wrapped) === false) {
        echo json_encode(['ok'=>false, 'error'=>'写入失败']);
        exit;
    }

    $shares = json_decode(file_get_contents(SHARE_FILE), true) ?: [];
    $shares[$id] = ['id'=>$id, 'title'=>$title, 'html_file'=>$fname, 'time'=>time()];
    file_put_contents(SHARE_FILE, json_encode($shares));

    echo json_encode(['ok'=>true, 'url'=>'/generated/'.$fname, 'file'=>$fname]);
} else {
    echo json_encode(['ok'=>false, 'error'=>'无效操作']);
}