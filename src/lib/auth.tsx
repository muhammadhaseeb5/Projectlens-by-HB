import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase,rpc } from './supabase'
import { toast } from 'sonner'
const Context = createContext<{session:Session|null;loading:boolean}>({session:null,loading:true})
export function AuthProvider({children}:{children:ReactNode}) {
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true)
 useEffect(()=>{
  supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)})
  const {data}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setLoading(false)})
  return ()=>data.subscription.unsubscribe()
 },[])
 useEffect(()=>{
  if(!session)return
  const pending=sessionStorage.getItem('projectlens-enrollment')
  if(pending){sessionStorage.removeItem('projectlens-enrollment');void rpc('enroll',JSON.parse(pending)).then(()=>toast.success('Your section enrollment is complete.')).catch(e=>toast.error(e.message))}
 },[session])
 return <Context.Provider value={{session,loading}}>{children}</Context.Provider>
}
export const useAuth=()=>useContext(Context)
