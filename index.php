<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>云文档</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<nav class="nav"><a class="brand" href="index.php">云文档</a><div class="nav-links"><a href="files.php">文件</a></div></nav>
<main class="wrap">
  <header class="hd"><h1>我的文档</h1><button class="btn-primary" id="btn-new">+ 新建</button></header>
  <div class="grid" id="doc-grid"></div>
  <div class="empty" id="empty" style="display:none">
    <div class="empty-ico">📄</div><div class="empty-title">还没有文档</div>
    <p>点击右上角"新建"创建您的第一个文档</p>
  </div>
</main>
<script src="js/app.js"></script>
</body>
</html>