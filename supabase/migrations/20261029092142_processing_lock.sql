alter table public.analysis_runs add column started_at timestamptz;
create function public.begin_source(p_version uuid,p_actor uuid) returns void language plpgsql security definer set search_path='' as $$
declare v public.submission_versions; r public.analysis_runs;
begin
 select * into v from public.submission_versions where id=p_version for update;
 if v.id is null or v.status<>'draft' or v.source_processed or not exists(select 1 from public.projects p left join public.groups g on g.id=p.group_id where p.id=v.project_id and case when p.group_id is null then p.owner_id=p_actor else g.leader_id=p_actor end) then raise exception 'This draft is not editable by the authenticated submitter.'; end if;
 select * into r from public.analysis_runs where version_id=v.id for update;
 if r.status='running' and r.started_at>now()-interval '2 minutes' then raise exception 'Source processing is already running. Wait for it to complete.'; end if;
 update public.analysis_runs set status='running',started_at=now(),error=null where id=r.id;
end $$;
revoke all on function public.begin_source(uuid,uuid) from public,anon,authenticated;
grant execute on function public.begin_source(uuid,uuid) to service_role;
create or replace function private.storage_editable(n text) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 return exists(select 1 from public.submission_versions v where v.id=split_part(n,'/',1)::uuid and v.status='draft' and not v.source_processed and private.leads_project(v.project_id) and not exists(select 1 from public.analysis_runs r where r.version_id=v.id and r.status='running' and r.started_at>now()-interval '2 minutes')) and n=split_part(n,'/',1)||'/source.zip';
exception when invalid_text_representation then return false;
end $$;
