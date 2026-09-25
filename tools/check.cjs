const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(read('js/core.js'),sandbox);const A=sandbox.window.Atlas;
const data=JSON.parse(read('data/knowledge.json'));A.setData(data);
assert.equal(A.byId.size,data.documents.length+data.nodes.length);
const html=read('index.html');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){const ref=match[1];if(/^(?:#|data:|https?:)/.test(ref))continue;assert.ok(fs.existsSync(path.join(root,ref.split(/[?#]/)[0])),`Missing reference: ${ref}`);}
for(const file of fs.readdirSync(path.join(root,'js'))){new vm.Script(read('js/'+file),{filename:file});}
new vm.Script(read('data/knowledge-snapshot.js'));new vm.Script(read('assets/vendor/d3.v7.min.js'));
vm.runInContext(read('data/knowledge-snapshot.js'),sandbox);assert.equal(JSON.stringify(sandbox.window.ATLAS_SNAPSHOT),JSON.stringify(data),'Offline snapshot differs from JSON');
const clone=()=>JSON.parse(JSON.stringify(data));
let invalid=clone();invalid.documents.push(invalid.documents[0]);assert.throws(()=>A.validate(invalid),/重复 id/);
invalid=clone();invalid.documents[0].relations=[{target:'missing',type:'related_to'}];assert.throws(()=>A.validate(invalid),/目标不存在/);
invalid=clone();invalid.documents[0].year='invalid';assert.throws(()=>A.validate(invalid),/year/);
invalid=clone();invalid.documents[0].node_type=4;assert.throws(()=>A.validate(invalid),/node_type/);
A.validate([{id:'minimal',title:'Minimal record',year:2026}]);
A.state.query='Tilden';assert.deepEqual(Array.from(A.filtered(),d=>d.id),['tilden']);
A.state.query='';A.state.filters={type:new Set(['Book','Convention']),public_role:new Set(['Visitor'])};assert.equal(A.filtered().length,3,'OR within a field; AND across fields');
A.state.filters={};A.state.minYear='2005';A.state.maxYear='2006';assert.equal(A.filtered().length,3);
A.state.query='no-such-entry';assert.equal(A.filtered().length,0);
assert.equal(A.safeURL('javascript:alert(1)'),null);
for(const d of data.documents){if(d.pdf&&!/^https?:/.test(d.pdf))assert.ok(fs.existsSync(path.join(root,d.pdf)),`Missing PDF ${d.pdf}`);}
console.log(`PASS: ${data.documents.length} entries, ${data.nodes.length} auxiliary nodes; JSON validation, references, script syntax, snapshot parity, search, compound filters, date range, empty results and unsafe URLs.`);
