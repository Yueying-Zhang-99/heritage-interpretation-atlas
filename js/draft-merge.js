/* Rebase a browser draft onto the current dataset without losing local edits. */
Atlas.mergeDraft=function(base,local,remote){
  const conflicts=[],same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const merge=(before,draft,current,path)=>{
    if(same(draft,before))return copy(current);
    if(same(current,before)||same(draft,current))return copy(draft);
    if((path==='documents'||path==='nodes')&&[before,draft,current].every(Array.isArray)){
      const maps=[before,draft,current].map(rows=>new Map(rows.map(row=>[row.id,row]))),result=[];
      const ids=new Set([...current,...draft,...before].map(row=>row.id));
      for(const id of ids){const value=merge(maps[0].get(id),maps[1].get(id),maps[2].get(id),path+'.'+id);if(value!==undefined)result.push(value);}
      return result;
    }
    if(object(draft)&&object(current)&&(before===undefined||object(before))){
      const result={},keys=new Set([...Object.keys(current),...Object.keys(draft),...Object.keys(before||{})]);
      for(const key of keys){const value=merge(before?.[key],draft[key],current[key],path?path+'.'+key:key);if(value!==undefined)Object.defineProperty(result,key,{value,enumerable:true,writable:true,configurable:true});}
      return result;
    }
    conflicts.push(path);return copy(draft);
  };
  return {data:merge(base,local,remote,''),conflicts};
};
