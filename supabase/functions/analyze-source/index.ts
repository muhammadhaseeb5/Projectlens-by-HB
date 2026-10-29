import { createClient } from '@supabase/supabase-js'
import { readArchive,analyzeFiles,LIMITS } from './analyzer.ts'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}
const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}})
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors})
 if(req.method!=='POST')return response({error:'Method not allowed'},405)
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 const boundedFetch:typeof fetch=(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(8000)})
 const auth=req.headers.get('Authorization')||'',client=createClient(url,anon,{global:{headers:{Authorization:auth},fetch:boundedFetch}}),admin=createClient(url,secret,{global:{fetch:boundedFetch}})
 const {data:{user},error:authError}=await client.auth.getUser()
 if(authError||!user)return response({error:'Sign in required.'},401)
 let versionId:string|undefined,authorized=false
 const started=Date.now()
 try{
  const body=await req.json();versionId=body.version_id
  if(!versionId||!(/^[0-9a-f-]{36}$/i.test(versionId)))return response({error:'Invalid version.'},400)
  const {data:v,error}=await client.from('submission_versions').select('*,projects!inner(*,assignments!inner(*))').eq('id',versionId).single()
  if(error||!v)return response({error:'Version not accessible.'},403)
  let permitted=v.projects.owner_id===user.id
  if(v.projects.group_id){const {data:g}=await client.from('groups').select('leader_id').eq('id',v.projects.group_id).single();permitted=g?.leader_id===user.id}
  if(!permitted||v.status!=='draft'||v.source_processed)return response({error:'This source version cannot be processed.'},403)
  const claim=await admin.rpc('begin_source',{p_version:versionId,p_actor:user.id})
  if(claim.error)return response({error:claim.error.message},409)
  authorized=true
  const {data:archive,error:downloadError}=await client.storage.from('project-source').download(versionId+'/source.zip')
  if(downloadError||!archive)throw new Error('Upload your source ZIP first.')
  if(archive.size>LIMITS.compressed)throw new Error('Source ZIP exceeds 10 MB.')
  const parsed=readArchive(new Uint8Array(await archive.arrayBuffer()))
  const {data:requirements}=await client.from('assignment_requirements').select('title').eq('assignment_id',v.projects.assignment_id)
  const result=analyzeFiles(parsed.extracted,(requirements||[]).map((r:{title:string})=>r.title))
  const files:any[]=[{path:'source.zip',storage_path:versionId+'/source.zip',kind:'archive',size:archive.size,indexed:false}]
  for(const [path,entry] of parsed.entries){
   if(Date.now()-started>45000)throw new Error('Source processing exceeded the 45-second limit. Reduce archive size or file count and retry.')
   if(path.endsWith('/'))continue
   const bytes=parsed.extracted.get(path),indexed=result.checked.includes(path),storagePath=versionId+'/indexed/'+path
   if(bytes){const upload=await admin.storage.from('project-source').upload(storagePath,bytes,{contentType:/\.png$/i.test(path)?'image/png':/\.jpe?g$/i.test(path)?'image/jpeg':/\.webp$/i.test(path)?'image/webp':'text/plain',upsert:true});if(upload.error)throw new Error('Unable to save extracted source. Retry the same validated draft.')}
   files.push({path,storage_path:bytes?storagePath:'',kind:/\.(png|jpe?g|webp)$/i.test(path)?'screenshot':/\.(md|txt|pdf)$/i.test(path)?'documentation':'source',size:entry.size,indexed,skip_reason:entry.skip||(entry.size>LIMITS.file?'File exceeds the 1 MB indexing limit':indexed?null:'Not checked by the supported static rules')})
  }
  if(Date.now()-started>45000)throw new Error('Source processing exceeded the 45-second limit. Reduce the archive and retry.')
  const {error:saveError}=await admin.rpc('complete_source',{p_version:versionId,p_files:files,p_findings:result.findings,p_checked:result.checked.length,p_skipped:files.length-1-result.checked.length})
  if(saveError)throw new Error(saveError.message)
  return response({status:'completed',checked:result.checked.length,skipped:files.length-1-result.checked.length,findings:result.findings.length})
 }catch(e){
  // No source or credential data is logged. Failed validation keeps the draft unsubmitted.
  const message=(e as Error).message
  if(versionId&&authorized){const {data:v}=await client.from('submission_versions').select('status').eq('id',versionId).maybeSingle();if(v?.status==='draft')await admin.rpc('complete_source',{p_version:versionId,p_files:[],p_findings:[],p_checked:0,p_skipped:0,p_error:message})}
  return response({error:message},400)
 }
})
