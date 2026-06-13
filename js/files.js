// ========== 文件管理 - 完整版（fetch + 鉴权） ==========
(function(){
  'use strict';
  var CD = CloudDoc;
  var API = 'api/files.php';
  var zone = document.getElementById('up-zone');
  var input = document.getElementById('up-input');
  var floatPanel = null;
  var uploadQueue = [];

  // ========== 上传区域 ==========
  zone.onclick = function() { input.click(); };
  input.onchange = function(e) {
    if (e.target.files && e.target.files.length > 0) startUpload(e.target.files);
    input.value = '';
  };
  zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
  zone.addEventListener('drop', function(e) {
    e.preventDefault(); zone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) startUpload(e.dataTransfer.files);
  });

  // ========== 浮动面板 ==========
  function showFloatPanel() {
    if (floatPanel) return floatPanel;
    floatPanel = document.createElement('div');
    floatPanel.className = 'float-panel';
    floatPanel.innerHTML = '<div class="fp-head"><span>📤 上传中</span><button class="fp-close">×</button></div><div class="fp-body"></div>';
    document.body.appendChild(floatPanel);
    floatPanel.querySelector('.fp-close').onclick = function() { floatPanel.style.display = 'none'; };
    return floatPanel;
  }
  function hideFloatPanel() {
    if (floatPanel) floatPanel.style.display = 'none';
  }

  // ========== 串行上传 ==========
  function startUpload(fileList) {
    var files = []; for (var i = 0; i < fileList.length; i++) files.push(fileList[i]);
    showFloatPanel();
    floatPanel.style.display = 'flex';
    processNext(files, 0);
  }

  function processNext(files, idx) {
    if (idx >= files.length) {
      CD.toast('全部上传完成', 'success');
      setTimeout(function() { hideFloatPanel(); }, 2000);
      load();
      return;
    }
    var file = files[idx];
    var isApp = /\.(apk|apks|xapk|ipa)$/i.test(file.name);

    var item = document.createElement('div');
    item.className = 'fp-item';
    item.innerHTML = '<div class="fp-row"><span class="fp-icon">📄</span><span class="fp-name">' + CD.esc(file.name) + '</span></div><div class="fp-bar"><div class="fp-fill" style="width:0%"></div></div><div class="fp-status">等待中...</div>';
    floatPanel.querySelector('.fp-body').appendChild(item);

    var fill = item.querySelector('.fp-fill');
    var status = item.querySelector('.fp-status');
    status.textContent = '准备中...';

    if (isApp) {
      showAppDialog(file, function(result) {
        uploadOne(file, result.customName, result.icon, fill, status, function() {
          processNext(files, idx + 1);
        });
      });
    } else {
      uploadOne(file, null, null, fill, status, function() {
        processNext(files, idx + 1);
      });
    }
  }

  function uploadOne(file, customName, icon, fill, status, cb) {
    var fd = new FormData();
    fd.append('f', file);
    if (customName) fd.append('name', customName);
    if (icon) fd.append('icon', icon);

    status.textContent = '上传中 0%';
    var x = new XMLHttpRequest();
    x.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        var p = Math.round((e.loaded / e.total) * 100);
        fill.style.width = p + '%';
        status.textContent = p + '%';
      }
    });
    x.onload = function() {
      try {
        var d = JSON.parse(x.responseText);
        if (d.ok) {
          fill.style.width = '100%';
          fill.style.background = '#10b981';
          status.textContent = '✓ 完成';
          status.style.color = '#10b981';
        } else {
          fill.style.background = '#FF6B6B';
          status.textContent = '✗ ' + (d.error || '失败');
          status.style.color = '#FF6B6B';
        }
      } catch(e) {
        fill.style.background = '#FF6B6B';
        status.textContent = '✗ 错误';
        status.style.color = '#FF6B6B';
      }
      setTimeout(cb, 200);
    };
    x.onerror = function() {
      fill.style.background = '#FF6B6B';
      status.textContent = '✗ 网络错误';
      setTimeout(cb, 200);
    };
    x.open('POST', API + '?action=upload', true);
    x.send(fd);
  }

  // ========== APP 信息对话框 ==========
  function showAppDialog(file, cb) {
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = '<div class="modal-box"><div class="modal-hd"><h3>📱 设置 APP 信息</h3><button class="modal-close">×</button></div><p style="color:#888;font-size:12px;margin-bottom:12px;">文件：' + CD.esc(file.name) + '</p><label style="display:block;font-size:13px;margin-bottom:6px;">名称（可选）</label><input class="in" id="ad-name" placeholder="如：微信 8.0.50"><label style="display:block;font-size:13px;margin:12px 0 6px 0;">图标（可选）</label><input type="file" id="ad-icon" accept="image/*" class="in" style="padding:10px;background:#f8f9fa;border:2px dashed #ccc;border-radius:8px"><div id="ad-preview" style="margin:12px 0;text-align:center;min-height:56px"></div><div style="display:flex;gap:10px;margin-top:16px"><button id="ad-skip" style="flex:1;padding:10px;border:2px solid #ccc;background:white;border-radius:8px;cursor:pointer;font-size:13px;">默认即可</button><button id="ad-ok" style="flex:1;padding:10px;background:#1E90FF;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">开始上传</button></div></div>';
    document.body.appendChild(modal);

    var nameInput = modal.querySelector('#ad-name');
    var iconInput = modal.querySelector('#ad-icon');
    var preview = modal.querySelector('#ad-preview');
    var selectedIcon = null;

    var dotIdx = file.name.lastIndexOf('.');
    var baseName = dotIdx >= 0 ? file.name.substring(0, dotIdx) : file.name;
    nameInput.value = baseName;

    iconInput.onchange = function(e) {
      if (e.target.files && e.target.files[0]) {
        selectedIcon = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function(ev) {
          preview.innerHTML = '<img src="' + ev.target.result + '" style="max-width:72px;max-height:72px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.2)">';
        };
        reader.readAsDataURL(selectedIcon);
      }
    };

    modal.querySelector('.modal-close').onclick = function() { modal.remove(); cb({ customName: null, icon: null }); };
    modal.onclick = function(e) { if (e.target === modal) { modal.remove(); cb({ customName: null, icon: null }); } };
    modal.querySelector('#ad-ok').onclick = function() { modal.remove(); cb({ customName: nameInput.value.trim(), icon: selectedIcon }); };
    modal.querySelector('#ad-skip').onclick = function() { modal.remove(); cb({ customName: null, icon: null }); };
  }

  // ========== 加载文件列表 ==========
  function load() {
    CD.get(API + '?action=list').then(function(d) {
      if (d && d.ok) {
        renderSection('list-image', d.files.image || [], renderImageCard);
        renderSection('list-video', d.files.video || [], renderVideoCard);
        renderSection('list-audio', d.files.audio || [], renderAudioCard);
        renderSection('list-app', d.files.app || [], renderAppCard);
        renderSection('list-zip', d.files.zip || [], renderFileCard);
        renderSection('list-other', d.files.other || [], renderFileCard);
      }
    });
  }

  function renderSection(cid, arr, fn) {
    var c = document.getElementById(cid);
    if (!c) return;
    if (!arr || arr.length === 0) {
      c.innerHTML = '<div style="padding:32px;color:#bbb;text-align:center;font-size:13px;">暂无文件</div>';
      return;
    }
    c.innerHTML = '';
    arr.forEach(function(f) { c.appendChild(fn(f)); });
  }

  function renderImageCard(f) {
    var d = document.createElement('div'); d.className = 'media-card image-card';
    d.innerHTML = '<div class="mc-thumb"><img src="' + f.url + '" alt="' + CD.esc(f.display_name) + '" loading="lazy"></div><div class="mc-info"><div class="mc-name" title="' + CD.esc(f.display_name) + '">' + CD.esc(f.display_name) + '</div><div class="mc-meta">' + f.type.toUpperCase() + ' · ' + CD.fmtSize(f.size) + '</div></div><div class="mc-actions"><a href="' + f.download_url + '" class="mc-btn download" download>⬇</a><button class="mc-btn del" data-kind="' + f.kind + '" data-name="' + CD.esc(f.name) + '">🗑</button></div>';
    bindDel(d); return d;
  }

  function renderVideoCard(f) {
    var d = document.createElement('div'); d.className = 'media-card video-card';
    d.innerHTML = '<div class="mc-thumb video-thumb"><video src="' + f.url + '" preload="metadata" muted playsinline></video><span class="play-overlay">▶</span></div><div class="mc-info"><div class="mc-name" title="' + CD.esc(f.display_name) + '">' + CD.esc(f.display_name) + '</div><div class="mc-meta">' + f.type.toUpperCase() + ' · ' + CD.fmtSize(f.size) + '</div></div><div class="mc-actions"><a href="' + f.download_url + '" class="mc-btn download" download>⬇</a><button class="mc-btn del" data-kind="' + f.kind + '" data-name="' + CD.esc(f.name) + '">🗑</button></div>';
    var video = d.querySelector('video');
    var overlay = d.querySelector('.play-overlay');
    d.querySelector('.video-thumb').onclick = function() {
      if (video.paused) { video.play(); overlay.style.display = 'none'; }
      else { video.pause(); video.currentTime = 0; overlay.style.display = 'flex'; }
    };
    bindDel(d); return d;
  }

  function renderAudioCard(f) {
    var d = document.createElement('div'); d.className = 'media-card audio-card';
    d.innerHTML = '<div class="mc-thumb audio-thumb">🎵</div><div class="mc-info" style="flex:1"><div class="mc-name" title="' + CD.esc(f.display_name) + '">' + CD.esc(f.display_name) + '</div><div class="mc-meta">' + f.type.toUpperCase() + ' · ' + CD.fmtSize(f.size) + '</div><audio controls preload="none" style="width:100%;margin-top:8px;max-width:420px;height:32px"><source src="' + f.url + '">您的浏览器不支持音频播放</audio></div><div class="mc-actions"><a href="' + f.download_url + '" class="mc-btn download" download>⬇</a><button class="mc-btn del" data-kind="' + f.kind + '" data-name="' + CD.esc(f.name) + '">🗑</button></div>';
    bindDel(d); return d;
  }

  function renderAppCard(f) {
    var d = document.createElement('div'); d.className = 'media-card app-card';
    var iconHtml = f.is_app_icon ? '<img src="' + f.icon + '" class="app-icon-img">' : '<span style="font-size:36px">📱</span>';
    d.innerHTML = '<div class="mc-thumb app-thumb">' + iconHtml + '</div><div class="mc-info" style="flex:1"><div class="mc-name" title="' + CD.esc(f.display_name) + '">' + CD.esc(f.display_name) + '</div><div class="mc-meta">' + f.type.toUpperCase() + ' · ' + CD.fmtSize(f.size) + '</div></div><div class="mc-actions" style="flex-direction:row;gap:8px"><a href="' + f.download_url + '" class="mc-btn-primary" download>下载</a><button class="mc-btn del" data-kind="' + f.kind + '" data-name="' + CD.esc(f.name) + '">🗑</button></div>';
    bindDel(d); return d;
  }

  function renderFileCard(f) {
    var d = document.createElement('div'); d.className = 'media-card file-card';
    var ic = f.kind === 'zip' ? '📦' : '📄';
    d.innerHTML = '<div class="mc-thumb file-thumb">' + ic + '</div><div class="mc-info" style="flex:1"><div class="mc-name" title="' + CD.esc(f.display_name) + '">' + CD.esc(f.display_name) + '</div><div class="mc-meta">' + f.type.toUpperCase() + ' · ' + CD.fmtSize(f.size) + '</div></div><div class="mc-actions" style="flex-direction:row;gap:8px"><a href="' + f.download_url + '" class="mc-btn-primary" download>下载</a><button class="mc-btn del" data-kind="' + f.kind + '" data-name="' + CD.esc(f.name) + '">🗑</button></div>';
    bindDel(d); return d;
  }

  function bindDel(node) {
    var btn = node.querySelector('.mc-btn.del');
    if (btn) btn.onclick = function() { delFile(btn.dataset.kind, btn.dataset.name, node); };
  }

  function delFile(kind, name, node) {
    if (!confirm('确定删除该文件？')) return;
    CD.post(API + '?action=delete', { cat: kind, name: name }).then(function(d) {
      if (d && d.ok) {
        node.style.transition = 'opacity .2s';
        node.style.opacity = '0';
        setTimeout(function() { node.remove(); CD.toast('已删除', 'success'); }, 200);
      }
    });
  }

  // ========== 初始化 ==========
  CD.renderNav().then(function() { load(); });
})();
