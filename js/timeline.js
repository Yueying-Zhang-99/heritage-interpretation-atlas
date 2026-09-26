/* A chronological map with editable, provisional topic bands. */
Atlas.timeline=function(rows){
  const A=Atlas,root=document.querySelector('#chart');
  root.classList.add('timeline-chart');
  const topics=['Conservation & values','Interpretation & experience','Participation & plural voices','Digital methods'];
  const fallback=d=>d.timeline_topic||(
    d.paradigm?.includes('Participation')?'Participation & plural voices':
    d.paradigm?.includes('Interpretation')?'Interpretation & experience':
    'Conservation & values');
  const start=1930,end=2025,width=1850,left=88,right=240,cardWidth=226,trackHeight=182;
  const xFor=year=>left+(Number(year)-start)/(end-start)*(width-left-right);
  const plot=A.el('div','timeline-plot');plot.style.width=width+'px';
  const axis=A.el('div','timeline-axis');axis.append(A.el('span','timeline-axis-label','YEAR →'));
  for(let y=1930;y<=2020;y+=10){const tick=A.el('span','timeline-tick',String(y));tick.style.left=xFor(y)+'px';axis.append(tick);}plot.append(axis);
  for(const topic of topics){
    const items=rows.filter(d=>fallback(d)===topic).sort((a,b)=>a.year-b.year||a.title.localeCompare(b.title));
    const tracks=[];
    for(const d of items){const x=xFor(d.year);let track=tracks.findIndex(last=>x-last>=cardWidth+14);if(track<0){track=tracks.length;tracks.push(x);}else tracks[track]=x;d.__timelineTrack=track;}
    const band=A.el('section','timeline-band');band.style.height=Math.max(185,tracks.length*trackHeight+54)+'px';
    band.setAttribute('aria-label',topic);
    const bandLabel=A.el('div','timeline-band-label',topic);band.append(bandLabel);
    for(const d of items){
      const item=A.el('button','timeline-bubble');item.type='button';item.style.left=xFor(d.year)+'px';item.style.top=(49+d.__timelineTrack*trackHeight)+'px';
      item.style.setProperty('--entry-color',A.color(d));item.onclick=()=>A.openDetail(d.id);
      item.setAttribute('aria-label',`${d.year_label||d.year}, ${d.title}${d.title_zh?', '+d.title_zh:''}, ${topic}`);
      if(d.placeholder)item.classList.add('is-placeholder');
      const dot=A.el('span','timeline-bubble-dot');dot.dataset.size=String(d.importance||1);
      const content=A.el('span','timeline-bubble-content');
      const meta=A.el('span','timeline-bubble-meta');meta.append(A.el('span','',d.year_label||d.year),A.el('span','',A.category(d)));
      content.append(meta,A.el('strong','timeline-bubble-title',d.title));
      if(d.title_zh)content.append(A.el('span','timeline-bubble-zh',d.title_zh));
      content.append(A.el('span','timeline-bubble-maker',[A.text(d.author),d.organization].filter(Boolean).join(' / ')||'Research topic'));
      content.append(A.el('span','timeline-bubble-preview',d.preview||d.summary||'Reading note pending.'));
      if(d.placeholder)content.append(A.el('span','timeline-bubble-pending','READING PENDING'));
      item.append(dot,content);band.append(item);
    }
    plot.append(band);
  }
  root.append(plot);
};
