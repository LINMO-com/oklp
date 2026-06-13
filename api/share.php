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

    $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    $genTime = date('Y-m-d H:i:s');

    $wrapped = <<<HTML
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{$safeTitle}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{font-family:"Microsoft YaHei","PingFang SC",system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.7;color:#1F2937;-webkit-font-smoothing:antialiased}
body{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:32px 16px}
.container{max-width:820px;margin:0 auto;background:#fff;border-radius:20px;padding:40px 40px 32px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.badge{display:inline-block;padding:6px 14px;background:#1E90FF;color:#fff;border-radius:20px;font-size:12px;margin-bottom:20px;font-weight:500;letter-spacing:.5px}
.title{font-size:30px;font-weight:700;color:#1E90FF;padding-bottom:16px;border-bottom:3px solid #1E90FF;margin-bottom:10px;word-break:break-word}
.meta{color:#999;font-size:13px;margin-bottom:28px}
.content{font-size:15px;line-height:1.9;color:#374151;word-break:break-word}
.content p{margin:12px 0}
.content img{max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);margin:12px 0;display:block}
.editor-video-wrap{margin:16px 0}
.editor-video-wrap video{max-width:100%;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);display:block;margin:8px 0}
.editor-audio-wrap{margin:16px 0;padding:14px;background:#f8f9fa;border-radius:12px;display:flex;align-items:center;gap:12px}
.editor-audio-wrap audio{flex:1;height:36px}
.editor-img{max-width:100%;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);margin:12px 0;display:block}
.editor-btn{display:inline-block;padding:10px 22px;margin:4px;cursor:pointer;text-decoration:none;font-size:14px;border:none;transition:all .2s;font-weight:500}
.editor-btn:hover{transform:translateY(-1px);opacity:.92}
.editor-btn-primary{background:#1E90FF;color:#fff;border-radius:8px}
.editor-btn-outline{background:transparent;color:#1E90FF;border:2px solid #1E90FF;border-radius:8px}
.editor-btn-dashed{background:transparent;color:#1E90FF;border:2px dashed #1E90FF;border-radius:8px}
.editor-btn-gradient{background:linear-gradient(135deg,#1E90FF,#9B59B6);color:#fff;border-radius:8px}
.editor-btn-rounded{background:#1E90FF;color:#fff;border-radius:14px}
.editor-btn-pill{background:#1E90FF;color:#fff;border-radius:50px}
.editor-btn-shadow{background:#1E90FF;color:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(30,144,255,.4)}
.editor-btn-glow{background:#1E90FF;color:#fff;border-radius:8px;box-shadow:0 0 20px rgba(30,144,255,.6)}
.editor-copy-box{padding:14px 18px;background:#f3f4f6;border:2px dashed #1E90FF;border-radius:10px;margin:12px 0;cursor:pointer;font-family:Consolas,"Courier New",monospace;word-break:break-all;transition:all .2s}
.editor-copy-box:hover{background:#e0e7ff;border-color:#3b82f6;transform:scale(1.005)}
.editor-file-link{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:#f3f4f6;border-radius:8px;color:#1E90FF;text-decoration:none;margin:6px;font-weight:500;font-size:13px;transition:all .2s}
.editor-file-link:hover{background:#e0e7ff}
.media-card{display:flex;align-items:center;gap:16px;margin:16px 0;padding:14px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);background:#fff;border:1px solid #e5e7eb}
.media-card img{width:56px;height:56px;border-radius:12px;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.app-card{display:flex;align-items:center;gap:16px;margin:14px 0;padding:16px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);background:#fff;border:1px solid #e5e7eb}
.app-card img{width:64px;height:64px;border-radius:14px;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.footer{text-align:center;color:rgba(255,255,255,.7);font-size:13px;margin-top:24px}
.toast{position:fixed;top:24px;right:24px;background:#1E90FF;color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.2);font-size:14px;z-index:9999;animation:slideIn .3s ease}
@keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}
@media(max-width:640px){body{padding:16px 8px}.container{padding:24px 18px;border-radius:16px}.title{font-size:22px}.content{font-size:14px}.media-card,.app-card{flex-wrap:wrap}.media-card img,.app-card img{width:48px;height:48px}}
</style>
</head>
<body>
<main class="container">
  <span class="badge">📄 只读分享</span>
  <h1 class="title">{$safeTitle}</h1>
  <div class="meta">创建时间：{$genTime}</div>
  <div class="content">{$html}</div>
</main>
<div class="footer">云文档分享 · Powered by CloudDoc</div>
<script>
(function(){
  document.addEventListener('click',function(e){
    var cb=e.target.closest('.editor-copy-box');
    if(cb){
      var t=cb.getAttribute('data-copy-content')||cb.innerText||'';
      var done=function(){
        var el=document.createElement('div');el.className='toast';el.textContent='✓ 已复制';
        document.body.appendChild(el);setTimeout(function(){el.style.transition='opacity .3s';el.style.opacity='0';setTimeout(function(){el.remove();},300);},2000);
      };
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done).catch(function(){
        var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(err){}document.body.removeChild(ta);
      });
      else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(err){}document.body.removeChild(ta);}
    }
    var btn=e.target.closest('.editor-btn');
    if(btn){var u=btn.getAttribute('data-url')||btn.getAttribute('href');if(u&&u!=='#'){window.open(u,'_blank');e.preventDefault();}}
  });
})();
</script>
</body>
</html>
HTML;

    if (file_put_contents($path, $wrapped) === false) {
        echo json_encode(['ok'=>false, 'error'=>'写入失败']);
        exit;
    }

    $shares = json_decode(file_get_contents(SHARE_FILE), true) ?: [];
    $shares[$id] = ['id'=>$id, 'title'=>$title, 'html_file'=>$fname, 'time'=>time()];
    file_put_contents(SHARE_FILE, json_encode($shares, JSON_UNESCAPED_UNICODE));

    echo json_encode(['ok'=>true, 'url'=>'generated/'.$fname, 'file'=>$fname]);
    exit;
}

echo json_encode(['ok'=>false, 'error'=>'无效操作']);
