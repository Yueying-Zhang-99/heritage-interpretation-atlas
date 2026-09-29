/* Force-directed relationship graph with zoom, pan, drag and neighbour focus. */
Atlas.network=function(rows){
  const A=Atlas,root=document.querySelector('#chart');root.classList.add('network-chart');
  const W=Math.max(1000,root.clientWidth),H=Math.max(600,root.clientHeight),svg=A.svg(W,H,'可拖动和缩放的文献关系网络');
  const selected=new Set(rows.map(d=>d.id)),auxIds=new Set(A.nodes.map(d=>d.id)),all=[...A.records,...A.nodes];
  if(rows.length===A.records.length)for(const d of A.nodes)selected.add(d.id);
  const candidates=all.flatMap(d=>(d.relations||[]).map(r=>({source:d.id,target:r.target,type:r.type,evidence:r.evidence||''})))
    .filter(l=>!A.state.relation||l.type===A.state.relation);
  for(const l of candidates){if(selected.has(l.source)&&auxIds.has(l.target))selected.add(l.target);if(selected.has(l.target)&&auxIds.has(l.source))selected.add(l.source);}
  const nodes=all.filter(d=>selected.has(d.id)).map(d=>({...d}));
  nodes.forEach((d,i)=>{d.x=W/2+Math.cos(i*2.4)*220;d.y=H/2+Math.sin(i*2.4)*170;d.labelWidth=190;d.labelOffset=36;});
  const nodeIds=new Set(nodes.map(d=>d.id)),links=candidates.filter(l=>nodeIds.has(l.source)&&nodeIds.has(l.target));
  const world=svg.append('g').attr('class','network-world');
  const linkLayer=world.append('g').attr('class','network-links');
  const link=linkLayer.selectAll('line').data(links).join('line').attr('stroke','#a9b8bd').attr('stroke-width',d=>d.type==='influences'?1.7:1.3).attr('stroke-dasharray',d=>d.type==='related_to'?'4 5':null).attr('opacity',.48).attr('tabindex',0).attr('aria-label',d=>`${A.byId.get(typeof d.source==='string'?d.source:d.source.id)?.title||''} → ${A.byId.get(typeof d.target==='string'?d.target:d.target.id)?.title||''}: ${d.type}`);
  link.append('title').text(d=>`${A.byId.get(typeof d.source==='string'?d.source:d.source.id)?.title||''} → ${A.byId.get(typeof d.target==='string'?d.target:d.target.id)?.title||''}\n${d.type}\n${d.evidence||'Relation coding needs source review.'}`);
  const nodeLayer=world.append('g').attr('class','network-nodes');
  const practice=d=>d.type==='Heritage Practice Case';
  const markerSize=d=>practice(d)?58:d.core_concept?410:d.node_type==='document'?170+(d.importance||1)*110:d.node_type==='person'?190:135;
  const markerShape=d=>d3.symbol().type(d.node_type==='person'?d3.symbolDiamond:d3.symbolCircle);
  const node=nodeLayer.selectAll('g').data(nodes,d=>d.id).join('g').attr('class',d=>'network-node'+(d.core_concept?' is-key-concept':'')+(practice(d)?' is-practice-case':'')).attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d.title}, ${d.year_label||d.year||''}; open details`).on('click',(e,d)=>{if(!e.defaultPrevented)A.openDetail(d.id);}).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();A.openDetail(d.id);}});
  node.append('circle').attr('class','network-halo').attr('r',d=>practice(d)?9:d.core_concept?29:d.node_type==='document'?17+(d.importance||1)*3:15).attr('fill',d=>practice(d)?'#82918d':A.color(d)).attr('fill-opacity',d=>practice(d)?.035:d.placeholder ? .04 : d.core_concept ? .2 : .08);
  node.append('path').attr('class','network-cutout').attr('d',d=>markerShape(d).size(markerSize(d)*1.55)()).attr('fill','#fff');
  node.append('path').attr('class','network-dot').attr('d',d=>markerShape(d).size(markerSize(d))()).attr('fill',d=>practice(d)?'#82918d':d.placeholder||d.node_type==='concept'?'#fff':A.color(d)).attr('fill-opacity',d=>practice(d)?.78:1).attr('stroke',d=>practice(d)?'#788984':A.color(d)).attr('stroke-width',d=>practice(d)?1.4:d.core_concept?3:2).attr('stroke-dasharray',d=>d.placeholder?'4 3':null);
  node.each(function(d){const label=d3.select(this).append('g').attr('class','network-label').attr('transform','translate(20,4)');
    if(d.year_label||d.year)label.append('text').attr('class','network-year').attr('y',10).text(d.year_label||d.year);
    const title=label.append('text').attr('class','network-title').attr('y',29).text(d.map_title||d.title).call(A.wrap,d.labelWidth||165,18);
    const maker=d.map_maker||A.text(d.author)||d.organization;if(maker)label.append('text').attr('class','network-maker').attr('y',29+Math.max(1,title.selectAll('tspan').size())*18+4).text(maker);
    label.lower();
  });
  const applyLabelScale=()=>{
    const scale=A.networkPhysics.labelScale/100;
    node.each(function(d){
      const group=d3.select(this),year=group.select('.network-year'),title=group.select('.network-title'),maker=group.select('.network-maker');
      year.style('font-size',`${11*scale}px`).attr('y',10*scale);
      title.style('font-size',`${(practice(d)?14:16)*scale}px`).attr('y',29*scale);
      title.selectAll('tspan').attr('dy',(word,i)=>i===0?0:18*scale);
      if(!maker.empty())maker.style('font-size',`${12*scale}px`).attr('y',29*scale+Math.max(1,title.selectAll('tspan').size())*18*scale+4*scale);
    });
  };
  applyLabelScale();
  const sim=d3.forceSimulation(nodes)
    .force('link',d3.forceLink(links).id(d=>d.id).distance(d=>A.networkPhysics.distance+(d.type==='influences'?35:0)).strength(.45))
    .force('charge',d3.forceManyBody().strength(-A.networkPhysics.repulsion))
    .force('center',d3.forceCenter(W/2,H/2))
    .force('x',d3.forceX(W/2).strength(.012))
    .force('y',d3.forceY(H/2).strength(.018))
    .force('collide',d3.forceCollide(d=>d.node_type==='document'?46:32).iterations(2))
    .alphaDecay(.025).stop();
  A.sim=sim;
  sim.tick(240);
  const place=()=>{node.attr('transform',d=>`translate(${d.x},${d.y})`);node.select('.network-label').attr('transform',d=>{const offset=(d.labelOffset||36)*A.networkPhysics.labelScale/100;return `translate(${d.x>W/2?-offset:offset},4)`;}).attr('text-anchor',d=>d.x>W/2?'end':'start');link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);};
  place();
  sim.on('tick',place);
  node.on('mouseenter.neighbours',function(e,d){const neighbours=new Set([d.id]);for(const l of links)if(l.source.id===d.id)neighbours.add(l.target.id);else if(l.target.id===d.id)neighbours.add(l.source.id);node.classed('is-dimmed',n=>!neighbours.has(n.id));link.classed('is-muted',l=>l.source.id!==d.id&&l.target.id!==d.id).classed('is-active',l=>l.source.id===d.id||l.target.id===d.id);}).on('mouseleave.neighbours',()=>{node.classed('is-dimmed',false);link.classed('is-muted',false).classed('is-active',false);});
  const zoom=d3.zoom().scaleExtent([.16,3.5]).on('zoom',e=>world.attr('transform',e.transform));svg.call(zoom).on('dblclick.zoom',null);
  const fit=(animate=false)=>{
    if(!nodes.length)return;
    const bounds=nodes.map(d=>{const scale=A.networkPhysics.labelScale/100,offset=(d.labelOffset||36)*scale,width=(d.labelWidth||190)*scale;return {left:d.x>W/2?Math.min(d.x-offset-width,d.x-30):d.x-30,right:d.x>W/2?d.x+30:Math.max(d.x+offset+width,d.x+30),top:d.y-24*scale,bottom:d.y+108*scale};});
    const minX=Math.min(...bounds.map(b=>b.left)),maxX=Math.max(...bounds.map(b=>b.right));
    const minY=Math.min(...bounds.map(b=>b.top)),maxY=Math.max(...bounds.map(b=>b.bottom));
    const contentWidth=maxX-minX,contentHeight=maxY-minY,k=Math.min(W/contentWidth,H/contentHeight)*.98;
    const transform=d3.zoomIdentity.translate(W/2-k*(minX+contentWidth/2),H/2-k*(minY+contentHeight/2)).scale(k);
    if(animate)svg.transition().duration(260).call(zoom.transform,transform);else svg.call(zoom.transform,transform);
  };
  A.fitNetwork=fit;fit();
  A.updateNetworkPhysics=()=>{
    sim.force('link').distance(d=>A.networkPhysics.distance+(d.type==='influences'?35:0));
    sim.force('charge').strength(-A.networkPhysics.repulsion);
    sim.alpha(.8).stop().tick(160);place();fit(true);
  };
  A.updateNetworkLabelScale=()=>{applyLabelScale();place();};
  // Measure pointer coordinates in the zoomed world group. D3 then accounts
  // for the node's pointer offset and the current zoom transform together.
  node.call(d3.drag().container(()=>world.node()).on('start',(e,d)=>{if(!e.active)sim.alphaTarget(.18).restart();d.fx=d.x;d.fy=d.y;}).on('drag',(e,d)=>{d.fx=e.x;d.fy=e.y;}).on('end',(e,d)=>{if(!e.active)sim.alphaTarget(0);d.targetX=d.x;d.targetY=d.y;d.fx=null;d.fy=null;}));
  const toolbar=A.el('div','network-toolbar'),hint=A.el('span','network-zoom-hint',`${nodes.length} nodes · ${links.length} coded links · Drag to move, scroll to zoom`);
  const zoomOut=A.el('button','','−'),zoomIn=A.el('button','','＋'),fitButton=A.el('button','','Fit all');
  for(const b of [zoomOut,zoomIn,fitButton])b.type='button';zoomIn.setAttribute('aria-label','Zoom in');zoomOut.setAttribute('aria-label','Zoom out');
  zoomIn.onclick=()=>svg.transition().duration(220).call(zoom.scaleBy,1.25);zoomOut.onclick=()=>svg.transition().duration(220).call(zoom.scaleBy,.8);fitButton.onclick=()=>fit(true);
  toolbar.append(hint,zoomOut,zoomIn,fitButton);root.append(toolbar);
};
