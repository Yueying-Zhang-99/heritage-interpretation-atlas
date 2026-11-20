/* Timeline arrows represent recorded, source-checked citations, not assumed influence. */
Atlas.timelineCitations=function(rows){
  const visible=new Map(rows.map(d=>[d.id,d])),result=[];
  for(const source of rows)for(const relation of source.relations||[]){
    if(relation.timeline_visible===false||relation.type!=='cites'||relation.claim_basis!=='explicit_source'||relation.validation_status!=='source_checked'||!relation.quote||!relation.source_locator||!/^https?:\/\//i.test(relation.source_url||''))continue;
    const target=visible.get(relation.target);if(!target||source.id===target.id)continue;
    result.push({source,target,relation,key:source.id+'--'+target.id});
  }
  return result;
};
Atlas.citationDisplayDirection=edge=>({from:edge.target,to:edge.source});
Atlas.timelineRelationControls=function(host,rows){
  const A=Atlas,edges=A.timelineCitations(rows);if(!edges.length)return null;
  const controls=A.el('div','timeline-relation-controls');controls.setAttribute('role','group');controls.setAttribute('aria-label','Documented citations');
  for(const [key,label]of [['citationArrows','Citations ('+edges.length+')'],['citationQuotes','Excerpts']]){
    const button=A.el('button','timeline-relation-toggle',label);button.type='button';button.setAttribute('aria-pressed',String(A.state[key]!==false));button.title=key==='citationArrows'?'箭头由被援引的先行文件指向后续引用文件':'在箭头旁显示原文短节选与定位';button.onclick=()=>{A.state[key]=A.state[key]===false;A.render();};controls.append(button);
  }
  controls.append(A.el('span','timeline-relation-key','→ cited by / 被援引'));host.append(controls);return controls;
};
Atlas.citationQuoteLines=function(value,max=36,limit=3){let rest=String(value||'').replace(/\s+/g,' ').trim(),lines=[];if(/[\u2e80-\u9fff]/.test(rest))max=Math.min(max,18);while(rest&&lines.length<limit){const chars=Array.from(rest);if(chars.length<=max){lines.push(rest);rest='';break;}let cut=chars.slice(0,max+1).lastIndexOf(' ');if(cut<max*.5)cut=max;lines.push(chars.slice(0,cut).join('').trim());rest=chars.slice(cut).join('').trim();}if(rest&&lines.length)lines[lines.length-1]+='…';return lines;};
Atlas.citationCurve=function(a,b,bend=60){
  const control={x:(a.x+b.x)/2,y:(a.y+b.y)/2+bend};
  const trim=(point,distance)=>{const dx=control.x-point.x,dy=control.y-point.y,length=Math.hypot(dx,dy)||1;return {x:point.x+dx/length*distance,y:point.y+dy/length*distance};};
  const start=trim(a,(a.r||6)+4),end=trim(b,(b.r||6)+7);
  return {start,end,control,path:`M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`,point(t){const u=1-t;return {x:u*u*start.x+2*u*t*control.x+t*t*end.x,y:u*u*start.y+2*u*t*control.y+t*t*end.y};}};
};
Atlas.citationOverlap=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
Atlas.citationLabelPosition=function(route,box,bounds,obstacles){
  const A=Atlas,candidates=[];
  const midpoint=route.point(.5),add=(x,y)=>{x=Math.max(8,Math.min(bounds.width-box.width-8,x));y=Math.max(8,Math.min(bounds.height-box.height-8,y));const candidate={x,y,...box};candidate.cost=obstacles.reduce((sum,o)=>sum+A.citationOverlap(candidate,o),0)*500+Math.hypot(x+box.width/2-midpoint.x,y+box.height/2-midpoint.y);candidates.push(candidate);};
  for(const t of [.5,.35,.65])for(const dy of [-18,18,-60,60,-110,110]){const p=route.point(t);add(p.x-box.width/2,p.y-box.height/2+dy);}
  // A quiet area elsewhere in the map is preferable to covering a document label.
  for(let y=8;y<=bounds.height-box.height-8;y+=Math.max(18,box.height/3))for(let x=8;x<=bounds.width-box.width-8;x+=Math.max(24,box.width/5))add(x,y);
  return candidates.sort((a,b)=>a.cost-b.cost)[0];
};
Atlas.openCitationEvidence=function(edge){
  const A=Atlas,r=edge.relation;A.hideTooltip();document.querySelector('.flow-theme-tooltip')?.setAttribute('hidden','');
  let dialog=document.querySelector('#citation-evidence-dialog');if(!dialog){dialog=A.el('dialog','citation-evidence-dialog');dialog.id='citation-evidence-dialog';dialog.setAttribute('aria-labelledby','citation-evidence-title');document.body.append(dialog);}
  dialog.replaceChildren();const header=A.el('div','citation-evidence-header'),close=A.el('button','close-button','×');close.type='button';close.setAttribute('aria-label','关闭引用依据');close.onclick=()=>dialog.close();header.append(A.el('span','eyebrow','DOCUMENTED CITATION / 原文明示引用'),close);dialog.append(header);
  const title=A.el('h2','',`${edge.target.map_title||edge.target.title} → ${edge.source.map_title||edge.source.title}`);title.id='citation-evidence-title';dialog.append(title,A.el('p','small',`${edge.target.year} → ${edge.source.year} · ${r.relation_label||'Cited by the later document'} · 先行文件 → 后续引用文件`),A.el('h3','','Excerpt from the later document / 后续文件原文'),A.el('blockquote','citation-evidence-quote',r.quote),A.el('p','citation-evidence-locator',r.source_locator));
  if(r.context_summary)dialog.append(A.el('h3','','Paragraph context / 段落语境释义'),A.el('p','',r.context_summary));if(r.context_summary_zh)dialog.append(A.el('p','small',r.context_summary_zh));
  dialog.append(A.el('p','small','引文仅为定位短节选；段落语境为研究者释义。明示引用不自动构成已证明的因果影响。'));
  const actions=A.el('div','citation-evidence-actions'),url=A.safeURL(r.source_url);if(url){const source=A.el('a','outline-button','Read source paragraph ↗');source.href=url;source.target='_blank';source.rel='noopener noreferrer';actions.append(source);}for(const [label,id]of [['Open cited record',edge.target.id],['Open citing record',edge.source.id]]){const button=A.el('button','text-button',label);button.type='button';button.onclick=()=>{dialog.close();A.openDetail(id);};actions.append(button);}dialog.append(actions);dialog.showModal();
};
Atlas.drawTimelineCitations=function({svg,rows,nodes,width,height,scale=1,obstacles=[],before=null}){
  const A=Atlas;if(A.state.citationArrows===false)return;const edges=A.timelineCitations(rows),positions=new Map(nodes.map(n=>[n.d.id,n]));if(!edges.length)return;
  const NS='http://www.w3.org/2000/svg',el=(tag,attrs={})=>{const node=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);return node;};
  const defs=el('defs'),marker=el('marker',{id:'timeline-citation-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:8/scale,markerHeight:8/scale,orient:'auto',markerUnits:'userSpaceOnUse'});marker.append(el('path',{d:'M0 0 L10 5 L0 10 Z',fill:'#526d91'}));defs.append(marker);svg.append(defs);
  const paths=el('g',{class:'timeline-citation-paths'}),labels=el('g',{class:'timeline-citation-labels'});svg.insertBefore(paths,before);svg.append(labels);
  const occupied=[...obstacles,...nodes.map(n=>({x:n.x-18,y:n.y-18,width:36,height:45}))];
  for(const edge of edges){const {from,to}=A.citationDisplayDirection(edge),a=positions.get(from.id),b=positions.get(to.id);if(!a||!b)continue;
    const alternatives=[-50,50,-110,110,-170,170].map(bend=>A.citationCurve(a,b,bend/scale));const route=alternatives.map(curve=>({curve,cost:Array.from({length:17},(_,i)=>curve.point((i+1)/18)).reduce((sum,p)=>sum+obstacles.filter(o=>p.x>o.x&&p.x<o.x+o.width&&p.y>o.y&&p.y<o.y+o.height).length,0)})).sort((x,y)=>x.cost-y.cost)[0].curve;
    const group=el('g',{class:'timeline-citation-edge','data-source':edge.source.id,'data-target':edge.target.id,'data-from':from.id,'data-to':to.id,role:'button',tabindex:0,'aria-label':`${from.year} ${from.map_title||from.title} → ${to.year} ${to.map_title||to.title}. Cited by the later document. ${edge.relation.quote}. ${edge.relation.source_locator}. Read citation evidence.`});
    const line=el('path',{d:route.path,class:'timeline-citation-line','marker-end':'url(#timeline-citation-arrow)','vector-effect':'non-scaling-stroke'}),hit=el('path',{d:route.path,class:'timeline-citation-hit','vector-effect':'non-scaling-stroke'});group.append(line,hit);paths.append(group);
    const activate=event=>{event.stopPropagation();A.openCitationEvidence(edge);};group.addEventListener('click',activate);group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(event);}});
    if(A.state.citationQuotes===false)continue;
    const lines=A.citationQuoteLines('“'+(edge.relation.arrow_quote||edge.relation.quote)+'”'),box={width:Math.min(220,width*scale-20)/scale,height:(lines.length*14+32)/scale};const place=A.citationLabelPosition(route,box,{width,height:height-30/scale},occupied);occupied.push(place);
    const quote=el('g',{class:'timeline-citation-label','data-target':edge.target.id,transform:`translate(${place.x},${place.y})`});quote.append(el('rect',{width:box.width,height:box.height,rx:5/scale}));
    const heading=el('text',{x:9/scale,y:15/scale,class:'timeline-citation-kind','font-size':10/scale});heading.textContent=edge.relation.relation_label||'Cited by later document';quote.append(heading);
    lines.forEach((line,i)=>{const text=el('text',{x:9/scale,y:(30+i*14)/scale,'font-size':11/scale,class:'timeline-citation-excerpt'});text.textContent=line;quote.append(text);});
    const locator=el('text',{x:9/scale,y:(box.height*scale-7)/scale,'font-size':9/scale,class:'timeline-citation-locator'});locator.textContent=edge.relation.short_locator||edge.relation.source_locator;quote.append(locator);
    const midpoint=route.point(.5),leader=el('path',{d:`M${midpoint.x},${midpoint.y} L${place.x+box.width/2},${place.y+box.height/2}`,class:'timeline-citation-leader','vector-effect':'non-scaling-stroke'});labels.append(leader,quote);for(const text of quote.querySelectorAll('text')){let value=text.textContent;while(value.length>1&&text.getComputedTextLength()>box.width-18/scale){value=value.slice(0,-1);text.textContent=value+'…';}}quote.addEventListener('click',activate);
    group.addEventListener('mouseenter',()=>quote.classList.add('is-active'));group.addEventListener('mouseleave',()=>quote.classList.remove('is-active'));group.addEventListener('focus',()=>quote.classList.add('is-active'));group.addEventListener('blur',()=>quote.classList.remove('is-active'));
  }
};
