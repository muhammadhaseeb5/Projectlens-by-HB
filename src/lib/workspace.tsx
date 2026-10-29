import { createContext,useContext,useState,useEffect } from 'react'
import type { ReactNode } from 'react'
import { useQuery,useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { tables } from './types'
import type { Workspace, RecordRow } from './types'
import { rows,rpc } from './supabase'
import { useAuth } from './auth'
import { demoWorkspace } from './demo'
import { toast } from 'sonner'
type State={data:Workspace;demo:boolean;teacher:boolean;userId:string;profile:RecordRow|undefined;classId:string;setClassId:(v:string)=>void;section:string;setSection:(v:string)=>void;classroom:RecordRow|undefined;sections:RecordRow[];projects:RecordRow[];assignments:RecordRow[];loading:boolean;error:Error|null;refresh:()=>void;act:<T=any>(action:string,payload?:Record<string,unknown>)=>Promise<T>}
const Context=createContext<State>(null!)
export function WorkspaceProvider({children}:{children:ReactNode}) {
 const {session}=useAuth(),location=useLocation(),demo=location.pathname.startsWith('/demo'),client=useQueryClient()
 const userId=demo?'demo-teacher':session?.user.id||''
 const [selectedClass,setClassId]=useState(''),[section,setSection]=useState('all')
 const query=useQuery({queryKey:['workspace',userId,demo],queryFn:async()=>demo?demoWorkspace():Object.fromEntries(await Promise.all(tables.map(async table=>[table,await rows(table)]))),enabled:demo||!!session,staleTime:15000})
 const data=(query.data||Object.fromEntries(tables.map(t=>[t,[]]))) as Workspace
 const teacher=data.user_roles.some(r=>r.id===userId&&r.role==='teacher'),profile=data.profiles.find(r=>r.id===userId)
 const classId=data.classes.some(c=>c.id===selectedClass)?selectedClass:data.classes[0]?.id||''
 const classroom=data.classes.find(c=>c.id===classId),sections=data.sections.filter(s=>s.class_id===classId)
 const assignments=data.assignments.filter(a=>a.class_id===classId&&(section==='all'||data.assignment_sections.some(t=>t.assignment_id===a.id&&t.section_id===section)))
 const projects=data.projects.filter(p=>assignments.some(a=>a.id===p.assignment_id)&&(section==='all'||p.section_id===section))
 const refresh=()=>{void client.invalidateQueries({queryKey:['workspace']})}
 async function act<T=any>(action:string,payload:Record<string,unknown>={}):Promise<T> {
  if(demo){toast.info('This is a read-only demonstration. Sign in to manage your classroom.');throw new Error('Read-only demonstration')}
  try{const result=await rpc<T>(action,payload);refresh();return result}catch(e){toast.error((e as Error).message);throw e}
 }
 return <Context.Provider value={{data,demo,teacher,userId,profile,classId,setClassId,section,setSection,classroom,sections,projects,assignments,loading:query.isLoading,error:query.error,refresh,act}}>{children}</Context.Provider>
}
export const useWorkspace=()=>useContext(Context)
export function useAssignmentClass(assignmentId?:string){
 const w=useWorkspace(),target=w.data.assignments.find(a=>a.id===assignmentId)?.class_id
 useEffect(()=>{if(target&&target!==w.classId){w.setClassId(target);w.setSection('all')}},[target,w.classId])
}
