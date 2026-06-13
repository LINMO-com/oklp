<?php
/**
 * CloudDoc - 数据库初始化与公共函数
 */

define('DB_PATH', __DIR__ . '/../data/clouddoc.db');

function getDB() {
    static $db = null;
    if ($db === null) {
        $dir = dirname(DB_PATH);
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $db = new PDO('sqlite:' . DB_PATH);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $db->exec('PRAGMA journal_mode=WAL');
        $db->exec('PRAGMA foreign_keys=ON');
        initTables($db);
    }
    return $db;
}

function initTables($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )");
    $db->exec("CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        deleted_at INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");
    $db->exec("CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        category TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        icon TEXT DEFAULT '',
        is_app_icon INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");
    $db->exec("CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        html_file TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");
    // 索引
    $db->exec("CREATE INDEX IF NOT EXISTS idx_docs_user ON documents(user_id, deleted_at)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_docs_updated ON documents(user_id, updated_at DESC)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id, category)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_shares_doc ON shares(document_id)");
}

/** 生成安全随机 ID */
function uid() {
    return bin2hex(random_bytes(16));
}

/** 要求登录，返回 user_id */
function requireAuth() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => '未登录']);
        exit;
    }
    return (int)$_SESSION['user_id'];
}

/** 获取当前登录用户 ID（未登录返回 0） */
function currentUserId() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    return !empty($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
}

/** HTML 内容安全过滤：移除 script、事件处理器、javascript: 协议 */
function sanitizeHtml($html) {
    if (empty($html)) return '';
    // 移除 <script> 标签及内容
    $html = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/si', '', $html);
    // 移除 on* 事件属性
    $html = preg_replace('/\s+on\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);
    $html = preg_replace('/\s+on\w+\s*=\s*\S+/i', '', $html);
    // 移除 javascript: / vbscript: 协议
    $html = preg_replace('/(href|src|action)\s*=\s*["\']javascript\s*:[^"\']*["\']/i', '$1="#"', $html);
    $html = preg_replace('/(href|src|action)\s*=\s*["\']vbscript\s*:[^"\']*["\']/i', '$1="#"', $html);
    // 移除 data: 协议（非图片）
    $html = preg_replace('/src\s*=\s*["\']data:(?!image\/)[^"\']*["\']/i', '', $html);
    // 移除 <iframe>, <object>, <embed>, <form> 标签
    $html = preg_replace('/<\s*\/?\s*(iframe|object|embed|form|input|textarea|select|button|base|meta|link)[^>]*>/si', '', $html);
    return $html;
}

/** JSON 输出 */
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** 设置 CORS 头 */
function corsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
