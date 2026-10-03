/* Theme envelopes derived from coded records. Geometry never asserts influence. */
Atlas.flowEnvelopePath=function(values,nx,ny,cell){
  // Round kernel intersections in the field first; increasing SVG resolution alone
  // cannot remove the cusps produced by a hard union of neighbouring kernels.
  const sigma=12/cell,radius=Math.ceil(sigma*3),kernel=[];
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
Atlas.flowTimeScale=function(rows,start,end,width){
  // Chronological, deliberately non-uniform spacing gives densely documented
  // recent years room without shrinking the type. The axis discloses this.
  const counts=new Map();for(const row of rows)counts.set(row.year,(counts.get(row.year)||0)+1);
  const years=[...new Set([start,...counts.keys(),end])].sort((a,b)=>a-b),positions=[0];
  for(let i=1;i<years.length;i++)positions.push(positions.at(-1)+(years[i]-years[i-1])*.5+14+7*(Math.sqrt(counts.get(years[i-1])||0)+Math.sqrt(counts.get(years[i])||0)));
  return d3.scaleLinear().domain(years).range(positions.map(p=>64+p/positions.at(-1)*(width-128)));
};
Atlas.placeFlowNodes=function(nodes,width,height,top,bottom,topics){
  const overlap=(a,b)=>a.x-3<b.x+b.width&&a.x+a.width+3>b.x&&a.y-3<b.y+b.height&&a.y+a.height+3>b.y;
  const conflict=(a,b)=>overlap(a.label,b.label)||overlap(a.label,b.dot)||overlap(a.dot,b.label)||overlap(a.dot,b.dot);
  let seed=73;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const options=nodes.map(n=>{
    const primary=topics.indexOf(n.d.timeline_topic),target=top+22+Math.max(0,primary)*(height-top-bottom-55)/3,choices=[];
    for(let y=top+12;y<height-bottom-25;y+=4){
      if(y+n.box.y<top||y+n.box.y+n.box.height>height-bottom)continue;
      for(const side of ['right','left']){
        const gap=Math.max(20,(n.r+4)*1.7+3),labelX=side==='right'?n.x+gap:n.x-gap-n.box.width;
        const label={x:labelX+n.box.x,y:y+n.box.y,width:n.box.width,height:n.box.height};
        if(label.x<12||label.x+label.width>width-12)continue;
        choices.push({y,labelX,label,dot:{x:n.x-14,y:y-14,width:28,height:39},cost:Math.abs(y-target)/height+(side==='left'?.02:0)});
      }
    }
    return choices.sort((a,b)=>a.cost-b.cost);
  });
  if(options.some(choices=>!choices.length))return false;
  // Reconsider earlier placements instead of making the canvas taller when a
  // late record has no free slot. Reproducible min-conflict search keeps labels
  // at their original font sizes and returns only a collision-free solution.
  for(let restart=0;restart<12;restart++){
    const state=options.map(choices=>choices[Math.floor(random()*Math.min(8,choices.length))]);
    for(let step=0;step<1400;step++){
      const counts=state.map(()=>0);
      for(let i=0;i<state.length;i++)for(let j=i+1;j<state.length;j++)if(conflict(state[i],state[j])){counts[i]++;counts[j]++;}
      const troubled=counts.map((count,i)=>({count,i})).filter(item=>item.count);
      if(!troubled.length){
        for(let pass=0;pass<3;pass++)for(const i of state.map((s,i)=>({i,cost:s.cost})).sort((a,b)=>b.cost-a.cost).map(item=>item.i)){
          const better=options[i].find(candidate=>candidate.cost<state[i].cost&&state.every((other,j)=>i===j||!conflict(candidate,other)));
          if(better)state[i]=better;
        }
        nodes.forEach((n,i)=>Object.assign(n,state[i]));return true;
      }
      const index=troubled[Math.floor(random()*troubled.length)].i;
      let chosen=null,best=Infinity;
      for(const candidate of options[index]){
        let clashes=0;for(let j=0;j<state.length;j++)if(j!==index&&conflict(candidate,state[j]))clashes++;
        const score=clashes+candidate.cost*.04+random()*.08;
        if(score<best){chosen=candidate;best=score;}
      }
      state[index]=random()<.035?options[index][Math.floor(random()*options[index].length)]:chosen;
    }
  }
  return false;
};
Atlas.flow=function(rows){
  const A=Atlas,root=document.querySelector('#chart'),topics=A.flowTopics;
  root.classList.add('flow-chart');
  const toolbar=A.el('div','flow-key');toolbar.append(A.el('span','flow-key-caption','THEME OVERLAPS'));
  const themeButtons=topics.map((topic,i)=>{const b=A.el('button','flow-theme-button',topic);b.type='button';b.dataset.theme=i;b.setAttribute('aria-pressed','false');toolbar.append(b);return b;});
  const reset=A.el('button','text-button','Show all');toolbar.append(reset);root.append(toolbar);
  const themeTip=A.el('div','flow-theme-tooltip');themeTip.id='flow-theme-tooltip';themeTip.setAttribute('role','tooltip');themeTip.hidden=true;root.append(themeTip);
  const openRecord=n=>{themeTip.hidden=true;A.openDetail(n.d.id);};
  const note=A.el('p','flow-note','Year order · Uneven spacing to fit records · Hover for all themes; click for source notes. Shared themes do not imply direct influence.');root.append(note);
  let width=Math.max(680,root.clientWidth);
  const top=28,bottom=42,labelWidth=width<1400?128:150;
  let height=Math.max(240,root.clientHeight-toolbar.getBoundingClientRect().height-note.getBoundingClientRect().height-2);
  root.style.setProperty('--flow-height',height+'px');
  const first=Math.min(1930,...rows.map(d=>d.year)),last=Math.max(2025,...rows.map(d=>d.year));
  const start=Math.floor(first/10)*10,end=Math.ceil(last/5)*5;
  let x=A.flowTimeScale(rows,start,end,width);
  const svg=A.svg(width,height,'Timeline Flow: overlapping working themes across time').attr('width',width).attr('height',height);
  root.insertBefore(svg.node(),note);
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
    g.append('text').attr('class','flow-title').text(n.d.map_title||n.d.title).call(A.wrap,labelWidth,14);
    const titleBox=g.select('.flow-title').node().getBBox();
    g.append('text').attr('class','flow-maker').attr('y',titleBox.y+titleBox.height+12).text(n.d.map_maker||A.text(n.d.author)||n.d.organization||'Research topic').call(A.wrap,labelWidth,12);
    n.g=g;n.box=g.node().getBBox();
  }
  let fit=A.placeFlowNodes(nodes,width,height,top,bottom,topics);
  // Very narrow windows or larger imported collections gain horizontal room,
  // never overlapping labels or silently dropping records to meet the height.
  for(let attempt=0;!fit&&attempt<3;attempt++){
    width+=Math.max(240,rows.length*12);x=A.flowTimeScale(rows,start,end,width);
    nodes.forEach(n=>n.x=x(n.d.year));fit=A.placeFlowNodes(nodes,width,height,top,bottom,topics);
  }
  if(!fit){
    // An unusually dense import (for example many records in one year) still
    // remains readable in a scrollable map rather than freezing the browser.
    const step=Math.max(42,...nodes.map(n=>n.box.height))+32;
    height=top+bottom+step*nodes.length;
    nodes.forEach((n,i)=>{n.y=top+16+i*step;const gap=Math.max(20,(n.r+4)*1.7+3);n.labelX=n.x+gap+n.box.width<width-12?n.x+gap:n.x-gap-n.box.width;});
    root.style.overflowY='auto';root.style.setProperty('--flow-height',height+'px');
  }
  svg.style('width',width+'px');
  if(width>root.clientWidth+1)note.append(document.createTextNode(' Scroll horizontally for the complete map.'));
  svg.attr('data-layout-fit',String(fit));
  svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height);
  for(const n of nodes)n.g.attr('transform',`translate(${n.labelX},${n.y})`).attr('data-record',n.d.id).attr('tabindex',0).attr('role','button').attr('aria-describedby',themeTip.id).attr('aria-label',`${n.d.year}: ${n.d.title}. Open record.`).on('click',()=>openRecord(n)).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openRecord(n);}});
  const dots=dotsLayer.selectAll('g').data(nodes).join('g').attr('class','flow-dot').attr('data-record',n=>n.d.id).attr('transform',n=>`translate(${n.x},${n.y})`).attr('role','button').attr('tabindex',0).attr('aria-label',n=>`${n.d.year}: ${n.d.title}. ${n.topics.map(i=>topics[i]).join('; ')}. Open record.`);
  dots.append('text').attr('class','flow-year').attr('y',24).attr('text-anchor','middle').text(n=>/^\d+s$/.test(n.d.year_label||'')?n.d.year_label:n.d.year);
  dots.append('circle').attr('class','flow-dot-halo').attr('r',n=>n.r+4);
  dots.append('circle').attr('class',n=>'flow-circle'+(n.d.placeholder?' is-placeholder':'')).attr('r',n=>n.r).style('--entry-color',n=>n.d.type==='Heritage Practice Case'?'#82918d':A.color(n.d));
  dots.append('circle').attr('class','flow-hit').attr('r',18);
  dots.attr('aria-describedby',themeTip.id).on('click',(e,n)=>openRecord(n)).on('keydown',(e,n)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openRecord(n);}});
  const axisY=height-28;
  guides.append('line').attr('x1',x(start)).attr('x2',x(end)).attr('y1',axisY).attr('y2',axisY);
  let previousTick=-Infinity;
  for(let year=start;year<=end;year+=10){if(x(year)-previousTick<36)continue;previousTick=x(year);const t=guides.append('g').attr('transform',`translate(${x(year)},${axisY})`);t.append('line').attr('y2',5);t.append('text').attr('y',19).attr('text-anchor','middle').text(year);}
  guides.append('text').attr('x',18).attr('y',axisY+4).text('YEAR');
  // A short branching scaffold avoids repeatedly sweeping across an entire
  // cluster when several same-year records sit at different heights. It is
  // graphic routing only, not a genealogical or chronological relationship.
  const cell=5,nx=Math.ceil(width/cell)+1,ny=Math.ceil(height/cell)+1,sigma=33;
  const contours=[];
  topics.forEach((topic,i)=>{
    const members=nodes.filter(n=>n.topics.includes(i)).sort((a,b)=>a.x-b.x||a.y-b.y);
    if(!members.length)return;
    const samples=members.map(n=>[n.x,n.y,sigma]);
    const connected=new Set([members[0]]),bridges=[];
    while(connected.size<members.length){
      let nearest=null;
      for(const a of connected)for(const b of members)if(!connected.has(b)){
        const distance=Math.hypot(b.x-a.x,b.y-a.y);
        if(!nearest||distance<nearest.distance)nearest={a,b,distance};
      }
      bridges.push(nearest);connected.add(nearest.b);
    }
    for(const edge of bridges){
      const [a,b]=edge.a.x<=edge.b.x?[edge.a,edge.b]:[edge.b,edge.a];
      const count=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/24);
      for(let j=1;j<count;j++){
        const t=j/count,u=1-t,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;
        // A gentle waist between records keeps the node lobes round and the
        // connecting ribbon continuous, with a smooth taper at both ends.
        const waist=Math.sin(Math.PI*t)**2,bridgeSigma=sigma-11*waist;
        // Separate coincident routes between shared records, returning smoothly
        // to the true node at each end. The offset encodes no additional data.
        const offset=(i-(topics.length-1)/2)*10*waist;
        samples.push([u*u*u*a.x+3*u*u*t*(a.x+dx*.5)+3*u*t*t*(b.x-dx*.5)+t*t*t*b.x-dy/length*offset,a.y+dy*(3*t*t-2*t*t*t)+dx/length*offset,bridgeSigma]);
      }
    }
    const values=new Float32Array(nx*ny);
    for(const [px,py,sampleSigma] of samples){const loX=Math.max(0,Math.floor((px-95)/cell)),hiX=Math.min(nx-1,Math.ceil((px+95)/cell)),loY=Math.max(0,Math.floor((py-95)/cell)),hiY=Math.min(ny-1,Math.ceil((py+95)/cell));
      for(let gy=loY;gy<=hiY;gy++)for(let gx=loX;gx<=hiX;gx++){const value=Math.exp(-((gx*cell-px)**2+(gy*cell-py)**2)/(2*sampleSigma*sampleSigma));const index=gy*nx+gx;values[index]=Math.max(values[index],value);}
    }
    contours.push(backdrop.append('path').datum({topic,i}).attr('d',A.flowEnvelopePath(values,nx,ny,cell)).attr('fill-rule','evenodd').attr('class','flow-envelope').attr('data-theme',i));
  });
  const byId=new Map(nodes.map(n=>[n.d.id,n]));
  let selected=null;
  const highlight=(active=null,hover=null)=>{
    const themeSet=hover?new Set(hover.topics):active==null?null:new Set([active]);
    themeButtons.forEach((b,i)=>b.classList.toggle('is-hovered',!!hover&&hover.topics.includes(i)));
    contours.forEach(p=>p.classed('is-active',themeSet?.has(p.datum().i)||false).classed('is-muted',!!themeSet&&!themeSet.has(p.datum().i)));
    const matches=n=>!themeSet||n.topics.some(i=>themeSet.has(i));
    nodes.forEach(n=>n.g.classed('is-muted',!matches(n)).classed('is-hovered',n===hover));dots.classed('is-muted',n=>!matches(n)).classed('is-hovered',n=>n===hover);
    linksLayer.selectAll('*').remove();
    if(hover){
      const relationships=[];for(const n of nodes)for(const r of n.d.relations||[]){if((n===hover||r.target===hover.d.id)&&byId.has(r.target))relationships.push({a:n,b:byId.get(r.target),r});}
      for(const {a,b,r} of relationships){const bend=Math.max(24,Math.abs(b.x-a.x)*.35);const p=linksLayer.append('path').attr('d',`M${a.x},${a.y} C${a.x+bend},${a.y} ${b.x-bend},${b.y} ${b.x},${b.y}`);p.append('title').text(`${a.d.title} → ${b.d.title}: ${r.type} · ${r.evidence||'Evidence pending'}`);}
    }
  };
  const positionTip=event=>{
    const rect=event.currentTarget.getBoundingClientRect(),px=Number.isFinite(event.clientX)?event.clientX:rect.left+rect.width/2,py=Number.isFinite(event.clientY)?event.clientY:rect.top+rect.height/2;
    themeTip.style.left=Math.max(8,Math.min(px+18,window.innerWidth-themeTip.offsetWidth-12))+'px';
    themeTip.style.top=Math.max(8,Math.min(py+18,window.innerHeight-themeTip.offsetHeight-12))+'px';
  };
  const showThemes=(event,n)=>{
    highlight(selected,n);themeTip.replaceChildren(A.el('strong','flow-tooltip-title',n.d.map_title||n.d.title),A.el('span','flow-tooltip-meta',`${n.d.year_label||n.d.year} · ${A.text(n.d.author)||n.d.organization||'Research topic'}`),A.el('span','flow-tooltip-caption','THEMES'));
    for(const i of n.topics){const row=A.el('div','flow-tooltip-theme'),line=A.el('i','flow-tooltip-line');line.dataset.theme=i;line.setAttribute('aria-hidden','true');row.append(line,A.el('span','',topics[i]));themeTip.append(row);}
    if(!n.topics.length)themeTip.append(A.el('span','flow-tooltip-theme','Theme coding pending'));
    themeTip.hidden=false;positionTip(event);
  };
  const hideThemes=()=>{themeTip.hidden=true;highlight(selected);};
  for(const n of nodes)n.g.on('mouseenter',e=>showThemes(e,n)).on('mousemove',positionTip).on('mouseleave',hideThemes).on('focus',e=>showThemes(e,n)).on('blur',hideThemes);
  dots.on('mouseenter',showThemes).on('mousemove',positionTip).on('mouseleave',hideThemes).on('focus',showThemes).on('blur',hideThemes);
  svg.on('keydown.flow-themes',event=>{if(event.key==='Escape')hideThemes();});
  themeButtons.forEach((b,i)=>b.onclick=()=>{selected=selected===i?null:i;themeButtons.forEach((button,j)=>button.setAttribute('aria-pressed',String(j===selected)));highlight(selected);});
  reset.onclick=()=>{selected=null;themeButtons.forEach(b=>b.setAttribute('aria-pressed','false'));highlight();};
};
