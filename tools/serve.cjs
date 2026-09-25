// Development-only static server. No dependencies or build step.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  try{const url=new URL(req.url,'http://localhost'),decoded=decodeURIComponent(url.pathname);const target=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));if(!target.startsWith(root+path.sep)||decoded.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);return res.end('Forbidden');}fs.readFile(target,(err,body)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);});}catch{res.writeHead(400);res.end('Bad request');}
}).listen(4173,'127.0.0.1',()=>console.log('Atlas preview: http://127.0.0.1:4173'));
