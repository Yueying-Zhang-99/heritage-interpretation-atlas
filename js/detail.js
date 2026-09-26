Atlas.openDetail=function(id){
  const A=Atlas,d=A.byId.get(id);if(!d)return;A.hideTooltip();
  const panel=document.querySelector('#detail-dialog'),root=document.querySelector('#detail-content');root.replaceChildren();
  root.append(A.el('div','entry-number',d.year_label||d.year||d.node_type.toUpperCase()));
  const title=A.el('h2','',d.title);title.id='detail-title';if(d.title_zh)title.append(A.el('span','',d.title_zh));root.append(title);
  root.append(A.el('p','small',`${A.category(d)} · ${d.placeholder?'Reading pending':'Research record'}${d.importance?` · Provisional contribution ${d.importance}/3`:''}`));
  if(d.importance_note)root.append(A.el('p','small',d.importance_note));
  const meta=A.el('dl','detail-meta');for(const [label,value]of [['Author',A.text(d.author)],['Organisation',d.organization],['Type',d.type],['Key concepts',A.text(d.concepts)],['Themes',A.text(d.themes)],['Heritage',A.text(d.heritage_conception)],['Interpretation',A.text(d.interpretation_model)],['Public role',A.text(d.public_role)],['Narrative',A.text(d.narrative_structure)],['Media',A.text(d.media)]]){if(value)meta.append(A.el('dt','',label),A.el('dd','',value));}root.append(meta);
  if(d.coding_status)root.append(A.el('p','small',d.coding_status));
  for(const [label,key]of [['Summary','summary'],['Theoretical shift','paradigm_shift'],['Research significance','significance'],['PhD relevance','phd_relevance'],['Reading notes','my_notes']]){if(!d[key])continue;const section=A.el('section','detail-section');section.append(A.el('h3','',label),A.el('p','',d[key]));root.append(section);}
  const excerpts=A.el('section','detail-section');excerpts.append(A.el('h3','','SOURCE EXCERPTS'));if(d.excerpts?.length){for(const e of d.excerpts){const quote=A.el('blockquote','source-excerpt',e.text||'');const cite=A.el('cite','',e.location||e.source||'Source location pending');quote.append(cite);excerpts.append(quote);}}else excerpts.append(A.el('p','small','Verified source excerpt pending. Add a short quotation with an article or page reference after reading the original.'));root.append(excerpts);
  if(d.annotations?.length){const s=A.el('section','detail-section');s.append(A.el('h3','','Annotations'));for(const a of d.annotations){s.append(A.el('p','',`${a.text||''}${a.page!=null?' (p. '+a.page+')':''}`));}root.append(s);}
  const related=A.el('section','detail-section');related.append(A.el('h3','','Related records'));
  const relations=(d.relations||[]).map(r=>({...r,other:r.target,direction:'→'}));for(const n of A.byId.values())for(const r of n.relations||[])if(r.target===id)relations.push({...r,other:n.id,direction:'←'});
  for(const r of relations){const other=A.byId.get(r.other);if(!other)continue;const b=A.el('button','related-button',`${r.direction} ${other.title}`);b.append(A.el('small','',`${r.type} · ${r.evidence||'Evidence pending'}`));b.onclick=()=>A.openDetail(other.id);related.append(b);}if(relations.length)root.append(related);
  const links=A.el('section','detail-section');links.append(A.el('h3','','Source'));const holder=A.el('div','source-links');for(const [label,url,isPDF]of [['View source ↗',d.source_url,false],['Open PDF ↗',d.pdf,true]]){const safe=A.safeURL(url,isPDF);if(safe){const a=A.el('a','',label);a.href=safe;a.target='_blank';a.rel='noopener noreferrer';holder.append(a);}}links.append(holder);root.append(links);
  if(!panel.open)panel.showModal();panel.scrollTop=0;
};
