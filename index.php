<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>云文档</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<nav class="nav"><a class="brand" href="index.php">云文档</a><div class="nav-links"></div></nav>
<main class="wrap">
  <header class="hd">
    <h1>我的文档</h1>
    <div class="hd-actions">
      <div class="search-box">
        <input type="text" id="search-input" class="in" placeholder="搜索文档...">
        <button class="btn-search" id="btn-search">🔍</button>
      </div>
      <button class="btn-primary" id="btn-new">+ 新建</button>
      <button class="btn-trash" id="btn-trash">🗑️ 回收站</button>
    </div>
  </header>
  <div class="grid" id="doc-grid"></div>
  <div class="empty" id="empty" style="display:none">
    <div class="empty-ico">📄</div><div class="empty-title">还没有文档</div>
    <p>点击右上角"新建"创建您的第一个文档</p>
  </div>
</main>

<!-- 回收站弹窗 -->
<div class="modal" id="m-trash"><div class="modal-box modal-lg">
  <div class="modal-hd"><h3>🗑️ 回收站</h3><button class="modal-close" data-close="m-trash">×</button></div>
  <div id="trash-list"></div>
  <div class="trash-footer" id="trash-footer" style="display:none">
    <button class="btn-danger" id="btn-empty-trash">清空回收站</button>
  </div>
</div></div>

<!-- 分享弹窗 -->
<div class="modal" id="m-share"><div class="modal-box">
  <div class="modal-hd"><h3>分享文档</h3><button class="modal-close" data-close="m-share">×</button></div>
  <p style="color:#888;font-size:13px;margin-bottom:12px;">以下链接可直接浏览（纯 HTML）</p>
  <input class="in" id="share-url" readonly>
  <button class="btn-primary" id="btn-copy-share" style="width:100%;margin-top:12px;">复制链接</button>
</div></div>

<script src="js/common.js"></script>
<script src="js/app.js"></script>
</body>
</html>
