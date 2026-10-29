create function private.sees_group(g uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.groups x join public.assignments a on a.id=x.assignment_id where x.id=g and (private.group_member(x.id) or private.teaches(a.class_id) or exists(select 1 from public.group_invitations i where i.group_id=x.id and i.student_id=auth.uid())));
$$;
create function private.manages_group(g uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.groups x join public.assignments a on a.id=x.assignment_id where x.id=g and (private.group_member(x.id) or private.teaches(a.class_id)));
$$;
drop policy visible_group on public.groups;
create policy visible_group on public.groups for select to authenticated using(private.sees_group(id));
drop policy visible_invites on public.group_invitations;
create policy visible_invites on public.group_invitations for select to authenticated using(student_id=(select auth.uid()) or private.manages_group(group_id));
alter function public.workspace_action(text,jsonb) set schema private;
create function public.workspace_action(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select private.workspace_action(action,payload); $$;
revoke execute on function public.workspace_action(text,jsonb) from public,anon;
grant execute on function public.workspace_action(text,jsonb) to authenticated;
revoke execute on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated;

-- Draft and published-grade edits are recorded with their previous and next state.
create function private.audit_grade() returns trigger language plpgsql security definer set search_path='' as $$
declare vi uuid; cl uuid; pi uuid; eid uuid;
begin
 if tg_table_name='evaluations' then vi:=new.version_id;
 else eid:=coalesce(new.evaluation_id,old.evaluation_id);select version_id into vi from public.evaluations where id=eid;end if;
 select p.id,a.class_id into pi,cl from public.submission_versions v join public.projects p on p.id=v.project_id join public.assignments a on a.id=p.assignment_id where v.id=vi;
 insert into public.audit_events(class_id,actor_id,project_id,version_id,action,details) values(cl,auth.uid(),pi,vi,'Evaluation record '||lower(tg_op),jsonb_build_object('table',tg_table_name,'before',case when tg_op<>'INSERT' then to_jsonb(old) else null end,'after',case when tg_op<>'DELETE' then to_jsonb(new) else null end));
 return coalesce(new,old);
end $$;
create trigger evaluation_audit after insert or update on public.evaluations for each row execute function private.audit_grade();
create trigger score_audit after insert or update or delete on public.evaluation_scores for each row execute function private.audit_grade();
create trigger individual_audit after insert or update on public.individual_results for each row execute function private.audit_grade();
revoke execute on function private.audit_grade() from public,anon,authenticated;
