<?php
/**
 * CloudDoc - 文档 API（SQLite + 鉴权 + 搜索 + 回收站）
 */
require_once __DIR__ . '/db.php';

corsHeaders();
$userId = requireAuth();
$db = getDB();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ========== 列表（支持搜索） ==========
if ($action === 'list' && $method === 'GET') {
    $q = trim($_GET['q'] ?? '');
    $sql = 'SELECT id, title, updated_at FROM documents WHERE user_id = ? AND deleted_at IS NULL';
    $params = [$userId];
    if ($q !== '') {
        $sql .= ' AND title LIKE ?';
        $params[] = '%' . $q . '%';
    }
    $sql .= ' ORDER BY updated_at DESC';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(['ok' => true, 'docs' => $stmt->fetchAll()]);
}

// ========== 回收站列表 ==========
if ($action === 'trash' && $method === 'GET') {
    $stmt = $db->prepare('SELECT id, title, deleted_at FROM documents WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC');
    $stmt->execute([$userId]);
    jsonResponse(['ok' => true, 'docs' => $stmt->fetchAll()]);
}

// ========== 获取单个文档 ==========
if ($action === 'get' && $method === 'GET') {
    $id = $_GET['id'] ?? '';
    $stmt = $db->prepare('SELECT id, title, content, updated_at FROM documents WHERE id = ? AND user_id = ? AND deleted_at IS NULL');
    $stmt->execute([$id, $userId]);
    $doc = $stmt->fetch();
    if (!$doc) jsonResponse(['ok' => false, 'error' => '文档不存在'], 404);
    jsonResponse(['ok' => true, 'doc' => $doc]);
}

// ========== 保存文档 ==========
if ($action === 'save' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = trim($input['id'] ?? '');
    $title = mb_substr(trim($input['title'] ?? ''), 0, 200) ?: '无标题';
    $content = $input['content'] ?? '';
    $now = time();

    // 限制内容大小（5MB）
    if (strlen($content) > 5 * 1024 * 1024) {
        jsonResponse(['ok' => false, 'error' => '内容过大'], 400);
    }

    if ($id) {
        // 更新已有文档
        $stmt = $db->prepare('SELECT id FROM documents WHERE id = ? AND user_id = ? AND deleted_at IS NULL');
        $stmt->execute([$id, $userId]);
        if ($stmt->fetch()) {
            $stmt = $db->prepare('UPDATE documents SET title = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$title, $content, $now, $id, $userId]);
        } else {
            // ID 不存在或不属于当前用户，新建
            $id = uid();
            $stmt = $db->prepare('INSERT INTO documents (id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$id, $userId, $title, $content, $now, $now]);
        }
    } else {
        // 新建文档
        $id = uid();
        $stmt = $db->prepare('INSERT INTO documents (id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$id, $userId, $title, $content, $now, $now]);
    }
    jsonResponse(['ok' => true, 'id' => $id]);
}

// ========== 软删除（移入回收站） ==========
if ($action === 'delete' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $stmt = $db->prepare('UPDATE documents SET deleted_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL');
    $stmt->execute([time(), $id, $userId]);
    jsonResponse(['ok' => true]);
}

// ========== 从回收站恢复 ==========
if ($action === 'restore' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $stmt = $db->prepare('UPDATE documents SET deleted_at = NULL WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL');
    $stmt->execute([$id, $userId]);
    jsonResponse(['ok' => true]);
}

// ========== 永久删除 ==========
if ($action === 'permanent_delete' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $stmt = $db->prepare('DELETE FROM documents WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    // 同时删除关联的分享记录
    $stmt = $db->prepare('DELETE FROM shares WHERE document_id = ?');
    $stmt->execute([$id]);
    jsonResponse(['ok' => true]);
}

// ========== 清空回收站 ==========
if ($action === 'empty_trash' && $method === 'POST') {
    // 先获取要删除的文档 ID
    $stmt = $db->prepare('SELECT id FROM documents WHERE user_id = ? AND deleted_at IS NOT NULL');
    $stmt->execute([$userId]);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if ($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $db->prepare("DELETE FROM shares WHERE document_id IN ($placeholders)")->execute($ids);
        $db->prepare("DELETE FROM documents WHERE user_id = ? AND deleted_at IS NOT NULL")->execute([$userId]);
    }
    jsonResponse(['ok' => true]);
}

jsonResponse(['ok' => false, 'error' => '无效操作'], 400);
