/* Readable chronological document atlas. Importance is a provisional research code. */
Atlas.timeline=function(rows){
  const A=Atlas,root=document.querySelector('#chart');
  root.classList.add('timeline-chart');
  const sorted=[...rows].sort((a,b)=>a.year-b.year||a.title.localeCompare(b.title));
  for(const d of sorted){
    const item=A.el('button','timeline-entry');item.type='button';item.style.setProperty('--entry-color',A.color(d));item.setAttribute('aria-label',`${d.year_label||d.year}, ${d.title}${d.title_zh?', '+d.title_zh:''}, ${d.placeholder?'reading pending':'open details'}`);
    item.onclick=()=>A.openDetail(d.id);
    const rail=A.el('span','timeline-rail'),dot=A.el('span','timeline-dot');
    dot.style.setProperty('--entry-color',A.color(d));
    dot.dataset.size=String(d.importance||1);
    if(d.placeholder)dot.classList.add('is-placeholder');
    rail.append(dot);
    const body=A.el('span','timeline-body'),meta=A.el('span','timeline-meta');
    const year=A.el('span','timeline-year',d.year_label||d.year);
    const category=A.el('span','timeline-category',A.category(d));
    const maker=A.el('span','timeline-maker',[A.text(d.author),d.organization].filter(Boolean).join(' / ')||'Research topic');
    meta.append(year,category,maker);
    const title=A.el('span','timeline-title',d.title);
    const zh=d.title_zh?A.el('span','timeline-title-zh',d.title_zh):null;
    const preview=A.el('span','timeline-preview',d.preview||d.summary||'Reading note pending.');
    body.append(meta,title);if(zh)body.append(zh);body.append(preview);
    if(d.placeholder)body.append(A.el('span','timeline-pending','READING PENDING'));
    item.append(rail,body);root.append(item);
  }
};
