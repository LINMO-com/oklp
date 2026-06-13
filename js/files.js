// 文件管理 - 云文档 【悬浮上传窗 + 灵动岛 + APK自定义】
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
    if(!c){c=document.createElement('div');c.style.cssText='position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px';document.body.appendChild(c);}
    c.appendChild(t);setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},3000);
  }
  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function fmtSize(b){if(b<1024)return b+' B';if(b<1024*1024)return (b/1024).toFixed(1)+' KB';return (b/1024/1024).toFixed(1)+' MB';}
  function isApp(name){var e=name.split('.').pop().toLowerCase();return e==='apk'||e==='apks'||e==='xapk'||e==='ipa';}

  zone.onclick=function(){input.click();};
  input.onchange=function(e){upload(e.target.files);input.value='';};
  zone.addEventListener('dragover',function(e){e.preventDefault();zone.classList.add('dragover');});
  zone.addEventListener('dragleave',function(){zone.classList.remove('dragover');});
  zone.addEventListener('drop',function(e){e.preventDefault();zone.classList.remove('dragover');upload(e.dataTransfer.files);});

  document.getElementById('fp-close').onclick=function(){collapse();};

  function showFloat(items){
    islandState='expanded';fp.style.display='flex';fpBody.innerHTML='';
    for(var i=0;i<items.length;i++)fpBody.appendChild(items[i].el);
    if(island){island.remove();island=null;}
  }
  function collapse(){
    islandState='collapsed';fp.style.display='none';
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
    var queue=[];
    for(var i=0;i<files.length;i++)queue.push({file:files[i]});
    processQueue(queue,0);
  }

  function processQueue(queue,idx){
    if(idx>=queue.length){load();return;}
    var item=queue[idx];
    // 如果是 APK/APKS，弹窗让用户设置名称和图标
    if(isApp(item.file.name)){
      showAppDialog(item.file,function(result){
        doUpload(item.file,result.customName,result.icon,function(){processQueue(queue,idx+1);});
      });
    }else{
      doUpload(item.file,null,null,function(){processQueue(queue,idx+1);});
    }
  }

  function showAppDialog(file,cb){
    var modal=document.createElement('div');
    modal.className='modal';
    modal.setAttribute('id','app-dialog-modal');
    modal.style.display='flex';
    modal.innerHTML='<div class="modal-box"><div class="modal-hd"><h3>📱 APP 上传信息</h3></div><div style="margin:16px 0;color:#999;font-size:12px">原文件：'+esc(file.name)+'</div><label style="display:block;font-size:13px;margin-bottom:6px">自定义名称</label><input class="in" id="ad-name" placeholder="例如：微信 8.0.50" value="'+esc(pathinfo(file.name).filename)+'"><label style="display:block;font-size:13px;margin-bottom:6px;margin-top:10px">选择图标（可选）</label><input type="file" id="ad-icon" accept="image/*" class="in" style="background:#f3f4f6;padding:10px;border:2px dashed #ccc;border-radius:8px"><div id="ad-preview" style="margin:10px 0;text-align:center"></div><div style="display:flex;gap:10px;margin-top:16px"><button id="ad-skip" style="flex:1;padding:10px;border:2px solid #ccc;background:white;border-radius:8px;cursor:pointer">用默认名称</button><button id="ad-ok" style="flex:1;padding:10px;background:#1E90FF;color:white;border:none;border-radius:8px;cursor:pointer">开始上传</button></div></div>';
    document.body.appendChild(modal);

    var nameInput=modal.querySelector('#ad-name');
    var iconInput=modal.querySelector('#ad-icon');
    var preview=modal.querySelector('#ad-preview');
    var selectedIcon=null;

    iconInput.onchange=function(e){
      if(e.target.files&&e.target.files[0]){
        selectedIcon=e.target.files[0];
        var reader=new FileReader();
        reader.onload=function(ev){preview.innerHTML='<img src="'+ev.target.result+'" style="max-width:96px;max-height:96px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.2)">';};
        reader.readAsDataURL(selectedIcon);
      }
    };

    modal.querySelector('#ad-ok').onclick=function(){modal.remove();cb({customName:nameInput.value.trim(),icon:selectedIcon});};
    modal.querySelector('#ad-skip').onclick=function(){modal.remove();cb({customName:null,icon:null});};
  }

  function pathinfo(p){var parts=p.split('.');var ext=parts.pop();return{filename:parts.join('.')||p,extension:ext};}

  function doUpload(file,customName,icon,cb){
    var el=document.createElement('div');el.className='fp-item';el.dataset.done='0';
    var displayName=customName||file.name;
    el.innerHTML='<div class="fp-row"><span class="fp-icon">📱</span><span class="fp-name" title="'+esc(displayName)+'">'+esc(displayName)+'</span><span class="fp-size">'+fmtSize(file.size)+'</span></div><div class="fp-bar"><div class="fp-fill"></div></div><div class="fp-status">等待中</div>';
    fpBody.appendChild(el);
    // 如果隐藏面板，重新展开
    fp.style.display='flex';islandState='expanded';if(island){island.remove();island=null;}

    var fill=el.querySelector('.fp-fill'),status=el.querySelector('.fp-status');
    status.textContent='上传中...';status.style.color='#1E90FF';

    var fd=new FormData();fd.append('f',file);
    if(customName)fd.append('name',customName);
    if(icon)fd.append('icon',icon);

    var x=new XMLHttpRequest();
    x.upload.addEventListener('progress',function(e){
      if(e.lengthComputable){var p=Math.round((e.loaded/e.total)*100);fill.style.width=p+'%';status.textContent=p+'%';}
    });
    x.open('POST',API+'?action=upload',true);
    x.onload=function(){
      try{var d=JSON.parse(x.responseText);if(d.ok){fill.style.width='100%';fill.style.background='#50C878';status.textContent='✓ 完成';status.style.color='#50C878';el.dataset.done='1';}
      else{fill.style.background='#FF6B6B';status.textContent='✗ 失败';status.style.color='#FF6B6B';}}
      catch(e){fill.style.background='#FF6B6B';status.textContent='✗ 失败';}
      setTimeout(cb,200);
    };
    x.onerror=function(){fill.style.background='#FF6B6B';status.textContent='✗ 错误';setTimeout(cb,200);};
    x.send(fd);
  }

  function load(){
    var x=new XMLHttpRequest();x.open('GET',API+'?action=list',true);
    x.onload=function(){
      try{var d=JSON.parse(x.responseText);if(d.ok){renderZip(d.files.zip||[]);renderApp(d.files.app||[]);render('list-media',d.files.media||[]);render('list-other',d.files.other||[]);}else toast('加载失败','error');}
      catch(e){toast('数据错误','error');}
    };x.send();
  }

  // ZIP/其他通用布局
  function render(cid,arr){
    var c=document.getElementById(cid);
    if(!arr||arr.length===0){c.innerHTML='<div style="padding:16px;color:#999;text-align:center;font-size:13px;">暂无文件</div>';return;}
    var html='';
    for(var i=0;i<arr.length;i++){
      var cat=cid.replace('list-','');
      var f=arr[i];
      html+='<div class="file-row"><span class="fr-ico">'+f.icon+'</span><span class="fr-name" title="'+esc(f.display_name)+'">'+esc(f.display_name)+'</span><span class="fr-size">'+fmtSize(f.size)+'</span><a href="'+f.download_url+'" class="fr-btn" download>下载</a><button class="fr-btn fr-del" data-cat="'+cat+'" data-name="'+esc(f.name)+'">删除</button></div>';
    }
    c.innerHTML=html;
    c.querySelectorAll('.fr-del').forEach(function(b){b.onclick=function(){del(b.dataset.cat,b.dataset.name);};});
  }

  // ZIP 单独处理（可能需要与 app 区分）
  function renderZip(arr){render('list-zip',arr);}

  // APP：图片在左，下载在右
  function renderApp(arr){
    var c=document.getElementById('list-app');
    if(!arr||arr.length===0){c.innerHTML='<div style="padding:16px;color:#999;text-align:center;font-size:13px;">暂无文件</div>';return;}
    var html='';
    for(var i=0;i<arr.length;i++){
      var f=arr[i];
      var iconHtml=f.is_app_icon?('<img src="'+f.icon+'" class="fr-img-icon" onerror="this.outerHTML=\'<span style=\\\'font-size:36px\\\'>📱</span>\'">'):('<span style="font-size:36px">'+f.icon+'</span>');
      html+='<div class="app-card"><div class="ac-left">'+iconHtml+'</div><div class="ac-center"><div class="ac-name" title="'+esc(f.display_name)+'">'+esc(f.display_name)+'</div><div class="ac-size">'+fmtSize(f.size)+'</div></div><div class="ac-right"><a href="'+f.download_url+'" class="btn-primary ac-btn" download>下载</a><button class="fr-btn fr-del" data-cat="app" data-name="'+esc(f.name)+'">删除</button></div></div>';
    }
    c.innerHTML=html;
    c.querySelectorAll('.fr-del').forEach(function(b){b.onclick=function(){del(b.dataset.cat,b.dataset.name);};});
  }

  function del(cat,name){
    if(!confirm('删除文件？'))return;
    var x=new XMLHttpRequest();x.open('POST',API+'?action=delete',true);x.setRequestHeader('Content-Type','application/json');
    x.onload=function(){try{var d=JSON.parse(x.responseText);if(d.ok){toast('已删除','success');load();}else toast('失败','error');}catch(e){toast('数据错误','error');}};
    x.send(JSON.stringify({cat:cat,name:name}));
  }
  load();
})();