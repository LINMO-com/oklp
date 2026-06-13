// ========== 编辑器 - 完整版 ==========
(function(){
  var API='api/documents.php';
  var id=new URLSearchParams(location.search).get('id');
  var editor=document.getElementById('editor');
  var titleInput=document.getElementById('doc-title');
  var selBtnStyle='primary';
  var fileCat='all';

  function toast(msg,type){type=type||'info';var colors={success:'#50C878',error:'#FF6B6B',info:'#1E90FF',warning:'#F59E0B'};var t=document.createElement('div');t.style.cssText='background:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:10px;font-size:14px;border-left:4px solid '+colors[type];t.innerHTML='<span style="color:'+colors[type]+';font-weight:700">'+(type==='success'?'✓':type==='error'?'✗':'ℹ')+'</span><span>'+msg+'</span>';var c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.style.cssText='position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px';document.body.appendChild(c);}c.appendChild(t);setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},3000);}
  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function fmtSize(b){if(b<1024)return b+' B';if(b<1024*1024)return (b/1024).toFixed(1)+' KB';return (b/1024/1024).toFixed(1)+' MB';}

  // 读取现有文档
  if(id){var xhr=new XMLHttpRequest();xhr.open('GET',API+'?action=get&id='+id,true);xhr.onload=function(){try{var d=JSON.parse(xhr.responseText);if(d.ok){titleInput.value=d.doc.title||'';editor.innerHTML=d.doc.content||'';}else toast('加载失败','error');}catch(e){toast('数据错误','error');}};xhr.send();}

  function updateStatus(){var n=(editor.textContent||'').length;var s=document.getElementById('status');if(s)s.textContent=n+' 字';}
  editor.addEventListener('input',updateStatus);
  updateStatus();

  // 粗体/斜体/下划线
  document.querySelectorAll('.tb').forEach(function(b){
    if(b.dataset.cmd){b.onclick=function(){document.execCommand(b.dataset.cmd,false,null);editor.focus();};}
  });

  // 保存按钮
  document.getElementById('btn-save').onclick=function(){save();};
  document.getElementById('btn-share').onclick=function(){save(share);};
  document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();save();}});

  function save(cb){
    var xhr=new XMLHttpRequest();xhr.open('POST',API+'?action=save',true);xhr.setRequestHeader('Content-Type','application/json');
    xhr.onload=function(){try{var d=JSON.parse(xhr.responseText);if(d.ok){if(!id){id=d.id;history.replaceState({},'','editor.php?id='+id);}toast('已保存','success');if(cb)cb();}else toast('保存失败','error');}catch(e){toast('数据错误','error');}};
    xhr.send(JSON.stringify({id:id,title:titleInput.value,content:editor.innerHTML}));
  }
  function share(){
    var xhr=new XMLHttpRequest();xhr.open('POST','api/share.php?action=share',true);xhr.setRequestHeader('Content-Type','application/json');
    xhr.onload=function(){try{var d=JSON.parse(xhr.responseText);if(d.ok){document.getElementById('share-url').value=location.protocol+'//'+location.host+'/generated/'+d.file;document.getElementById('m-share').style.display='flex';}else toast('分享失败','error');}catch(e){toast('数据错误','error');}};
    xhr.send(JSON.stringify({id:id,title:titleInput.value,html:editor.innerHTML}));
  }

  // --- 所有弹窗的关闭按钮 ---
  document.querySelectorAll('.modal .modal-close').forEach(function(b){
    b.onclick=function(){
      var m=b;while(m&&m.className!=='modal')m=m.parentElement;
      if(m)m.style.display='none';
    };
  });
  document.querySelectorAll('.modal').forEach(function(m){
    m.onclick=function(e){if(e.target===m)m.style.display='none';};
  });

  // --- 插入按钮 ---
  document.getElementById('btn-ins-btn').onclick=function(){document.getElementById('m-btn').style.display='flex';};
  document.querySelectorAll('#btn-opts .btn-opt').forEach(function(o){
    o.onclick=function(){document.querySelectorAll('#btn-opts .btn-opt').forEach(function(x){x.classList.remove('selected');});o.classList.add('selected');selBtnStyle=o.dataset.style;};
  });
  if(document.querySelector('#btn-opts .btn-opt'))document.querySelector('#btn-opts .btn-opt').classList.add('selected');
  document.getElementById('btn-confirm').onclick=function(){
    var text=document.getElementById('btn-text').value||'按钮';
    var url=document.getElementById('btn-url').value||'#';
    var cls='editor-btn editor-btn-'+selBtnStyle;
    var html='<a href="'+esc(url)+'" class="'+cls+'" data-url="'+esc(url)+'" target="_blank" style="margin:4px">'+esc(text)+'</a>';
    insertAtCursor(html);document.getElementById('m-btn').style.display='none';document.getElementById('btn-text').value='';document.getElementById('btn-url').value='';
  };

  // --- 插入复制框 ---
  document.getElementById('btn-ins-copy').onclick=function(){document.getElementById('m-copy').style.display='flex';};
  document.getElementById('copy-confirm').onclick=function(){
    var content=document.getElementById('copy-text').value||'';if(!content.trim()){toast('请输入内容','warning');return;}
    var html='<div class="editor-copy-box" data-copy-content="'+esc(content)+'" style="padding:16px;background:#f3f4f6;border:2px dashed #1E90FF;border-radius:8px;margin:8px 0;cursor:pointer;font-family:Consolas,\'Courier New\',monospace;word-break:break-all">'+esc(content)+'</div>';
    insertAtCursor(html);document.getElementById('m-copy').style.display='none';document.getElementById('copy-text').value='';toast('已插入','success');
  };

  // --- 插入视频 ---
  document.getElementById('btn-ins-video').onclick=function(){document.getElementById('m-video').style.display='flex';};
  document.getElementById('video-confirm').onclick=function(){
    var url=document.getElementById('video-url').value||'';if(!url.trim()){toast('请输入视频链接','warning');return;}
    var html='<div class="editor-video-wrap" style="margin:14px 0"><video class="editor-video" src="'+esc(url)+'" controls preload="metadata" style="max-width:100%;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);display:block">您的浏览器不支持视频播放</video></div>';
    insertAtCursor(html);document.getElementById('m-video').style.display='none';document.getElementById('video-url').value='';toast('视频已插入','success');
  };

  // --- 插入音频 ---
  document.getElementById('btn-ins-audio').onclick=function(){document.getElementById('m-audio').style.display='flex';};
  document.getElementById('audio-confirm').onclick=function(){
    var url=document.getElementById('audio-url').value||'';if(!url.trim()){toast('请输入音频链接','warning');return;}
    var html='<div class="editor-audio-wrap" style="margin:14px 0;padding:14px;background:#f8f9fa;border-radius:12px;display:flex;align-items:center;gap:12px"><span style="font-size:28px">🎵</span><audio controls preload="none" style="flex:1;height:36px"><source src="'+esc(url)+'">您的浏览器不支持音频播放</audio></div>';
    insertAtCursor(html);document.getElementById('m-audio').style.display='none';document.getElementById('audio-url').value='';toast('音频已插入','success');
  };

  // --- 插入已有文件（从 API 获取）---
  document.getElementById('btn-ins-file').onclick=function(){loadFiles();document.getElementById('m-file').style.display='flex';};
  function loadFiles(){
    var x=new XMLHttpRequest();x.open('GET','api/files.php?action=list',true);
    x.onload=function(){try{var d=JSON.parse(x.responseText);if(d.ok){renderFileChooser(d.files);}else toast('加载失败','error');}catch(e){toast('数据错误','error');}};
    x.send();
  }
  function renderFileChooser(allData){
    var box=document.getElementById('file-list');
    var list;
    if(fileCat==='all'){
      list=[];for(var k in allData)list=list.concat(allData[k]||[]);
    }else{
      list=allData[fileCat]||[];
    }
    if(list.length===0){box.innerHTML='<div style="padding:32px;text-align:center;color:#999;font-size:13px;">暂无文件</div>';return;}
    box.innerHTML='';
    for(var i=0;i<list.length;i++){
      var f=list[i];
      var row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:12px;padding:10px;border-radius:10px;margin-bottom:6px;background:#fafafa';
      var thumbHtml='';
      if(f.kind==='image')thumbHtml='<img src="'+f.url+'" style="width:44px;height:44px;object-fit:cover;border-radius:8px">';
      else if(f.kind==='video')thumbHtml='<div style="width:44px;height:44px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;flex-shrink:0">▶</div>';
      else if(f.kind==='audio')thumbHtml='<span style="font-size:26px">🎵</span>';
      else if(f.kind==='app')thumbHtml=f.is_app_icon?('<img src="'+f.icon+'" style="width:44px;height:44px;border-radius:10px;object-fit:cover">'):'<span style="font-size:26px">📱</span>';
      else if(f.kind==='zip')thumbHtml='<span style="font-size:26px">📦</span>';
      else thumbHtml='<span style="font-size:26px">📄</span>';
      row.innerHTML=thumbHtml+'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(f.display_name)+'</div><div style="font-size:11px;color:#999">'+(f.kind||f.type).toUpperCase()+' · '+fmtSize(f.size)+'</div></div><button data-idx="'+i+'" style="padding:6px 14px;background:#1E90FF;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;flex-shrink:0">插入</button>';
      (function(file){row.querySelector('button').onclick=function(e){insertFileIntoEditor(file);document.getElementById('m-file').style.display='none';};})(f);
      box.appendChild(row);
    }
  }

  // --- 分类 tabs ---
  document.querySelectorAll('#file-tabs .ft').forEach(function(b){
    b.onclick=function(){
      document.querySelectorAll('#file-tabs .ft').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      fileCat=b.dataset.cat;
      loadFiles();
    };
  });

  // --- 插入文件到编辑器（按类型渲染）---
  function insertFileIntoEditor(f){
    var html='';
    if(f.kind==='image'){
      html='<div style="margin:14px 0;text-align:center"><img src="'+f.url+'" alt="'+esc(f.display_name)+'" class="editor-img" style="max-width:100%;max-height:600px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);display:inline-block"><div style="font-size:12px;color:#999;margin-top:8px">'+esc(f.display_name)+'</div></div>';
    }else if(f.kind==='video'){
      html='<div class="editor-video-wrap" style="margin:14px 0"><div style="font-size:12px;color:#999;margin-bottom:6px">'+esc(f.display_name)+'</div><video class="editor-video" src="'+f.url+'" controls preload="metadata" style="max-width:100%;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);display:block">您的浏览器不支持视频播放</video></div>';
    }else if(f.kind==='audio'){
      html='<div class="editor-audio-wrap" style="margin:14px 0;padding:14px;background:#f8f9fa;border-radius:12px;display:flex;align-items:center;gap:12px"><span style="font-size:28px">🎵</span><div style="flex:1"><div style="font-size:12px;color:#333;font-weight:500;margin-bottom:4px">'+esc(f.display_name)+'</div><audio controls preload="none" style="width:100%;height:36px"><source src="'+f.url+'">您的浏览器不支持音频播放</audio></div></div>';
    }else if(f.kind==='app'){
      var icon=f.is_app_icon?('<img src="'+f.icon+'" class="app-icon-img" style="width:56px;height:56px;border-radius:14px;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,.15)">'):'<span style="font-size:36px">📱</span>';
      html='<div class="media-card app-card" style="margin:14px 0;display:flex;align-items:center;gap:16px;padding:14px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);background:white;border:1px solid #e5e7eb"><div style="flex:0 0 auto">'+icon+'</div><div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:600;color:#1F2937;margin-bottom:4px">'+esc(f.display_name)+'</div><div style="font-size:12px;color:#999">'+f.type.toUpperCase()+' · '+fmtSize(f.size)+'</div></div><div style="flex:0 0 auto"><a href="'+f.download_url+'" class="editor-btn editor-btn-primary" download style="display:inline-block;padding:10px 24px;background:#1E90FF;color:#fff;border:none;border-radius:8px;text-decoration:none;font-weight:600">⬇ 下载</a></div></div>';
    }else{
      var ic=f.kind==='zip'?'📦':'📄';
      html='<div class="media-card file-card" style="margin:14px 0;display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);background:white;border:1px solid #e5e7eb"><div style="flex:0 0 auto;font-size:32px">'+ic+'</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500;color:#1F2937">'+esc(f.display_name)+'</div><div style="font-size:11px;color:#999">'+f.type.toUpperCase()+' · '+fmtSize(f.size)+'</div></div><div style="flex:0 0 auto"><a href="'+f.download_url+'" class="editor-btn editor-btn-primary" download style="display:inline-block;padding:10px 20px;background:#1E90FF;color:#fff;border:none;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">⬇ 下载</a></div></div>';
    }
    insertAtCursor(html);toast('已插入','success');
  }

  // --- 在光标位置插入 ---
  function insertAtCursor(html){
    editor.focus();
    var sel=window.getSelection();
    var temp=document.createElement('div');
    temp.innerHTML=html;
    if(sel&&sel.rangeCount>0&&editor.contains(sel.anchorNode)){
      var range=sel.getRangeAt(0);range.deleteContents();
      var frag=document.createDocumentFragment(),node,last;
      while((node=temp.firstChild)){last=frag.appendChild(node);}
      range.insertNode(frag);
      if(last){range.setStartAfter(last);range.collapse(true);sel.removeAllRanges();sel.addRange(range);}
    }else{
      while(temp.firstChild)editor.appendChild(temp.firstChild);
    }
    updateStatus();
  }

  // --- 分享链接弹窗 ---
  document.getElementById('btn-copy-share').onclick=function(){
    var inp=document.getElementById('share-url');
    inp.select();
    try{document.execCommand('copy');toast('已复制链接','success');}catch(e){toast('复制失败','warning');}
  };

  // --- 编辑器内点击：复制框跳转 ---
  editor.addEventListener('click',function(e){
    var cb=e.target.closest('.editor-copy-box');
    if(cb){e.preventDefault();var t=cb.getAttribute('data-copy-content')||cb.textContent;if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){toast('已复制','success');});else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('已复制','success');}catch(err){}document.body.removeChild(ta);}return;}
    var btn=e.target.closest('.editor-btn');
    if(btn){e.preventDefault();var u=btn.getAttribute('data-url')||btn.getAttribute('href');if(u&&u!=='#'){window.open(u,'_blank');}}
  });
})();
