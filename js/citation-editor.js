/* Human-editable citation arrows; unrelated relationship records are preserved. */
Atlas.citationRecords=function(data){return data.documents.flatMap(source=>(source.relations||[]).flatMap((relation,index)=>relation.type==='cites'?[{source,index,relation}]:[]));};
Atlas.changeCitation=function(data,values,original=null){
  const A=Atlas,next=JSON.parse(JSON.stringify(data)),source=next.documents.find(d=>d.id===values.source),target=next.documents.find(d=>d.id===values.target);
  if(!source||!target)throw new Error('请选择引用方和被引用方。');if(source.id===target.id)throw new Error('引用方和被引用方不能是同一条目。');
  const checked=values.validation_status==='source_checked',quote=String(values.quote||'').trim(),locator=String(values.source_locator||'').trim(),url=String(values.source_url||'').trim();
  if(checked&&(!quote||!locator||!/^https?:\/\//i.test(url)))throw new Error('已核对的引用必须填写原文节选、条款／页码及 HTTP/HTTPS 来源网址。');
  let previous={};if(original){const oldSource=next.documents.find(d=>d.id===original.sourceId),old=oldSource?.relations?.[original.index];if(!old||old.type!=='cites'||JSON.stringify(old)!==JSON.stringify(original.relation))throw new Error('该引用已在别处修改，请重新打开编辑。');previous=old;oldSource.relations.splice(original.index,1);}
  const relation={...previous,target:target.id,type:'cites',quote,source_locator:locator,source_url:url,claim_basis:'explicit_source',validation_status:checked?'source_checked':'pending_source_review'};
  for(const key of ['relation_label','arrow_quote','short_locator','context_summary','context_summary_zh']){const value=String(values[key]||'').trim();if(value)relation[key]=value;else delete relation[key];}
  if(values.timeline_visible===false)relation.timeline_visible=false;else delete relation.timeline_visible;
  if((source.relations||[]).some(r=>r.type==='cites'&&r.target===relation.target&&r.quote===relation.quote&&r.source_locator===relation.source_locator))throw new Error('相同目标、节选和定位的引用已存在。');
  source.relations??=[];if(original?.sourceId===source.id)source.relations.splice(Math.min(original.index,source.relations.length),0,relation);else source.relations.push(relation);
  A.validate(next);return next;
};
Atlas.removeCitation=function(data,original){
  const A=Atlas,next=JSON.parse(JSON.stringify(data)),source=next.documents.find(d=>d.id===original.sourceId),relation=source?.relations?.[original.index];
  if(!relation||relation.type!=='cites'||JSON.stringify(relation)!==JSON.stringify(original.relation))throw new Error('该引用已修改，请重新打开后再移除。');
  source.relations.splice(original.index,1);A.validate(next);return next;
};
Atlas.mountCitationManager=function(root,{getData,onSave,onCancel,onFilterChange,sourceFilter='',report}){
  const A=Atlas,all=getData().documents,byId=new Map(all.map(d=>[d.id,d])),label=d=>`${d.year_label||d.year||'—'} · ${d.map_title||d.title}${d.title_zh?' / '+d.title_zh:''}`;
  let active=null;
  const button=(text,action,cls='outline-button')=>{const b=A.el('button',cls,text);b.type='button';b.onclick=action;return b;};
  const field=(name,title,value='',kind='input')=>{const wrap=A.el('label','editor-field',title),input=A.el(kind);input.name=name;input.setAttribute('aria-label',title);if(kind==='textarea')input.rows=3;else if(kind==='input')input.type='text';input.value=value;wrap.append(input);return {wrap,input};};
  const option=(select,value,title)=>{const o=A.el('option','',title);o.value=value;select.append(o);};
  const summary=A.el('p','small','箭头方向：先行文件 → 后续引用文件。节选取自后续文件。已核对且包含节选、定位和来源的关系可显示在 Timeline；待核对的关系也可以先保存。');root.append(summary);
  const toolbar=A.el('div','citation-manager-toolbar'),filter=field('citation-source-filter','按关联条目筛选','','select');option(filter.input,'','全部条目');for(const d of all)option(filter.input,d.id,label(d));filter.input.value=sourceFilter;filter.input.onchange=()=>onFilterChange(filter.input.value);toolbar.append(filter.wrap,button('＋ 新建引用箭头',()=>edit()));root.append(toolbar);
  const content=A.el('div','citation-manager-content');root.append(content);
  function edit(record=null){
    content.replaceChildren();toolbar.hidden=true;summary.hidden=true;active={record,inputs:{}};const form=A.el('form','editor-form citation-manager-form');form.noValidate=true;form.onsubmit=e=>e.preventDefault();
    const header=A.el('div','citation-manager-heading');header.append(A.el('h3','',record?'编辑引用箭头':'新建引用箭头'),A.el('span','small','选择两端条目，再填写作为依据的原文。'));form.append(header);
    const add=(name,title,value='',kind='input')=>{const item=field(name,title,value,kind);active.inputs[name]=item.input;form.append(item.wrap);return item.input;};
    const target=add('target','先行文件（箭头起点／被引用方）','','select'),source=add('source','后续文件（箭头终点／引用方）','','select');option(source,'','请选择后续引用文件');option(target,'','请选择先行被引文件');for(const d of all){option(source,d.id,label(d));option(target,d.id,label(d));}const related=A.citationRecords(getData()),seedAsTarget=sourceFilter&&related.some(r=>r.relation.target===sourceFilter)&&!related.some(r=>r.source.id===sourceFilter);source.value=record?.source.id||(seedAsTarget?'':sourceFilter);target.value=record?.relation.target||(seedAsTarget?sourceFilter:'');
    const direction=A.el('p','citation-direction-preview');form.append(direction);const updateDirection=()=>{const a=byId.get(source.value),b=byId.get(target.value);direction.textContent=(b?b.year+' '+(b.map_title||b.title):'先行文件')+' → '+(a?a.year+' '+(a.map_title||a.title):'后续引用文件');for(const o of target.options)o.disabled=!!o.value&&o.value===source.value;};updateDirection();
    const old=record?.relation||{},title=add('relation_label','箭头标题（可自定）',old.relation_label||''),quote=add('quote','原文段落／节选',old.quote||'','textarea');title.placeholder='例如：被后续宪章援引 / Invoked by later charter';quote.rows=4;quote.placeholder='粘贴后续引用文件中的原文；较长段落会在图上缩略，点击后可查看完整内容。';
    const locator=add('source_locator','出处定位（条款、段落或页码）',old.source_locator||'');locator.placeholder='例如：Principle 4, opening statement, p. 6';const url=add('source_url','原文来源网址',old.source_url||byId.get(source.value)?.source_url||'');url.placeholder='https://…（可附 #page=6）';
    const status=add('validation_status','依据状态','','select');option(status,'pending_source_review','待核对原文');option(status,'source_checked','已核对原文');status.value=old.validation_status==='source_checked'?'source_checked':'pending_source_review';
    const visibleWrap=A.el('label','citation-visible-option'),visible=A.el('input');visible.type='checkbox';visible.name='timeline_visible';visible.checked=old.timeline_visible!==false;active.inputs.timeline_visible=visible;visibleWrap.append(visible,document.createTextNode('在 Timeline 显示这条箭头'));form.append(visibleWrap);
    const note=A.el('p','citation-manager-note');form.append(note);const updateNote=()=>{note.textContent=status.value==='source_checked'?(visible.checked?'保存后将在 Timeline 显示；还需确保两端条目均符合当前筛选。':'此关系保留在数据库中，但不在 Timeline 显示。'):'待核对关系会保存，但暂不显示箭头。补齐依据并选择“已核对原文”后即可显示。';};status.onchange=updateNote;visible.onchange=updateNote;updateNote();
    source.onchange=()=>{if(target.value===source.value)target.value='';url.value=byId.get(source.value)?.source_url||'';status.value='pending_source_review';updateDirection();updateNote();};target.onchange=updateDirection;
    const extras=A.el('details','citation-manager-extras');extras.append(A.el('summary','','段落语境与图上显示（可选）'));const extraFields=A.el('div','citation-manager-extra-fields');for(const [name,text,kind]of [['arrow_quote','箭头短节选（留空则自动截取原文）','textarea'],['short_locator','图上简短定位','input'],['context_summary','段落语境说明（English）','textarea'],['context_summary_zh','段落语境说明（中文）','textarea']]){const item=field(name,text,old[name]||'',kind);active.inputs[name]=item.input;extraFields.append(item.wrap);}extras.append(extraFields);form.append(extras);
    const actions=A.el('div','editor-actions');actions.append(button('取消',onCancel),button('保存引用到草稿',()=>save(),'solid-button'));if(record)actions.append(button('移除这条引用',()=>remove(record),'text-button'));form.append(actions);content.append(form);
  }
  function descriptor(record){return {sourceId:record.source.id,index:record.index,relation:record.relation};}
  function save(){if(!active)return true;try{const values={};for(const [name,input]of Object.entries(active.inputs))values[name]=input.type==='checkbox'?input.checked:input.value;const next=A.changeCitation(getData(),values,active.record?descriptor(active.record):null);onSave(next);return true;}catch(err){report('无法保存引用：'+err.message,true);return false;}}
  function remove(record){try{onSave(A.removeCitation(getData(),descriptor(record)));}catch(err){report('无法移除引用：'+err.message,true);}}
  const records=A.citationRecords(getData()).filter(record=>!sourceFilter||record.source.id===sourceFilter||record.relation.target===sourceFilter);
  if(!records.length)content.append(A.el('p','citation-manager-empty','这里还没有引用箭头。点击“＋ 新建引用箭头”开始。'));
  for(const record of records){const r=record.relation,target=byId.get(r.target),card=A.el('article','citation-manager-card'),head=A.el('div','citation-manager-card-top');head.append(A.el('strong','',`${target?.year||''} ${target?.map_title||target?.title||r.target} → ${record.source.year} ${record.source.map_title||record.source.title}`),button('编辑',()=>edit(record)));card.append(head,A.el('span','citation-manager-badge',r.validation_status==='source_checked'?(r.timeline_visible===false?'已核对 · 已隐藏':'已核对 · 图中显示'):'待核对 · 暂不显示'));if(r.relation_label)card.append(A.el('p','citation-manager-card-label',r.relation_label));if(r.quote)card.append(A.el('blockquote','citation-manager-card-quote',r.quote));card.append(A.el('p','small',r.source_locator||'尚未填写出处定位'));content.append(card);}
  return {get editing(){return !!active;},save};
};
