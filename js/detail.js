Atlas.openDetail=function(id){
  const A=Atlas,d=A.byId.get(id);if(!d)return;A.hideTooltip();
  const root=document.querySelector('#detail-content');root.replaceChildren();
  const link=(label,url,cls='reading-resource')=>{const a=A.el('a',cls,label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
  const section=(host,title)=>{const s=A.el('section','reading-section');s.append(A.el('h3','',title));host.append(s);return s;};
  const fold=(host,title)=>{const f=A.el('details','reading-fold');f.append(A.el('summary','',title));const body=A.el('div','reading-fold-body');f.append(body);host.append(f);return body;};
  const paragraph=(host,value,cls='')=>{if(value)host.append(A.el('p',cls,value));};
  const metadata=(host,items)=>{const dl=A.el('dl','reading-metadata');for(const [label,value]of items){if(value&&A.text(value))dl.append(A.el('dt','',label),A.el('dd','',A.text(value)));}if(dl.childNodes.length)host.append(dl);};
  const header=A.el('header','reading-header'),identity=A.el('div','reading-identity'),category=A.el('span','reading-category',A.category(d));category.style.setProperty('--record-color',A.color(d));identity.append(category);if(d.year_label||d.year)identity.append(A.el('span','reading-year',d.year_label||d.year));header.append(identity);
  const title=A.el('h2','',d.title);title.id='detail-title';header.append(title);if(d.title_zh)header.append(A.el('p','reading-title-zh',d.title_zh));
  const authors=A.text(d.author),creator=[authors,d.organization&&d.organization!==authors?d.organization:''].filter(Boolean).join(' · ');paragraph(header,creator,'reading-creator');
  const resources=A.el('div','reading-resources');for(const source of A.sourceLinks(d))resources.append(link(source.label,source.url));
  if(d.notes_pdf){const note=A.el('a','reading-resource reading-resource-notes','✎ Annotated PDF / 批注');note.title=d.notes_pdf_name||'Annotated reading copy';note.target='_blank';note.rel='noopener noreferrer';note.setAttribute('aria-busy','true');resources.append(note);A.attachments.link(d).then(result=>{if(!note.isConnected)return;note.removeAttribute('aria-busy');if(result)note.href=result.url;else{note.textContent='Annotated PDF unavailable';note.setAttribute('aria-disabled','true');}});}
  if(resources.childNodes.length)header.append(resources);root.append(header);
  const tabs=A.el('div','reading-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Document sections');root.append(tabs);
  const pages={},buttons=[];for(const [key,label]of [['overview','Overview / 概览'],['evidence','Evidence / 依据'],['notes','My notes / 笔记'],['record','Record / 资料']]){const button=A.el('button','',label);button.type='button';button.id='reading-tab-'+key;button.setAttribute('role','tab');button.setAttribute('aria-controls','reading-page-'+key);const page=A.el('div','reading-page');page.id='reading-page-'+key;page.setAttribute('role','tabpanel');page.setAttribute('aria-labelledby',button.id);page.tabIndex=0;pages[key]=page;buttons.push({key,button});tabs.append(button);root.append(page);}
  const activate=key=>{for(const item of buttons){const active=item.key===key;item.button.setAttribute('aria-selected',String(active));item.button.tabIndex=active?0:-1;pages[item.key].hidden=!active;}root.scrollTop=0;};
  buttons.forEach(({key,button},i)=>{button.onclick=()=>activate(key);button.onkeydown=event=>{let next;if(event.key==='ArrowRight')next=(i+1)%buttons.length;if(event.key==='ArrowLeft')next=(i+buttons.length-1)%buttons.length;if(event.key==='Home')next=0;if(event.key==='End')next=buttons.length-1;if(next!==undefined){event.preventDefault();activate(buttons[next].key);buttons[next].button.focus();}};});
  // The first view is a reading summary, with research judgements clearly grouped.
  const overview=pages.overview;
  if(d.preview)paragraph(overview,d.preview,'reading-lead');if(d.summary&&d.summary!==d.preview){const s=section(overview,'In brief / 内容概览');paragraph(s,d.summary);}
  const insights=[['Theoretical contribution / 理论贡献',d.paradigm_shift],['Why it matters / 研究意义',d.significance],['For my thesis / 论文关联',d.phd_relevance]].filter(([,value])=>value);
  if(insights.length){const s=section(overview,'Research notes / 研究关联');for(const [label,value]of insights){const item=A.el('div','reading-insight');item.append(A.el('h4','',label));paragraph(item,value);s.append(item);}}
  const concepts=[...new Set(A.arr(d.concepts))].filter(Boolean);if(concepts.length){const tags=A.el('div','reading-tags');for(const concept of concepts)tags.append(A.el('span','',concept));overview.append(tags);}
  if(!overview.childNodes.length)paragraph(overview,'A summary has not been added yet.','reading-empty');
  // Excerpts and attributed claims remain separate from the researcher's reflections.
  const evidence=pages.evidence;
  if(d.excerpts?.length){const s=section(evidence,'Source passages / 原文摘录');for(const e of d.excerpts){const quote=A.el('blockquote','reading-quote',e.text||'');quote.append(A.el('cite','',[e.source,e.location].filter(Boolean).join(' · ')));s.append(quote);}}
  if(d.claims?.length){const s=section(evidence,'Key arguments / 文献主张');for(const c of d.claims){const card=A.el('article','reading-claim');card.append(A.el('span','reading-caption',c.claim_basis==='researcher_inference'?'Researcher interpretation / 研究者解读':'Source argument / 来源主张'));paragraph(card,c.claim_paraphrase,'reading-claim-text');paragraph(card,[c.claim_subject,c.source_locator].filter(Boolean).join(' · '),'reading-caption');if(c.source_context)paragraph(card,({abstract:'Abstract',official_description:'Official overview',publisher_description:'Publisher overview',relevant_passage:'Selected passage'})[c.source_context]||c.source_context,'reading-caption');const url=A.safeURL(c.source_url);if(url)card.append(link('Source ↗',url,'reading-inline-link'));const reflections=[['Design implications / 设计思考',c.researcher_implication],['Evaluation ideas / 评价设想',c.evaluation_proposal]].filter(([,value])=>value);if(reflections.length){const body=fold(card,'Research reflections / 研究者思考');for(const [label,value]of reflections){body.append(A.el('h4','',label));paragraph(body,value);}}s.append(card);}}
  const citations=[];for(const source of A.byId.values())for(const r of source.relations||[]){if(r.type!=='cites'||(source.id!==id&&r.target!==id))continue;const target=A.byId.get(r.target);if(target)citations.push({source,target,relation:r});}
  if(citations.length){const s=section(evidence,'Citation connections / 引用关系');for(const edge of citations){const r=edge.relation,card=A.el('article','reading-citation');paragraph(card,`${edge.target.year||''} ${edge.target.map_title||edge.target.title} → ${edge.source.year||''} ${edge.source.map_title||edge.source.title}`,'reading-connection-title');if(r.quote){const q=A.el('blockquote','reading-quote reading-quote-short',r.quote);card.append(q);}paragraph(card,r.source_locator,'reading-caption');if(r.validation_status!=='source_checked')paragraph(card,'Reading note · To check','reading-caption');const b=A.el('button','reading-inline-link','Read passage / 查看依据 ↗');b.type='button';b.onclick=()=>A.openCitationEvidence(edge);card.append(b);s.append(card);}}
  if(!evidence.childNodes.length)paragraph(evidence,'No source passages or arguments have been added yet.','reading-empty');
  const notes=pages.notes;if(d.my_notes){const s=section(notes,'My reading notes / 我的阅读笔记');paragraph(s,d.my_notes);}
  if(d.annotations?.length){const s=section(notes,'Annotations / 批注摘记');for(const a of d.annotations){const item=A.el('div','reading-annotation');paragraph(item,a.text);if(a.page!=null)paragraph(item,'p. '+a.page,'reading-caption');s.append(item);}}
  if(d.notes_pdf){const s=section(notes,'Annotated reading copy / 批注文件');paragraph(s,d.notes_pdf_name,'reading-caption');const a=A.el('a','reading-resource reading-resource-notes','Open annotated PDF ↗');a.target='_blank';a.rel='noopener noreferrer';s.append(a);A.attachments.link(d).then(result=>{if(a.isConnected&&result)a.href=result.url;});}if(!d.notes_pdf&&!d.my_notes&&!d.annotations?.length)paragraph(notes,'Add reading notes in Manage content → Entries → Edit.','reading-empty');
  const record=pages.record,readingStages={not_assessed:'To read',metadata_checked:'Metadata checked',relevant_passages_checked:'Selected passages read',full_text_read:'Full text read',coded:'Coded'};
  const bibliographic=section(record,'Publication / 文献信息');metadata(bibliographic,[['Type',d.type],['Document form',d.document_nature],['Published as',d.publication_format],['Organisation',d.organization],['Recognition',d.recognition_basis],['Practice date',d.practice_date]]);if(d.bibliography)metadata(bibliographic,Object.entries(d.bibliography));if(bibliographic.children.length===1)bibliographic.remove();
  const coding=fold(record,'Research classification / 研究分类');metadata(coding,[['Material kind',d.record_kind],['Reading stage',readingStages[d.reading_status]||d.reading_status],['Heritage',d.heritage_conception],['Interpretation',d.interpretation_model],['Public role',d.public_role],['Authority',d.authority_structure],['Narrative',d.narrative_structure],['Themes',d.themes],['Interpretive media',d.interpretive_media],['Concept roles',A.arr(d.concept_roles).map(v=>A.researchLabels?.[v]||v)],['Thesis chapters',d.chapter_use],['Authenticity',d.authenticity_focus],['Context',d.context_dimensions],['Participation',d.participation_stage],['Public activities',d.interpretive_operations],['Outcome dimensions',d.outcome_constructs]]);if(!coding.childNodes.length)coding.parentElement.remove();
  const memberships=A.topicMemberships(d);if(memberships.length){const s=fold(record,'Theme assignments / 主题归属');for(const m of memberships){const body=fold(s,m.topic);paragraph(body,m.status==='source'?'Source checked':'Reading note','reading-caption');paragraph(body,m.evidence);paragraph(body,m.location,'reading-caption');const url=A.safeURL(m.source_url);if(url)body.append(link('Source ↗',url,'reading-inline-link'));}}
  const settings=A.interpretiveSettings(d).filter(value=>value!=='Unspecified / pending review');if(settings.length){const body=fold(record,'Interpretive setting / 阐释情境');paragraph(body,A.text(settings));if(d.interpretive_setting_evidence){const e=d.interpretive_setting_evidence;paragraph(body,e.status==='source'?'Source checked':'Reading note','reading-caption');paragraph(body,e.evidence);paragraph(body,e.location,'reading-caption');const url=A.safeURL(e.source_url);if(url)body.append(link('Source ↗',url,'reading-inline-link'));}}
  const related=[];for(const r of d.relations||[])if(r.type!=='cites'&&A.byId.has(r.target))related.push({other:A.byId.get(r.target),r});for(const n of A.byId.values())for(const r of n.relations||[])if(r.type!=='cites'&&r.target===id)related.push({other:n,r});if(related.length){const body=fold(record,'Other connections / 其他关联');for(const {other,r}of related){const b=A.el('button','reading-related',other.title);b.type='button';b.onclick=()=>A.openDetail(other.id);body.append(b);if(r.evidence){const more=fold(body,r.type);paragraph(more,r.evidence);}}}
  if(d.importance_note||d.coding_status||d.date_basis||d.legacy_coding){const body=fold(record,'Catalogue notes / 编目记录');metadata(body,[['Contribution level',d.importance?d.importance+' / 3':''],['Date basis',d.date_basis],['Coding note',d.coding_status],['Contribution note',d.importance_note]]);if(d.legacy_coding){metadata(body,[['Archived media',d.legacy_coding.media],['Archived activities',d.legacy_coding.public_actions]]);paragraph(body,d.legacy_coding.note,'reading-caption');}}
  if(!record.childNodes.length)paragraph(record,'Publication details have not been added yet.','reading-empty');activate('overview');A.detailCard.open();root.scrollTop=0;
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
    if(!geometry){const max=limits(),width=Math.min(640,max.width),height=Math.min(780,max.height);geometry={width,height,x:(window.innerWidth-width)/2,y:(window.innerHeight-height)/2};}
    place(geometry);
    if(!panel.open){opener=document.activeElement;panel.show();handle.focus({preventScroll:true});}
  }};
})();
