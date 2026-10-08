const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const read=p=>fs.readFileSync(root+'/'+p,'utf8');
const context={window:{}};vm.createContext(context);vm.runInContext(read('js/core.js'),context);const A=context.window.Atlas;
const data=JSON.parse(read('data/knowledge.json'));A.setData(data);
const clone=()=>JSON.parse(JSON.stringify(data));
let bad=clone();bad.documents[0].claims=[{claim_id:'test',claim_paraphrase:'A claim',claim_basis:'explicit_source',source_url:'javascript:alert(1)',source_locator:'p. 1'}];assert.throws(()=>A.validate(bad),/网址和位置/);
bad=clone();bad.documents[0].claims=[{claim_id:'same',claim_paraphrase:'one',claim_basis:'researcher_inference'},{claim_id:'same',claim_paraphrase:'two',claim_basis:'researcher_inference'}];assert.throws(()=>A.validate(bad),/唯一/);
bad=clone();bad.documents[0].reading_status='assumed_read';assert.throws(()=>A.validate(bad),/reading_status/);
bad=clone();bad.documents[0].concept_roles='evidence';assert.throws(()=>A.validate(bad),/concept_roles/);
for(const d of data.documents){for(const c of d.claims||[])assert.ok(c.source_locator&&c.source_context&&c.researcher_implication,'Source, scope and proposal must remain distinguishable');if(d.legacy_coding){assert.ok(Array.isArray(d.legacy_coding.media));assert.equal(d.media.length,0,'Do not treat archived publication codes as current interpretive media');}}
assert.equal(A.byId.get('nara').outcome_constructs.length,0,'Do not assume an authenticity norm is a visitor scale');
assert.ok(A.byId.get('vichnevetskaia-xr-authenticity-2025').authenticity_focus.some(x=>x.includes('Subjective')),'Retain source terminology');
assert.ok(A.byId.get('ireland-everyday-2025').bibliography.online_publication.startsWith('2024'));
A.state.filters={concept_roles:new Set(['evidence']),record_kind:new Set(['normative'])};assert.ok(A.filtered().some(d=>d.id==='nara'));assert.ok(!A.filtered().some(d=>d.id==='wang-authenticity-1999'));
const legacy=JSON.parse(read('data/knowledge.json'));for(const d of legacy.documents){delete d.claims;delete d.reading_status;delete d.concept_roles;}A.validate(legacy);
console.log('PASS: claim provenance, duplicate claim IDs, reading status, concept types, legacy migration, authenticity distinctions, date provenance, compound research filters and legacy imports.');
