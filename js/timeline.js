Atlas.timeline=function(rows){
  const A=Atlas,W=1440,baseH=540,start=205,end=1230;
  const min=Math.min(1930,...rows.map(d=>d.year)),max=Math.max(new Date().getFullYear(),...rows.map(d=>d.year));
  const x=d3.scaleLinear().domain([min,max]).range([start,end]);
  const positioned=[],heights=[];let top=55;
  for(const stream of ['A','B','C','U']){
    const entries=rows.filter(d=>(A.streams[d.stream]?d.stream:'U')===stream).sort((a,b)=>a.year-b.year);if(stream==='U'&&!entries.length)continue;
    const lanes=[];for(const d of entries){const px=x(d.year);let lane=lanes.findIndex(last=>px-last>148);if(lane<0)lane=lanes.length;lanes[lane]=px;positioned.push({...d,px,py:top+42+lane*62});}
    const height=Math.max(142,lanes.length*62+40);heights.push({stream,top,height});top+=height;
  }
  const H=Math.max(baseH,top+36),svg=A.svg(W,H,'三条理论流时间轴，使用 Tab 选择节点');
  const ticks=d3.range(Math.ceil(min/10)*10,max+1,10);if(!ticks.includes(max))ticks.push(max);
  svg.selectAll('.guide').data(ticks).join('line').attr('x1',d=>x(d)).attr('x2',d=>x(d)).attr('y1',35).attr('y2',H-24).attr('stroke','#ded9cd').attr('stroke-dasharray','2 5');
  svg.selectAll('.year').data(ticks).join('text').attr('x',d=>x(d)).attr('y',23).attr('text-anchor','middle').attr('font-size',11).attr('fill','#8a887b').text(d=>d===max?`${d} / NOW`:d);
  for(const [i,{stream,top,height}] of heights.entries()){
    const info=A.streams[stream]||{name:'Unassigned',zh:'未分类条目',color:'#7d7c73'};
    const cy=top+height/2;
    svg.append('path').attr('d',`M ${start-20} ${cy} C ${start+10} ${top-4}, ${start+240} ${top+9}, ${start+470} ${top+15} S ${end+40} ${top-3}, ${end+68} ${cy-4} S ${end-180} ${top+height-3}, ${start+465} ${top+height-12} S ${start-52} ${top+height}, ${start-20} ${cy} Z`).attr('fill',info.color).attr('fill-opacity',.055).attr('stroke',info.color).attr('stroke-opacity',.28).attr('stroke-width',.8);
    const label=svg.append('g').attr('transform',`translate(8,${cy-28})`);label.append('text').attr('font-size',10).attr('fill',info.color).attr('letter-spacing',2).text(`${String(i+1).padStart(2,'0')} / STREAM ${stream}`);label.append('text').attr('y',27).attr('font-family','Georgia').attr('font-size',15).attr('fill',info.color).text(info.name.includes(' / ')?'Participatory / Plural':info.name.replace(' Paradigm',''));label.append('text').attr('y',47).attr('font-size',10).attr('fill','#858477').text(info.zh);
  }
  const byId=new Map(positioned.map(d=>[d.id,d]));
  for(const d of positioned)for(const r of d.relations||[]){const t=byId.get(r.target);if(!t)continue;svg.append('path').attr('d',`M${d.px},${d.py} C${d.px+50},${d.py+30} ${t.px-50},${t.py-30} ${t.px},${t.py}`).attr('fill','none').attr('stroke','#96958a').attr('stroke-width',.8).attr('stroke-dasharray','3 5').append('title').text(`${d.title} → ${t.title}: ${r.type}`);}
  const nodes=svg.append('g').selectAll('g').data(positioned).join('g').attr('transform',d=>`translate(${d.px},${d.py})`);A.bindNodes(nodes);
  nodes.append('circle').attr('class','node-dot').attr('r',5).attr('fill',A.color).attr('stroke',A.color).attr('fill-opacity',d=>d.node_type==='concept'?.12:1);
  nodes.append('text').attr('class','node-year').attr('x',12).attr('y',-4).attr('fill',A.color).text(d=>d.year_label||d.year);
  const labels=nodes.append('g').attr('transform','translate(12,15)');labels.append('text').attr('class','node-title').text(d=>d.id==='ename'?'Interpretation Charter':d.title).call(A.wrap,135,15);
};
