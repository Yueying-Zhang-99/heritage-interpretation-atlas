/* Shared state and data helpers. No build step, ES modules or server required. */
window.Atlas = (() => {
  const streams={A:{name:'Heritage Paradigm',zh:'遗产对象观与保护范式',color:'#a1813e'},B:{name:'Interpretation Paradigm',zh:'遗产阐释理论',color:'#6f7950'},C:{name:'Participatory / Plural',zh:'参与式与多元叙事',color:'#a55f48'}};
  const flowTopics=['Conservation & values','Interpretation & experience','Participation & plural voices','Heritage visitation & tourism','Digital methods'];
  const fields={topic_memberships:'Flow themes',interpretive_setting:'Interpretive setting',document_nature:'Document nature',paradigm:'Paradigm',themes:'Theme',public_role:'Public Role',narrative_structure:'Narrative',heritage_conception:'Heritage Conception',media:'Media / Technology'};
  const lenses=[['stream','Heritage Values'],['interpretation_model','Interpretation'],['public_role','Public Role'],['narrative_structure','Narrative'],['media','Technology']];
  const palette=['#a1813e','#6f7950','#a55f48','#586f70','#8b6a72','#6e6555','#8d8457','#59724c','#af725b','#616774','#967845'];
  const relationTypes=['influences','extends','critiques','related_to','supports','shifts_toward'];
  const state={view:'timeline',timelineMode:'flow',lens:'stream',cluster:'topic_memberships',query:'',filters:{},minYear:'',maxYear:'',relation:'',sort:'year',direction:1,dotScale:1};
  const A={streams,fields,lenses,palette,relationTypes,flowTopics,state,data:null,records:[],nodes:[],byId:new Map(),visible:[],sim:null};
  A.arr=v=>v==null||v===''?[]:Array.isArray(v)?v:[v];
  A.text=v=>A.arr(v).join(' · ');
  A.topicMemberships=d=>Array.isArray(d.topic_memberships)?d.topic_memberships:d.timeline_topic?[{topic:d.timeline_topic,status:'provisional',evidence:'沿用原有 Timeline 工作分类；多主题编码待核对。'}]:[];
  A.interpretiveSettings=d=>A.arr(d.interpretive_setting).length?A.arr(d.interpretive_setting):['Unspecified / pending review'];
  A.values=(d,key)=>key==='topic_memberships'?A.topicMemberships(d).map(m=>m.topic):key==='interpretive_setting'?A.interpretiveSettings(d):A.arr(d[key]);
  A.el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  A.validate=raw=>{
    const data=Array.isArray(raw)?{documents:raw,nodes:[],meta:{},vocabulary:{}}:raw;
    if(!data||!Array.isArray(data.documents))throw new Error('数据必须是条目数组，或包含 documents 数组的对象。');
    if(data.nodes!=null&&!Array.isArray(data.nodes))throw new Error('nodes 必须是数组。');
    const ids=new Set();
    for(const [index,d] of [...data.documents,...(data.nodes||[])].entries()){
      if(!d||typeof d.id!=='string'||!d.id.trim()||typeof d.title!=='string'||!d.title.trim())throw new Error(`第 ${index+1} 条缺少有效的 id 或 title。`);
      if(ids.has(d.id))throw new Error(`重复 id：${d.id}`);ids.add(d.id);
      if(d.node_type!=null&&!['document','person','concept'].includes(d.node_type))throw new Error(`${d.id} 的 node_type 必须是 document、person 或 concept。`);
      if(data.documents.includes(d)&&(d.year==null||d.year===''||!Number.isInteger(Number(d.year))||Number(d.year)<0||Number(d.year)>9999))throw new Error(`${d.id} 的 year 必须为有效整数。`);
      if(d.relations!=null&&!Array.isArray(d.relations))throw new Error(`${d.id} 的 relations 必须为数组。`);
      if(d.annotations!=null&&!Array.isArray(d.annotations))throw new Error(`${d.id} 的 annotations 必须为数组。`);
      if(d.excerpts!=null&&(!Array.isArray(d.excerpts)||d.excerpts.some(e=>!e||typeof e.text!=='string'||typeof e.source!=='string')))throw new Error(`${d.id} 的 excerpts 必须为包含 text 和 source 的数组。`);
      if(d.document_nature!=null&&(!Array.isArray(d.document_nature)||d.document_nature.some(v=>typeof v!=='string'||!v.trim())||new Set(d.document_nature).size!==d.document_nature.length))throw new Error(`${d.id} 的文件性质必须为不重复的非空文字标签数组。`);
      if(d.interpretive_setting!=null&&(!Array.isArray(d.interpretive_setting)||d.interpretive_setting.some(v=>typeof v!=='string'||!v.trim())||new Set(d.interpretive_setting).size!==d.interpretive_setting.length))throw new Error(`${d.id} 的阐释情境必须为不重复的非空文字标签数组。`);
      if(d.interpretive_setting_evidence!=null){const e=d.interpretive_setting_evidence;if(!e||!['source','provisional'].includes(e.status)||typeof e.evidence!=='string'||!e.evidence.trim())throw new Error(`${d.id} 的阐释情境需填写有效依据和状态。`);if(e.status==='source'&&(typeof e.source_url!=='string'||!/^https?:\/\//i.test(e.source_url)||typeof e.location!=='string'||!e.location.trim()))throw new Error(`${d.id} 已核对的阐释情境需填写来源和位置。`);}
      if(d.timeline_topic!=null&&!flowTopics.includes(d.timeline_topic))throw new Error(`${d.id} 的 timeline_topic 无效。`);
      if(d.topic_memberships!=null){
        if(!Array.isArray(d.topic_memberships))throw new Error(`${d.id} 的 topic_memberships 必须是数组。`);
        const topics=new Set();
        for(const m of d.topic_memberships){if(!m||!flowTopics.includes(m.topic)||!['source','provisional'].includes(m.status)||typeof m.evidence!=='string'||!m.evidence.trim())throw new Error(`${d.id} 的主题归属需包含有效 topic、status 和 evidence。`);if(topics.has(m.topic))throw new Error(`${d.id} 的主题归属重复。`);topics.add(m.topic);if(m.status==='source'&&(typeof m.source_url!=='string'||!/^https?:\/\//i.test(m.source_url)||typeof m.location!=='string'||!m.location.trim()))throw new Error(`${d.id} 已核对的主题归属需填写来源和位置（HTTP/HTTPS网址及条款或页码）。`);}
        if(data.documents.includes(d)&&(!topics.size||!topics.has(d.timeline_topic)))throw new Error(`${d.id} 的主题归属必须包含 Bands 主分类。`);
      }
      if(d.display_category!=null&&!['Charter / Policy','Theory / Book','Research Paper','Research Topic','Heritage Practice'].includes(d.display_category))throw new Error(`${d.id} 的 display_category 无效。`);
      if(d.importance!=null&&![1,2,3].includes(Number(d.importance)))throw new Error(`${d.id} 的 importance 必须为 1、2 或 3。`);
      if(d.annotations?.some(a=>!a||typeof a!=='object'))throw new Error(`${d.id} 包含无效标注。`);
      for(const r of d.relations||[])if(!r||typeof r.target!=='string'||!relationTypes.includes(r.type))throw new Error(`${d.id} 包含无效关系。`);
    }
    for(const d of [...data.documents,...(data.nodes||[])])for(const r of d.relations||[])if(!ids.has(r.target))throw new Error(`${d.id} 的关系目标不存在：${r.target}`);
    return {...data,meta:data.meta||{},nodes:data.nodes||[],vocabulary:data.vocabulary||{}};
  };
  A.setData=raw=>{const data=A.validate(raw);A.data=data;A.records=data.documents.map(d=>({...d,year:Number(d.year),node_type:d.node_type||'document'}));A.nodes=data.nodes.map(d=>({...d,node_type:d.node_type||'concept'}));A.byId=new Map([...A.records,...A.nodes].map(d=>[d.id,d]));};
  A.filtered=()=>A.records.filter(d=>{
    if(state.query&&!JSON.stringify(d).toLocaleLowerCase().includes(state.query.toLocaleLowerCase().trim()))return false;
    if(state.minYear!==''&&d.year<Number(state.minYear)||state.maxYear!==''&&d.year>Number(state.maxYear))return false;
    return Object.entries(state.filters).every(([key,values])=>{if(!values.size)return true;const assigned=A.values(d,key);return assigned.some(x=>values.has(String(x)))||(key==='interpretive_setting'&&assigned.includes('Both')&&(values.has('On-site')||values.has('Off-site')));});
  });
  A.categories=key=>key==='stream'?Object.keys(streams):[...new Set(A.records.flatMap(d=>A.values(d,key)).map(String))].sort();
  const typeColors={'Charter / Policy':'#267f8c','Theory / Book':'#4f6077','Research Paper':'#a36749','Research Topic':'#777f78','Heritage Practice':'#17806f'};
  A.category=d=>{if(typeColors[d.display_category])return d.display_category;if(d.type==='Heritage Practice Case')return 'Heritage Practice';if(d.type==='Research theme'||d.node_type==='concept')return 'Research Topic';if(['Book','Monograph'].includes(d.type))return 'Theory / Book';if(['Article','Paper','Conference paper'].includes(d.type))return 'Research Paper';return 'Charter / Policy';};
  A.typeColors=typeColors;
  A.color=d=>typeColors[A.category(d)]||'#777f78';
  A.safeURL=(value,pdf=false)=>{if(typeof value!=='string'||!value.trim())return null;try{const u=new URL(value,location.href);if(/^https?:$/.test(u.protocol))return u.href;if(pdf&&u.protocol==='file:'&&location.protocol==='file:'&&!/^[a-z][a-z\d+.-]*:/i.test(value)&&!value.startsWith('/')&&!value.includes('..'))return u.href;}catch{}return null;};
  A.tooltip=(event,d)=>{const tip=document.querySelector('#tooltip');tip.replaceChildren(A.el('strong','',d.title),A.el('span','',[d.year_label||d.year,A.text(d.concepts||d.themes)].filter(Boolean).join(' / ')));tip.hidden=false;const rect=event.currentTarget.getBoundingClientRect();const x=event.clientX||rect.x,y=event.clientY||rect.y;tip.style.left=Math.max(8,Math.min(x+15,innerWidth-tip.offsetWidth-12))+'px';tip.style.top=Math.max(8,Math.min(y+15,innerHeight-tip.offsetHeight-12))+'px';};
  A.hideTooltip=()=>document.querySelector('#tooltip').hidden=true;
  A.bindNodes=selection=>selection.attr('class','node').attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d.title} ${d.year_label||d.year||''}，打开详情`).on('click',(e,d)=>{A.hideTooltip();A.openDetail(d.id);}).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();A.openDetail(d.id);}}).on('mouseenter',A.tooltip).on('mousemove',A.tooltip).on('mouseleave',A.hideTooltip).on('focus',A.tooltip).on('blur',A.hideTooltip);
  A.svg=(width,height,label)=>d3.select('#chart').append('svg').attr('viewBox',`0 0 ${width} ${height}`).attr('role','group').attr('aria-label',label);
  A.wrap=(selection,width,lineHeight=17)=>selection.each(function(){const text=d3.select(this),words=text.text().split(/\s+/);text.text('');let line=[],row=0;let span=text.append('tspan').attr('x',0).attr('dy',0);for(const word of words){line.push(word);span.text(line.join(' '));if(span.node().getComputedTextLength()>width&&line.length>1){line.pop();span.text(line.join(' '));line=[word];span=text.append('tspan').attr('x',0).attr('dy',lineHeight).text(word);row++;}}});
  return A;
})();
