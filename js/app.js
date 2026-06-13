// 首页 - 云文档
(function(){
  var API='api/documents.php';
  function toast(msg,type){
    type=type||'info';
    var t=document.createElement('div');
    var colors={success:'#50C878',error:'#FF6B6B',info:'#1E90FF',warning:'#F59E0B'};
    t.className='toast toast-'+type;
    t.style.cssText='background:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:10px;font-size:14px;border-left:4px solid '+colors[type];
    t.innerHTML='<span style="color:'+colors[type]+';font-weight:700">'+(type==='success'?'✓':type==='error'?'✗':'ℹ')+'</span><span>'+msg+'</span>';
    var c=document.getElementById('toast-container');
    if(!c){c=document.createElement('div');c.id='toast-container';c.style.cssText='position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px';document.body.appendChild(c);}
    c.appendChild(t);
    setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},3000);
  }
  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function timeAgo(ts){var s=Math.floor(Date.now()/1000-ts);if(s<60)return'刚刚';if(s<3600)return Math.floor(s/60)+'分钟前';if(s<86400)return Math.floor(s/3600)+'小时前';return new Date(ts*1000).toLocaleDateString('zh-CN');}
  function fmtSize(b){if(b<1024)return b+' B';if(b<1024*1024)return (b/1024).toFixed(1)+' KB';return (b/1024/1024).toFixed(1)+' MB';}

  function load(){
    var xhr=new XMLHttpRequest();
    xhr.open('GET',API+'?action=list',true);
    xhr.onload=function(){
      try{var d=JSON.parse(xhr.responseText);if(d.ok)render(d.docs);else toast('加载失败','error');}
      catch(e){toast('数据错误','error');}
    };
    xhr.onerror=function(){toast('网络错误','error');};
    xhr.send();
  }
  function render(docs){
    var grid=document.getElementById('doc-grid');
    var empty=document.getElementById('empty');
    if(!docs||docs.length===0){empty.style.display='block';grid.innerHTML='';return;}
    empty.style.display='none';
    var html='';
    for(var i=0;i<docs.length;i++){
      var d=docs[i];
      html+='<div class="doc-card" style="background:rgba(255,255,255,.94);padding:18px;border-radius:16px;box-shadow:0 8px 26px rgba(0,0,0,.10);border:1px solid rgba(255,255,255,.55);display:flex;flex-direction:column;gap:10px;backdrop-filter:blur(14px)"><div class="dc-title">'+esc(d.title||'无标题')+'</div><div class="dc-meta">'+timeAgo(d.time)+'</div><div class="dc-actions" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:100%"><a class="dc-btn dc-edit" href="editor.php?id='+d.id+'" style="display:flex;align-items:center;justify-content:center;min-height:40px;padding:9px 8px;border-radius:13px;background:linear-gradient(135deg,#1E90FF,#2563eb);color:#fff;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap;box-shadow:0 8px 20px rgba(30,144,255,.22)">编辑</a><button class="dc-btn dc-share" data-id="'+d.id+'" style="display:flex;align-items:center;justify-content:center;min-height:40px;padding:9px 8px;border-radius:13px;background:rgba(255,255,255,.26);color:#1F2937;border:1px solid rgba(30,144,255,.35);font-size:13px;font-weight:700;white-space:nowrap;backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 8px 20px rgba(30,144,255,.12)">分享</button><button class="dc-btn dc-del" data-id="'+d.id+'" style="display:flex;align-items:center;justify-content:center;min-height:40px;padding:9px 8px;border-radius:13px;background:linear-gradient(135deg,#FF6B6B,#ef4444);color:#fff;border:none;font-size:13px;font-weight:700;white-space:nowrap;box-shadow:0 8px 20px rgba(239,68,68,.22)">删除</button></div></div>';
    }
    grid.innerHTML=html;
    grid.querySelectorAll('.dc-del').forEach(function(b){b.onclick=function(){del(b.dataset.id);};});
    grid.querySelectorAll('.dc-share').forEach(function(b){b.onclick=function(){share(b.dataset.id);};});
  }
  function del(id){
    if(!confirm('删除这个文档？'))return;
    var xhr=new XMLHttpRequest();xhr.open('POST',API+'?action=delete',true);
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.onload=function(){try{var d=JSON.parse(xhr.responseText);if(d.ok){toast('已删除','success');load();}else toast('失败','error');}catch(e){toast('数据错误','error');}};
    xhr.send(JSON.stringify({id:id}));
  }
  function share(id){
    var xhr=new XMLHttpRequest();xhr.open('GET',API+'?action=get&id='+id,true);
    xhr.onload=function(){
      try{var d=JSON.parse(xhr.responseText);if(!d.ok){toast('失败','error');return;}
      var sx=new XMLHttpRequest();sx.open('POST','api/share.php?action=share',true);sx.setRequestHeader('Content-Type','application/json');
      sx.onload=function(){try{var s=JSON.parse(sx.responseText);if(s.ok){showShare(s.url);}else toast('分享失败','error');}catch(e){toast('数据错误','error');}};
      sx.send(JSON.stringify({id:d.doc.id,title:d.doc.title,html:d.doc.content}));}
      catch(e){toast('数据错误','error');}
    };xhr.send();
  }
  function showShare(url){
    var m=document.createElement('div');m.className='modal';
    var finalUrl = url.indexOf('http')===0 ? url : location.origin + '/' + url.replace(/^\/+/,'');
    m.innerHTML='<div class="modal-box"><div class="modal-hd"><h3>分享链接</h3><button class="modal-close" id="mx">×</button></div><p style="color:#888;font-size:13px;margin-bottom:12px;">点击下方链接可直接浏览（纯 HTML）</p><input class="in" id="share-in" readonly value="'+finalUrl+'"><button class="btn-primary" id="share-copy" style="width:100%;margin-top:12px;">复制链接</button></div>';
    document.body.appendChild(m);m.style.display='flex';
    m.querySelector('#mx').onclick=function(){m.remove();};
    m.querySelector('#share-copy').onclick=function(){var inp=m.querySelector('#share-in');inp.select();try{document.execCommand('copy');toast('已复制','success');}catch(e){toast('复制失败','warning');}};
    m.onclick=function(e){if(e.target===m)m.remove();};
  }
  document.getElementById('btn-new').onclick=function(){location.href='editor.php';};
  load();
})();
