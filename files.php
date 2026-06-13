<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>文件管理 - 云文档</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<nav class="nav"><a class="brand" href="index.php">云文档</a><div class="nav-links"></div></nav>
<main class="wrap">
  <header class="hd"><h1>文件管理</h1></header>
  <div class="upload-zone" id="up-zone">
    <div class="up-ico">⬆️</div>
    <div class="up-text">点击或拖拽文件到此处上传</div>
    <div class="up-hint">支持任意格式，自动分类到 压缩包 / APP / 媒体 / 其他</div>
  </div>
  <input type="file" id="up-input" multiple style="display:none">

  <h3 style="margin:24px 0 12px;">🖼️ 图片</h3>
  <div class="file-panel" id="list-image"></div>
  <h3 style="margin:24px 0 12px;">🎬 视频</h3>
  <div class="file-panel" id="list-video"></div>
  <h3 style="margin:24px 0 12px;">🎵 音频</h3>
  <div class="file-panel" id="list-audio"></div>
  <h3 style="margin:24px 0 12px;">📱 APP</h3>
  <div class="file-panel" id="list-app"></div>
  <h3 style="margin:24px 0 12px;">📦 压缩包</h3>
  <div class="file-panel" id="list-zip"></div>
  <h3 style="margin:24px 0 12px;">📄 其他</h3>
  <div class="file-panel" id="list-other"></div>
</main>

<!-- 悬浮上传窗 -->
<div class="float-panel" id="float-panel" style="display:none">
  <div class="fp-head">
    <span>📤 上传中</span>
    <button class="fp-close" id="fp-close">_</button>
  </div>
  <div class="fp-body" id="fp-body"></div>
</div>

<script src="js/common.js"></script>
<script src="js/files.js"></script>
</body>
</html>
