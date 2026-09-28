Atlas.cluster=function(rows){
  const A=Atlas,key=A.state.cluster;
  const assignments=new Map();
  for(const d of rows){const values=A.arr(d[key]).length?A.arr(d[key]).map(String):['Uncoded'];for(const value of values){if(!assignments.has(value))assignments.set(value,[]);assignments.get(value).push(d);}}
  const board=A.el('div','cluster-board');
  for(const [group,items] of [...assignments].sort(([a],[b])=>a.localeCompare(b))){
    const section=A.el('section','cluster-group'),head=A.el('div','cluster-group-head');
    head.append(A.el('h3','',group),A.el('span','cluster-count',`${items.length} ${items.length===1?'record':'records'}`));
    const list=A.el('div','cluster-items');
    for(const d of items.sort((a,b)=>a.year-b.year||a.title.localeCompare(b.title))){
      const item=A.el('button','cluster-item');item.type='button';item.style.setProperty('--entry-color',A.color(d));item.onclick=()=>A.openDetail(d.id);
      const dot=A.el('span','cluster-dot');dot.dataset.size=String(d.importance||1);if(d.placeholder)dot.classList.add('is-placeholder');
      const copy=A.el('span','cluster-copy'),meta=A.el('span','cluster-meta');meta.append(A.el('span','cluster-year',d.year_label||d.year));
      copy.append(meta,A.el('strong','cluster-title',d.map_title||d.title),A.el('span','cluster-maker',d.map_maker||A.text(d.author)||d.organization||'Research topic'));
      item.append(dot,copy);list.append(item);
    }
    section.append(head,list);board.append(section);
  }
  rootAppend(board);
  function rootAppend(el){document.querySelector('#chart').append(el);}
};
