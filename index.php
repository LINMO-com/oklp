<?php
declare(strict_types=1);

/**
 * 门户入口 - PHP 8.2 兼容
 * 默认显示按钮导航，有 ?s= 参数时进入系统
 */

function show_portal(): void {
    echo <<<HTML
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>云服务中心</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 50%, #0f0f2e 100%); min-height: 100vh; color: #fff; overflow-x: hidden; }
.header { text-align: center; padding: 60px 20px 30px; }
.header h1 { font-size: 42px; font-weight: 700; background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; }
.header p { color: #94a3b8; font-size: 16px; }
.container { max-width: 1100px; margin: 0 auto; padding: 20px; }
.service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-top: 40px; }
.service-card { background: rgba(30, 30, 60, 0.6); border: 1px solid rgba(96, 165, 250, 0.15); border-radius: 16px; padding: 30px 24px; text-align: center; text-decoration: none; color: #fff; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px); cursor: pointer; display: block; }
.service-card:hover { transform: translateY(-6px); border-color: rgba(96, 165, 250, 0.4); box-shadow: 0 20px 40px rgba(96, 165, 250, 0.15); background: rgba(40, 40, 80, 0.7); }
.service-icon { width: 64px; height: 64px; margin: 0 auto 20px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
.card-shop .service-icon { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
.card-admin .service-icon { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
.card-query .service-icon { background: linear-gradient(135deg, #10b981, #34d399); }
.card-user .service-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.card-login .service-icon { background: linear-gradient(135deg, #ef4444, #f87171); }
.card-register .service-icon { background: linear-gradient(135deg, #ec4899, #f472b6); }
.service-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.service-card p { font-size: 13px; color: #94a3b8; line-height: 1.6; }
.footer { text-align: center; padding: 60px 20px 40px; color: #64748b; font-size: 12px; }
@media (max-width: 640px) {
    .header h1 { font-size: 32px; }
    .header { padding: 40px 15px 20px; }
    .service-grid { grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 25px; }
    .service-card { padding: 20px 12px; }
    .service-icon { width: 48px; height: 48px; font-size: 24px; border-radius: 12px; margin-bottom: 12px; }
    .service-card h3 { font-size: 14px; }
    .service-card p { font-size: 11px; }
}
</style>
</head>
<body>
<div class="header">
    <h1>云服务中心</h1>
    <p>选择一个服务开始使用</p>
</div>
<div class="container">
    <div class="service-grid">
        <a href="?s=/user/index/index" class="service-card card-shop">
            <div class="service-icon">&#128722;</div>
            <h3>商品商城</h3>
            <p>浏览和购买商品</p>
        </a>
        <a href="?s=/admin" class="service-card card-admin">
            <div class="service-icon">&#9881;</div>
            <h3>管理后台</h3>
            <p>系统管理与配置</p>
        </a>
        <a href="?s=/user/index/query" class="service-card card-query">
            <div class="service-icon">&#128269;</div>
            <h3>订单查询</h3>
            <p>查询您的订单记录</p>
        </a>
        <a href="?s=/user/personal/index" class="service-card card-user">
            <div class="service-icon">&#128100;</div>
            <h3>用户中心</h3>
            <p>个人信息与设置</p>
        </a>
        <a href="?s=/user/authentication/login" class="service-card card-login">
            <div class="service-icon">&#128274;</div>
            <h3>登录账号</h3>
            <p>登录您的账户</p>
        </a>
        <a href="?s=/user/authentication/register" class="service-card card-register">
            <div class="service-icon">&#128221;</div>
            <h3>注册账号</h3>
            <p>创建新账户</p>
        </a>
    </div>
</div>
<div class="footer">Powered by ACG Shop System &middot; PHP 8.2 Ready</div>
</body>
</html>
HTML;
}

if (!isset($_GET['s']) || trim((string)$_GET['s']) === '') {
    show_portal();
    exit;
}

define('BASE_PATH', __DIR__ . "/");
require(BASE_PATH . 'kernel/Kernel.php');
