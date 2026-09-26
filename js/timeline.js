/* One-screen topic × time overview. Focus or hover a dot for a readable entry card. */
Atlas.timeline=function(rows){
  const A=Atlas,root=document.querySelector('#chart');
  root.classList.add('timeline-chart');
  const topics=['Conservation & values','Interpretation & experience','Participation & plural voices','Digital methods'];
  const topicOf=d=>d.timeline_topic||(
    d.paradigm?.includes('Participation')?'Participation & plural voices':
    d.paradigm?.includes('Interpretation')?'Interpretation & experience':
    'Conservation & values');
  const start=1930,end=2025,width=Math.max(680,root.clientWidth),left=168,right=34;
  const xFor=year=>left+(Number(year)-start)/(end-start)*(width-left-right);
  const plot=A.el('div','timeline-plot compact-map');plot.style.width=width+'px';
  const axis=A.el('div','timeline-axis');axis.append(A.el('span','timeline-axis-label','YEAR →'));
  for(let year=1930;year<=2020;year+=10){const tick=A.el('span','timeline-tick',String(year));tick.style.left=xFor(year)+'px';axis.append(tick);}plot.append(axis);
  for(const topic of topics){
    const items=rows.filter(d=>topicOf(d)===topic).sort((a,b)=>a.year-b.year||a.title.localeCompare(b.title));
    const tracks=[];const positioned=[];
    for(const d of items){const x=xFor(d.year);let track=tracks.findIndex(last=>x-last>=31);if(track<0){track=tracks.length;tracks.push(x);}else tracks[track]=x;positioned.push({d,x,track});}
    const band=A.el('section','timeline-band');band.style.height=Math.max(75,25+tracks.length*20)+'px';band.setAttribute('aria-label',topic);
    band.append(A.el('div','timeline-band-label',topic));
    for(const {d,x,track} of positioned){
      const point=A.el('button','timeline-point');point.type='button';point.style.left=(x-16)+'px';point.style.top=(14+track*20)+'px';
      point.style.setProperty('--entry-color',A.color(d));point.dataset.size=String(d.importance||1);
      if(d.placeholder)point.classList.add('is-placeholder');
      point.setAttribute('aria-label',`${d.year_label||d.year}: ${d.title}${d.title_zh?' / '+d.title_zh:''}. ${A.text(d.author)||d.organization||''}. ${d.preview||''}`);
      const circle=A.el('span','timeline-point-circle');const year=A.el('span','timeline-point-year',String(d.year));
      point.append(circle,year);
      const card=A.el('span','timeline-hover-card');
      card.append(A.el('span','timeline-hover-year',d.year_label||d.year),A.el('strong','timeline-hover-title',d.title));
      if(d.title_zh)card.append(A.el('span','timeline-hover-zh',d.title_zh));
      card.append(A.el('span','timeline-hover-maker',[A.text(d.author),d.organization].filter(Boolean).join(' / ')||'Research topic'));
      card.append(A.el('span','timeline-hover-summary',d.preview||d.summary||'Reading note pending.'));
      if(d.placeholder)card.append(A.el('span','timeline-hover-pending','READING PENDING'));
      if(x>width-300)card.classList.add('align-right');
      point.append(card);
      const placeCard=()=>{const r=point.getBoundingClientRect();card.style.left=Math.max(12,Math.min(window.innerWidth-280,r.left>window.innerWidth-290?r.left-280:r.right+10))+'px';card.style.top=Math.max(12,Math.min(window.innerHeight-190,r.bottom+8))+'px';};
      point.onmouseenter=placeCard;point.onfocus=placeCard;point.onclick=()=>A.openDetail(d.id);band.append(point);
    }
    plot.append(band);
  }
  root.append(plot);
};
