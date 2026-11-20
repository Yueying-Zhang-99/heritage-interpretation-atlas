const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'..'),stored=new Map();
function indexedDB(){return {open(){const request={};queueMicrotask(()=>{request.result={createObjectStore(){},transaction(){const tx={objectStore(){return {get(key){const result={};queueMicrotask(()=>{result.result=stored.get(key);result.onsuccess?.();});return result;},put(record){stored.set(record.path,record);queueMicrotask(()=>tx.oncomplete?.());}};}};return tx;}};request.onupgradeneeded?.();request.onsuccess?.();});return request;}};}
function context(fetch){const s={window:{},location:{href:'https://example.org/atlas/',protocol:'https:'},URL,Uint8Array,TextDecoder,crypto:webcrypto,indexedDB:indexedDB(),btoa,fetch};vm.createContext(s);vm.runInContext(fs.readFileSync(path.join(root,'js/core.js'),'utf8'),s);s.Atlas=s.window.Atlas;vm.runInContext(fs.readFileSync(path.join(root,'js/attachments.js'),'utf8'),s);return s.Atlas;}
const file=(text,name='reading-notes.pdf')=>Object.assign(new Blob([text],{type:'application/pdf'}),{name});
(async()=>{
  const requests=[];let responseCode=404;
  const fetch=async(url,opts)=>{requests.push({url,...opts});if(opts.method==='PUT')return {ok:true,status:201};return {ok:responseCode===200,status:responseCode};};
  const A=context(fetch),pdf='https://example.org/original.pdf';
  assert.equal(A.sourceLinks({source_url:pdf,pdf}).length,1,'Same source/PDF yields one link');
  assert.equal(A.sourceLinks({source_url:pdf+'#page=2',pdf}).length,1,'Same file with a page fragment is not duplicated');
  assert.equal(A.sourceLinks({source_url:'https://example.org/source',pdf}).length,2,'Distinct page and PDF remain available');
  assert.equal(A.sourceLinks({source_url:'javascript:alert(1)'}).length,0);
  await assert.rejects(A.attachments.stage(file('not a PDF'),'athens'),/PDF/);
  await assert.rejects(A.attachments.stage(file('%PDF-1.4','notes.txt'),'athens'),/pdf/i);
  await assert.rejects(A.attachments.stage({size:21*1024*1024,name:'notes.pdf'},'athens'),/20 MB/);
  const notes=await A.attachments.stage(file('%PDF-1.4\nexample notes'),'Athens / 中文');
  assert.match(notes.notes_pdf,/^documents\/notes\/[a-z0-9_-]+\.pdf$/);
  const reloaded=context(fetch),preview=await reloaded.attachments.link(notes);
  assert.equal(preview.local,true,'A fresh module can recover a browser-stored PDF');URL.revokeObjectURL(preview.url);
  const baseline={documents:[],nodes:[]},data={documents:[{id:'athens',...notes}],nodes:[]};
  await A.attachments.publish(data,baseline,{});
  const upload=requests.find(r=>r.method==='PUT');
  assert.equal(Buffer.from(JSON.parse(upload.body).content,'base64').toString(),'%PDF-1.4\nexample notes','Uploaded file bytes are preserved');
  requests.length=0;await A.attachments.publish(data,data,{});assert.equal(requests.length,0,'Existing published notes are not re-uploaded');
  responseCode=200;await A.attachments.publish(data,baseline,{});assert.equal(requests.filter(r=>r.method==='PUT').length,0,'Retry reuses an already uploaded immutable file');
  requests.length=0;responseCode=403;await assert.rejects(A.attachments.publish(data,baseline,{}),/403/);assert.equal(requests.filter(r=>r.method==='PUT').length,0,'Access failures stop publication');
  responseCode=404;await assert.rejects(A.attachments.publish({documents:[{notes_pdf:'documents/notes/missing.pdf'}]},baseline,{}),/找不到/);
  const outside={documents:[{notes_pdf:'https://example.org/notes.pdf'}]};requests.length=0;await A.attachments.publish(outside,baseline,{});assert.equal(requests.length,0,'Credentials never go to an external PDF URL');
  console.log('PASS: source deduplication, file validation, draft recovery, binary upload, retry, permission errors, missing files and external URL handling.');
})().catch(err=>{console.error(err);process.exitCode=1;});
