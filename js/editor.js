// ========== 编辑器 - 完整版（自动保存 + 图片粘贴 + fetch） ==========
(function(){
  'use strict';
  var CD = CloudDoc;
  var API = 'api/documents.php';
  var id = new URLSearchParams(location.search).get('id');
  var editor = document.getElementById('editor');
  var titleInput = document.getElementById('doc-title');
  var selBtnStyle = 'primary';
  var fileCat = 'all';
  var autoSaveTimer = null;
  var lastSavedContent = '';
  var lastSavedTitle = '';

  // ========== 读取现有文档 ==========
  if (id) {
    CD.get(API + '?action=get&id=' + id).then(function(d) {
      if (d && d.ok) {
        titleInput.value = d.doc.title || '';
        editor.innerHTML = d.doc.content || '';
        lastSavedContent = d.doc.content || '';
        lastSavedTitle = d.doc.title || '';
        updateStatus();
      }
    });
  }

  // ========== 字数统计 ==========
  function updateStatus() {
    var n = (editor.textContent || '').length;
    var s = document.getElementById('status');
    if (s) s.textContent = n + ' 字';
  }
  editor.addEventListener('input', function() {
    updateStatus();
    scheduleAutoSave();
  });
  titleInput.addEventListener('input', function() {
    scheduleAutoSave();
  });
  updateStatus();

  // ========== 自动保存（30秒无操作后保存） ==========
  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    var indicator = document.getElementById('autosave-status');
    if (indicator) indicator.textContent = '● 未保存';
    if (indicator) indicator.style.color = '#F59E0B';
    autoSaveTimer = setTimeout(function() {
      autoSave();
    }, 30000);
  }

  function autoSave() {
    var content = editor.innerHTML;
    var title = titleInput.value;
    if (content === lastSavedContent && title === lastSavedTitle) return;

    var indicator = document.getElementById('autosave-status');
    if (indicator) { indicator.textContent = '● 保存中...'; indicator.style.color = '#1E90FF'; }

    saveDoc(function() {
      if (indicator) { indicator.textContent = '✓ 已自动保存'; indicator.style.color = '#10b981'; }
      setTimeout(function() { if (indicator) indicator.textContent = ''; }, 3000);
    });
  }

  // ========== 手动保存 ==========
  document.getElementById('btn-save').onclick = function() { saveDoc(function() { CD.toast('已保存', 'success'); }); };
  document.getElementById('btn-share').onclick = function() { saveDoc(shareDoc); };
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDoc(function() { CD.toast('已保存', 'success'); });
    }
  });

  function saveDoc(cb) {
    CD.post(API + '?action=save', {
      id: id,
      title: titleInput.value,
      content: editor.innerHTML
    }).then(function(d) {
      if (d && d.ok) {
        if (!id) {
          id = d.id;
          history.replaceState({}, '', 'editor.php?id=' + id);
        }
        lastSavedContent = editor.innerHTML;
        lastSavedTitle = titleInput.value;
        if (cb) cb();
      }
    });
  }

  function shareDoc() {
    CD.post('api/share.php?action=create', {
      id: id,
      title: titleInput.value,
      html: editor.innerHTML
    }).then(function(d) {
      if (d && d.ok) {
        document.getElementById('share-url').value = location.protocol + '//' + location.host + '/' + d.url.replace(/^\/+/, '');
        CD.openModal('m-share');
      }
    });
  }

  // ========== 富文本命令 ==========
  document.querySelectorAll('.tb').forEach(function(b) {
    if (b.dataset.cmd) {
      b.onclick = function() { document.execCommand(b.dataset.cmd, false, null); editor.focus(); };
    }
  });

  // ========== 弹窗管理 ==========
  CD.initModals();

  // ========== 插入按钮 ==========
  document.getElementById('btn-ins-btn').onclick = function() { CD.openModal('m-btn'); };
  document.querySelectorAll('#btn-opts .btn-opt').forEach(function(o) {
    o.onclick = function() {
      document.querySelectorAll('#btn-opts .btn-opt').forEach(function(x) { x.classList.remove('selected'); });
      o.classList.add('selected');
      selBtnStyle = o.dataset.style;
    };
  });
  if (document.querySelector('#btn-opts .btn-opt')) document.querySelector('#btn-opts .btn-opt').classList.add('selected');
  document.getElementById('btn-confirm').onclick = function() {
    var text = document.getElementById('btn-text').value || '按钮';
    var url = document.getElementById('btn-url').value || '#';
    var cls = 'editor-btn editor-btn-' + selBtnStyle;
    var html = '<a href="' + CD.esc(url) + '" class="' + cls + '" data-url="' + CD.esc(url) + '" target="_blank" style="margin:4px">' + CD.esc(text) + '</a>';
    insertAtCursor(html);
    CD.closeModal('m-btn');
    document.getElementById('btn-text').value = '';
    document.getElementById('btn-url').value = '';
  };

  // ========== 插入复制框 ==========
  document.getElementById('btn-ins-copy').onclick = function() { CD.openModal('m-copy'); };
  document.getElementById('copy-confirm').onclick = function() {
    var content = document.getElementById('copy-text').value || '';
    if (!content.trim()) { CD.toast('请输入内容', 'warning'); return; }
    var html = '<div class="editor-copy-box" data-copy-content="' + CD.esc(content) + '">' + CD.esc(content) + '</div>';
    insertAtCursor(html);
    CD.closeModal('m-copy');
    document.getElementById('copy-text').value = '';
    CD.toast('已插入', 'success');
  };

  // ========== 插入视频 ==========
  document.getElementById('btn-ins-video').onclick = function() { CD.openModal('m-video'); };
  document.getElementById('video-confirm').onclick = function() {
    var url = document.getElementById('video-url').value || '';
    if (!url.trim()) { CD.toast('请输入视频链接', 'warning'); return; }
    var html = '<div class="editor-video-wrap"><video src="' + CD.esc(url) + '" controls preload="metadata">您的浏览器不支持视频播放</video></div>';
    insertAtCursor(html);
    CD.closeModal('m-video');
    document.getElementById('video-url').value = '';
    CD.toast('视频已插入', 'success');
  };

  // ========== 插入音频 ==========
  document.getElementById('btn-ins-audio').onclick = function() { CD.openModal('m-audio'); };
  document.getElementById('audio-confirm').onclick = function() {
    var url = document.getElementById('audio-url').value || '';
    if (!url.trim()) { CD.toast('请输入音频链接', 'warning'); return; }
    var html = '<div class="editor-audio-wrap"><span style="font-size:28px">🎵</span><audio controls preload="none"><source src="' + CD.esc(url) + '">您的浏览器不支持音频播放</audio></div>';
    insertAtCursor(html);
    CD.closeModal('m-audio');
    document.getElementById('audio-url').value = '';
    CD.toast('音频已插入', 'success');
  };

  // ========== 图片上传（按钮 + 粘贴 + 拖拽） ==========
  var imageUploadInput = document.getElementById('image-upload');

  document.getElementById('btn-ins-image').onclick = function() { imageUploadInput.click(); };

  imageUploadInput.onchange = function(e) {
    if (e.target.files && e.target.files[0]) uploadImage(e.target.files[0]);
    imageUploadInput.value = '';
  };

  // 粘贴图片
  editor.addEventListener('paste', function(e) {
    var items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        var file = items[i].getAsFile();
        uploadImage(file);
        return;
      }
    }
  });

  // 拖拽图片
  editor.addEventListener('dragover', function(e) { e.preventDefault(); });
  editor.addEventListener('drop', function(e) {
    e.preventDefault();
    var files = e.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
      if (files[i].type.indexOf('image') !== -1) {
        uploadImage(files[i]);
      }
    }
  });

  function uploadImage(file) {
    CD.toast('正在上传图片...', 'info');
    var fd = new FormData();
    fd.append('f', file);
    CD.upload('api/files.php?action=upload', fd).then(function(d) {
      if (d && d.ok) {
        var html = '<div style="margin:14px 0;text-align:center"><img src="' + d.url + '" alt="' + CD.esc(d.display_name) + '" class="editor-img"></div>';
        insertAtCursor(html);
        CD.toast('图片已插入', 'success');
      }
    });
  }

  // ========== 插入已有文件 ==========
  document.getElementById('btn-ins-file').onclick = function() { loadFiles(); CD.openModal('m-file'); };

  function loadFiles() {
    CD.get('api/files.php?action=list').then(function(d) {
      if (d && d.ok) renderFileChooser(d.files);
    });
  }

  function renderFileChooser(allData) {
    var box = document.getElementById('file-list');
    var list;
    if (fileCat === 'all') {
      list = [];
      for (var k in allData) list = list.concat(allData[k] || []);
    } else {
      list = allData[fileCat] || [];
    }
    if (list.length === 0) {
      box.innerHTML = '<div style="padding:32px;text-align:center;color:#999;font-size:13px;">暂无文件</div>';
      return;
    }
    box.innerHTML = '';
    list.forEach(function(f) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px;border-radius:10px;margin-bottom:6px;background:#fafafa';
      var thumbHtml = '';
      if (f.kind === 'image') thumbHtml = '<img src="' + f.url + '" style="width:44px;height:44px;object-fit:cover;border-radius:8px">';
      else if (f.kind === 'video') thumbHtml = '<div style="width:44px;height:44px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;flex-shrink:0">▶</div>';
      else if (f.kind === 'audio') thumbHtml = '<span style="font-size:26px">🎵</span>';
      else if (f.kind === 'app') thumbHtml = f.is_app_icon ? '<img src="' + f.icon + '" style="width:44px;height:44px;border-radius:10px;object-fit:cover">' : '<span style="font-size:26px">📱</span>';
      else if (f.kind === 'zip') thumbHtml = '<span style="font-size:26px">📦</span>';
      else thumbHtml = '<span style="font-size:26px">📄</span>';

      row.innerHTML = thumbHtml +
        '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + CD.esc(f.display_name) + '</div>' +
        '<div style="font-size:11px;color:#999">' + (f.kind || f.type).toUpperCase() + ' · ' + CD.fmtSize(f.size) + '</div></div>' +
        '<button class="file-insert-btn" style="padding:6px 14px;background:#1E90FF;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;flex-shrink:0">插入</button>';

      (function(file) {
        row.querySelector('.file-insert-btn').onclick = function() {
          insertFileIntoEditor(file);
          CD.closeModal('m-file');
        };
      })(f);
      box.appendChild(row);
    });
  }

  // 分类 tabs
  document.querySelectorAll('#file-tabs .ft').forEach(function(b) {
    b.onclick = function() {
      document.querySelectorAll('#file-tabs .ft').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active');
      fileCat = b.dataset.cat;
      loadFiles();
    };
  });

  function insertFileIntoEditor(f) {
    var html = '';
    if (f.kind === 'image') {
      html = '<div style="margin:14px 0;text-align:center"><img src="' + f.url + '" alt="' + CD.esc(f.display_name) + '" class="editor-img"></div>';
    } else if (f.kind === 'video') {
      html = '<div class="editor-video-wrap"><video src="' + f.url + '" controls preload="metadata">您的浏览器不支持视频播放</video></div>';
    } else if (f.kind === 'audio') {
      html = '<div class="editor-audio-wrap"><span style="font-size:28px">🎵</span><div style="flex:1"><div style="font-size:12px;color:#333;font-weight:500;margin-bottom:4px">' + CD.esc(f.display_name) + '</div><audio controls preload="none" style="width:100%;height:36px"><source src="' + f.url + '">您的浏览器不支持音频播放</audio></div></div>';
    } else if (f.kind === 'app') {
      var icon = f.is_app_icon ? '<img src="' + f.icon + '" class="app-icon-img">' : '<span style="font-size:36px">📱</span>';
      html = '<div class="media-card app-card"><div style="flex:0 0 auto">' + icon + '</div><div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:600;color:#1F2937;margin-bottom:4px">' + CD.esc(f.display_name) + '</div><div style="font-size:12px;color:#999">' + f.type.toUpperCase() + ' · ' + CD.fmtSize(f.size) + '</div></div><div style="flex:0 0 auto"><a href="' + f.download_url + '" class="editor-btn editor-btn-primary" download>⬇ 下载</a></div></div>';
    } else {
      var ic = f.kind === 'zip' ? '📦' : '📄';
      html = '<div class="media-card file-card"><div style="flex:0 0 auto;font-size:32px">' + ic + '</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500;color:#1F2937">' + CD.esc(f.display_name) + '</div><div style="font-size:11px;color:#999">' + f.type.toUpperCase() + ' · ' + CD.fmtSize(f.size) + '</div></div><div style="flex:0 0 auto"><a href="' + f.download_url + '" class="editor-btn editor-btn-primary" download>⬇ 下载</a></div></div>';
    }
    insertAtCursor(html);
    CD.toast('已插入', 'success');
  }

  // ========== 在光标位置插入 ==========
  function insertAtCursor(html) {
    editor.focus();
    var sel = window.getSelection();
    var temp = document.createElement('div');
    temp.innerHTML = html;
    if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      var range = sel.getRangeAt(0);
      range.deleteContents();
      var frag = document.createDocumentFragment(), node, last;
      while ((node = temp.firstChild)) { last = frag.appendChild(node); }
      range.insertNode(frag);
      if (last) { range.setStartAfter(last); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); }
    } else {
      while (temp.firstChild) editor.appendChild(temp.firstChild);
    }
    updateStatus();
  }

  // ========== 复制分享链接 ==========
  document.getElementById('btn-copy-share').onclick = function() {
    var inp = document.getElementById('share-url');
    inp.select();
    try { document.execCommand('copy'); CD.toast('已复制链接', 'success'); }
    catch(e) { CD.toast('复制失败', 'warning'); }
  };

  // ========== 编辑器内点击：复制框 + 按钮 ==========
  editor.addEventListener('click', function(e) {
    var cb = e.target.closest('.editor-copy-box');
    if (cb) {
      e.preventDefault();
      var t = cb.getAttribute('data-copy-content') || cb.textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(t).then(function() { CD.toast('已复制', 'success'); });
      } else {
        var ta = document.createElement('textarea'); ta.value = t;
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); CD.toast('已复制', 'success'); } catch(err) {}
        document.body.removeChild(ta);
      }
      return;
    }
    var btn = e.target.closest('.editor-btn');
    if (btn) {
      e.preventDefault();
      var u = btn.getAttribute('data-url') || btn.getAttribute('href');
      if (u && u !== '#') window.open(u, '_blank');
    }
  });

  // ========== 离开页面前提示 ==========
  window.addEventListener('beforeunload', function(e) {
    if (editor.innerHTML !== lastSavedContent || titleInput.value !== lastSavedTitle) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ========== 初始化 ==========
  CD.renderNav();
})();
