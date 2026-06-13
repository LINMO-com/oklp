/**
 * CloudDoc - 公共工具函数
 */
var CloudDoc = CloudDoc || {};

(function (CD) {
  'use strict';

  // ========== API 请求封装 ==========
  CD.api = function (url, options) {
    options = options || {};
    var opts = {
      method: options.method || 'GET',
      headers: options.headers || {},
      credentials: 'same-origin'
    };
    if (options.body && opts.method !== 'GET') {
      if (options.json) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(options.body);
      } else {
        opts.body = options.body; // FormData
      }
    }
    return fetch(url, opts)
      .then(function (res) {
        if (res.status === 401) {
          // 未登录，跳转到登录页
          location.href = 'login.php';
          return Promise.reject(new Error('未登录'));
        }
        return res.json();
      })
      .then(function (data) {
        if (data.ok === false && data.error) {
          CD.toast(data.error, 'error');
        }
        return data;
      });
  };

  CD.get = function (url) { return CD.api(url); };
  CD.post = function (url, body) { return CD.api(url, { method: 'POST', json: true, body: body }); };
  CD.upload = function (url, formData) { return CD.api(url, { method: 'POST', body: formData }); };

  // ========== Toast 提示 ==========
  CD.toast = function (msg, type) {
    type = type || 'info';
    var colors = { success: '#10b981', error: '#FF6B6B', info: '#1E90FF', warning: '#F59E0B' };
    var icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('data-type', type);
    t.innerHTML = '<span style="color:' + colors[type] + ';font-weight:700">' + icons[type] + '</span><span>' + CD.esc(msg) + '</span>';
    var c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px';
      document.body.appendChild(c);
    }
    c.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(function () { t.remove(); }, 300);
    }, 3000);
  };

  // ========== 工具函数 ==========
  CD.esc = function (s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  };

  CD.timeAgo = function (ts) {
    var s = Math.floor(Date.now() / 1000 - ts);
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + '分钟前';
    if (s < 86400) return Math.floor(s / 3600) + '小时前';
    return new Date(ts * 1000).toLocaleDateString('zh-CN');
  };

  CD.fmtSize = function (b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(1) + ' MB';
  };

  CD.fmtTime = function (ts) {
    return new Date(ts * 1000).toLocaleString('zh-CN');
  };

  // ========== 检查登录状态 ==========
  CD.checkAuth = function () {
    return CD.get('api/auth.php?action=check').then(function (data) {
      if (data && data.ok) return data;
      return null;
    }).catch(function () { return null; });
  };

  // ========== 弹窗管理 ==========
  CD.openModal = function (id) {
    var m = document.getElementById(id);
    if (m) m.style.display = 'flex';
  };

  CD.closeModal = function (id) {
    var m = document.getElementById(id);
    if (m) m.style.display = 'none';
  };

  CD.initModals = function () {
    document.querySelectorAll('.modal .modal-close').forEach(function (b) {
      b.onclick = function () {
        var m = b;
        while (m && !m.classList.contains('modal')) m = m.parentElement;
        if (m) m.style.display = 'none';
      };
    });
    document.querySelectorAll('.modal').forEach(function (m) {
      m.onclick = function (e) { if (e.target === m) m.style.display = 'none'; };
    });
  };

  // ========== 导航栏用户信息 ==========
  CD.renderNav = function () {
    return CD.checkAuth().then(function (user) {
      var navLinks = document.querySelector('.nav-links');
      if (!navLinks) return;
      if (user) {
        navLinks.innerHTML =
          '<a href="index.php">文档</a>' +
          '<a href="files.php">文件</a>' +
          '<span class="nav-user">' + CD.esc(user.username) + '</span>' +
          '<a href="#" id="nav-logout">退出</a>';
        var logoutBtn = document.getElementById('nav-logout');
        if (logoutBtn) {
          logoutBtn.onclick = function (e) {
            e.preventDefault();
            CD.post('api/auth.php?action=logout', {}).then(function () {
              location.href = 'login.php';
            });
          };
        }
      } else {
        navLinks.innerHTML =
          '<a href="login.php">登录</a>' +
          '<a href="register.php">注册</a>';
      }
    });
  };

})(CloudDoc);
