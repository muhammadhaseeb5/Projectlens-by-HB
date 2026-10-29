import { lazy,Suspense } from 'react'
import { BrowserRouter,Routes,Route,Navigate,Outlet,Link } from 'react-router-dom'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider,useAuth } from './lib/auth'
import { WorkspaceProvider } from './lib/workspace'
import Shell from './components/Shell'
import { Empty } from './components/ui'
const Landing=lazy(()=>import('./pages/Landing'))
const Auth=lazy(()=>import('./pages/Auth'))
const Dashboard=lazy(()=>import('./pages/Dashboard'))
const Library=lazy(()=>import('./pages/Library'))
const ProjectDetail=lazy(()=>import('./pages/Projects'))
const Review=lazy(()=>import('./pages/Review'))
const Assignments=lazy(()=>import('./pages/Assignments'))
const AssignmentDetail=lazy(()=>import('./pages/Assignments').then(m=>({default:m.AssignmentDetail})))
const AssignmentForm=lazy(()=>import('./pages/Assignments').then(m=>({default:m.AssignmentForm})))
const ProjectForm=lazy(()=>import('./pages/Projects').then(m=>({default:m.ProjectForm})))
const ReviewSheet=lazy(()=>import('./pages/Review').then(m=>({default:m.ReviewSheet})))
const Classes=lazy(()=>import('./pages/Classroom').then(m=>({default:m.Classes})))
const Students=lazy(()=>import('./pages/Classroom').then(m=>({default:m.Students})))
const Notifications=lazy(()=>import('./pages/WorkspacePages').then(m=>({default:m.Notifications})))
const Reports=lazy(()=>import('./pages/WorkspacePages').then(m=>({default:m.Reports})))
const Settings=lazy(()=>import('./pages/WorkspacePages').then(m=>({default:m.Settings})))
const Guide=lazy(()=>import('./pages/WorkspacePages').then(m=>({default:m.Guide})))
const client=new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:false}}})
function Guard(){const {session,loading}=useAuth();if(loading)return <div className="fullscreen-loading"><span className="spinner"/>Restoring your workspace…</div>;return session?<Outlet/>:<Navigate to="/login" replace/>}
function Workspace(){return <WorkspaceProvider><Shell/></WorkspaceProvider>}
function workspaceRoutes(){return <><Route index element={<Dashboard/>}/><Route path="projects" element={<Library/>}/><Route path="projects/new" element={<ProjectForm/>}/><Route path="projects/:id" element={<ProjectDetail/>}/><Route path="projects/:id/edit" element={<ProjectForm/>}/><Route path="proposals" element={<Library/>}/><Route path="reviews" element={<Library queue/>}/><Route path="assignments" element={<Assignments/>}/><Route path="assignments/new" element={<AssignmentForm/>}/><Route path="assignments/:id" element={<AssignmentDetail/>}/><Route path="assignments/:id/edit" element={<AssignmentForm/>}/><Route path="classes" element={<Classes/>}/><Route path="students" element={<Students/>}/><Route path="review/:versionId" element={<Review/>}/><Route path="review/:versionId/sheet" element={<ReviewSheet/>}/><Route path="notifications" element={<Notifications/>}/><Route path="settings" element={<Settings/>}/><Route path="reports" element={<Reports/>}/><Route path="guide" element={<Guide/>}/><Route path="*" element={<Empty title="This page is out of focus" action={<Link className="btn primary" to="/">Back to ProjectLens</Link>}/>}/></>}
export default function App(){return <QueryClientProvider client={client}><BrowserRouter><AuthProvider><a className="skip-link" href="#main">Skip to content</a><Suspense fallback={<div className="route-loading" aria-busy="true"><span className="spinner"/>Loading your view?</div>}><Routes><Route path="/" element={<Landing/>}/>{['login','register','reset-password','update-password','verify','teacher-setup'].map(path=><Route key={path} path={'/'+path} element={<Auth/>}/>)}<Route element={<Guard/>}><Route path="/app" element={<Workspace/>}>{workspaceRoutes()}</Route></Route><Route path="/demo" element={<Workspace/>}>{workspaceRoutes()}</Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense><Toaster richColors position="bottom-right" closeButton/></AuthProvider></BrowserRouter></QueryClientProvider>}
