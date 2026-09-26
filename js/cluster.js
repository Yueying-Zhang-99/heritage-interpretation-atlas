Atlas.cluster=function(rows){
  const A=Atlas,key=A.state.cluster,groups=[...new Set(rows.flatMap(d=>A.arr(d[key]).length?A.arr(d[key]).map(String):['Uncoded']))].sort();
  const W=1320,cols=Math.min(4,groups.length),cellW=W/cols,cellH=230,H=Math.max(480,Math.ceil(groups.length/cols)*cellH+30),svg=A.svg(W,H,'按研究编码聚类；多值条目在各组分别出现');
  const centers=new Map(groups.map((g,i)=>[g,{x:cellW*(i%cols+.5),y:115+Math.floor(i/cols)*cellH}]));
  for(const group of groups){const c=centers.get(group);svg.append('ellipse').attr('cx',c.x).attr('cy',c.y+18).attr('rx',cellW*.44).attr('ry',87).attr('fill','#747b53').attr('fill-opacity',.035).attr('stroke','#cecbbd').attr('stroke-dasharray','3 5');svg.append('text').attr('x',c.x).attr('y',c.y-81).attr('text-anchor','middle').attr('font-size',13).attr('fill','#747568').text(group);}
  const nodes=rows.flatMap(d=>(A.arr(d[key]).length?A.arr(d[key]).map(String):['Uncoded']).map(group=>({...d,group,x:centers.get(group).x,y:centers.get(group).y})));
  const simulation=d3.forceSimulation(nodes).force('x',d3.forceX(d=>centers.get(d.group).x).strength(.13)).force('y',d3.forceY(d=>centers.get(d.group).y).strength(.18)).force('collide',d3.forceCollide(29)).force('charge',d3.forceManyBody().strength(-6)).stop();
  for(let i=0;i<200;i++)simulation.tick();
  const g=svg.selectAll('.cluster-node').data(nodes).join('g').attr('transform',d=>`translate(${d.x},${d.y})`);A.bindNodes(g);
  g.append('circle').attr('class','node-dot').attr('r',d=>d.placeholder?17:17+(d.importance||1)*2).attr('fill',A.color).attr('fill-opacity',d=>d.placeholder?0:.13).attr('stroke',A.color).attr('stroke-width',1.4).attr('stroke-dasharray',d=>d.placeholder?'3 3':null);
  g.append('text').attr('text-anchor','middle').attr('dy',4).attr('font-size',11).attr('fill',A.color).text(d=>d.year_label||d.year);
  g.append('title').text(d=>`${d.title} / ${d.group}`);
};
