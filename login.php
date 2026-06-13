<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>登录 - 云文档</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<nav class="nav"><a class="brand" href="index.php">云文档</a><div class="nav-links"><a href="register.php">注册</a></div></nav>
<main class="wrap">
  <div class="auth-box">
    <div class="auth-ico">☁️</div>
    <h2 class="auth-title">登录云文档</h2>
    <form id="login-form" class="auth-form">
      <input type="text" id="username" class="in" placeholder="用户名" autocomplete="username" required minlength="2" maxlength="20">
      <input type="password" id="password" class="in" placeholder="密码" autocomplete="current-password" required minlength="6">
      <button type="submit" class="btn-primary auth-btn">登 录</button>
    </form>
    <p class="auth-switch">还没有账号？<a href="register.php">立即注册</a></p>
  </div>
</main>
<script src="js/common.js"></script>
<script>
(function(){
  document.getElementById('login-form').onsubmit=function(e){
    e.preventDefault();
    var btn=this.querySelector('.auth-btn');
    btn.disabled=true;btn.textContent='登录中...';
    CloudDoc.post('api/auth.php?action=login',{
      username:document.getElementById('username').value,
      password:document.getElementById('password').value
    }).then(function(d){
      if(d.ok)location.href='index.php';
      else{btn.disabled=false;btn.textContent='登 录';}
    }).catch(function(){btn.disabled=false;btn.textContent='登 录';});
  };
})();
</script>
</body>
</html>
