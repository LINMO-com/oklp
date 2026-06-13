// 分享页面 - 云文档
(function(){
  'use strict';
  var CD = CloudDoc;
  var id = new URLSearchParams(location.search).get('id');

  if (!id) return;

  CD.get('api/documents.php?action=get&id=' + id).then(function(d) {
    if (d && d.ok) {
      document.getElementById('s-title').textContent = d.doc.title;
      document.getElementById('s-meta').textContent = CD.fmtTime(d.doc.updated_at);
      // 安全过滤后渲染
      var temp = document.createElement('div');
      temp.innerHTML = d.doc.content;
      // 移除 script 标签
      temp.querySelectorAll('script').forEach(function(s) { s.remove(); });
      // 移除事件属性
      temp.querySelectorAll('[onclick],[onerror],[onload],[onmouseover]').forEach(function(el) {
        el.removeAttribute('onclick');
        el.removeAttribute('onerror');
        el.removeAttribute('onload');
        el.removeAttribute('onmouseover');
      });
      document.getElementById('s-body').innerHTML = temp.innerHTML;
      document.getElementById('sb').style.display = 'block';
      document.getElementById('s-empty').style.display = 'none';

      // 复制框
      document.querySelectorAll('.editor-copy-box').forEach(function(b) {
        b.onclick = function() {
          var t = b.getAttribute('data-copy-content') || b.textContent;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(t).then(function() { CD.toast('已复制到剪贴板', 'success'); });
          } else {
            var ta = document.createElement('textarea'); ta.value = t;
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); CD.toast('已复制到剪贴板', 'success'); } catch(e) {}
            document.body.removeChild(ta);
          }
        };
      });

      // 按钮
      document.querySelectorAll('.editor-btn').forEach(function(b) {
        b.onclick = function() {
          var u = b.getAttribute('data-url') || b.getAttribute('href');
          if (u && u !== '#') window.open(u, '_blank');
        };
      });
    } else {
      document.getElementById('s-empty').style.display = 'block';
    }
  }).catch(function() {
    document.getElementById('s-empty').style.display = 'block';
  });

  CD.renderNav();
})();
