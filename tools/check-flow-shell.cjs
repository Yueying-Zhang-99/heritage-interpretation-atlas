const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const context={Atlas:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/vendor/d3.v7.min.js','utf8'),context);
vm.runInContext(fs.readFileSync('js/flow.js','utf8'),context);
const A=context.Atlas,d3=context.d3,nx=121,ny=81,cell=5;
const inside=(point,polygon)=>polygon.reduce((value,ring)=>value!==d3.polygonContains(ring,point),false);
function check(members,expectHole=false){
  const values=new Float32Array(nx*ny);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)for(const n of members)values[y*nx+x]=Math.max(values[y*nx+x],Math.exp(-((x*cell-n.x)**2+(y*cell-n.y)**2)/(2*33**2)));
  const shell=A.flowShellField(values,members,nx,ny,cell);
  const contours=d3.contours().size([nx,ny]).thresholds([.5])(shell)[0];
  if(!members.length){assert.equal(contours.coordinates.length,0);return;}
  assert.equal(contours.coordinates.length,1,'one continuous outer shell');
  const polygon=contours.coordinates[0];
  for(const n of members)assert(inside([n.x/cell,n.y/cell],polygon),'member dot remains filled');
  for(const hole of polygon.slice(1))for(const p of hole)assert(d3.polygonContains(polygon[0],p),'hole stays enclosed');
  if(expectHole)assert(polygon.length>1,'broad internal space becomes a cavity');
  const path=A.flowEnvelopePath(shell,nx,ny,cell);assert(path&& !path.includes('NaN'),'finite rounded path');
}
check([]);check([{x:100,y:100}]);check([{x:100,y:100},{x:100,y:250}]);
check([{x:100,y:100},{x:100,y:300},{x:500,y:100},{x:500,y:300}],true);
check([{x:100,y:100},{x:300,y:100},{x:500,y:100}]);
for(const width of [1175,1805,2406]){
  const scale=A.flowTimeScale([{year:1931},{year:1957},{year:1964},{year:1990},{year:2008},{year:2017}],1930,2025,width);
  const decade=scale(1940)-scale(1930);
  for(let year=1940;year<=1990;year+=10)assert(Math.abs(scale(year)-scale(year-10)-decade)<1e-7,'equal early decade spacing');
  assert(Math.abs(scale(1964)-(scale(1930)+3.4*decade))<1e-7,'early records follow elapsed time');
  for(let year=1930;year<2025;year++)assert(scale(year)<scale(year+1),'monotonic chronology across 1990');
  for(let year=1930;year<=2025;year++)assert(Math.abs(scale.invert(scale(year))-year)<1e-7,'invertible hybrid time scale');
}
process.stdout.write('PASS: continuous shells, enclosed cavities, protected members, empty/single/collinear cases, equal early decades and monotonic hybrid time.\n');
