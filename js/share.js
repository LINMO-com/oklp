// 分享页面 - 云文档
(function(){
  var id=new URLSearchParams(location.search).get('id');
  var API='api/documents.php';
  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function fmtTime(ts){return new Date(ts*1000).toLocaleString('zh-CN');}
  if(!id){return;}
  var x=new XMLHttpRequest();x.open('GET',API+'?action=get&id='+id,true);
  x.onload=function(){
    try{var d=JSON.parse(x.responseText);
    if(d.ok){
      document.getElementById('s-title').textContent=d.doc.title;
      document.getElementById('s-meta').textContent=fmtTime(d.doc.time);
      document.getElementById('s-body').innerHTML=d.doc.content;
      document.getElementById('sb').style.display='block';
      document.getElementById('s-empty').style.display='none';
      // 复制框
      document.querySelectorAll('.editor-copy-box').forEach(function(b){
        b.onclick=function(){var t=b.getAttribute('data-copy-content')||b.textContent;
        if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){alert('已复制到剪贴板');});
        else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');alert('已复制到剪贴板');}catch(e){}document.body.removeChild(ta);}};
      });
      document.querySelectorAll('.editor-btn').forEach(function(b){
        b.onclick=function(){var u=b.getAttribute('data-url')||b.getAttribute('href');if(u&&u!=='#')window.open(u,'_blank');};
      });
    }else{document.getElementById('s-empty').style.display='block';}}
    catch(e){document.getElementById('s-empty').style.display='block';}
  };x.send();
})();