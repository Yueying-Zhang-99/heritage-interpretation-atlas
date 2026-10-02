/* Theme envelopes derived from coded records. Geometry never asserts influence. */
Atlas.flowEnvelopePath=function(values,nx,ny,cell){
  // Round kernel intersections in the field first; increasing SVG resolution alone
  // cannot remove the cusps produced by a hard union of neighbouring kernels.
  const sigma=18/cell,radius=Math.ceil(sigma*3),kernel=[];
  let total=0;
  for(let offset=-radius;offset<=radius;offset++){const weight=Math.exp(-offset*offset/(2*sigma*sigma));kernel.push(weight);total+=weight;}
  for(let i=0;i<kernel.length;i++)kernel[i]/=total;
  const horizontal=new Float32Array(values.length),smooth=new Float32Array(values.length);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    let sum=0;for(let k=-radius;k<=radius;k++)if(x+k>=0&&x+k<nx)sum+=values[y*nx+x+k]*kernel[k+radius];
    horizontal[y*nx+x]=sum;
  }
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    let sum=0;for(let k=-radius;k<=radius;k++)if(y+k>=0&&y+k<ny)sum+=horizontal[(y+k)*nx+x]*kernel[k+radius];
    smooth[y*nx+x]=sum;
  }
  const contour=d3.contours().size([nx,ny]).thresholds([.32])(smooth)[0];
  const curve=d3.line().curve(d3.curveBasisClosed);
  const paths=[];
  for(const polygon of contour.coordinates)for(const ring of polygon){
    // A closed B-spline follows a coarser, evenly spaced boundary without the
    // tiny straight segments of marching squares. Keep separate islands/holes.
    const points=ring.slice(0,-1).map(([x,y])=>[x*cell,y*cell]),spaced=[];
    if(!points.length)continue;
    spaced.push(points[0]);let distance=0,previous=points[0];
    for(let i=1;i<=points.length;i++){
      const next=points[i%points.length],dx=next[0]-previous[0],dy=next[1]-previous[1],length=Math.hypot(dx,dy);
      if(!length){previous=next;continue;}
      let travelled=0;
      while(distance+length-travelled>=10){const step=10-distance;travelled+=step;spaced.push([previous[0]+dx*travelled/length,previous[1]+dy*travelled/length]);distance=0;}
      distance+=length-travelled;previous=next;
    }
    if(spaced.length>1&&Math.hypot(spaced.at(-1)[0]-spaced[0][0],spaced.at(-1)[1]-spaced[0][1])<5)spaced.pop();
    const path=curve(spaced.length>=4?spaced:points);
    if(path)paths.push(path.endsWith('Z')?path:path+'Z');
  }
  return paths.filter(Boolean).join('');
};
Atlas.flow=function(rows){
  const A=Atlas,root=document.querySelector('#chart'),topics=A.flowTopics;
  root.classList.add('flow-chart');
  const toolbar=A.el('div','flow-key');toolbar.append(A.el('span','flow-key-caption','THEME OVERLAPS'));
  const themeButtons=topics.map((topic,i)=>{const b=A.el('button','flow-theme-button',topic);b.type='button';b.dataset.theme=i;b.setAttribute('aria-pressed','false');toolbar.append(b);return b;});
  const reset=A.el('button','text-button','Show all');toolbar.append(reset);root.append(toolbar);
  const width=Math.max(680,root.clientWidth),top=34,bottom=78,labelWidth=width<1400?140:166;
  let height=Math.max(700,window.innerHeight-root.getBoundingClientRect().top-122);
  const first=Math.min(1930,...rows.map(d=>d.year)),last=Math.max(2025,...rows.map(d=>d.year));
  const start=Math.floor(first/10)*10,end=Math.ceil(last/5)*5;
  const x=d3.scaleLinear().domain([start,end]).range([75,width-72]);
  const svg=A.svg(width,height,'Timeline Flow: overlapping working themes across time').attr('width',width).attr('height',height);
  const backdrop=svg.append('g').attr('class','flow-envelopes');
  const guides=svg.append('g').attr('class','flow-guides');
  const linksLayer=svg.append('g').attr('class','flow-links');
  const labelsLayer=svg.append('g').attr('class','flow-labels');
  // All circles are appended after all labels, so text can never paint over a dot.
  const dotsLayer=svg.append('g').attr('class','flow-dots');
  const radius=d=>d.importance?({1:5,2:7,3:9}[d.importance]||5):4.5;
  const nodes=rows.map(d=>({d,x:x(d.year),y:0,topics:A.topicMemberships(d).map(m=>topics.indexOf(m.topic)).filter(i=>i>=0),r:radius(d)}));
  // Measure actual labels, then keep time fixed while choosing the nearest free Y.
  for(const n of nodes){
    const g=labelsLayer.append('g').datum(n).attr('class','flow-label'+(n.d.type==='Heritage Practice Case'?' is-practice-case':''));
    g.append('text').attr('class','flow-year').text(n.d.year_label||n.d.year);
    g.append('text').attr('class','flow-title').attr('y',17).text(n.d.map_title||n.d.title).call(A.wrap,labelWidth,15);
    const titleBox=g.select('.flow-title').node().getBBox();
    g.append('text').attr('class','flow-maker').attr('y',titleBox.y+titleBox.height+13).text(n.d.map_maker||A.text(n.d.author)||n.d.organization||'Research topic').call(A.wrap,labelWidth,13);
    n.g=g;n.box=g.node().getBBox();
  }
  const overlaps=(a,b,pad=7)=>a.x-pad<b.x+b.width&&a.x+a.width+pad>b.x&&a.y-pad<b.y+b.height&&a.y+a.height+pad>b.y;
  let placed=[];
  for(let attempt=0;attempt<8;attempt++){
    placed=[];let complete=true;
    const anchor=i=>top+62+i*(height-top-bottom-140)/3;
    for(const n of nodes.slice().sort((a,b)=>b.d.year-a.d.year||a.d.id.localeCompare(b.d.id))){
      const primary=topics.indexOf(n.d.timeline_topic),themeY=n.topics.length?n.topics.reduce((s,i)=>s+anchor(i),0)/n.topics.length:anchor(Math.max(0,primary));
      const target=(themeY+2*anchor(Math.max(0,primary)))/3;
      let chosen=null;
      for(let delta=0;delta<height&&!chosen;delta+=10)for(const sign of delta===0?[1]:[1,-1]){
        const y=target+delta*sign;if(y<top+30||y>height-bottom-56)continue;
        for(const side of ['right','left']){
          const gap=Math.max(n.r+10,(n.r+4)*1.7+4),labelX=side==='right'?n.x+gap:n.x-gap-n.box.width;
          const label={x:labelX+n.box.x,y:y+n.box.y,width:n.box.width,height:n.box.height};
          const dot={x:n.x-16,y:y-16,width:32,height:32};
          if(label.x<18||label.x+label.width>width-18)continue;
          if(placed.every(p=>!overlaps(label,p.label)&&!overlaps(label,p.dot)&&!overlaps(dot,p.label)&&!overlaps(dot,p.dot))){chosen={y,labelX,label,dot};break;}
        }
      }
      if(!chosen){complete=false;break;}
      Object.assign(n,chosen);placed.push(n);
    }
    if(complete)break;height+=120;
  }
  svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height);
  // Defensive fallback for much larger imported libraries: grow vertically rather than hide records.
  for(const n of nodes.filter(n=>!placed.includes(n))){n.y=height-bottom;const labelX=Math.max(18,Math.min(width-n.box.width-18,n.x+18));n.labelX=labelX;placed.push(n);height+=n.box.height+35;}
  svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height);
  for(const n of nodes)n.g.attr('transform',`translate(${n.labelX},${n.y})`).attr('data-record',n.d.id).attr('tabindex',0).attr('role','button').attr('aria-label',`${n.d.year}: ${n.d.title}. Open record.`).on('click',()=>A.openDetail(n.d.id)).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();A.openDetail(n.d.id);}});
  const dots=dotsLayer.selectAll('g').data(nodes).join('g').attr('class','flow-dot').attr('data-record',n=>n.d.id).attr('transform',n=>`translate(${n.x},${n.y})`).attr('role','button').attr('tabindex',0).attr('aria-label',n=>`${n.d.year}: ${n.d.title}. ${n.topics.map(i=>topics[i]).join('; ')}. Open record.`);
  dots.append('circle').attr('class','flow-dot-halo').attr('r',n=>n.r+4);
  dots.append('circle').attr('class',n=>'flow-circle'+(n.d.placeholder?' is-placeholder':'')).attr('r',n=>n.r).style('--entry-color',n=>n.d.type==='Heritage Practice Case'?'#82918d':A.color(n.d));
  dots.append('circle').attr('class','flow-hit').attr('r',18);
  dots.on('click',(e,n)=>A.openDetail(n.d.id)).on('keydown',(e,n)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();A.openDetail(n.d.id);}});
  const axisY=height-28;
  guides.append('line').attr('x1',x(start)).attr('x2',x(end)).attr('y1',axisY).attr('y2',axisY);
  for(let year=start;year<=end;year+=10){const t=guides.append('g').attr('transform',`translate(${x(year)},${axisY})`);t.append('line').attr('y2',5);t.append('text').attr('y',19).attr('text-anchor','middle').text(year);}
  guides.append('text').attr('x',18).attr('y',axisY+4).text('YEAR');
  // An envelope unions local kernels and short chronological bridges. Long gaps remain open.
  const cell=5,nx=Math.ceil(width/cell)+1,ny=Math.ceil(height/cell)+1,sigma=43;
  const contours=[];
  topics.forEach((topic,i)=>{
    const members=nodes.filter(n=>n.topics.includes(i)).sort((a,b)=>a.x-b.x||a.y-b.y);
    if(!members.length)return;
    const samples=members.map(n=>[n.x,n.y]);
    for(let k=1;k<members.length;k++){
      const a=members[k-1],b=members[k];if(b.d.year-a.d.year>22)continue;
      const count=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/24);
      for(let j=1;j<count;j++){const t=j/count,u=1-t,dx=b.x-a.x;samples.push([u*u*u*a.x+3*u*u*t*(a.x+dx*.5)+3*u*t*t*(b.x-dx*.5)+t*t*t*b.x,a.y+(b.y-a.y)*(3*t*t-2*t*t*t)]);}
    }
    const values=new Float32Array(nx*ny);
    for(const [px,py] of samples){const loX=Math.max(0,Math.floor((px-95)/cell)),hiX=Math.min(nx-1,Math.ceil((px+95)/cell)),loY=Math.max(0,Math.floor((py-95)/cell)),hiY=Math.min(ny-1,Math.ceil((py+95)/cell));
      for(let gy=loY;gy<=hiY;gy++)for(let gx=loX;gx<=hiX;gx++){const value=Math.exp(-((gx*cell-px)**2+(gy*cell-py)**2)/(2*sigma*sigma));const index=gy*nx+gx;values[index]=Math.max(values[index],value);}
    }
    contours.push(backdrop.append('path').datum({topic,i}).attr('d',A.flowEnvelopePath(values,nx,ny,cell)).attr('fill-rule','evenodd').attr('class','flow-envelope').attr('data-theme',i));
  });
  const byId=new Map(nodes.map(n=>[n.d.id,n]));
  let selected=null;
  const highlight=(active=null,hover=null)=>{
    const themeSet=hover?new Set(hover.topics):active==null?null:new Set([active]);
    contours.forEach(p=>p.classed('is-active',themeSet?.has(p.datum().i)||false).classed('is-muted',!!themeSet&&!themeSet.has(p.datum().i)));
    const matches=n=>!themeSet||n.topics.some(i=>themeSet.has(i));
    nodes.forEach(n=>n.g.classed('is-muted',!matches(n)).classed('is-hovered',n===hover));dots.classed('is-muted',n=>!matches(n)).classed('is-hovered',n=>n===hover);
    linksLayer.selectAll('*').remove();
    if(hover){
      const relationships=[];for(const n of nodes)for(const r of n.d.relations||[]){if((n===hover||r.target===hover.d.id)&&byId.has(r.target))relationships.push({a:n,b:byId.get(r.target),r});}
      for(const {a,b,r} of relationships){const bend=Math.max(24,Math.abs(b.x-a.x)*.35);const p=linksLayer.append('path').attr('d',`M${a.x},${a.y} C${a.x+bend},${a.y} ${b.x-bend},${b.y} ${b.x},${b.y}`);p.append('title').text(`${a.d.title} → ${b.d.title}: ${r.type} · ${r.evidence||'Evidence pending'}`);}
    }
  };
  for(const n of nodes)n.g.on('mouseenter',()=>highlight(selected,n)).on('mouseleave',()=>highlight(selected)).on('focus',()=>highlight(selected,n)).on('blur',()=>highlight(selected));
  dots.on('mouseenter',(e,n)=>highlight(selected,n)).on('mouseleave',()=>highlight(selected)).on('focus',(e,n)=>highlight(selected,n)).on('blur',()=>highlight(selected));
  themeButtons.forEach((b,i)=>b.onclick=()=>{selected=selected===i?null:i;themeButtons.forEach((button,j)=>button.setAttribute('aria-pressed',String(j===selected)));highlight(selected);});
  reset.onclick=()=>{selected=null;themeButtons.forEach(b=>b.setAttribute('aria-pressed','false'));highlight();};
  const note=A.el('p','flow-note','One record, multiple themes. Select a theme to trace its envelope; hover a record for coded links. Overlap means shared subject matter, not proven influence.');root.append(note);
};
