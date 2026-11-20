const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context={window:{}};vm.createContext(context);vm.runInContext(read('js/core.js'),context);context.Atlas=context.window.Atlas;vm.runInContext(read('js/timeline-relations.js'),context);const A=context.Atlas;
const data=JSON.parse(read('data/knowledge.json'));A.setData(data);
const edges=A.timelineCitations(data.documents);
assert.equal(edges.length,2,'Two verified document citations appear by default');
assert.deepEqual(Array.from(edges,e=>[e.source.id,e.target.id]),[['ename','venice'],['ename','nara']],'Arrows point from the citing charter to the cited document');
for(const edge of edges){assert.equal(edge.relation.type,'cites');assert.equal(edge.relation.claim_basis,'explicit_source');assert.equal(edge.relation.validation_status,'source_checked');assert.match(edge.relation.source_url,/^https:\/\/www\.icomos\.org\/.+#page=(1|6)$/);assert.ok(edge.relation.source_locator);}
assert.equal(A.timelineCitations(data.documents.filter(d=>['ename','venice'].includes(d.id))).length,1,'Only citations with both endpoints visible are drawn');
assert.equal(A.timelineCitations(data.documents.filter(d=>d.id==='ename')).length,0,'Filtering cannot leave a dangling arrow');
for(const change of [{validation_status:'pending_source_review'},{claim_basis:'researcher_comparison'},{quote:''},{source_locator:''},{source_url:'javascript:alert(1)'},{type:'related_to'}]){
  const copy=JSON.parse(JSON.stringify(data));for(const d of copy.documents)for(const r of d.relations||[])if(r.type==='cites')Object.assign(r,change);assert.equal(A.timelineCitations(copy.documents).length,0,'Unverified or incomplete evidence is not displayed as a verified citation');
}
const invalid=JSON.parse(JSON.stringify(data)),charter=invalid.documents.find(d=>d.id==='ename');delete charter.relations.find(r=>r.type==='cites').source_locator;assert.throws(()=>A.validate(invalid),/引用关系/);
for(const [a,b]of [[{x:500,y:180,r:9},{x:100,y:50,r:7}],[{x:200,y:50,r:7},{x:200,y:200,r:9}]]){
  const curve=A.citationCurve(a,b,-65);assert.ok(!/NaN|Infinity/.test(curve.path));assert.ok(Math.abs(Math.hypot(curve.start.x-a.x,curve.start.y-a.y)-a.r-4)<1e-8);assert.ok(Math.abs(Math.hypot(curve.end.x-b.x,curve.end.y-b.y)-b.r-7)<1e-8);assert.ok(Number.isFinite(curve.point(.5).x));
}
const curve=A.citationCurve({x:550,y:210,r:8},{x:100,y:60,r:8},-50),box={width:180,height:60},bounds={width:650,height:350},obstacles=[{x:200,y:0,width:270,height:240}];
const label=A.citationLabelPosition(curve,box,bounds,obstacles);assert.ok(label.x>=0&&label.y>=0&&label.x+label.width<=bounds.width&&label.y+label.height<=bounds.height);assert.equal(A.citationOverlap(label,obstacles[0]),0,'Available free space is used instead of covering a document');
console.log('PASS: citation provenance, direction, filters, pending evidence exclusion, schema checks, trimmed arrow endpoints and bounded label placement.');
