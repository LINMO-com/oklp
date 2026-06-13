<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>注册 - 云文档</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<nav class="nav"><a class="brand" href="index.php">云文档</a><div class="nav-links"><a href="login.php">登录</a></div></nav>
<main class="wrap">
  <div class="auth-box">
    <div class="auth-ico">☁️</div>
    <h2 class="auth-title">注册云文档</h2>
    <form id="reg-form" class="auth-form">
      <input type="text" id="username" class="in" placeholder="用户名（2-20个字符）" autocomplete="username" required minlength="2" maxlength="20">
      <input type="password" id="password" class="in" placeholder="密码（至少6位）" autocomplete="new-password" required minlength="6">
      <input type="password" id="password2" class="in" placeholder="确认密码" autocomplete="new-password" required minlength="6">
      <button type="submit" class="btn-primary auth-btn">注 册</button>
    </form>
    <p class="auth-switch">已有账号？<a href="login.php">去登录</a></p>
  </div>
</main>
<script src="js/common.js"></script>
<script>
(function(){
  document.getElementById('reg-form').onsubmit=function(e){
    e.preventDefault();
    var pw=document.getElementById('password').value;
    var pw2=document.getElementById('password2').value;
    if(pw!==pw2){CloudDoc.toast('两次密码不一致','error');return;}
    var btn=this.querySelector('.auth-btn');
    btn.disabled=true;btn.textContent='注册中...';
    CloudDoc.post('api/auth.php?action=register',{
      username:document.getElementById('username').value,
      password:pw
    }).then(function(d){
      if(d.ok)location.href='index.php';
      else{btn.disabled=false;btn.textContent='注 册';}
    }).catch(function(){btn.disabled=false;btn.textContent='注 册';});
  };
})();
</script>
</body>
</html>
