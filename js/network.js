Atlas.network=function(rows){
  const A=Atlas,W=1320,H=610,svg=A.svg(W,H,'文献、人物与概念的关系网络');
  const included=new Set(rows.map(d=>d.id)),aux=new Set(A.nodes.map(d=>d.id));
  const all=[...A.records,...A.nodes],allLinks=all.flatMap(d=>(d.relations||[]).map(r=>({source:d.id,target:r.target,type:r.type,evidence:r.evidence||''}))).filter(r=>!A.state.relation||r.type===A.state.relation);
  // Include only one-hop auxiliary nodes; filtered-out documents never return through links.
  for(const l of allLinks){if(included.has(l.source)&&aux.has(l.target))included.add(l.target);if(included.has(l.target)&&aux.has(l.source))included.add(l.source);}
  const nodes=all.filter(d=>included.has(d.id)).map(d=>({...d}));
  const links=allLinks.filter(l=>included.has(l.source)&&included.has(l.target));
  const defs=svg.append('defs');defs.append('marker').attr('id','network-arrow').attr('viewBox','0 -5 10 10').attr('refX',22).attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto').append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#aaa79c');
  const simulation=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(140).strength(.45)).force('charge',d3.forceManyBody().strength(-650)).force('center',d3.forceCenter(W/2,H/2)).force('x',d3.forceX(W/2).strength(.035)).force('y',d3.forceY(H/2).strength(.12)).force('collide',d3.forceCollide(53)).stop();
  for(let i=0;i<240;i++)simulation.tick();
  const sx=d3.scaleLinear().domain(d3.extent(nodes,d=>d.x)).range([110,W-150]),sy=d3.scaleLinear().domain(d3.extent(nodes,d=>d.y)).range([70,H-95]);
  for(const n of nodes){n.x=nodes.length===1?W/2:sx(n.x);n.y=nodes.length===1?H/2:sy(n.y);}
  // Resolve label-sized rectangles after fitting the force layout to the canvas.
  // A circular force alone does not account for the text extending to the right.
  for(let pass=0;pass<100;pass++){
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,ox=184-Math.abs(dx),oy=65-Math.abs(dy);
      if(ox>0&&oy>0){if(ox/184<oy/65){const move=(ox+1)/2*(dx>=0?1:-1);a.x-=move;b.x+=move;}else{const move=(oy+1)/2*(dy>=0?1:-1);a.y-=move;b.y+=move;}}
    }
    for(const n of nodes){n.x=Math.max(30,Math.min(W-180,n.x));n.y=Math.max(35,Math.min(H-60,n.y));}
  }
  const dash={influences:'',extends:'7 3',critiques:'2 4',related_to:'2 6',supports:'9 3 2 3',shifts_toward:'6 6'};
  const lines=svg.append('g').selectAll('line').data(links).join('line').attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y).attr('stroke','#bdb9ad').attr('stroke-width',1.2).attr('stroke-dasharray',d=>dash[d.type]).attr('marker-end','url(#network-arrow)').attr('tabindex',0).attr('aria-label',d=>`${d.source.title} → ${d.target.title}: ${d.type}`);
  lines.append('title').text(d=>`${d.source.title} → ${d.target.title}\n${d.type}\n${d.evidence}`);
  const g=svg.append('g').selectAll('g').data(nodes).join('g').attr('transform',d=>`translate(${d.x},${d.y})`);A.bindNodes(g);
  g.append('path').attr('class','node-dot').attr('d',d=>d3.symbol().type(d.node_type==='person'?d3.symbolDiamond:d.node_type==='concept'?d3.symbolCircle:d3.symbolSquare).size(d.node_type==='document'?180:135)()).attr('fill',d=>d.node_type==='concept'?'#f5f1e8':A.color(d)).attr('stroke',A.color).attr('stroke-width',1.5);
  const labels=g.append('g').attr('transform','translate(15,4)');labels.append('text').attr('class','node-title').attr('font-size',12).text(d=>d.title).call(A.wrap,145,15);
  g.on('mouseenter.highlight',function(e,d){lines.attr('opacity',l=>l.source.id===d.id||l.target.id===d.id?1:.12);}).on('mouseleave.highlight',()=>lines.attr('opacity',1));
  g.call(d3.drag().on('start',A.hideTooltip).on('drag',function(e,d){d.x=Math.max(25,Math.min(W-170,e.x));d.y=Math.max(30,Math.min(H-45,e.y));d3.select(this).attr('transform',`translate(${d.x},${d.y})`);lines.attr('x1',l=>l.source.x).attr('y1',l=>l.source.y).attr('x2',l=>l.target.x).attr('y2',l=>l.target.y);}));
};
