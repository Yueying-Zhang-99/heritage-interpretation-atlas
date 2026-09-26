/* Compact topic × time map. Labels remain visible; clicking a circle opens its record. */
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
    const tracks=[];const placed=[];
    for(const d of items){
      const x=xFor(d.year);let slot=null;
      for(let track=0;track<=tracks.length&&!slot;track++)for(const side of ['right','left']){
        const lo=side==='right'?x-11:x-129,hi=lo+140;
        if(lo<156||hi>width-5)continue;
        if((tracks[track]||[]).every(([a,b])=>hi+4<a||lo-4>b)){slot={track,side,lo,hi};break;}
      }
      if(!slot){slot={track:tracks.length,side:'left',lo:x-129,hi:x+11};}
      (tracks[slot.track]??=[]).push([slot.lo,slot.hi]);placed.push({d,...slot});
    }
    const band=A.el('section','timeline-band');band.style.height=Math.max(68,12+tracks.length*31)+'px';band.setAttribute('aria-label',topic);
    band.append(A.el('div','timeline-band-label',topic));
    for(const {d,side,lo,track} of placed){
      const point=A.el('button','map-node'+(side==='left'?' reverse':''));point.type='button';
      point.style.left=lo+'px';point.style.top=(7+track*31)+'px';point.style.setProperty('--entry-color',A.color(d));
      point.setAttribute('aria-label',`${d.year_label||d.year}: ${d.title}${d.title_zh?' / '+d.title_zh:''}. ${A.text(d.author)||d.organization||''}. Open details.`);
      const marker=A.el('span','map-marker'),circle=A.el('span','map-circle');circle.dataset.size=String(d.importance||1);
      if(d.placeholder)circle.classList.add('is-placeholder');
      marker.append(circle,A.el('span','map-year',String(d.year)));
      const label=A.el('span','map-label');label.append(A.el('strong','map-title',d.map_title||d.title),A.el('span','map-maker',d.map_maker||A.text(d.author)||d.organization||'Research topic'));
      point.append(marker,label);point.onclick=()=>A.openDetail(d.id);band.append(point);
    }
    plot.append(band);
  }
  root.append(plot);
};
