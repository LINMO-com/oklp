// 文件管理 - 云文档 【悬浮上传窗 + 灵动岛】
(function(){
  var API='api/files.php';
  var zone=document.getElementById('up-zone');var input=document.getElementById('up-input');
  var fp=document.getElementById('float-panel');var fpBody=document.getElementById('fp-body');
  var island=null;var islandState='expanded';

  function toast(msg,type){
    type=type||'info';var colors={success:'#50C878',error:'#FF6B6B',info:'#1E90FF',warning:'#F59E0B'};
    var t=document.createElement('div');t.style.cssText='background:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:10px;font-size:14px;border-left:4px solid '+colors[type];
    t.innerHTML='<span style="color:'+colors[type]+';font-weight:700">'+(type==='success'?'✓':type==='error'?'✗':'ℹ')+'</span><span>'+msg+'</span>';
    var c=document.getElementById('toast-container');
    if(!c){c=document.createElement('div');c.id='toast-container';c.style.cssText='position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px';document.body.appendChild(c);}
    c.appendChild(t);setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},3000);
  }
  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function fmtSize(b){if(b<1024)return b+' B';if(b<1024*1024)return (b/1024).toFixed(1)+' KB';return (b/1024/1024).toFixed(1)+' MB';}

  // 上传触发
  zone.onclick=function(){input.click();};
  input.onchange=function(e){upload(e.target.files);input.value='';};
  zone.addEventListener('dragover',function(e){e.preventDefault();zone.classList.add('dragover');});
  zone.addEventListener('dragleave',function(){zone.classList.remove('dragover');});
  zone.addEventListener('drop',function(e){e.preventDefault();zone.classList.remove('dragover');upload(e.dataTransfer.files);});

  // 悬浮窗关闭按钮 -> 缩成灵动岛
  document.getElementById('fp-close').onclick=function(){collapse();};

  function showFloat(items){
    islandState='expanded';fp.style.display='flex';fpBody.innerHTML='';
    for(var i=0;i<items.length;i++)fpBody.appendChild(items[i].el);
    if(island){island.remove();island=null;}
  }
  function collapse(){
    islandState='collapsed';fp.style.display='none';
    // 统计
    var total=0,done=0,items=document.querySelectorAll('.fp-item');
    items.forEach(function(it){total++;if(it.dataset.done==='1')done++;});
    if(!island){
      island=document.createElement('div');
      island.className='island';
      island.innerHTML='<span class="il-ico">📤</span><span class="il-text">'+done+'/'+total+'</span>';
      island.onclick=expand;document.body.appendChild(island);
    }else{island.querySelector('.il-text').textContent=done+'/'+total;}
  }
  function expand(){
    islandState='expanded';if(island){island.remove();island=null;}fp.style.display='flex';
  }

  function upload(files){
    if(!files||files.length===0)return;
    var items=[];
    for(var i=0;i<files.length;i++){
      var el=document.createElement('div');el.className='fp-item';el.dataset.done='0';
      el.innerHTML='<div class="fp-row"><span class="fp-name" title="'+esc(files[i].name)+'">'+esc(files[i].name)+'</span><span class="fp-size">'+fmtSize(files[i].size)+'</span></div><div class="fp-bar"><div class="fp-fill"></div></div><div class="fp-status">等待中</div>';
      items.push({el:el,file:files[i],fill:el.querySelector('.fp-fill'),status:el.querySelector('.fp-status')});
    }
    showFloat(items);
    doUpload(items,0);
  }
  function doUpload(items,idx){
    if(idx>=items.length){finish(items);return;}
    var it=items[idx];it.status.textContent='上传中...';it.status.style.color='#1E90FF';
    var fd=new FormData();fd.append('f',it.file);
    var x=new XMLHttpRequest();
    x.upload.addEventListener('progress',function(e){
      if(e.lengthComputable){var p=Math.round((e.loaded/e.total)*100);it.fill.style.width=p+'%';it.status.textContent=p+'%';}
    });
    x.open('POST',API+'?action=upload',true);
    x.onload=function(){
      try{var d=JSON.parse(x.responseText);if(d.ok){it.fill.style.width='100%';it.fill.style.background='#50C878';it.status.textContent='✓ 完成';it.status.style.color='#50C878';it.el.dataset.done='1';}
      else{it.fill.style.background='#FF6B6B';it.status.textContent='✗ 失败';it.status.style.color='#FF6B6B';}}
      catch(e){it.fill.style.background='#FF6B6B';it.status.textContent='✗ 失败';}
      if(island){var done=0;items.forEach(function(x){if(x.el.dataset.done==='1')done++;});island.querySelector('.il-text').textContent=done+'/'+items.length;}
      setTimeout(function(){doUpload(items,idx+1);},200);
    };
    x.onerror=function(){it.fill.style.background='#FF6B6B';it.status.textContent='✗ 错误';setTimeout(function(){doUpload(items,idx+1);},200);};
    x.send(fd);
  }
  function finish(items){
    var ok=0;items.forEach(function(x){if(x.el.dataset.done==='1')ok++;});
    toast(ok+' 个文件上传成功','success');
    load();
    // 3秒后收起为灵动岛（如果还展开）
    setTimeout(function(){if(islandState==='expanded')collapse();},2500);
  }

  // 列表
  function load(){
    var x=new XMLHttpRequest();x.open('GET',API+'?action=list',true);
    x.onload=function(){
      try{var d=JSON.parse(x.responseText);if(d.ok){render('list-zip',d.files.zip||[]);render('list-app',d.files.app||[]);render('list-media',d.files.media||[]);render('list-other',d.files.other||[]);}else toast('加载失败','error');}
      catch(e){toast('数据错误','error');}
    };x.send();
  }
  function render(cid,arr){
    var c=document.getElementById(cid);
    if(!arr||arr.length===0){c.innerHTML='<div style="padding:16px;color:#999;text-align:center;font-size:13px;">暂无文件</div>';return;}
    var html='';
    for(var i=0;i<arr.length;i++){
      var cat=cid.replace('list-','');
      html+='<div class="file-row"><span class="fr-ico">📄</span><span class="fr-name" title="'+esc(arr[i].name)+'">'+esc(arr[i].name)+'</span><span class="fr-size">'+fmtSize(arr[i].size)+'</span><a href="'+arr[i].url+'" class="fr-btn" download>下载</a><button class="fr-btn fr-del" data-cat="'+cat+'" data-name="'+esc(arr[i].name)+'">删除</button></div>';
    }
    c.innerHTML=html;
    c.querySelectorAll('.fr-del').forEach(function(b){b.onclick=function(){del(b.dataset.cat,b.dataset.name);};});
  }
  function del(cat,name){
    if(!confirm('删除 '+name+'？'))return;
    var x=new XMLHttpRequest();x.open('POST',API+'?action=delete',true);x.setRequestHeader('Content-Type','application/json');
    x.onload=function(){try{var d=JSON.parse(x.responseText);if(d.ok){toast('已删除','success');load();}else toast('失败','error');}catch(e){toast('数据错误','error');}};
    x.send(JSON.stringify({cat:cat,name:name}));
  }
  load();
})();