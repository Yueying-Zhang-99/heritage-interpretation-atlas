const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={Atlas:{}};vm.createContext(context);
for(const file of ['assets/vendor/d3.v7.min.js','js/flow.js','js/timeline.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const A=context.Atlas,rows=JSON.parse(fs.readFileSync('data/knowledge.json','utf8')).documents;
for(const width of [680,1175,1805,2406]){
  const large=width>=1500,left=large?205:168,right=large?55:34,nodeWidth=large?190:140,markerWidth=large?30:22;
  const x=A.bandsTimeScale(rows,1930,2025,width,left,right);
  for(let year=1940;year<=1990;year+=10)assert(Math.abs((x(year)-x(year-10))-(x(1940)-x(1930)))<1e-7,'equal early decades');
  for(let year=1930;year<2025;year++)assert(x(year)<x(year+1),'chronology remains monotonic');
  for(const topic of new Set(rows.map(d=>d.timeline_topic))){
    const items=rows.filter(d=>d.timeline_topic===topic).sort((a,b)=>a.year-b.year||a.title.localeCompare(b.title));
    const layout=A.packTimelineBand(items,x,left,width,nodeWidth,markerWidth);
    assert(layout,'every record fits the plot');assert.equal(layout.placed.length,items.length);
    if(width>=1175)assert(layout.tracks<=3,'current desktop collection uses at most three tracks per topic');
    for(const slot of layout.placed){
      assert(slot.lo>=left-12&&slot.hi<=width-5,'labels stay out of the topic gutter');
      const dot=slot.side==='right'?slot.lo+markerWidth/2:slot.hi-markerWidth/2;
      assert(Math.abs(dot-x(slot.d.year))<1e-7,'circle remains at its year position');
      for(const other of layout.placed)if(slot!==other&&slot.track===other.track)assert(slot.hi+4<other.lo||other.hi+4<slot.lo,'no overlap on a shared track');
    }
  }
  assert.equal(A.packTimelineBand([],x,left,width,nodeWidth,markerWidth).tracks,0);
  assert.equal(A.packTimelineBand([rows[0]],x,left,width,nodeWidth,markerWidth).tracks,1);
}
console.log('PASS: Bands chronology, early decade spacing, bounded plot labels, exact year positions and non-overlapping compact tracks.');
