<?php
/**
 * CloudDoc - 用户认证 API
 */
require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) session_start();
corsHeaders();

$db = getDB();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'register' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    if (mb_strlen($username) < 2 || mb_strlen($username) > 20) {
        jsonResponse(['ok' => false, 'error' => '用户名长度需 2-20 个字符'], 400);
    }
    if (strlen($password) < 6) {
        jsonResponse(['ok' => false, 'error' => '密码至少 6 位'], 400);
    }
    if (!preg_match('/^[\w\x{4e00}-\x{9fa5}]+$/u', $username)) {
        jsonResponse(['ok' => false, 'error' => '用户名只能包含字母、数字、下划线、中文'], 400);
    }

    $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonResponse(['ok' => false, 'error' => '用户名已存在'], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)');
    $stmt->execute([$username, $hash, time()]);
    $userId = $db->lastInsertId();

    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    jsonResponse(['ok' => true, 'user_id' => $userId, 'username' => $username]);
}

if ($action === 'login' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    $stmt = $db->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['ok' => false, 'error' => '用户名或密码错误'], 401);
    }

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    jsonResponse(['ok' => true, 'user_id' => $user['id'], 'username' => $user['username']]);
}

if ($action === 'logout' && $method === 'POST') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    jsonResponse(['ok' => true]);
}

if ($action === 'check') {
    if (!empty($_SESSION['user_id'])) {
        jsonResponse(['ok' => true, 'user_id' => $_SESSION['user_id'], 'username' => $_SESSION['username'] ?? '']);
    } else {
        jsonResponse(['ok' => false]);
    }
}

jsonResponse(['ok' => false, 'error' => '无效操作'], 400);
