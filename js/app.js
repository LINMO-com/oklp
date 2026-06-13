// 首页 - 云文档
(function(){
  'use strict';
  var CD = CloudDoc;
  var API = 'api/documents.php';

  function load(q) {
    var url = API + '?action=list';
    if (q) url += '&q=' + encodeURIComponent(q);
    CD.get(url).then(function(d) {
      if (d && d.ok) render(d.docs);
    });
  }

  function render(docs) {
    var grid = document.getElementById('doc-grid');
    var empty = document.getElementById('empty');
    if (!docs || docs.length === 0) {
      empty.style.display = 'block';
      grid.innerHTML = '';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = '';
    docs.forEach(function(d) {
      var card = document.createElement('div');
      card.className = 'doc-card';
      card.innerHTML =
        '<div class="dc-title">' + CD.esc(d.title || '无标题') + '</div>' +
        '<div class="dc-meta">' + CD.timeAgo(d.updated_at) + '</div>' +
        '<div class="dc-actions">' +
          '<a class="dc-btn dc-edit" href="editor.php?id=' + d.id + '">编辑</a>' +
          '<button class="dc-btn dc-share" data-id="' + d.id + '">分享</button>' +
          '<button class="dc-btn dc-del" data-id="' + d.id + '">删除</button>' +
        '</div>';
      grid.appendChild(card);
    });

    // 绑定事件
    grid.querySelectorAll('.dc-del').forEach(function(b) {
      b.onclick = function() { delDoc(b.dataset.id); };
    });
    grid.querySelectorAll('.dc-share').forEach(function(b) {
      b.onclick = function() { shareDoc(b.dataset.id); };
    });
  }

  function delDoc(id) {
    if (!confirm('删除这个文档？它会被移入回收站。')) return;
    CD.post(API + '?action=delete', { id: id }).then(function(d) {
      if (d && d.ok) { CD.toast('已移入回收站', 'success'); load(); }
    });
  }

  function shareDoc(id) {
    CD.get(API + '?action=get&id=' + id).then(function(d) {
      if (!d || !d.ok) return;
      CD.post('api/share.php?action=create', {
        id: d.doc.id,
        title: d.doc.title,
        html: d.doc.content
      }).then(function(s) {
        if (s && s.ok) {
          var url = location.protocol + '//' + location.host + '/' + s.url.replace(/^\/+/, '');
          document.getElementById('share-url').value = url;
          CD.openModal('m-share');
        }
      });
    });
  }

  // ========== 搜索 ==========
  var searchInput = document.getElementById('search-input');
  var searchTimer = null;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function() { load(searchInput.value.trim()); }, 300);
  });
  document.getElementById('btn-search').onclick = function() { load(searchInput.value.trim()); };

  // ========== 回收站 ==========
  document.getElementById('btn-trash').onclick = function() { loadTrash(); CD.openModal('m-trash'); };

  function loadTrash() {
    CD.get(API + '?action=trash').then(function(d) {
      if (!d || !d.ok) return;
      var list = document.getElementById('trash-list');
      var footer = document.getElementById('trash-footer');
      if (!d.docs || d.docs.length === 0) {
        list.innerHTML = '<div class="empty" style="padding:24px"><div class="empty-title">回收站为空</div></div>';
        footer.style.display = 'none';
        return;
      }
      footer.style.display = 'block';
      list.innerHTML = '';
      d.docs.forEach(function(doc) {
        var row = document.createElement('div');
        row.className = 'trash-item';
        row.innerHTML =
          '<div class="ti-info"><div class="ti-title">' + CD.esc(doc.title || '无标题') + '</div>' +
          '<div class="ti-time">删除于 ' + CD.timeAgo(doc.deleted_at) + '</div></div>' +
          '<div class="ti-actions">' +
            '<button class="btn-mini" data-id="' + doc.id + '" data-action="restore">恢复</button>' +
            '<button class="btn-mini danger" data-id="' + doc.id + '" data-action="permanent">彻底删除</button>' +
          '</div>';
        list.appendChild(row);
      });

      list.querySelectorAll('[data-action="restore"]').forEach(function(b) {
        b.onclick = function() {
          CD.post(API + '?action=restore', { id: b.dataset.id }).then(function(r) {
            if (r && r.ok) { CD.toast('已恢复', 'success'); loadTrash(); load(); }
          });
        };
      });
      list.querySelectorAll('[data-action="permanent"]').forEach(function(b) {
        b.onclick = function() {
          if (!confirm('彻底删除？此操作不可恢复！')) return;
          CD.post(API + '?action=permanent_delete', { id: b.dataset.id }).then(function(r) {
            if (r && r.ok) { CD.toast('已彻底删除', 'success'); loadTrash(); load(); }
          });
        };
      });
    });
  }

  document.getElementById('btn-empty-trash').onclick = function() {
    if (!confirm('清空回收站？所有文档将被彻底删除，不可恢复！')) return;
    CD.post(API + '?action=empty_trash', {}).then(function(r) {
      if (r && r.ok) { CD.toast('回收站已清空', 'success'); loadTrash(); load(); }
    });
  };

  // ========== 复制分享链接 ==========
  document.getElementById('btn-copy-share').onclick = function() {
    var inp = document.getElementById('share-url');
    inp.select();
    try { document.execCommand('copy'); CD.toast('已复制链接', 'success'); }
    catch(e) { CD.toast('复制失败', 'warning'); }
  };

  // ========== 新建文档 ==========
  document.getElementById('btn-new').onclick = function() { location.href = 'editor.php'; };

  // ========== 初始化 ==========
  CD.renderNav().then(function() { load(); });
  CD.initModals();
})();
