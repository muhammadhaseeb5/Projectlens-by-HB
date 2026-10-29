import { defaultRubric } from './types'
import type { Workspace } from './types'
export function demoWorkspace(): Workspace {
 const examples=[['Threadly','Messaging Application','A','Build meaningful conversations. A messaging workspace with conversations, profiles, and real-time updates.'],['Cellwise','Spreadsheet Application','B','From simple cells to useful insights. An editable spreadsheet with formulas, sorting, and saved workbooks.'],['Presento','Presentation Editor','C','Make every idea presentation-ready. Create, arrange, and present slides in a focused web editor.']]
 return {
 profiles:[{id:'demo-teacher',name:'Sir Hassan Abbas',email:'Demonstration workspace'}],user_roles:[{id:'demo-teacher',role:'teacher'}],
 classes:[{id:'demo-class',title:'Web Technology',semester:'',institution:'',timezone:'Asia/Karachi',teacher_id:'demo-teacher'}],
 sections:['A','B','C'].map(name=>({id:'demo-'+name,class_id:'demo-class',name})),enrollments:[],
 assignments:examples.map((e,i)=>({id:'assignment-'+i,class_id:'demo-class',title:e[1],description:e[3],category:e[1],mode:'both',min_group:2,max_group:4,published:true,deadline:'2026-12-15T18:59:00Z',proposal_required:true,technologies:['React','TypeScript'],allow_resubmit:true})),
 assignment_sections:examples.map((e,i)=>({id:'target-'+i,assignment_id:'assignment-'+i,section_id:'demo-'+e[2],instructions:'Demonstration instructions. Build an original web application and document your decisions.'})),
 assignment_requirements:examples.flatMap((_,i)=>(i===0?['Authentication','Conversations','Message sending','Persistence','Responsive layout']:i===1?['Editable cells','Formulas','Sorting','Saving']:['Slide creation','Editing','Reordering','Presentation mode']).map((title,j)=>({id:`req-${i}-${j}`,assignment_id:'assignment-'+i,title,sort_order:j}))),
 rubric_criteria:examples.flatMap((_,i)=>defaultRubric.map((r,j)=>({id:`rubric-${i}-${j}`,assignment_id:'assignment-'+i,...r,sort_order:j}))),
 projects:examples.map((e,i)=>({id:'project-'+i,assignment_id:'assignment-'+i,section_id:'demo-'+e[2],owner_id:'demo-example',title:e[0],description:e[3],category:e[1],technologies:['React','TypeScript',i===0?'Supabase':i===1?'CSS Grid':'Tailwind'],created_at:'2026-10-28T10:00:00Z',notes:'Clearly labeled example, separate from real classroom records.',limitations:'This is a demonstration brief. No student submission, automated result, or grade is represented.',feature_checklist:[],repo_url:'',live_url:''})),
 groups:[],group_members:[],group_invitations:[],proposals:[],submission_versions:[],submission_members:[],submission_files:[],analysis_runs:[],analysis_findings:[],evaluations:[],evaluation_scores:[],individual_results:[],review_comments:[],notifications:[],audit_events:[],
 }
}
