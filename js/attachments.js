/* Annotated PDFs: browser drafts in IndexedDB, public files only on explicit publishing. */
Atlas.attachments=(()=>{
  const A=Atlas,maxSize=20*1024*1024,pathPattern=/^documents\/notes\/[a-z0-9_-]+\.pdf$/i;
  const contentsAPI='https://api.github.com/repos/Yueying-Zhang-99/heritage-interpretation-atlas/contents/';
  let database;
  const localURLs=new Map();
  function open(){if(!database)database=new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('此浏览器无法保存 PDF，请使用支持 IndexedDB 的浏览器。'));return;}const request=indexedDB.open('heritage-atlas-attachments-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('pdfs',{keyPath:'path'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return database;}
  async function read(path){const db=await open();return new Promise((resolve,reject)=>{const request=db.transaction('pdfs','readonly').objectStore('pdfs').get(path);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function write(record){const db=await open();return new Promise((resolve,reject)=>{const transaction=db.transaction('pdfs','readwrite');transaction.objectStore('pdfs').put(record);transaction.oncomplete=()=>resolve(record);transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error||new Error('PDF 保存未完成'));});}
  async function stage(file,id){if(!file||!file.size)throw new Error('请选择非空 PDF 文件。');if(file.size>maxSize)throw new Error('批注 PDF 请控制在 20 MB 以内。');if(!/\.pdf$/i.test(file.name))throw new Error('请选择 .pdf 格式的批注文件。');const signature=new TextDecoder().decode(await file.slice(0,5).arrayBuffer());if(signature!=='%PDF-')throw new Error('文件内容不是有效的 PDF。');const slug=String(id||'entry').toLowerCase().replace(/[^a-z0-9_-]/g,'-').slice(0,60)||'entry';const path='documents/notes/'+slug+'-'+crypto.randomUUID()+'.pdf';await write({path,name:file.name,blob:file.slice(0,file.size,'application/pdf')});return {notes_pdf:path,notes_pdf_name:file.name};}
  async function link(d){if(!d.notes_pdf)return null;if(pathPattern.test(d.notes_pdf)){try{const local=await read(d.notes_pdf);if(local){if(!localURLs.has(d.notes_pdf))localURLs.set(d.notes_pdf,URL.createObjectURL(local.blob));return {url:localURLs.get(d.notes_pdf),local:true};}}catch{} }const url=A.safeURL(d.notes_pdf,true);return url?{url,local:false}:null;}
  async function base64(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}
  async function publish(data,baseline,headers,progress=()=>{}){
    const records=[...data.documents,...(data.nodes||[])],known=new Set([...(baseline?.documents||[]),...(baseline?.nodes||[])].map(d=>d.notes_pdf).filter(Boolean));
    const paths=[...new Set(records.map(d=>d.notes_pdf).filter(path=>pathPattern.test(path||'')&&!known.has(path)))];
    for(let i=0;i<paths.length;i++){const path=paths[i];progress('正在同步批注 PDF '+(i+1)+' / '+paths.length+'…');const url=contentsAPI+path;const check=await fetch(url+'?ref=main',{headers,cache:'no-store'});if(check.ok)continue;if(check.status!==404)throw new Error('检查批注 PDF 失败（HTTP '+check.status+'）。');const local=await read(path);if(!local)throw new Error('此浏览器找不到待上传的批注 PDF，请重新选择文件：'+path);const response=await fetch(url,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Add annotated reading PDF',content:await base64(local.blob),branch:'main'})});if(!response.ok){const detail=await response.json().catch(()=>({}));throw new Error('批注 PDF 上传失败（HTTP '+response.status+'）：'+(detail.message||'请稍后重试。'));}}
  }
  return {stage,link,publish,maxSize};
})();
