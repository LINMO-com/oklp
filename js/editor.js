// 编辑器 - 云文档
(function(){
  var API='api/documents.php';
  var id=new URLSearchParams(location.search).get('id');
  var editor=document.getElementById('editor');
  var titleInput=document.getElementById('doc-title');
  var selBtnStyle='primary';

  function toast(msg,type){type=type||'info';var colors={success:'#50C878',error:'#FF6B6B',info:'#1E90FF',warning:'#F59E0B'};var t=document.createElement('div');t.style.cssText='background:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:10px;font-size:14px;border-left:4px solid '+colors[type];t.innerHTML='<span style="color:'+colors[type]+';font-weight:700">'+(type==='success'?'✓':type==='error'?'✗':'ℹ')+'</span><span>'+msg+'</span>';var c=document.getElementById('toast-container');if(!c){c=document.createElement('div');c.style.cssText='position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px';document.body.appendChild(c);}c.appendChild(t);setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},3000);}
  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function uid(){return 'doc-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);}
  function fmtSize(b){if(b<1024)return b+' B';if(b<1024*1024)return (b/1024).toFixed(1)+' KB';return (b/1024/1024).toFixed(1)+' MB';}
  function isApp(name){var e=name.split('.').pop().toLowerCase();return e==='apk'||e==='apks'||e==='xapk'||e==='ipa';}

  if(id){var xhr=new XMLHttpRequest();xhr.open('GET',API+'?action=get&id='+id,true);xhr.onload=function(){try{var d=JSON.parse(xhr.responseText);if(d.ok){titleInput.value=d.doc.title||'';editor.innerHTML=d.doc.content||'';}else toast('加载失败','error');}catch(e){toast('数据错误','error');}};xhr.send();}

  function updateStatus(){var n=(editor.textContent||'').length;document.getElementById('status').textContent=n+' 字';}
  editor.addEventListener('input',updateStatus);

  document.querySelectorAll('.tb').forEach(function(b){if(b.dataset.cmd){b.onclick=function(){document.execCommand(b.dataset.cmd,false,null);editor.focus();};}});

  document.getElementById('btn-save').onclick=function(){save();};
  document.getElementById('btn-share').onclick=function(){save();};
  document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();save();}});

  function save(cb){var xhr=new XMLHttpRequest();xhr.open('POST',API+'?action=save',true);xhr.setRequestHeader('Content-Type','application/json');xhr.onload=function(){try{var d=JSON.parse(xhr.responseText);if(d.ok){if(!id){id=d.id;history.replaceState({},'','editor.php?id='+id);}toast('已保存','success');if(cb)cb(d.id);}else toast('保存失败','error');}catch(e){toast('数据错误','error');}};xhr.send(JSON.stringify({id:id,title:titleInput.value,content:editor.innerHTML}));}
  function share(){save(function(sid){var xhr=new XMLHttpRequest();xhr.open('POST','api/share.php?action=share',true);xhr.setRequestHeader('Content-Type','application/json');xhr.onload=function(){try{var d=JSON.parse(xhr.responseText);if(d.ok){document.getElementById('share-url').value=location.origin+d.url;document.getElementById('m-share').style.display='flex';}else toast('分享失败','error');}catch(e){toast('数据错误','error');}};xhr.send(JSON.stringify({id:sid,title:titleInput.value,html:editor.innerHTML}));});}

  document.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){document.getElementById(b.dataset.close).style.display='none';};});
  document.querySelectorAll('.modal').forEach(function(m){m.onclick=function(e){if(e.target===m)m.style.display='none';};});

  document.getElementById('btn-ins-btn').onclick=function(){document.getElementById('m-btn').style.display='flex';};
  document.querySelectorAll('#btn-opts .btn-opt').forEach(function(o){o.onclick=function(){document.querySelectorAll('#btn-opts .btn-opt').forEach(function(x){x.classList.remove('selected');});o.classList.add('selected');selBtnStyle=o.dataset.style;};});
  document.querySelector('#btn-opts .btn-opt').classList.add('selected');
  document.getElementById('btn-confirm').onclick=function(){var text=document.getElementById('btn-text').value||'按钮';var url=document.getElementById('btn-url').value||'#';var cls='editor-btn editor-btn-'+selBtnStyle;var html='<a href="'+esc(url)+'" class="'+cls+'" data-url="'+esc(url)+'" target="_blank" style="margin:4px">'+esc(text)+'</a>';editor.focus();document.execCommand('insertHTML',false,html);document.getElementById('m-btn').style.display='none';document.getElementById('btn-text').value='';document.getElementById('btn-url').value='';};

  document.getElementById('btn-ins-copy').onclick=function(){document.getElementById('m-copy').style.display='flex';};
  document.getElementById('copy-confirm').onclick=function(){var content=document.getElementById('copy-text').value||'';if(!content.trim()){toast('请输入内容','warning');return;}var html='<div class="editor-copy-box" data-copy-content="'+esc(content)+'" style="padding:16px;background:#f3f4f6;border:2px dashed #1E90FF;border-radius:8px;margin:8px 0;cursor:pointer;font-family:monospace;word-break:break-all;">'+esc(content)+'</div>';editor.focus();document.execCommand('insertHTML',false,html);document.getElementById('m-copy').style.display='none';document.getElementById('copy-text').value='';};

  document.getElementById('btn-ins-file').onclick=function(){loadFiles();document.getElementById('m-file').style.display='flex';};
  var fileCat='all';var fileData=null;
  function loadFiles(){var x=new XMLHttpRequest();x.open('GET','api/files.php?action=list',true);x.onload=function(){try{var d=JSON.parse(x.responseText);if(d.ok){fileData=d.files;renderFiles();}else toast('加载失败','error');}catch(e){toast('数据错误','error');}};x.send();}
  function renderFiles(){
    var all=[];if(fileCat==='all'){for(var k in fileData)all=all.concat(fileData[k]||[]);}else all=fileData[fileCat]||[];var box=document.getElementById('file-list');
    if(all.length===0){box.innerHTML='<div style="padding:20px;text-align:center;color:#999">暂无文件</div>';return;}
    var html='';
    for(var i=0;i<all.length;i++){var f=all[i];
      var iconTag=f.is_app_icon?('<img src="'+f.icon+'" style="width:40px;height:40px;border-radius:8px;object-fit:cover">'):('<span style="font-size:28px">'+f.icon+'</span>');
      html+='<div class="file-item" data-cat="'+f.type+'"><div style="padding:0 8px">'+iconTag+'</div><div class="fi-info" style="flex:1;min-width:0"><div class="fi-name" style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(f.display_name)+'</div><div class="fi-size" style="font-size:11px;color:#999">'+fmtSize(f.size)+'</div></div><button class="dc-btn" data-download="'+f.download_url+'" data-name="'+esc(f.display_name)+'" data-display="'+esc(f.display_name)+'" data-icon="'+f.icon+'" data-isapp="'+(f.is_app_icon?1:0)+'" data-url="'+f.url+'">插入</button></div>';
    }
    box.innerHTML=html;
    box.querySelectorAll('.file-item').forEach(function(el){el.style.cssText='display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;cursor:pointer;';el.onmouseenter=function(){el.style.background='#f3f4f6';};el.onmouseleave=function(){el.style.background='';};});
    box.querySelectorAll('.dc-btn').forEach(function(b){b.onclick=function(){insertFile(b.dataset);document.getElementById('m-file').style.display='none';};});
  }
  function insertFile(d){
    var html;
    if(d.isapp==='1'||(d.dataDownload&&(d.dataIcon&&(d.dataIcon.indexOf('uploads/app_icon')===0))){
      // APP：左边图片，右边下载按钮
      html='<div class="app-card" style="display:flex;align-items:center;gap:16px;margin:8px 0;padding:12px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08)">\n  <div class="ac-left" style="flex:0 0 auto"><img src="'+d.dataIcon+'" class="fr-img-icon" style="width:64px;height:64px;border-radius:12px;object-fit:cover;box-shadow:0 2px 6px rgba(0,0,0,.1)" onerror="this.outerHTML=\'<span style=\\\'font-size:40px\\\'>📱</span>\'"></div>\n  <div class="ac-center" style="flex:1;min-width:0"><div class="ac-name" style="font-size:14px;font-weight:600;margin-bottom:4px">'+d.dataDisplay+'</div></div>\n  <div class="ac-right" style="flex:0 0 auto"><a href="'+d.dataDownload+'" class="editor-btn editor-btn-primary" download style="display:inline-block;padding:10px 24px;background:#1E90FF;color:#fff;border:none;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;cursor:pointer">⬇ 下载</a></div>\n</div>';
    }else{
      // 其他文件：图标+名称+下载按钮
      html='<a href="'+d.dataDownload+'" class="editor-file-link" download style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:#f3f4f6;border-radius:8px;color:#1E90FF;text-decoration:none;margin:4px;font-weight:500;font-size:14px"><span style="font-size:20px">'+d.dataIcon+'</span><span>'+d.dataDisplay+'</span></a>';
    }
    editor.focus();
    var range=window.getSelection().rangeCount>0?window.getSelection().getRangeAt(0):null;
    if(range&&editor.contains(range.commonAncestorContainer)){
      var fragment=document.createElement('div');
      fragment.innerHTML=html;
      for(var i=fragment.childNodes.length-1;i>=0;i--)range.insertNode(fragment.childNodes[i].cloneNode(true));
    }else{
      editor.innerHTML+=html;
    }
    updateStatus();
  }
  document.querySelectorAll('#file-tabs .ft').forEach(function(b){b.onclick=function(){document.querySelectorAll('#file-tabs .ft').forEach(function(x){x.classList.remove('active');});b.classList.add('active');fileCat=b.dataset.cat;renderFiles();};});

  document.getElementById('btn-ins-video').onclick=function(){document.getElementById('m-video').style.display='flex';};
  document.getElementById('video-confirm').onclick=function(){var url=document.getElementById('video-url').value||'';if(!url.trim()){toast('请输入视频链接','warning');return;}var html='<video class="editor-video" src="'+esc(url)+'" controls preload="metadata" style="max-width:100%;border-radius:8px;margin:8px 0">您的浏览器不支持视频播放</video>';editor.focus();document.execCommand('insertHTML',false,html);document.getElementById('m-video').style.display='none';document.getElementById('video-url').value='';toast('视频已插入','info');};

  document.getElementById('btn-ins-audio').onclick=function(){document.getElementById('m-audio').style.display='flex';};
  document.getElementById('audio-confirm').onclick=function(){var url=document.getElementById('audio-url').value||'';if(!url.trim()){toast('请输入音频链接','warning');return;}var html='<audio class="editor-audio" src="'+esc(url)+'" controls style="width:100%;margin:8px 0;border-radius:8px">您的浏览器不支持音频播放</audio>';editor.focus();document.execCommand('insertHTML',false,html);document.getElementById('m-audio').style.display='none';document.getElementById('audio-url').value='';};

  document.getElementById('btn-copy-share').onclick=function(){var inp=document.getElementById('share-url');inp.select();try{document.execCommand('copy');toast('已复制','success');}catch(e){toast('复制失败','warning');}};

  editor.addEventListener('click',function(e){
    var cb=e.target.closest('.editor-copy-box');
    if(cb){e.preventDefault();var t=cb.getAttribute('data-copy-content')||cb.textContent;if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){toast('已复制','success');});else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('已复制','success');}catch(err){}document.body.removeChild(ta);}}
    var btn=e.target.closest('.editor-btn');if(btn){e.preventDefault();var u=btn.getAttribute('data-url')||btn.getAttribute('href');if(u&&u!=='#')window.open(u,'_blank');}
  });

  updateStatus();
})();