/* Claims are source paraphrases. Design implications and evaluation are proposals. */
Atlas.researchLabels={object_value:'遗产对象与价值',authority:'阐释权与主体',evidence:'证据与真实性',context:'场所与情境',mediation:'阐释与设计',outcome:'体验与效果',review_method:'综述方法'};
Atlas.claimCard=function(d,c){
  const A=Atlas,card=A.el('article','claim-card');card.dataset.claimId=c.claim_id;
  card.append(A.el('h4','',c.claim_paraphrase),A.el('p','small',`${c.claim_basis} · ${c.source_context||'范围待补'} · ${c.validation_status||'待核查'}`));
  const steps=A.el('div','claim-steps');
  for(const [label,text] of [['来源与定位',[c.claim_subject,c.source_locator].filter(Boolean).join(' · ')],['研究者推导：设计依据',c.researcher_implication||'尚未提出；不自动由主张生成。'],['研究者建议：未来评价',c.evaluation_proposal||'尚未提出；不代表已有量表或效果证据。']]){const step=A.el('section');step.append(A.el('h5','',label),A.el('p','',text));steps.append(step);}card.append(steps);
  card.append(A.el('p','small',`概念作用：${A.arr(c.concept_roles).map(v=>A.researchLabels[v]||v).join(' / ')||'尚未编码'} · 章节：${A.text(c.chapter_use)||'尚未编码'}`));
  const safe=A.safeURL(c.source_url);if(safe){const link=A.el('a','','查阅来源 ↗');link.href=safe;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}return card;
};
Atlas.renderResearchDetails=function(root,d){
  const A=Atlas;if(!d.record_kind&&!d.claims)return;
  const section=A.el('section','detail-section research-detail');section.append(A.el('h3','','RESEARCH CODING / 研究编码'));
  const meta=A.el('dl','detail-meta');for(const [label,key]of [['材料性质','record_kind'],['阅读核查','reading_status'],['年份依据','date_basis'],['概念作用','concept_roles'],['章节用途','chapter_use'],['真实性讨论对象','authenticity_focus'],['情境维度','context_dimensions'],['参与阶段','participation_stage'],['公众活动','interpretive_operations'],['候选效果维度','outcome_constructs']]){const value=A.text(d[key]);if(value)meta.append(A.el('dt','',label),A.el('dd','',value));}section.append(meta);
  if(d.bibliography){const bib=A.el('dl','detail-meta');for(const [key,value]of Object.entries(d.bibliography))bib.append(A.el('dt','',key),A.el('dd','',String(value)));section.append(bib);}
  section.append(A.el('p','small','未编码不等于没有。核查摘要或出版社介绍不等于完成全文精读。候选效果维度不构成已验证量表。'));
  for(const c of d.claims||[])section.append(A.claimCard(d,c));if(!d.claims?.length)section.append(A.el('p','small','主张提取待完成；旧摘要和图谱标签不自动视为已核实主张。'));
  if(d.legacy_coding){const archived=A.el('details'),summary=A.el('summary','','旧媒介与公众行动编码（归档）');archived.append(summary,A.el('p','small',`media: ${A.text(d.legacy_coding.media)||'—'}; public_actions: ${A.text(d.legacy_coding.public_actions)||'—'}. ${d.legacy_coding.note}`));section.append(archived);}root.append(section);
};
Atlas.evidence=function(rows){
  const A=Atlas,root=document.querySelector('#chart'),holder=A.el('div','evidence-library');
  holder.append(A.el('p','research-notice','来源主张与设计推导分列。这里只展示已提取的主张，不能用于推算整个领域的概念频率；评价建议均待检验。'));
  let count=0;for(const d of rows){if(!d.claims?.length)continue;count+=d.claims.length;const group=A.el('section','evidence-record'),button=A.el('button','text-button',`${d.year} · ${d.title}`);button.onclick=()=>A.openDetail(d.id);group.append(button,A.el('p','small',`${d.record_kind} · ${d.reading_status}`));for(const c of d.claims)group.append(A.claimCard(d,c));holder.append(group);}
  holder.prepend(A.el('p','small',`${count} 条主张 / 当前 ${rows.length} 个匹配条目。未完成主张提取的条目仍可在 Library 查看。`));if(!count)holder.append(A.el('p','','当前筛选尚无主张提取记录。'));root.append(holder);
};
