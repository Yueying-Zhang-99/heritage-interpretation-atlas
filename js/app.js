(async()=>{
  'use strict';
  const A=Atlas,$=s=>document.querySelector(s),state=A.state;
  const viewInfo={timeline:['01 / TOPIC × TIME MAP','Ideas and documents across time','X: year · Y: editable working topic · Size: provisional contribution · Dashed: reading pending.'],cluster:['02 / CONCEPTUAL CLUSTERS','Shared concepts','Documents with multiple codes appear in each relevant group.'],network:['03 / RELATIONAL READING','Document relationships','Lines show provisional research links; open each record for evidence.'],matrix:['04 / RESEARCH LIBRARY','Research library','Sort columns or open a record to read source notes.']};
  A.render=()=>{
    A.hideTooltip();A.visible=A.filtered();$('#chart').replaceChildren();$('#chart').classList.remove('timeline-chart');
    const info=viewInfo[state.view];$('#view-number').textContent='VIEW '+info[0];$('#view-title').textContent=info[1];$('#view-hint').textContent=info[2];$('#result-count').textContent=`${A.visible.length} / ${A.records.length} entries`;
    document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===state.view;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
    $('#cluster-control').hidden=state.view!=='cluster';$('#network-control').hidden=state.view!=='network';
    const count=Object.values(state.filters).reduce((n,set)=>n+set.size,0)+(state.minYear!==''?1:0)+(state.maxYear!==''?1:0);$('#filter-count').textContent=count||'＋';
    const legend=$('#legend');legend.replaceChildren();for(const [value,color]of Object.entries(A.typeColors)){const item=A.el('span','legend-item'),swatch=A.el('i','swatch');swatch.style.setProperty('--swatch',color);item.append(swatch,document.createTextNode(value));legend.append(item);}legend.append(A.el('span','legend-note','Size: provisional contribution · Dashed: reading pending'));
    if(!A.visible.length){const empty=A.el('div','empty-state');empty.append(A.el('h3','','No matching entries'),A.el('p','','没有符合条件的条目，请调整搜索或筛选。'));const reset=A.el('button','text-button','清空搜索与筛选');reset.onclick=A.reset;empty.append(reset);$('#chart').append(empty);return;}
    if(typeof d3==='undefined'&&['cluster','network'].includes(state.view)){$('#chart').append(A.el('p','error','D3 unavailable; Timeline and Library remain available.'));return;}
    A[state.view](A.visible);
  };
  A.reset=()=>{Object.assign(state,{query:'',filters:{},minYear:'',maxYear:'',lens:'stream',cluster:'paradigm',relation:'',sort:'year',direction:1});$('#search').value='';$('#cluster-by').value='paradigm';$('#relation-type').value='';A.buildFilters();A.render();};
  A.buildFilters=()=>{
    const root=$('#filter-fields');root.replaceChildren();const year=A.el('fieldset');year.append(A.el('legend','','Year / 年份'));const inputs=A.el('div','year-fields');for(const [key,label]of [['minYear','起始年份'],['maxYear','结束年份']]){const l=A.el('label','',label),input=A.el('input');input.type='number';input.min=0;input.max=9999;input.value=state[key];input.placeholder=key==='minYear'?'1930':String(new Date().getFullYear());input.oninput=()=>{state[key]=input.value;A.render();};l.append(input);inputs.append(l);}year.append(inputs);root.append(year);
    const fields={type:'Document Type',paradigm:'Paradigm',themes:'Theme',concepts:'Key Concepts',heritage_conception:'Heritage Conception',interpretation_model:'Interpretation Model',authority_structure:'Authority',public_role:'Public Role',narrative_structure:'Narrative',media:'Media',public_actions:'Public Actions'};
    for(const [key,label]of Object.entries(fields)){const group=A.el('fieldset');group.append(A.el('legend','',label));const values=[...new Set([...A.arr(A.data.vocabulary[key]),...A.categories(key)])].sort();for(const value of values){const l=A.el('label','check-option'),input=A.el('input');input.type='checkbox';input.checked=state.filters[key]?.has(String(value))||false;input.onchange=()=>{state.filters[key]??=new Set();input.checked?state.filters[key].add(String(value)):state.filters[key].delete(String(value));A.render();};l.append(input,document.createTextNode(String(value)));group.append(l);}root.append(group);}
  };
  A.load=(raw,source)=>{A.setData(raw);A.reset();$('#data-status').classList.remove('error');$('#data-status').textContent=`${source} · ${A.data.meta.is_sample?'示例数据库：摘要、编码与关系待原文校核。':'已加载知识库。'}`;};
  for(const [key,label]of Object.entries(A.fields)){const o=A.el('option','',label);o.value=key;$('#cluster-by').append(o);}
  for(const type of A.relationTypes){const o=A.el('option','',type);o.value=type;$('#relation-type').append(o);}
  $('#cluster-by').onchange=e=>{state.cluster=e.target.value;A.render();};$('#relation-type').onchange=e=>{state.relation=e.target.value;A.render();};
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;A.render();});
  $('#search').oninput=e=>{state.query=e.target.value;A.render();};$('#reset').onclick=A.reset;
  $('#filters-button').onclick=()=>{$('#filter-dialog').showModal();$('#filters-button').setAttribute('aria-expanded','true');};
  $('#filter-dialog').addEventListener('close',()=>$('#filters-button').setAttribute('aria-expanded','false'));
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
  $('#clear-filters').onclick=()=>{state.filters={};state.minYear='';state.maxYear='';A.buildFilters();A.render();};
  $('#json-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const raw=JSON.parse(await f.text());A.load(raw,`本地文件：${f.name}`);A.editor.imported();}catch(err){$('#data-status').textContent='未替换当前数据：'+err.message;$('#data-status').classList.add('error');}e.target.value='';};
  try{if(location.protocol==='file:'){A.load(window.ATLAS_SNAPSHOT,'离线预览快照 · 修改 JSON 后请点“打开本地 JSON”');}else{const response=await fetch('data/knowledge.json',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);A.load(await response.json(),'knowledge.json');}}
  catch(err){$('#data-status').textContent='加载失败：'+err.message+'。请检查 JSON 或选择本地文件。';$('#data-status').classList.add('error');$('#chart').append(A.el('div','empty-state','知识库尚未加载；可通过右下方打开本地 JSON。'));}
  A.editor.init();A.editor.restore();
  // Optional progressive enhancement; ordinary browsers use the visible controls.
  if(document.modelContext?.registerTool){try{await document.modelContext.registerTool({name:'search_heritage_atlas',description:'Search the atlas and update its visible results.',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(typeof input?.query!=='string')throw new Error('query must be a string');state.query=input.query;$('#search').value=input.query;A.render();return {entries:A.visible.map(({id,title,year})=>({id,title,year}))};}});}catch(err){console.info('Optional atlas tool unavailable:',err.message);}}
})();
