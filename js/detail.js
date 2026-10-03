Atlas.openDetail=function(id){
  const A=Atlas,d=A.byId.get(id);if(!d)return;A.hideTooltip();
  const root=document.querySelector('#detail-content');root.replaceChildren();
  root.append(A.el('div','entry-number',d.year_label||d.year||d.node_type.toUpperCase()));
  const title=A.el('h2','',d.title);title.id='detail-title';if(d.title_zh)title.append(A.el('span','',d.title_zh));root.append(title);
  root.append(A.el('p','small',`${A.category(d)} · ${d.type==='Heritage Practice Case'?'Practice case':d.placeholder?'Reading pending':'Research record'}${d.importance?` · Provisional contribution ${d.importance}/3`:''}`));
  if(d.importance_note)root.append(A.el('p','small',d.importance_note));
  const meta=A.el('dl','detail-meta');for(const [label,value]of [['Author',A.text(d.author)],['Organisation',d.organization],['Recognition basis',d.recognition_basis],['Practice date',d.practice_date],['Type',d.type],['Document nature',A.category(d)==='Charter / Policy'?A.text(d.document_nature):''],['Key concepts',A.text(d.concepts)],['Themes',A.text(d.themes)],['Heritage',A.text(d.heritage_conception)],['Interpretation',A.text(d.interpretation_model)],['Public role',A.text(d.public_role)],['Narrative',A.text(d.narrative_structure)],['Media',A.text(d.media)]]){if(value)meta.append(A.el('dt','',label),A.el('dd','',value));}root.append(meta);
  if(d.coding_status)root.append(A.el('p','small',d.coding_status));
  const setting=A.el('section','detail-section');setting.append(A.el('h3','','INTERPRETIVE SETTING'),A.el('p','',A.text(A.interpretiveSettings(d))),A.el('p','small','Setting describes where the public encounters heritage. Digital media can be used on-site or off-site. Tags record the scope checked so far.'));
  const se=d.interpretive_setting_evidence;
  if(se){setting.append(A.el('span','coding-badge',se.status==='source'?'Source checked':'Provisional'),A.el('p','',se.evidence));if(se.location)setting.append(A.el('p','small',se.location));const safe=A.safeURL(se.source_url);if(safe){const link=A.el('a','','Check setting source ↗');link.href=safe;link.target='_blank';link.rel='noopener noreferrer';setting.append(link);}}else setting.append(A.el('p','small','Setting evidence pending. A technology label alone does not establish the setting.'));
  root.append(setting);
  if(A.topicMemberships(d).length){const section=A.el('section','detail-section topic-evidence');section.append(A.el('h3','','THEME MEMBERSHIPS'),A.el('p','small','Working research codes · Shared themes do not establish direct influence.'));for(const m of A.topicMemberships(d)){const entry=A.el('div','topic-evidence-entry');entry.append(A.el('h4','',m.topic),A.el('span','coding-badge',m.status==='source'?'Source checked':'Provisional'),A.el('p','',m.evidence));if(m.location)entry.append(A.el('p','small',m.location));const safe=A.safeURL(m.source_url);if(safe){const link=A.el('a','', 'Check source ↗');link.href=safe;link.target='_blank';link.rel='noopener noreferrer';entry.append(link);}section.append(entry);}root.append(section);}
  for(const [label,key]of [['Summary','summary'],['Theoretical shift','paradigm_shift'],['Research significance','significance'],['PhD relevance','phd_relevance'],['Reading notes','my_notes']]){if(!d[key])continue;const section=A.el('section','detail-section');section.append(A.el('h3','',label),A.el('p','',d[key]));root.append(section);}
  const excerpts=A.el('section','detail-section');excerpts.append(A.el('h3','','SOURCE EXCERPTS'));if(d.excerpts?.length){for(const e of d.excerpts){const quote=A.el('blockquote','source-excerpt',e.text||'');const cite=A.el('cite','',[`— ${e.source||'Source pending'}`,e.location].filter(Boolean).join(' · '));quote.append(cite);excerpts.append(quote);}}else excerpts.append(A.el('p','small','Verified source excerpt pending. Add a short quotation with an article or page reference after reading the original.'));root.append(excerpts);
  if(d.annotations?.length){const s=A.el('section','detail-section');s.append(A.el('h3','','Annotations'));for(const a of d.annotations){s.append(A.el('p','',`${a.text||''}${a.page!=null?' (p. '+a.page+')':''}`));}root.append(s);}
  const related=A.el('section','detail-section');related.append(A.el('h3','','Related records'));
  const relations=(d.relations||[]).map(r=>({...r,other:r.target,direction:'→'}));for(const n of A.byId.values())for(const r of n.relations||[])if(r.target===id)relations.push({...r,other:n.id,direction:'←'});
  for(const r of relations){const other=A.byId.get(r.other);if(!other)continue;const b=A.el('button','related-button',`${r.direction} ${other.title}`);b.append(A.el('small','',`${r.type} · ${r.evidence||'Evidence pending'}`));b.onclick=()=>A.openDetail(other.id);related.append(b);}if(relations.length)root.append(related);
  const links=A.el('section','detail-section');links.append(A.el('h3','','Source'));const holder=A.el('div','source-links');for(const [label,url,isPDF]of [['View source ↗',d.source_url,false],['Open PDF ↗',d.pdf,true]]){const safe=A.safeURL(url,isPDF);if(safe){const a=A.el('a','',label);a.href=safe;a.target='_blank';a.rel='noopener noreferrer';holder.append(a);}}links.append(holder);root.append(links);
  A.detailCard.open();root.scrollTop=0;
};

Atlas.detailCard=(()=>{
  const panel=document.querySelector('#detail-dialog'),handle=document.querySelector('#detail-move');
  const storageKey='heritage-atlas-detail-card-v1',margin=12;
  let geometry=null,gesture=null,opener=null;
  try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved&&['x','y','width','height'].every(key=>Number.isFinite(saved[key])))geometry=saved;}catch{}
  const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
  const limits=()=>({width:Math.max(1,window.innerWidth-2*margin),height:Math.max(1,window.innerHeight-2*margin)});
  const place=(next)=>{
    const max=limits(),width=clamp(next.width,Math.min(320,max.width),max.width),height=clamp(next.height,Math.min(260,max.height),max.height);
    geometry={width,height,x:clamp(next.x,margin,window.innerWidth-margin-width),y:clamp(next.y,margin,window.innerHeight-margin-height)};
    Object.assign(panel.style,{left:geometry.x+'px',top:geometry.y+'px',width:width+'px',height:height+'px'});
  };
  const remember=()=>{try{localStorage.setItem(storageKey,JSON.stringify(geometry));}catch{}};
  const finish=()=>{
    if(!gesture)return;
    const {target,pointerId}=gesture;gesture=null;panel.classList.remove('is-adjusting');
    if(target.hasPointerCapture(pointerId))target.releasePointerCapture(pointerId);
    remember();
  };
  const begin=(event,edge)=>{
    if(event.button!==0||gesture||event.target.closest('.close-button'))return;
    event.preventDefault();const target=event.currentTarget;
    gesture={edge,target,pointerId:event.pointerId,x:event.clientX,y:event.clientY,start:{...geometry}};
    target.focus({preventScroll:true});target.setPointerCapture(event.pointerId);panel.classList.add('is-adjusting');
  };
  handle.addEventListener('pointerdown',event=>begin(event,'move'));
  for(const edge of ['n','e','s','w','ne','nw','sw']){
    const grip=document.createElement('div');grip.className='detail-resize detail-resize-'+edge;grip.dataset.resize=edge;grip.setAttribute('aria-hidden','true');panel.append(grip);
  }
  panel.querySelectorAll('[data-resize]').forEach(grip=>grip.addEventListener('pointerdown',event=>begin(event,grip.dataset.resize)));
  document.addEventListener('pointermove',event=>{
    if(!gesture||event.pointerId!==gesture.pointerId)return;
    const {start,edge}=gesture,dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(edge==='move'){place({...start,x:start.x+dx,y:start.y+dy});return;}
    const max=limits(),minW=Math.min(320,max.width),minH=Math.min(260,max.height);
    let left=start.x,top=start.y,right=start.x+start.width,bottom=start.y+start.height;
    if(edge.includes('e'))right=clamp(right+dx,left+minW,window.innerWidth-margin);
    if(edge.includes('w'))left=clamp(left+dx,margin,right-minW);
    if(edge.includes('s'))bottom=clamp(bottom+dy,top+minH,window.innerHeight-margin);
    if(edge.includes('n'))top=clamp(top+dy,margin,bottom-minH);
    place({x:left,y:top,width:right-left,height:bottom-top});
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,event=>{if(gesture&&event.pointerId===gesture.pointerId)finish();});
  const keyboard=(event,resize)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||!geometry)return;
    event.preventDefault();const step=event.shiftKey?20:10,next={...geometry};
    const horizontal=event.key==='ArrowLeft'||event.key==='ArrowRight',delta=(event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1)*step;
    const key=resize?(horizontal?'width':'height'):(horizontal?'x':'y');next[key]+=delta;place(next);remember();
  };
  handle.addEventListener('keydown',event=>keyboard(event,false));
  panel.querySelector('[data-resize="se"]').addEventListener('keydown',event=>keyboard(event,true));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&panel.open&&!document.querySelector('dialog:modal')){event.preventDefault();panel.close();}
  });
  panel.addEventListener('close',()=>{finish();if(panel.contains(document.activeElement)&&opener?.isConnected)opener.focus({preventScroll:true});});
  window.addEventListener('resize',()=>{finish();if(geometry){place(geometry);remember();}});
  return {open(){
    if(!geometry){const max=limits(),width=Math.min(560,max.width),height=Math.min(680,max.height);geometry={width,height,x:(window.innerWidth-width)/2,y:(window.innerHeight-height)/2};}
    place(geometry);
    if(!panel.open){opener=document.activeElement;panel.show();handle.focus({preventScroll:true});}
  }};
})();
