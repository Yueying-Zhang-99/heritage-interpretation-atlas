/* Compact topic × time map. Labels remain visible; clicking a circle opens its record. */
Atlas.bandsTimeScale=function(rows,start,end,width,left,right){
  if(typeof d3==='undefined'||!Atlas.flowTimeScale)return year=>left+(year-start)/(end-start)*(width-left-right);
  const scale=Atlas.flowTimeScale(rows,start,end,width-left-right+128);
  return scale.range(scale.range().map(x=>left+x-64));
};
Atlas.packTimelineBand=function(items,xFor,left,width,nodeWidth,markerWidth){
  if(!items.length)return {placed:[],tracks:0};
  const choices=items.map(d=>['right','left'].map(side=>{
    const size=typeof nodeWidth==='function'?nodeWidth(d):nodeWidth,x=xFor(d.year),lo=side==='right'?x-markerWidth/2:x-(size-markerWidth/2);
    return {d,side,lo,hi:lo+size};
  }).filter(slot=>slot.lo>=left-12&&slot.hi<=width-5));
  if(choices.some(options=>!options.length))return null;
  let best=null,attempts=0;
  // Choose label directions together, then colour the horizontal intervals.
  // For the current collection all combinations are searched; larger imports
  // retain a bounded, overlap-free fallback instead of blocking the interface.
  const visit=(index,selected)=>{
    if(attempts>=4096)return;
    if(index<choices.length){for(const option of choices[index])visit(index+1,[...selected,option]);return;}
    attempts++;
    const ends=[],placed=[];
    for(const slot of [...selected].sort((a,b)=>a.lo-b.lo||a.hi-b.hi)){
      let track=ends.findIndex(end=>end+4<slot.lo);if(track<0)track=ends.length;
      ends[track]=slot.hi;placed.push({...slot,track});
    }
    const score=ends.length*10000+placed.filter(p=>p.side==='left').length;
    if(!best||score<best.score)best={placed,tracks:ends.length,score};
  };
  visit(0,[]);return best;
};
Atlas.timeline=function(rows){
  if(Atlas.state.timelineMode==='flow'&&typeof d3!=='undefined')return Atlas.flow(rows);
  const A=Atlas,root=document.querySelector('#chart');
  root.classList.add('timeline-chart');
  const topics=A.flowTopics;
  const topicOf=d=>d.timeline_topic||(
    d.paradigm?.includes('Participation')?'Participation & plural voices':
    d.paradigm?.includes('Interpretation')?'Interpretation & experience':
    'Conservation & values');
  const start=Math.floor(Math.min(1930,...rows.map(d=>d.year))/10)*10,end=Math.ceil(Math.max(2025,...rows.map(d=>d.year))/5)*5;
  let width=Math.max(680,root.clientWidth);const initialWidth=width,large=width>=1500;
  const left=large?205:168,right=large?55:34,markerWidth=large?30:22,trackStep=large?46:34;
  let xFor=A.bandsTimeScale(rows,start,end,width,left,right);
  const plot=A.el('div','timeline-plot compact-map');plot.style.width=width+'px';root.append(plot);
  const points=new Map(),sizes=new Map(),canvas=document.createElement('canvas'),measure=canvas.getContext('2d');
  const makePoint=d=>{
      const point=A.el('button','map-node'+(d.type==='Heritage Practice Case'?' is-practice-case':''));point.type='button';
      point.style.setProperty('--entry-color',d.type==='Heritage Practice Case'?'#82918d':A.color(d));
      point.setAttribute('aria-label',`${d.year_label||d.year}: ${d.title}${d.title_zh?' / '+d.title_zh:''}. ${A.text(d.author)||d.organization||''}. Open details.`);
      const marker=A.el('span','map-marker'),circle=A.el('span','map-circle');circle.dataset.size=d.importance?String(d.importance):'unscored';
      if(d.placeholder)circle.classList.add('is-placeholder');
      marker.append(circle,A.el('span','map-year',String(d.year)));
      const label=A.el('span','map-label');label.append(A.el('strong','map-title',d.map_title||d.title),A.el('span','map-maker',d.map_maker||A.text(d.author)||d.organization||'Research topic'));
      point.append(marker,label);point.onclick=()=>A.openDetail(d.id);return point;
  };
  for(const d of rows){
    const point=makePoint(d);plot.append(point);points.set(d.id,point);
    const label=point.querySelector('.map-label'),maxWidth=label.getBoundingClientRect().width;
    const textWidth=el=>{const style=getComputedStyle(el);measure.font=style.font||`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;return measure.measureText(el.textContent).width;};
    const labelWidth=Math.ceil(Math.min(maxWidth,Math.max(60,textWidth(point.querySelector('.map-title')),textWidth(point.querySelector('.map-maker')))));
    label.style.width=labelWidth+'px';const size=markerWidth+(large?8:6)+labelWidth;point.style.width=size+'px';sizes.set(d.id,size);
  }
  let layouts,heights,available;
  const arrange=()=>{
    layouts=topics.map(topic=>{
      const items=rows.filter(d=>topicOf(d)===topic).sort((a,b)=>a.year-b.year||a.title.localeCompare(b.title));
      return {topic,...A.packTimelineBand(items,xFor,left,width,d=>sizes.get(d.id),markerWidth)};
    });
    heights=layouts.map(layout=>Math.max(large?64:46,(large?18:8)+layout.tracks*trackStep));
    available=Math.max(0,root.clientHeight-(large?42:35)-8);
  };
  arrange();
  // Short windows get more horizontal reading room before extra vertical tracks.
  for(let attempt=0;attempt<5&&heights.reduce((sum,h)=>sum+h,0)>available;attempt++){
    width=Math.ceil(width*1.1);plot.style.width=width+'px';xFor=A.bandsTimeScale(rows,start,end,width,left,right);arrange();
  }
  const extra=Math.max(0,available-heights.reduce((sum,h)=>sum+h,0))/topics.length;
  if(width>initialWidth)document.querySelector('#view-hint').textContent+=' Scroll horizontally for the full map.';
  const axis=A.el('div','timeline-axis');axis.append(A.el('span','timeline-axis-label','YEAR →'));
  for(let year=start;year<=end;year+=10){const tick=A.el('span','timeline-tick',String(year));tick.style.left=xFor(year)+'px';axis.append(tick);}plot.prepend(axis);
  layouts.forEach(({topic,placed,tracks},i)=>{
    const band=A.el('section','timeline-band');band.style.height=(heights[i]+extra)+'px';band.setAttribute('aria-label',topic);band.dataset.tracks=String(tracks);
    band.append(A.el('div','timeline-band-label',topic));
    for(const {d,side,lo,track} of placed){
      const point=points.get(d.id);point.classList.toggle('reverse',side==='left');point.style.left=lo+'px';point.style.top=((large?12:7)+track*trackStep)+'px';band.append(point);
    }
    plot.append(band);
  });
  plot.style.paddingBottom='8px';
};
