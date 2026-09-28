/* Force-directed relationship graph with zoom, pan, drag and neighbour focus. */
Atlas.network=function(rows){
  const A=Atlas,root=document.querySelector('#chart'),W=1600,H=900,svg=A.svg(W,H,'可拖动和缩放的文献关系网络');
  const selected=new Set(rows.map(d=>d.id)),auxIds=new Set(A.nodes.map(d=>d.id)),all=[...A.records,...A.nodes];
  const candidates=all.flatMap(d=>(d.relations||[]).map(r=>({source:d.id,target:r.target,type:r.type,evidence:r.evidence||''})))
    .filter(l=>!A.state.relation||l.type===A.state.relation);
  for(const l of candidates){if(selected.has(l.source)&&auxIds.has(l.target))selected.add(l.target);if(selected.has(l.target)&&auxIds.has(l.source))selected.add(l.source);}
  const nodes=all.filter(d=>selected.has(d.id)).map((d,i)=>({...d,x:W/2+Math.cos(i*2.4)*220,y:H/2+Math.sin(i*2.4)*170}));
  const nodeIds=new Set(nodes.map(d=>d.id)),links=candidates.filter(l=>nodeIds.has(l.source)&&nodeIds.has(l.target));
  const world=svg.append('g').attr('class','network-world');
  const defs=svg.append('defs'),pattern=defs.append('pattern').attr('id','network-grid').attr('width',36).attr('height',36).attr('patternUnits','userSpaceOnUse');
  pattern.append('circle').attr('cx',2).attr('cy',2).attr('r',1).attr('fill','#d7e0e2');
  world.append('rect').attr('width',W).attr('height',H).attr('fill','#fbfcfc');
  world.append('rect').attr('width',W).attr('height',H).attr('fill','url(#network-grid)');
  const linkLayer=world.append('g').attr('class','network-links');
  const link=linkLayer.selectAll('line').data(links).join('line').attr('stroke','#a9b8bd').attr('stroke-width',d=>d.type==='influences'?1.7:1.3).attr('stroke-dasharray',d=>d.type==='related_to'?'4 5':null).attr('opacity',.48).attr('tabindex',0).attr('aria-label',d=>`${A.byId.get(typeof d.source==='string'?d.source:d.source.id)?.title||''} → ${A.byId.get(typeof d.target==='string'?d.target:d.target.id)?.title||''}: ${d.type}`);
  link.append('title').text(d=>`${A.byId.get(typeof d.source==='string'?d.source:d.source.id)?.title||''} → ${A.byId.get(typeof d.target==='string'?d.target:d.target.id)?.title||''}\n${d.type}\n${d.evidence||'Relation coding needs source review.'}`);
  const nodeLayer=world.append('g').attr('class','network-nodes');
  const node=nodeLayer.selectAll('g').data(nodes,d=>d.id).join('g').attr('class','network-node').attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d.title}, ${d.year_label||d.year||''}; open details`).on('click',(e,d)=>{if(!e.defaultPrevented)A.openDetail(d.id);}).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();A.openDetail(d.id);}});
  node.append('circle').attr('class','network-halo').attr('r',d=>d.node_type==='document'?17+(d.importance||1)*3:15).attr('fill',d=>A.color(d)).attr('fill-opacity',d=>d.placeholder?.04:.08);
  node.append('path').attr('class','network-dot').attr('d',d=>d3.symbol().type(d.node_type==='person'?d3.symbolDiamond:d3.symbolCircle).size(d.node_type==='document'?170+(d.importance||1)*110:d.node_type==='person'?190:135)()).attr('fill',d=>d.placeholder||d.node_type==='concept'?'#fff':A.color(d)).attr('stroke',A.color).attr('stroke-width',2).attr('stroke-dasharray',d=>d.placeholder?'4 3':null);
  node.each(function(d){const label=d3.select(this).append('g').attr('class','network-label').attr('transform','translate(20,4)');label.append('text').attr('class','network-title').text(d.map_title||d.title).call(A.wrap,210,16);label.append('text').attr('class','network-meta').attr('y',34).text([d.year_label||d.year,A.text(d.author)||d.organization].filter(Boolean).join(' · '));});
  const sim=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(d=>d.type==='influences'?190:145).strength(.45)).force('charge',d3.forceManyBody().strength(-430)).force('center',d3.forceCenter(W/2,H/2)).force('x',d3.forceX(W/2).strength(.012)).force('y',d3.forceY(H/2).strength(.018)).force('collide',d3.forceCollide(d=>d.node_type==='document'?46:32).iterations(2)).alphaDecay(.025);
  A.sim=sim;
  sim.on('tick',()=>{node.attr('transform',d=>`translate(${d.x},${d.y})`);link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);});
  node.on('mouseenter.neighbours',function(e,d){const neighbours=new Set([d.id]);for(const l of links)if(l.source.id===d.id)neighbours.add(l.target.id);else if(l.target.id===d.id)neighbours.add(l.source.id);node.classed('is-dimmed',n=>!neighbours.has(n.id));link.classed('is-muted',l=>l.source.id!==d.id&&l.target.id!==d.id);}).on('mouseleave.neighbours',()=>{node.classed('is-dimmed',false);link.classed('is-muted',false);});
  const zoom=d3.zoom().scaleExtent([.45,2.8]).on('zoom',e=>world.attr('transform',e.transform));svg.call(zoom).on('dblclick.zoom',null);
  node.call(d3.drag().container(()=>svg.node()).on('start',(e,d)=>{if(!e.active)sim.alphaTarget(.18).restart();d.fx=d.x;d.fy=d.y;}).on('drag',(e,d)=>{const p=d3.zoomTransform(svg.node()).invert([e.x,e.y]);d.fx=p[0];d.fy=p[1];}).on('end',(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}));
  const toolbar=A.el('div','network-toolbar'),hint=A.el('span','network-zoom-hint',`${nodes.length} nodes · ${links.length} coded links · Drag to move, scroll to zoom`);
  const zoomIn=A.el('button','', '＋'),zoomOut=A.el('button','','−'),reset=A.el('button','','Reset');
  for(const b of [zoomIn,zoomOut,reset])b.type='button';zoomIn.setAttribute('aria-label','Zoom in');zoomOut.setAttribute('aria-label','Zoom out');
  zoomIn.onclick=()=>svg.transition().duration(220).call(zoom.scaleBy,1.25);zoomOut.onclick=()=>svg.transition().duration(220).call(zoom.scaleBy,.8);reset.onclick=()=>svg.transition().duration(260).call(zoom.transform,d3.zoomIdentity);
  toolbar.append(hint,zoomOut,zoomIn,reset);root.append(toolbar);
};
