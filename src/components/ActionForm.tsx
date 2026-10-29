import { useState } from 'react'
import type { ReactNode, FormEvent } from 'react'
import { Button } from './ui'
export default function ActionForm({children,onSubmit,label='Save changes',className='form-stack',secondary}:{children:ReactNode;onSubmit:(data:FormData)=>Promise<void>;label?:string;className?:string;secondary?:ReactNode}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const data=new FormData(e.currentTarget);setBusy(true);setError('');try{await onSubmit(data)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <form className={className} onSubmit={submit}>{children}{error&&<div className="inline-error" role="alert">{error}</div>}<div className="form-actions">{secondary}<Button type="submit" loading={busy}>{label}</Button></div></form>
}
export const text=(data:FormData,key:string)=>String(data.get(key)||'')
