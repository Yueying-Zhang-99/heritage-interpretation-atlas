// Optional: refresh the double-click preview from the authoritative JSON.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/knowledge.json'),'utf8'));
fs.writeFileSync(path.join(root,'data/knowledge-snapshot.js'),'/* Local-file preview snapshot. HTTP mode reads knowledge.json. */\nwindow.ATLAS_SNAPSHOT = '+JSON.stringify(data,null,2)+';\n');
console.log('Offline snapshot updated.');
