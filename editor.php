<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>编辑 - 云文档</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<nav class="nav"><a class="brand" href="index.php">云文档</a><div class="nav-links"></div></nav>
<main class="wrap">
  <input type="text" id="doc-title" class="title" placeholder="请输入标题...">
  <div class="toolbar">
    <button class="tb" data-cmd="bold" title="粗体"><b>B</b></button>
    <button class="tb" data-cmd="italic" title="斜体"><i>I</i></button>
    <button class="tb" data-cmd="underline" title="下划线"><u>U</u></button>
    <span class="sep"></span>
    <button class="tb" data-cmd="justifyLeft" title="左对齐">⬅</button>
    <button class="tb" data-cmd="justifyCenter" title="居中">↔</button>
    <button class="tb" data-cmd="justifyRight" title="右对齐">➡</button>
    <span class="sep"></span>
    <button class="tb" id="btn-ins-video" title="插入视频">🎬</button>
    <button class="tb" id="btn-ins-audio" title="插入音频">🎵</button>
    <button class="tb" id="btn-ins-btn" title="插入按钮">🔘</button>
    <button class="tb" id="btn-ins-copy" title="复制框">📋</button>
    <button class="tb" id="btn-ins-file" title="插入文件">📎</button>
    <button class="tb" id="btn-ins-image" title="上传图片">🖼️</button>
    <div class="right">
      <span class="status" id="status">0 字</span>
      <span class="autosave-status" id="autosave-status"></span>
      <button class="btn-primary" id="btn-save">保存</button>
      <button class="btn-share" id="btn-share">分享</button>
    </div>
  </div>
  <div id="editor" class="editor" contenteditable="true"></div>
</main>

<!-- 视频插入弹窗 -->
<div class="modal" id="m-video"><div class="modal-box">
  <div class="modal-hd"><h3>插入视频</h3><button class="modal-close" data-close="m-video">×</button></div>
  <input class="in" id="video-url" placeholder="视频链接（支持 mp4/webm/mov）">
  <p style="color:#888;font-size:12px;margin-bottom:12px;">视频会自动预缓存，播放时无需等待</p>
  <button class="btn-primary" id="video-confirm" style="width:100%;margin-top:12px;">插入视频</button>
</div></div>

<!-- 音频插入弹窗 -->
<div class="modal" id="m-audio"><div class="modal-box">
  <div class="modal-hd"><h3>插入音频</h3><button class="modal-close" data-close="m-audio">×</button></div>
  <input class="in" id="audio-url" placeholder="音频链接（支持 mp3/wav/ogg）">
  <button class="btn-primary" id="audio-confirm" style="width:100%;margin-top:12px;">插入音频</button>
</div></div>

<!-- 按钮插入弹窗 -->
<div class="modal" id="m-btn"><div class="modal-box">
  <div class="modal-hd"><h3>插入按钮</h3><button class="modal-close" data-close="m-btn">×</button></div>
  <div class="btn-opts" id="btn-opts">
    <div class="btn-opt" data-style="primary"><div class="editor-btn-primary eb">按钮</div><div class="bl">深蓝</div></div>
    <div class="btn-opt" data-style="outline"><div class="editor-btn-outline eb">按钮</div><div class="bl">液态玻璃</div></div>
    <div class="btn-opt" data-style="dashed"><div class="editor-btn-dashed eb">按钮</div><div class="bl">暗黑虚线</div></div>
    <div class="btn-opt" data-style="gradient"><div class="editor-btn-gradient eb">按钮</div><div class="bl">极光渐变</div></div>
    <div class="btn-opt" data-style="rounded"><div class="editor-btn-rounded eb">按钮</div><div class="bl">薄荷绿</div></div>
    <div class="btn-opt" data-style="pill"><div class="editor-btn-pill eb">按钮</div><div class="bl">高斯胶囊</div></div>
    <div class="btn-opt" data-style="shadow"><div class="editor-btn-shadow eb">按钮</div><div class="bl">立体橙红</div></div>
    <div class="btn-opt" data-style="glow"><div class="editor-btn-glow eb">按钮</div><div class="bl">霓虹发光</div></div>
  </div>
  <input class="in" id="btn-text" placeholder="按钮文字">
  <input class="in" id="btn-url" placeholder="跳转链接">
  <button class="btn-primary" id="btn-confirm" style="width:100%;margin-top:12px;">插入</button>
</div></div>

<!-- 复制框插入弹窗 -->
<div class="modal" id="m-copy"><div class="modal-box">
  <div class="modal-hd"><h3>插入复制框</h3><button class="modal-close" data-close="m-copy">×</button></div>
  <textarea class="in" id="copy-text" rows="5" placeholder="要复制的内容..."></textarea>
  <button class="btn-primary" id="copy-confirm" style="width:100%;margin-top:12px;">插入</button>
</div></div>

<!-- 文件选择弹窗 -->
<div class="modal" id="m-file"><div class="modal-box">
  <div class="modal-hd"><h3>插入文件</h3><button class="modal-close" data-close="m-file">×</button></div>
  <div class="file-tabs" id="file-tabs">
    <button class="ft active" data-cat="all">全部</button>
    <button class="ft" data-cat="image">图片</button>
    <button class="ft" data-cat="video">视频</button>
    <button class="ft" data-cat="audio">音频</button>
    <button class="ft" data-cat="app">APP</button>
    <button class="ft" data-cat="zip">压缩包</button>
    <button class="ft" data-cat="other">其他</button>
  </div>
  <div class="file-list" id="file-list"></div>
</div></div>

<!-- 分享弹窗 -->
<div class="modal" id="m-share"><div class="modal-box">
  <div class="modal-hd"><h3>分享文档</h3><button class="modal-close" data-close="m-share">×</button></div>
  <p style="color:#888;font-size:13px;margin-bottom:12px;">以下链接可直接浏览（纯 HTML）</p>
  <input class="in" id="share-url" readonly>
  <button class="btn-primary" id="btn-copy-share" style="width:100%;margin-top:12px;">复制链接</button>
</div></div>

<!-- 隐藏的图片上传 input -->
<input type="file" id="image-upload" accept="image/*" style="display:none">

<script src="js/common.js"></script>
<script src="js/editor.js"></script>
</body>
</html>
