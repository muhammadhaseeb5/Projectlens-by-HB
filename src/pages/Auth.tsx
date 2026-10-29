import { useEffect,useState } from 'react'
import { Link,useNavigate,useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight,ArrowLeft,Mail,ShieldCheck,Layers,Eye,EyeOff,CheckCircle2 } from 'lucide-react'
import { supabase,configured,rpc } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/Shell'
import { Button,Field } from '../components/ui'
import { toast } from 'sonner'
const schema=z.object({email:z.string(),password:z.string(),name:z.string(),code:z.string(),roll_number:z.string()})
type Values=z.infer<typeof schema>
export default function Auth(){
 const location=useLocation(),mode=location.pathname.split('/')[1],teacherSetup=mode==='teacher-setup',register=mode==='register'||teacherSetup,reset=mode==='reset-password',update=mode==='update-password',verify=mode==='verify',navigate=useNavigate(),{session,loading}=useAuth(),[sent,setSent]=useState(false),[show,setShow]=useState(false),[error,setError]=useState('')
 const form=useForm<Values>({resolver:zodResolver(schema),defaultValues:{email:'',password:'',name:'',code:'',roll_number:''}})
 useEffect(()=>{if(session&&!loading&&!update&&!verify)navigate('/app',{replace:true})},[session,loading,update,verify,navigate])
 async function submit(v:Values){setError('');try{
  if(!update&&!z.email().safeParse(v.email).success)throw new Error('Enter a valid email address.');
  if(!configured)throw new Error('Supabase is not configured. Add the public project URL and publishable key to your environment.')
  if(update){if(v.password.length<10)throw new Error('Use at least 10 characters.');const r=await supabase.auth.updateUser({password:v.password});if(r.error)throw r.error;toast.success('Password updated.');navigate('/app');return}
  if(reset){const r=await supabase.auth.resetPasswordForEmail(v.email,{redirectTo:window.location.origin+'/update-password'});if(r.error)throw r.error;setSent(true);return}
  if(register){
   if(v.password.length<10)throw new Error('Use at least 10 characters for your password.')
   if(!v.name.trim()||(!teacherSetup&&(!v.code.trim()||!v.roll_number.trim())))throw new Error('Name, roll number, and section enrollment code are required.')
   // Enrollment is performed after verification; metadata never grants authorization.
   const r=await supabase.auth.signUp({email:v.email,password:v.password,options:{data:{name:v.name},emailRedirectTo:window.location.origin+'/verify'}})
   if(r.error)throw r.error
   if(!teacherSetup)sessionStorage.setItem('projectlens-enrollment',JSON.stringify({code:v.code,roll_number:v.roll_number}))
   if(r.data.session){if(!teacherSetup)await rpc('enroll',{code:v.code,roll_number:v.roll_number});navigate('/app')}else setSent(true)
  }else{const r=await supabase.auth.signInWithPassword({email:v.email,password:v.password});if(r.error)throw r.error;navigate('/app')}
 }catch(e){setError((e as Error).message)}}

 const title=teacherSetup?'Activate your teacher account.':verify?'Email verification':sent?'Check your inbox':register?'Find your classroom.':reset?'A fresh start.':update?'Set a new password.':'Welcome back.'
 return <div className="auth-layout"><div className="auth-story"><Link to="/"><Logo/></Link><div><span className="eyebrow">A CLEARER VIEW OF EVERY PROJECT</span><h1>Big ideas.<br/>Thoughtful feedback.<br/><em>Real progress.</em></h1><p>Your Web Technology classroom, connected from the first proposal to the final approval.</p><div className="auth-story-chips"><span><ShieldCheck size={16}/>Private workspace</span><span><Layers size={16}/>Every version matters</span></div></div><span className="auth-credit">Web Technology · Sir Hassan Abbas</span><div className="auth-orb"/></div><main className="auth-main"><Link className="auth-back" to="/"><ArrowLeft size={16}/>Back to ProjectLens</Link><div className="auth-form-wrap">{(sent||verify)&&<span className="auth-success-icon">{verify&&session?<CheckCircle2 size={27}/>:<Mail size={27}/>}</span>}<h1>{title}</h1><p>{verify?(session?'Your account is verified. Your workspace is ready.':'Follow the verification link in your email, then sign in to continue.'):sent?'If your request can be completed, you’ll receive an email with your next step.':register?'Join your authorized section and start building.':reset?'Enter your email and we’ll send you a reset link.':update?'Choose a strong password with at least 10 characters.':'Your classroom is ready when you are.'}</p>
 {verify||sent?<><Link className="btn primary full" to={session?'/app':'/login'}>{session?'Open workspace':'Back to sign in'}<ArrowRight size={17}/></Link><p className="auth-note">Check your spam folder too. For a new verification email, sign in and follow the message.</p></>:<form onSubmit={form.handleSubmit(submit)} className="form-stack">{register&&<Field label="Your full name"><input autoComplete="name" placeholder="Your name" {...form.register('name')} required maxLength={120}/></Field>}{!update&&<Field label="Email address"><input type="email" autoComplete="email" placeholder="you@example.edu" {...form.register('email')} required={!update}/>{form.formState.errors.email&&<small className="field-error">{form.formState.errors.email.message}</small>}</Field>}{!reset&&<Field label={update?'New password':'Password'}><div className="password-input"><input type={show?'text':'password'} autoComplete={register||update?'new-password':'current-password'} placeholder={register?'At least 10 characters':'Enter your password'} {...form.register('password')} required minLength={register||update?10:1}/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></Field>}{register&&!teacherSetup&&<><div className="form-grid"><Field label="Roll number"><input placeholder="Your class roll number" {...form.register('roll_number')} required maxLength={50}/></Field><Field label="Section enrollment code"><input placeholder="Provided by your teacher" {...form.register('code')} required/></Field></div><p className="auth-note">Your code determines your section. Section corrections require teacher approval. Registration creates a student account.</p></>}{!register&&!reset&&!update&&<Link className="forgot-link" to="/reset-password">Forgot password?</Link>}{error&&<div className="inline-error" role="alert">{error}</div>}<Button type="submit" loading={form.formState.isSubmitting} className="btn primary full">{teacherSetup?'Verify teacher email':register?'Create student account':reset?'Send reset link':update?'Update password':'Sign in to workspace'}<ArrowRight size={17}/></Button></form>}
 {!sent&&!verify&&!update&&<div className="auth-footer">{register?'Already have an account?':reset?'Remember your password?':'New to your classroom?'} <Link to={register||reset?'/login':'/register'}>{register||reset?'Sign in':'Join with an enrollment code'}</Link></div>}<div className="auth-teacher-note"><ShieldCheck size={15}/><span>Teacher access is activated only for the verified, pre-authorized email address.</span></div>{!register&&!reset&&!update&&!sent&&!verify&&<Link className="teacher-activation-link" to="/teacher-setup">Teacher account activation</Link>}</div><span className="auth-bottom">ProjectLens · Built for a more thoughtful classroom.</span></main></div>
}
