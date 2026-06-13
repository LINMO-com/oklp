// ========== 文件管理 - 完整版 ==========
(function(){
  var API='api/files.php';
  var zone=document.getElementById('up-zone');
  var input=document.getElementById('up-input');
  var floatPanel=null;  // 全局只维护一个浮动面板
  var uploadQueue=[];   // 上传队列

  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function fmtSize(b){if(b<1024)return b+' B';if(b<1024*1024)return (b/1024).toFixed(1)+' KB';return (b/1024/1024).toFixed(1)+' MB';}
  function toast(msg,type){
    type=type||'info';var colors={success:'#50C878',error:'#FF6B6B',info:'#1E90FF',warning:'#F59E0B'};
    var t=document.createElement('div');
    t.style.cssText='background:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:10px;font-size:14px;border-left:4px solid '+colors[type];
    t.innerHTML='<span style="color:'+colors[type]+';font-weight:700">'+(type==='success'?'✓':type==='error'?'✗':'ℹ')+'</span><span>'+msg+'</span>';
    var c=document.getElementById('toast-container');
    if(!c){c=document.createElement('div');c.style.cssText='position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px';document.body.appendChild(c);}
    c.appendChild(t);
    setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},3000);
  }

  // ========== 上传区域 ==========
  zone.onclick=function(){input.click();};
  input.onchange=function(e){
    if(e.target.files&&e.target.files.length>0)startUpload(e.target.files);
    input.value='';
  };
  zone.addEventListener('dragover',function(e){e.preventDefault();zone.classList.add('dragover');});
  zone.addEventListener('dragleave',function(){zone.classList.remove('dragover');});
  zone.addEventListener('drop',function(e){
    e.preventDefault();zone.classList.remove('dragover');
    if(e.dataTransfer.files&&e.dataTransfer.files.length>0)startUpload(e.dataTransfer.files);
  });

  // ========== 浮动面板（只创建一个）==========
  function showFloatPanel(){
    if(floatPanel)return floatPanel;
    floatPanel=document.createElement('div');
    floatPanel.className='float-panel';
    floatPanel.innerHTML='<div class="fp-head"><span>📤 上传中</span><button class="fp-close">×</button></div><div class="fp-body"></div>';
    document.body.appendChild(floatPanel);
    floatPanel.querySelector('.fp-close').onclick=function(){
      floatPanel.style.display='none';
    };
    return floatPanel;
  }
  function hideFloatPanel(){
    if(floatPanel)floatPanel.style.display='none';
  }

  // ========== 开始上传（串行处理）==========
  function startUpload(fileList){
    var files=[];for(var i=0;i<fileList.length;i++)files.push(fileList[i]);
    showFloatPanel();
    floatPanel.style.display='flex';
    processNext(files,0);
  }

  function processNext(files,idx){
    if(idx>=files.length){
      // 全部完成
      toast('全部上传完成','success');
      // 2 秒后自动隐藏
      setTimeout(function(){hideFloatPanel();},2000);
      load();
      return;
    }
    var file=files[idx];
    var isApp=/\.(apk|apks|xapk|ipa)$/i.test(file.name);

    // 先添加一个进度项
    var item=document.createElement('div');
    item.className='fp-item';
    item.innerHTML='<div class="fp-row"><span class="fp-icon">📄</span><span class="fp-name">'+esc(file.name)+'</span></div><div class="fp-bar"><div class="fp-fill" style="width:0%"></div></div><div class="fp-status">等待中...</div>';
    floatPanel.querySelector('.fp-body').appendChild(item);

    var fill=item.querySelector('.fp-fill');
    var status=item.querySelector('.fp-status');
    status.textContent='准备中...';

    // 如果是 APP，先弹窗设置信息
    if(isApp){
      showAppDialog(file,function(result){
        uploadOne(file,result.customName,result.icon,fill,status,function(){
          processNext(files,idx+1);
        });
      });
    }else{
      uploadOne(file,null,null,fill,status,function(){
        processNext(files,idx+1);
      });
    }
  }

  function uploadOne(file,customName,icon,fill,status,cb){
    var fd=new FormData();fd.append('f',file);
    if(customName)fd.append('name',customName);
    if(icon)fd.append('icon',icon);

    status.textContent='上传中 0%';
    var x=new XMLHttpRequest();
    x.upload.addEventListener('progress',function(e){
      if(e.lengthComputable){
        var p=Math.round((e.loaded/e.total)*100);
        fill.style.width=p+'%';
        status.textContent=p+'%';
      }
    });
    x.onload=function(){
      try{
        var d=JSON.parse(x.responseText);
        if(d.ok){
          fill.style.width='100%';
          fill.style.background='#50C878';
          status.textContent='✓ 完成';
          status.style.color='#50C878';
        }else{
          fill.style.background='#FF6B6B';
          status.textContent='✗ 失败';
          status.style.color='#FF6B6B';
        }
      }catch(e){
        fill.style.background='#FF6B6B';
        status.textContent='✗ 错误';
        status.style.color='#FF6B6B';
      }
      setTimeout(cb,200);
    };
    x.onerror=function(){
      fill.style.background='#FF6B6B';
      status.textContent='✗ 网络错误';
      setTimeout(cb,200);
    };
    x.open('POST',API+'?action=upload',true);
    x.send(fd);
  }

  // ========== APP 信息对话框（带正确 id/关闭）==========
  function showAppDialog(file,cb){
    var modal=document.createElement('div');
    modal.className='modal';
    modal.id='app-dialog-modal';
    modal.style.display='flex';
    modal.innerHTML='<div class="modal-box"><div class="modal-hd"><h3>📱 设置 APP 信息</h3><button class="modal-close">×</button></div><p style="color:#888;font-size:12px;margin-bottom:12px;">文件：'+esc(file.name)+'</p><label style="display:block;font-size:13px;margin-bottom:6px;">名称（可选，留空自动解析）</label><input class="in" id="ad-name" placeholder="如：微信 8.0.50" value=""><label style="display:block;font-size:13px;margin:12px 0 6px 0;">图标（可选）</label><input type="file" id="ad-icon" accept="image/*" class="in" style="padding:10px;background:#f8f9fa;border:2px dashed #ccc;border-radius:8px"><div id="ad-preview" style="margin:12px 0;text-align:center;min-height:56px"></div><div style="display:flex;gap:10px;margin-top:16px"><button id="ad-skip" style="flex:1;padding:10px;border:2px solid #ccc;background:white;border-radius:8px;cursor:pointer;font-size:13px;">默认即可</button><button id="ad-ok" style="flex:1;padding:10px;background:#1E90FF;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">开始上传</button></div></div>';
    document.body.appendChild(modal);

    var nameInput=modal.querySelector('#ad-name');
    var iconInput=modal.querySelector('#ad-icon');
    var preview=modal.querySelector('#ad-preview');
    var selectedIcon=null;

    // 自动填充不带扩展名的文件名
    var dotIdx=file.name.lastIndexOf('.');
    var baseName=dotIdx>=0?file.name.substring(0,dotIdx):file.name;
    nameInput.value=baseName;

    iconInput.onchange=function(e){
      if(e.target.files&&e.target.files[0]){
        selectedIcon=e.target.files[0];
        var reader=new FileReader();
        reader.onload=function(ev){
          preview.innerHTML='<img src="'+ev.target.result+'" style="max-width:72px;max-height:72px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.2)">';
        };
        reader.readAsDataURL(selectedIcon);
      }
    };

    modal.querySelector('.modal-close').onclick=function(){modal.remove();cb({customName:null,icon:null});};
    modal.onclick=function(e){if(e.target===modal){modal.remove();cb({customName:null,icon:null});}};
    modal.querySelector('#ad-ok').onclick=function(){modal.remove();cb({customName:nameInput.value.trim(),icon:selectedIcon});};
    modal.querySelector('#ad-skip').onclick=function(){modal.remove();cb({customName:null,icon:null});};
  }

  // ========== 加载文件列表 ==========
  function load(){
    var x=new XMLHttpRequest();x.open('GET',API+'?action=list',true);
    x.onload=function(){
      try{var d=JSON.parse(x.responseText);
        if(d.ok){
          renderSection('list-image',d.files.image||[],renderImageCard);
          renderSection('list-video',d.files.video||[],renderVideoCard);
          renderSection('list-audio',d.files.audio||[],renderAudioCard);
          renderSection('list-app',d.files.app||[],renderAppCard);
          renderSection('list-zip',d.files.zip||[],renderFileCard);
          renderSection('list-other',d.files.other||[],renderFileCard);
        }else toast('加载失败','error');
      }catch(e){toast('数据错误','error');}
    };x.send();
  }

  function renderSection(cid,arr,fn){
    var c=document.getElementById(cid);if(!c)return;
    if(!arr||arr.length===0){
      c.innerHTML='<div style="padding:32px;color:#bbb;text-align:center;font-size:13px;">暂无文件</div>';
      return;
    }
    c.innerHTML='';
    for(var i=0;i<arr.length;i++)c.appendChild(fn(arr[i]));
  }

  // ---- 图片卡片 ----
  function renderImageCard(f){
    var d=document.createElement('div');d.className='media-card image-card';
    d.innerHTML='<div class="mc-thumb"><img src="'+f.url+'" alt="'+esc(f.display_name)+'" loading="lazy" onerror="this.outerHTML=\'<span style=\\\'font-size:28px\\\'>🖼️</span>\'"></div><div class="mc-info"><div class="mc-name" title="'+esc(f.display_name)+'">'+esc(f.display_name)+'</div><div class="mc-meta">'+f.type.toUpperCase()+' · '+fmtSize(f.size)+'</div></div><div class="mc-actions"><a href="'+f.download_url+'" class="mc-btn download" download title="下载">⬇</a><button class="mc-btn del" data-kind="'+f.kind+'" data-name="'+esc(f.name)+'" title="删除">🗑</button></div>';
    bindDel(d);return d;
  }

  // ---- 视频卡片（点击缩略图播放）----
  function renderVideoCard(f){
    var d=document.createElement('div');d.className='media-card video-card';
    d.innerHTML='<div class="mc-thumb video-thumb"><video src="'+f.url+'" preload="metadata" muted playsinline></video><span class="play-overlay">▶</span></div><div class="mc-info"><div class="mc-name" title="'+esc(f.display_name)+'">'+esc(f.display_name)+'</div><div class="mc-meta">'+f.type.toUpperCase()+' · '+fmtSize(f.size)+'</div></div><div class="mc-actions"><a href="'+f.download_url+'" class="mc-btn download" download title="下载">⬇</a><button class="mc-btn del" data-kind="'+f.kind+'" data-name="'+esc(f.name)+'" title="删除">🗑</button></div>';
    var video=d.querySelector('video');
    var overlay=d.querySelector('.play-overlay');
    d.querySelector('.video-thumb').onclick=function(e){
      if(video.paused){video.play();overlay.style.display='none';}
      else{video.pause();video.currentTime=0;overlay.style.display='flex';}
    };
    bindDel(d);return d;
  }

  // ---- 音频卡片 ----
  function renderAudioCard(f){
    var d=document.createElement('div');d.className='media-card audio-card';
    d.innerHTML='<div class="mc-thumb audio-thumb">🎵</div><div class="mc-info" style="flex:1"><div class="mc-name" title="'+esc(f.display_name)+'">'+esc(f.display_name)+'</div><div class="mc-meta">'+f.type.toUpperCase()+' · '+fmtSize(f.size)+'</div><audio controls preload="none" style="width:100%;margin-top:8px;max-width:420px;height:32px"><source src="'+f.url+'">您的浏览器不支持音频播放</audio></div><div class="mc-actions"><a href="'+f.download_url+'" class="mc-btn download" download title="下载">⬇</a><button class="mc-btn del" data-kind="'+f.kind+'" data-name="'+esc(f.name)+'" title="删除">🗑</button></div>';
    bindDel(d);return d;
  }

  // ---- APP 卡片（左图标右下载）----
  function renderAppCard(f){
    var d=document.createElement('div');d.className='media-card app-card';
    var iconHtml=f.is_app_icon?('<img src="'+f.icon+'" class="app-icon-img" onerror="this.outerHTML=\'<span style=\\\'font-size:36px\\\'>📱</span>\'">'):'<span style="font-size:36px">📱</span>';
    d.innerHTML='<div class="mc-thumb app-thumb">'+iconHtml+'</div><div class="mc-info" style="flex:1"><div class="mc-name" title="'+esc(f.display_name)+'">'+esc(f.display_name)+'</div><div class="mc-meta">'+f.type.toUpperCase()+' · '+fmtSize(f.size)+'</div></div><div class="mc-actions" style="flex-direction:row;gap:8px"><a href="'+f.download_url+'" class="mc-btn-primary" download>下载</a><button class="mc-btn del" data-kind="'+f.kind+'" data-name="'+esc(f.name)+'" title="删除">🗑</button></div>';
    bindDel(d);return d;
  }

  // ---- 通用文件（压缩包/其他）----
  function renderFileCard(f){
    var d=document.createElement('div');d.className='media-card file-card';
    var ic=f.kind==='zip'?'📦':'📄';
    d.innerHTML='<div class="mc-thumb file-thumb">'+ic+'</div><div class="mc-info" style="flex:1"><div class="mc-name" title="'+esc(f.display_name)+'">'+esc(f.display_name)+'</div><div class="mc-meta">'+f.type.toUpperCase()+' · '+fmtSize(f.size)+'</div></div><div class="mc-actions" style="flex-direction:row;gap:8px"><a href="'+f.download_url+'" class="mc-btn-primary" download>下载</a><button class="mc-btn del" data-kind="'+f.kind+'" data-name="'+esc(f.name)+'" title="删除">🗑</button></div>';
    bindDel(d);return d;
  }

  function bindDel(node){
    var btn=node.querySelector('.mc-btn.del');
    if(btn)btn.onclick=function(){delFile(btn.dataset.kind,btn.dataset.name,node);};
  }
  function delFile(kind,name,node){
    if(!confirm('确定删除该文件？'))return;
    var x=new XMLHttpRequest();x.open('POST',API+'?action=delete',true);x.setRequestHeader('Content-Type','application/json');
    x.onload=function(){
      try{var d=JSON.parse(x.responseText);
        if(d.ok){node.style.transition='opacity .2s';node.style.opacity='0';
          setTimeout(function(){node.remove();toast('已删除','success');},200);
        }else toast('删除失败','error');
      }catch(e){toast('数据错误','error');}
    };
    x.send(JSON.stringify({cat:kind,name:name}));
  }

  load();
})();
