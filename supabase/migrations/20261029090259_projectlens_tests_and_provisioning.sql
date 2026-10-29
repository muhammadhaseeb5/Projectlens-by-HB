-- Reapply the validated mutation body using UTF-8, and enforce historical roll ownership.
create or replace function private.workspace_action(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); c public.classes; a public.assignments; p public.projects; g public.groups; v public.submission_versions; pr public.proposals; ev public.evaluations; en public.enrollments;
 target uuid; sid uuid; member_id uuid; result_id uuid; x jsonb; code_value text; total numeric; n integer; next_status text; deadline_value timestamptz;
begin
 if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'Verify your email and sign in to continue.'; end if;
 if action='profile' then
  if length(trim(payload->>'name')) not between 1 and 120 then raise exception 'Enter a name (1–120 characters).'; end if;
  update public.profiles set name=trim(payload->>'name') where id=u; return '{}';
 elsif action='enroll' then
  select ec.section_id into sid from private.enrollment_codes ec where ec.code=trim(payload->>'code') and ec.expires_at>now();
  if sid is null then raise exception 'The enrollment code is invalid or expired.'; end if;
  select * into c from public.classes where id=(select class_id from public.sections where id=sid);
  if exists(select 1 from public.enrollments where student_id=u and class_id=c.id and ended_at is null) then raise exception 'You are already enrolled. Ask your teacher for a section correction.'; end if;
  insert into public.enrollments(student_id,class_id,section_id,roll_number) values(u,c.id,sid,trim(payload->>'roll_number'));
  insert into public.audit_events(class_id,actor_id,action) values(c.id,u,'Student enrolled'); return '{}';
 elsif action='class_save' then
  target:=(payload->>'id')::uuid;
  if not private.teaches(target) then raise exception 'Not authorized for this class.'; end if;
  if not exists(select 1 from pg_timezone_names where name=payload->>'timezone') then raise exception 'Choose a valid IANA timezone.'; end if;
  update public.classes set title=left(payload->>'title',180),semester=left(payload->>'semester',120),institution=left(payload->>'institution',180),timezone=payload->>'timezone' where id=target;
  return '{}';
 elsif action='class_create' then
  if not exists(select 1 from public.user_roles where id=u and role='teacher') then raise exception 'Teacher access required.'; end if;
  insert into public.classes(teacher_id,title) values(u,coalesce(nullif(payload->>'title',''),'Web Technology')) returning id into target;
  insert into public.sections(class_id,name) select target,s from unnest(array['A','B','C']) s;
  insert into private.enrollment_codes(section_id) select id from public.sections where class_id=target;
  return jsonb_build_object('id',target);
 elsif action='enrollment_codes' then
  target:=(payload->>'class_id')::uuid;
  if not private.teaches(target) then raise exception 'Teacher access required.'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('section_id',s.id,'name',s.name,'code',ec.code,'expires_at',ec.expires_at)),'[]') from public.sections s join private.enrollment_codes ec on ec.section_id=s.id where s.class_id=target);
 elsif action='rotate_code' then
  sid:=(payload->>'section_id')::uuid;
  if not exists(select 1 from public.sections where id=sid and private.teaches(class_id)) then raise exception 'Teacher access required.'; end if;
  update private.enrollment_codes set code=replace(gen_random_uuid()::text,'-',''),expires_at=now()+interval '90 days' where section_id=sid; return '{}';
 elsif action='correct_enrollment' then
  select * into en from public.enrollments where id=(payload->>'id')::uuid and ended_at is null for update;
  sid:=(payload->>'section_id')::uuid;
  if length(trim(coalesce(payload->>'reason','')))=0 then raise exception 'An enrollment correction reason is required.'; end if;
  if en.id is null or not private.teaches(en.class_id) or not exists(select 1 from public.sections where id=sid and class_id=en.class_id) then raise exception 'Invalid enrollment correction.'; end if;
  if exists(select 1 from public.group_members gm join public.groups gr on gr.id=gm.group_id join public.assignments aa on aa.id=gr.assignment_id where gm.student_id=en.student_id and aa.class_id=en.class_id) then raise exception 'Correct active group memberships before changing sections.'; end if;
  update public.enrollments set ended_at=now() where id=en.id;
  insert into public.enrollments(student_id,class_id,section_id,roll_number) values(en.student_id,en.class_id,sid,coalesce(nullif(payload->>'roll_number',''),en.roll_number));
  insert into public.audit_events(class_id,actor_id,action,details) values(en.class_id,u,'Enrollment corrected',jsonb_build_object('student_id',en.student_id,'reason',payload->>'reason')); return '{}';
 elsif action in ('assignment_create','assignment_update') then
  if action='assignment_update' then
   select * into a from public.assignments where id=(payload->>'id')::uuid for update; target:=a.class_id;
   if exists(select 1 from public.projects where assignment_id=a.id) then raise exception 'This assignment already has projects. Create a new assignment to preserve its rubric and requirements.'; end if;
  else target:=(payload->>'class_id')::uuid; end if;
  if not private.teaches(target) then raise exception 'Teacher access required.'; end if;
  if jsonb_array_length(payload->'sections')=0 then raise exception 'Select at least one section.'; end if;
  select sum((r->>'max_marks')::numeric) into total from jsonb_array_elements(payload->'rubric') r;
  if total<>100 or total is null then raise exception 'The rubric must total 100 marks.'; end if;
  if action='assignment_create' then
   insert into public.assignments(class_id,title,description,category,technologies,mode,min_group,max_group,proposal_required,proposal_deadline,deadline,allow_late,allow_resubmit,draft_edit_members,published)
   values(target,payload->>'title',coalesce(payload->>'description',''),payload->>'category',array(select jsonb_array_elements_text(payload->'technologies')),payload->>'mode',(payload->>'min_group')::int,(payload->>'max_group')::int,coalesce((payload->>'proposal_required')::boolean,false),(payload->>'proposal_deadline')::timestamptz,(payload->>'deadline')::timestamptz,coalesce((payload->>'allow_late')::boolean,false),coalesce((payload->>'allow_resubmit')::boolean,true),coalesce((payload->>'draft_edit_members')::boolean,false),coalesce((payload->>'published')::boolean,true)) returning * into a;
  else
   update public.assignments set title=payload->>'title',description=payload->>'description',category=payload->>'category',technologies=array(select jsonb_array_elements_text(payload->'technologies')),mode=payload->>'mode',min_group=(payload->>'min_group')::int,max_group=(payload->>'max_group')::int,proposal_required=(payload->>'proposal_required')::boolean,proposal_deadline=(payload->>'proposal_deadline')::timestamptz,deadline=(payload->>'deadline')::timestamptz,allow_late=(payload->>'allow_late')::boolean,allow_resubmit=(payload->>'allow_resubmit')::boolean,published=(payload->>'published')::boolean where id=a.id;
   delete from public.assignment_sections where assignment_id=a.id; delete from public.assignment_requirements where assignment_id=a.id; delete from public.rubric_criteria where assignment_id=a.id;
  end if;
  for x in select value from jsonb_array_elements(payload->'sections') loop
   sid:=(x->>'section_id')::uuid;
   if not exists(select 1 from public.sections where id=sid and class_id=target) then raise exception 'Sections must belong to the assignment class.'; end if;
   insert into public.assignment_sections(assignment_id,section_id,deadline,instructions) values(a.id,sid,(x->>'deadline')::timestamptz,coalesce(x->>'instructions',''));
  end loop;
  n:=0; for x in select value from jsonb_array_elements(payload->'rubric') loop
   insert into public.rubric_criteria(assignment_id,title,max_marks,individual,sort_order) values(a.id,x->>'title',(x->>'max_marks')::numeric,coalesce((x->>'individual')::boolean,false),n); n:=n+1;
  end loop;
  n:=0; for code_value in select jsonb_array_elements_text(payload->'requirements') loop
   insert into public.assignment_requirements(assignment_id,title,sort_order) values(a.id,left(code_value,500),n); n:=n+1;
  end loop;
  insert into public.audit_events(class_id,actor_id,action) values(target,u,'Assignment saved'); return jsonb_build_object('id',a.id);
 elsif action='group_create' then
  select * into a from public.assignments where id=(payload->>'assignment_id')::uuid for update;
  sid:=(payload->>'section_id')::uuid;
  if a.id is null or not private.sees_assignment(a.id) or not private.in_section(sid) or not exists(select 1 from public.assignment_sections where assignment_id=a.id and section_id=sid) or a.mode='individual' then raise exception 'This group is not allowed for your enrollment.'; end if;
  if exists(select 1 from public.projects where assignment_id=a.id and owner_id=u) then raise exception 'You already have a project for this assignment.'; end if;
  insert into public.groups(assignment_id,section_id,name,leader_id) values(a.id,sid,payload->>'name',u) returning * into g;
  insert into public.group_members(group_id,assignment_id,student_id) values(g.id,a.id,u); return jsonb_build_object('id',g.id);
 elsif action in ('invite_member','respond_invite','transfer_leader','remove_member','contribution') then
  select * into g from public.groups where id=(payload->>'group_id')::uuid for update;
  select * into a from public.assignments where id=g.assignment_id;
  if g.id is null then raise exception 'Group not found.'; end if;
  if action='respond_invite' then
   if not exists(select 1 from public.group_invitations where group_id=g.id and student_id=u and status='pending') then raise exception 'Invitation not found.'; end if;
   if (payload->>'accept')::boolean then
    if not private.in_section(g.section_id) or exists(select 1 from public.projects where assignment_id=a.id and owner_id=u) then raise exception 'You must be in the same section with no other project for this assignment.'; end if;
    if (select count(*) from public.group_members where group_id=g.id)>=a.max_group then raise exception 'This group has reached its size limit.'; end if;
    insert into public.group_members(group_id,assignment_id,student_id) values(g.id,a.id,u);
   end if;
   update public.group_invitations set status=case when (payload->>'accept')::boolean then 'accepted' else 'declined' end where group_id=g.id and student_id=u;
  elsif action='contribution' then
   if not private.group_member(g.id) then raise exception 'Group membership required.'; end if;
   update public.group_members set contribution=left(payload->>'contribution',4000) where group_id=g.id and student_id=u;
  else
   if g.leader_id<>u and not private.teaches(a.class_id) then raise exception 'Only the group leader or teacher can do this.'; end if;
   if action='invite_member' then
    select pp.id into member_id from public.profiles pp join public.enrollments e on e.student_id=pp.id where lower(pp.email)=lower(trim(payload->>'email')) and e.section_id=g.section_id and e.ended_at is null;
    if member_id is null or member_id=u then raise exception 'No eligible classmate found in this section.'; end if;
    insert into public.group_invitations(group_id,student_id) values(g.id,member_id) on conflict(group_id,student_id) do update set status='pending';
    insert into public.notifications(user_id,title,body,link) values(member_id,'Group invitation',g.name,'/app/students');
   elsif action='transfer_leader' then
    member_id:=(payload->>'student_id')::uuid;
    if not exists(select 1 from public.group_members where group_id=g.id and student_id=member_id) then raise exception 'Choose an accepted member.'; end if;
    update public.groups set leader_id=member_id where id=g.id;
   else
    if not private.teaches(a.class_id) then raise exception 'Only the teacher can correct membership.'; end if;
    member_id:=(payload->>'student_id')::uuid;
    if member_id=g.leader_id then raise exception 'Transfer leadership before removing the leader.'; end if;
    delete from public.group_members where group_id=g.id and student_id=member_id;
   end if;
  end if;
  insert into public.audit_events(class_id,actor_id,action,details) values(a.class_id,u,action,jsonb_build_object('group_id',g.id)); return '{}';
 elsif action in ('project_create','project_save') then
  if action='project_create' then
   select * into a from public.assignments where id=(payload->>'assignment_id')::uuid for update;
   sid:=(payload->>'section_id')::uuid; target:=(payload->>'group_id')::uuid;
   if not private.sees_assignment(a.id) or not private.in_section(sid) or not exists(select 1 from public.assignment_sections where assignment_id=a.id and section_id=sid) then raise exception 'Authorized enrollment required.'; end if;
   if target is null then
    if a.mode='group' or exists(select 1 from public.group_members where assignment_id=a.id and student_id=u) then raise exception 'This assignment requires your group project.'; end if;
   else
    if a.mode='individual' or not exists(select 1 from public.groups where id=target and assignment_id=a.id and section_id=sid and leader_id=u) then raise exception 'Invalid group project.'; end if;
   end if;
   insert into public.projects(assignment_id,section_id,owner_id,group_id,title,description,category,technologies,repo_url,live_url,notes,limitations,feature_checklist)
    values(a.id,sid,u,target,payload->>'title',coalesce(payload->>'description',''),a.category,array(select jsonb_array_elements_text(payload->'technologies')),coalesce(payload->>'repo_url',''),coalesce(payload->>'live_url',''),coalesce(payload->>'notes',''),coalesce(payload->>'limitations',''),coalesce(payload->'feature_checklist','[]')) returning id into result_id;
  else
   result_id:=(payload->>'id')::uuid;
   if not private.edits_project(result_id) then raise exception 'Draft editing is not allowed.'; end if;
   update public.projects set title=payload->>'title',description=coalesce(payload->>'description',''),technologies=array(select jsonb_array_elements_text(payload->'technologies')),repo_url=coalesce(payload->>'repo_url',''),live_url=coalesce(payload->>'live_url',''),notes=coalesce(payload->>'notes',''),limitations=coalesce(payload->>'limitations',''),feature_checklist=coalesce(payload->'feature_checklist','[]') where id=result_id;
  end if;
  return jsonb_build_object('id',result_id);
 elsif action in ('proposal_save','proposal_decision') then
  select * into p from public.projects where id=(payload->>'project_id')::uuid for update;
  select * into a from public.assignments where id=p.assignment_id;
  select * into pr from public.proposals where project_id=p.id;
  next_status:=payload->>'status';
  if action='proposal_save' then
   if not private.edits_project(p.id) or (pr.id is not null and pr.status not in ('draft','changes_requested','rejected')) or next_status not in ('draft','submitted') then raise exception 'Proposal cannot be edited at this stage.'; end if;
   if next_status='submitted' and a.proposal_deadline is not null and now()>a.proposal_deadline then raise exception 'The proposal deadline has passed.'; end if;
   insert into public.proposals(project_id,body,status) values(p.id,left(payload->>'body',20000),next_status) on conflict(project_id) do update set body=excluded.body,status=excluded.status,reason='',updated_at=now();
  else
   if not private.teaches(a.class_id) or pr.id is null or pr.status not in ('submitted','under_review') or next_status not in ('under_review','changes_requested','approved','rejected') then raise exception 'Invalid proposal decision.'; end if;
   if next_status in ('changes_requested','rejected') and length(trim(coalesce(payload->>'reason','')))=0 then raise exception 'A reason is required.'; end if;
   update public.proposals set status=next_status,reason=coalesce(payload->>'reason',''),updated_at=now() where id=pr.id;
   insert into public.notifications(user_id,title,body,link) select student_id,'Proposal '||replace(next_status,'_',' '),coalesce(payload->>'reason',''),'/app/projects/'||p.id from public.group_members where group_id=p.group_id union all select p.owner_id,'Proposal '||replace(next_status,'_',' '),coalesce(payload->>'reason',''),'/app/projects/'||p.id where p.group_id is null;
  end if;
  insert into public.audit_events(class_id,actor_id,project_id,action) values(a.class_id,u,p.id,'Proposal '||next_status); return '{}';
 elsif action='version_create' then
  select * into p from public.projects where id=(payload->>'project_id')::uuid for update;
  select * into a from public.assignments where id=p.assignment_id;
  if not private.leads_project(p.id) then raise exception 'Only the project owner or group leader can submit.'; end if;
  if exists(select 1 from public.submission_versions where project_id=p.id and status='draft') then raise exception 'Finish the existing draft version first.'; end if;
  if exists(select 1 from public.submission_versions where project_id=p.id and status not in ('draft','changes_requested')) or (not a.allow_resubmit and exists(select 1 from public.submission_versions where project_id=p.id)) then raise exception 'A new version requires a revision request and an allowed resubmission policy.'; end if;
  insert into public.submission_versions(project_id,version,submitted_by,snapshot) select p.id,coalesce(max(version),0)+1,u,to_jsonb(p) from public.submission_versions where project_id=p.id returning id into result_id;
  insert into public.analysis_runs(version_id) values(result_id);
  return jsonb_build_object('id',result_id);
 elsif action='submit_version' then
  select * into v from public.submission_versions where id=(payload->>'version_id')::uuid for update;
  select * into p from public.projects where id=v.project_id for update;
  select * into a from public.assignments where id=p.assignment_id;
  if v.id is null or v.status<>'draft' or not private.leads_project(p.id) then raise exception 'Only an editable draft can be submitted by its leader.'; end if;
  select coalesce(s.deadline,a.deadline) into deadline_value from public.assignment_sections s where assignment_id=a.id and section_id=p.section_id;
  if deadline_value is null or (now()>deadline_value and not a.allow_late) then raise exception 'The final deadline has passed.'; end if;
  if not v.source_processed then raise exception 'Upload and validate a source ZIP before submitting.'; end if;
  if a.proposal_required and not exists(select 1 from public.proposals where project_id=p.id and status='approved') then raise exception 'Your proposal must be approved first.'; end if;
  if p.group_id is not null then
   perform 1 from public.groups where id=p.group_id for update;
   select count(*) into n from public.group_members where group_id=p.group_id;
   if n<a.min_group or n>a.max_group then raise exception 'Group size must be between % and %.',a.min_group,a.max_group; end if;
   if exists(select 1 from public.group_members m where m.group_id=p.group_id and not exists(select 1 from public.enrollments e where e.student_id=m.student_id and e.section_id=p.section_id and e.ended_at is null)) then raise exception 'All members must have an active enrollment in this section.'; end if;
   insert into public.submission_members(version_id,student_id,name,roll_number,contribution) select v.id,m.student_id,pp.name,e.roll_number,m.contribution from public.group_members m join public.profiles pp on pp.id=m.student_id join public.enrollments e on e.student_id=m.student_id and e.section_id=p.section_id and e.ended_at is null where m.group_id=p.group_id;
  else
   insert into public.submission_members(version_id,student_id,name,roll_number) select v.id,u,pp.name,e.roll_number from public.profiles pp join public.enrollments e on e.student_id=pp.id and e.section_id=p.section_id and e.ended_at is null where pp.id=u;
   if not found then raise exception 'Active enrollment required.'; end if;
  end if;
  update public.submission_versions set status=case when version=1 then 'submitted' else 'resubmitted' end,submitted_at=now(),late=now()>deadline_value,snapshot=to_jsonb(p) where id=v.id;
  insert into public.notifications(user_id,title,body,link) select student_id,'Submission received',p.title||' · version '||v.version,'/app/projects/'||p.id from public.submission_members where version_id=v.id;
  insert into public.audit_events(class_id,actor_id,project_id,version_id,action) values(a.class_id,u,p.id,v.id,'Version submitted'); return '{}';
 elsif action in ('review_transition','evaluation_save','release_results','comment_add','individual_save') then
  select * into v from public.submission_versions where id=(payload->>'version_id')::uuid for update;
  select * into p from public.projects where id=v.project_id;
  select * into a from public.assignments where id=p.assignment_id;
  if v.id is null or not private.teaches(a.class_id) or v.status='draft' then raise exception 'Teacher access to a submitted version is required.'; end if;
  if action='review_transition' then
   next_status:=payload->>'status';
   if not ((v.status in ('submitted','resubmitted') and next_status='under_review') or (v.status='under_review' and next_status in ('changes_requested','approved')) or (v.status='approved' and next_status='under_review' and length(trim(coalesce(payload->>'reason','')))>0)) then raise exception 'This review transition is not allowed.'; end if;
   if next_status='changes_requested' and length(trim(coalesce(payload->>'reason','')))=0 then raise exception 'Give a revision reason.'; end if;
   if next_status='approved' and not exists(select 1 from public.evaluations where version_id=v.id) then raise exception 'Save an evaluation before approval.'; end if;
   update public.submission_versions set status=next_status,change_reason=coalesce(payload->>'reason','') where id=v.id;
   update public.evaluations set decision=case when next_status in ('approved','changes_requested') then next_status else 'pending' end where version_id=v.id;
   if next_status in ('approved','changes_requested') then insert into public.notifications(user_id,title,body,link) select student_id,case when next_status='approved' then 'Submission approved' else 'Changes requested' end,coalesce(payload->>'reason',''),'/app/projects/'||p.id from public.submission_members where version_id=v.id; end if;
  elsif action='comment_add' then
   insert into public.review_comments(version_id,author_id,body,path,line,released) values(v.id,u,payload->>'body',nullif(payload->>'path',''),(payload->>'line')::int,false);
  elsif action='evaluation_save' then
   insert into public.evaluations(version_id,teacher_id,strengths,improvements,comments,checklist) values(v.id,u,coalesce(payload->>'strengths',''),coalesce(payload->>'improvements',''),coalesce(payload->>'comments',''),coalesce(payload->'checklist','{}')) on conflict(version_id) do update set strengths=excluded.strengths,improvements=excluded.improvements,comments=excluded.comments,checklist=excluded.checklist,evaluated_at=now() returning * into ev;
   delete from public.evaluation_scores where evaluation_id=ev.id;
   for x in select value from jsonb_array_elements(payload->'scores') loop
    if not exists(select 1 from public.rubric_criteria where id=(x->>'criterion_id')::uuid and assignment_id=a.id and not individual and (x->>'marks')::numeric between 0 and max_marks) then raise exception 'Marks must match a shared criterion and its limit.'; end if;
    insert into public.evaluation_scores(evaluation_id,criterion_id,marks) values(ev.id,(x->>'criterion_id')::uuid,(x->>'marks')::numeric);
   end loop;
   next_status:='Evaluation saved';
  elsif action='individual_save' then
   select * into ev from public.evaluations where version_id=v.id;
   member_id:=(payload->>'student_id')::uuid;
   if ev.id is null or not exists(select 1 from public.submission_members where version_id=v.id and student_id=member_id) then raise exception 'Save an evaluation and choose a version member.'; end if;
   select coalesce(sum(max_marks),0) into total from public.rubric_criteria where assignment_id=a.id and individual;
   if (payload->>'marks')::numeric not between 0 and total or length(trim(coalesce(payload->>'reason','')))=0 then raise exception 'Individual marks exceed their limit, or a reason is missing.'; end if;
   insert into public.individual_results(evaluation_id,student_id,marks,reason,private_feedback) values(ev.id,member_id,(payload->>'marks')::numeric,payload->>'reason',coalesce(payload->>'private_feedback','')) on conflict(evaluation_id,student_id) do update set marks=excluded.marks,reason=excluded.reason,private_feedback=excluded.private_feedback;
   next_status:='Individual evaluation saved';
  else
   select * into ev from public.evaluations where version_id=v.id;
   if ev.id is null or (select count(*) from public.evaluation_scores where evaluation_id=ev.id)<>(select count(*) from public.rubric_criteria where assignment_id=a.id and not individual) then raise exception 'Complete all shared rubric criteria before release.'; end if;
   if exists(select 1 from public.rubric_criteria where assignment_id=a.id and individual) and (select count(*) from public.individual_results where evaluation_id=ev.id)<>(select count(*) from public.submission_members where version_id=v.id) then raise exception 'Record individual marks for every version member before release.'; end if;
   update public.evaluations set released_at=now() where id=ev.id;
   update public.review_comments set released=true where version_id=v.id;
   insert into public.notifications(user_id,title,body,link) select student_id,'Results released',p.title||' · version '||v.version,'/app/review/'||v.id||'/sheet' from public.submission_members where version_id=v.id;
   next_status:='Results released';
  end if;
  insert into public.audit_events(class_id,actor_id,project_id,version_id,action,details) values(a.class_id,u,p.id,v.id,coalesce(next_status,action),jsonb_build_object('reason',payload->>'reason','previous_status',v.status)); return '{}';
 elsif action='read_notification' then
  update public.notifications set read_at=now() where user_id=u and (payload->>'id' is null or id=(payload->>'id')::uuid); return '{}';
 else raise exception 'Unknown workspace action.';
 end if;
end $$;

create function private.reserve_roll_number() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.classes where id=new.class_id for update;
 if exists(select 1 from public.enrollments where class_id=new.class_id and lower(roll_number)=lower(new.roll_number) and student_id<>new.student_id) then raise exception 'This roll number already belongs to another student in this class, including enrollment history.'; end if;
 return new;
end $$;
create trigger preserve_roll_ownership before insert on public.enrollments for each row execute function private.reserve_roll_number();
create index enrollments_historical_roll_idx on public.enrollments(class_id,lower(roll_number));
revoke execute on function private.reserve_roll_number() from public,anon,authenticated;
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;
