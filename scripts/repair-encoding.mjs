import fs from 'node:fs'
const decoder=new TextDecoder('windows-1252'),utf8=new TextDecoder('utf-8',{fatal:true}),map=new Map()
for(let b=0;b<256;b++)map.set(decoder.decode(new Uint8Array([b])),b)
const continuation='[\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013-\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]'
const pattern=new RegExp('[\u00C2-\u00F4]'+continuation+'{1,3}','g')
for(const file of ['src/pages/Review.tsx','src/pages/Classroom.tsx','src/pages/Projects.tsx']){
 let s=fs.readFileSync(file,'utf8'),changes=0
 for(let pass=0;pass<5;pass++){const before=s;s=s.replace(pattern,part=>{try{const bytes=[...part].map(c=>map.get(c));if(bytes.some(v=>v===undefined))return part;const repaired=utf8.decode(new Uint8Array(bytes));if(repaired!==part)changes++;return repaired}catch{return part}});if(s===before)break}
 fs.writeFileSync(file,s);console.log(file+': '+changes+' encoding sequences repaired')
}
