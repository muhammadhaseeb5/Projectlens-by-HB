import { Unzip, UnzipInflate } from 'fflate'
export type Finding={rule:string;severity:'info'|'warning'|'error';explanation:string;path:string;line?:number;suggestion:string}
export const LIMITS={compressed:10*1024*1024,expanded:25*1024*1024,files:400,file:1024*1024,milliseconds:15000}
export function validatePath(path:string){
 if(!path||path.length>240||path.includes('\\')||path.startsWith('/')||/^[A-Za-z]:/.test(path)||path.split('/').some(p=>p==='..'||p==='.')||/[\x00-\x1f\x7f]/.test(path))throw new Error('Unsafe archive path.')
 return path
}
export function skipReason(path:string){
 const parts=path.toLowerCase().split('/')
 if(parts.some(p=>['node_modules','dist','build','.git','.next','coverage','vendor','__macosx'].includes(p)))return 'Dependency, generated output, or repository metadata'
 if(parts.some(p=>p==='.env'||p.startsWith('.env.')||/\.(pem|key|p12|pfx)$/.test(p)||['id_rsa','id_ed25519','.npmrc'].includes(p)))return 'Potential secret file — excluded from indexing and storage'
 if(!/\.(html?|css|[cm]?[jt]sx?|json|md|txt|svg|png|jpe?g|webp|pdf)$/i.test(path))return 'Unsupported format — excluded from source indexing'
 return null
}
export function readArchive(bytes:Uint8Array){
 if(bytes.length>LIMITS.compressed)throw new Error('ZIP exceeds the 10 MB compressed limit.')
 const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),decoder=new TextDecoder('utf-8',{fatal:true})
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(dv.getUint32(i,true)===0x06054b50){end=i;break}}
 if(end<0)throw new Error('Invalid ZIP archive.')
 const count=dv.getUint16(end+10,true),offset=dv.getUint32(end+16,true),centralSize=dv.getUint32(end+12,true)
 if(dv.getUint16(end+4,true)||dv.getUint16(end+6,true)||count!==dv.getUint16(end+8,true)||count===65535||count>LIMITS.files||offset+centralSize>end)throw new Error('Split, ZIP64, or oversized archives are unsupported (maximum 400 entries).')
 const entries=new Map<string,{size:number;skip:string|null}>();let at=offset,total=0
 for(let i=0;i<count;i++){
  if(at+46>bytes.length||dv.getUint32(at,true)!==0x02014b50)throw new Error('Invalid ZIP directory.')
  const flags=dv.getUint16(at+8,true),method=dv.getUint16(at+10,true),size=dv.getUint32(at+24,true),nl=dv.getUint16(at+28,true),el=dv.getUint16(at+30,true),cl=dv.getUint16(at+32,true),local=dv.getUint32(at+42,true),attrs=dv.getUint32(at+38,true)
  if(flags&1||![0,8].includes(method))throw new Error('Encrypted or unsupported ZIP compression is not allowed.')
  if(((attrs>>>16)&0xf000)===0xa000)throw new Error('Archive symlinks are not allowed.')
  if(at+46+nl+el+cl>bytes.length||local+30>offset||dv.getUint32(local,true)!==0x04034b50)throw new Error('Invalid ZIP entry.')
  if(dv.getUint16(local+6,true)!==flags||dv.getUint16(local+8,true)!==method)throw new Error('ZIP header flags or compression do not match.')
  if(!(flags&8)&&(dv.getUint32(local+18,true)!==dv.getUint32(at+20,true)||dv.getUint32(local+22,true)!==size))throw new Error('ZIP header sizes do not match.')
  const path=validatePath(decoder.decode(bytes.subarray(at+46,at+46+nl))),localNl=dv.getUint16(local+26,true)
  if(decoder.decode(bytes.subarray(local+30,local+30+localNl))!==path)throw new Error('ZIP entry names do not match.')
  if(entries.has(path))throw new Error('Duplicate archive paths are not allowed.')
  if(/\.(zip|7z|rar|tar|gz)$/i.test(path))throw new Error('Nested archives are not supported.')
  if(/\.(exe|dll|com|bat|cmd|ps1|sh|so|dylib|wasm)$/i.test(path)&&!skipReason(path)?.startsWith('Dependency'))throw new Error('Executable and binary program content is not supported.')
  total+=size;if(total>LIMITS.expanded)throw new Error('Expanded ZIP exceeds the 25 MB limit.')
  entries.set(path,{size,skip:path.endsWith('/')?'Directory':skipReason(path)});at+=46+nl+el+cl
 }
 const extracted=new Map<string,Uint8Array>(),start=Date.now();let expanded=0
 const zip=new Unzip(file=>{
  const entry=entries.get(file.name)
  if(!entry)throw new Error('Archive contains an unlisted entry.')
  if(entry.skip||entry.size>LIMITS.file)return
  let size=0;const chunks:Uint8Array[]=[]
  file.ondata=(error,data,final)=>{
   if(error)throw error;size+=data.length;expanded+=data.length
   if(size>LIMITS.file||expanded>LIMITS.expanded||Date.now()-start>LIMITS.milliseconds)throw new Error('Archive processing limit exceeded.')
   chunks.push(data)
   if(final){if(size!==entry.size)throw new Error('ZIP expanded size does not match its directory.');const output=new Uint8Array(size);let pos=0;for(const c of chunks){output.set(c,pos);pos+=c.length}extracted.set(file.name,output)}
  };file.start()
 });zip.register(UnzipInflate)
 // Feed small compressed chunks so forged ZIP size metadata cannot cause one
 // unbounded inflate allocation before the output-size callback can reject it.
 for(let pos=0;pos<bytes.length;pos+=256){
  if(Date.now()-start>LIMITS.milliseconds)throw new Error('Archive processing time limit exceeded.')
  zip.push(bytes.subarray(pos,Math.min(pos+256,bytes.length)),pos+256>=bytes.length)
 }
 return {entries,extracted}
}
export function analyzeFiles(files:Map<string,Uint8Array>,requirements:string[]=[]){
 const findings:Finding[]=[],checked:string[]=[],unsupported:string[]=[],decoder=new TextDecoder('utf-8',{fatal:true}),corpus:string[]=[]
 const add=(rule:string,severity:Finding['severity'],explanation:string,path:string,line:number|undefined,suggestion:string)=>findings.push({rule,severity,explanation,path,line,suggestion})
 if(![...files.keys()].some(p=>/(^|\/)readme\.(md|txt)$/i.test(p)))add('documentation/readme','warning','No README was found in the indexed files.','/',undefined,'Add setup instructions, features, limitations, and contribution summaries.')
 for(const [path,bytes] of files){
  if(!/\.(html?|css|[cm]?[jt]sx?)$/i.test(path)){unsupported.push(path);continue}
  let content:string;try{content=decoder.decode(bytes)}catch{unsupported.push(path);continue}
  if(content.includes('\0')){unsupported.push(path);continue}checked.push(path);corpus.push(content.toLowerCase())
  const lines=content.split('\n')
  lines.forEach((line,i)=>{
   if(/<img\b/i.test(line)&&!(/\balt\s*=/i.test(line)))add('accessibility/image-alt','warning','An image element has no alt attribute on this line. A static heuristic cannot determine its full context.',path,i+1,'Provide descriptive alt text, or alt="" for decorative images; verify in the rendered app.')
   if(/\beval\s*\(/.test(line))add('javascript/dynamic-eval','warning','A call resembling eval() was found. It has not been executed.',path,i+1,'Review whether dynamic evaluation can be replaced with explicit logic.')
   if(/dangerouslySetInnerHTML/.test(line))add('react/html-injection','warning','Raw HTML injection API appears in source. This does not establish exploitability.',path,i+1,'Inspect the data source and sanitization before rendering HTML.')
   if(/console\.log\s*\(/.test(line))add('quality/console-log','info','A console logging statement was found.',path,i+1,'Review whether this log is appropriate for the deployed app.')
  })
  if(/\.html?$/i.test(path)&&/<html\b/i.test(content)&&!/<html[^>]*\blang\s*=/i.test(content))add('accessibility/document-language','warning','The HTML root appears to omit a language.',path,1,'Declare an appropriate lang attribute and test assistive technology behavior.')
 }
 if(!checked.length)add('structure/supported-source','warning','No supported HTML, CSS, JavaScript, TypeScript, or React source file was indexed.','/',undefined,'Include original supported source files in your ZIP.')
 for(const requirement of requirements){const tokens=requirement.toLowerCase().split(/\W+/).filter(t=>t.length>3);const found=tokens.some(t=>corpus.some(c=>c.includes(t)));add('assignment/source-evidence','info',found?`Potential source evidence for “${requirement}” was found. Functionality is not verified.`:`No keyword evidence for “${requirement}” was found in indexed source. This does not prove the feature is absent.`,'/',undefined,'Use the functional teacher checklist and inspect the relevant implementation manually.')}
 return {findings:findings.slice(0,500),checked,unsupported}
}
