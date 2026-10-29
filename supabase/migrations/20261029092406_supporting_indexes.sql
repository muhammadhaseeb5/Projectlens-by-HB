create index if not exists teacher_invites_claimed_by_idx on private.teacher_invites(claimed_by);
create index if not exists enrollments_section_class_idx on public.enrollments(section_id,class_id);
