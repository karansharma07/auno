-- AUNO 3.0 · OPTIONAL LIVE-ALPHA EXPERIENCE SCHEMA
-- Apply AFTER 202611060001_foundation.sql in a separately configured Supabase project.
-- This migration only creates data structures, guardrails and limited workflows.
-- The current eight-feature GitHub Pages demo remains localStorage-based: it is NOT wired
-- to these tables. No payments, official verification, luggage or paid travel products.

-- Recurring small circles are created by approved community owners and published by operators.
create table if not exists public.circle_series (
 id uuid primary key default gen_random_uuid(),
 community_id uuid not null references public.communities(id) on delete cascade,
 owner_id uuid not null references public.profiles(id),
 title text not null check(char_length(title) between 4 and 100),
 description text not null check(char_length(description) between 20 and 1200),
 area text not null check(char_length(area) between 2 and 100),
 cadence text not null check(cadence in ('weekly','fortnightly','monthly')),
 capacity integer not null check(capacity between 3 and 30),
 status text not null default 'draft' check(status in ('draft','published','paused')),
 created_at timestamptz not null default now()
);
create index if not exists circle_series_public_idx on public.circle_series(status,created_at desc);
create table if not exists public.circle_series_members (
 series_id uuid not null references public.circle_series(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'joined' check(status in ('joined','left')),
 created_at timestamptz not null default now(),
 primary key(series_id,user_id)
);

-- Passport stamps must come from trusted activity or server-side evidence, never a self-issuance API.
create table if not exists public.passport_stamps (
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 stamp_key text not null check(char_length(stamp_key) between 3 and 90),
 source_type text not null check(source_type in ('event_checkin','community_milestone','approved_experience')),
 source_id uuid,
 awarded_at timestamptz not null default now(),
 unique(user_id,stamp_key,source_type,source_id)
);
create index if not exists passport_member_idx on public.passport_stamps(user_id,awarded_at desc);

-- Journeys: private saved plans. Never put passport IDs, precise location traces,
-- or payment details in JSONB. Retention/deletion policy required before public signups.
create table if not exists public.member_journeys (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 3 and 100),
 destination text not null default 'Dubai' check(char_length(destination) between 2 and 100),
 begins_on date not null,
 duration_days integer not null check(duration_days between 1 and 30),
 plan jsonb not null default '[]'::jsonb check(jsonb_typeof(plan)='array'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists member_journeys_user_idx on public.member_journeys(user_id,created_at desc);

-- Lens: approved submissions are separately distinguished from verified professional guidance.
create table if not exists public.place_recommendations (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 3 and 100),
 area text not null check(char_length(area) between 2 and 100),
 category text not null check(category in ('Culture','Art','Food','Outdoors','Sports')),
 tip text not null check(char_length(tip) between 20 and 600),
 status text not null default 'pending' check(status in ('pending','approved','rejected','hidden')),
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index if not exists lens_review_queue_idx on public.place_recommendations(status,submitted_at desc);
create table if not exists public.saved_recommendations (
 user_id uuid not null references public.profiles(id) on delete cascade,
 recommendation_id uuid not null references public.place_recommendations(id) on delete cascade,
 saved_at timestamptz not null default now(),
 primary key(user_id,recommendation_id)
);

-- Homebase: user-managed preferences/checklist only, never external identity or residency proof.
create table if not exists public.homebase_progress (
 user_id uuid not null references public.profiles(id) on delete cascade,
 task_key text not null check(char_length(task_key) between 3 and 90),
 completed_at timestamptz not null default now(),
 primary key(user_id,task_key)
);

-- HostOS: operational drafts can only be read/written by approved community owners.
create table if not exists public.host_event_templates (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 community_id uuid not null references public.communities(id) on delete cascade,
 name text not null check(char_length(name) between 4 and 100),
 category text not null check(char_length(category) between 2 and 60),
 venue text not null check(char_length(venue) between 2 and 200),
 area text not null check(char_length(area) between 2 and 100),
 description text not null check(char_length(description) between 20 and 2000),
 capacity integer not null check(capacity between 2 and 500),
 created_at timestamptz not null default now()
);

-- Business pilot applications intentionally omit contact PII and payment fields.
create table if not exists public.business_pilot_requests (
 id uuid primary key default gen_random_uuid(),
 requested_by uuid not null references public.profiles(id) on delete cascade,
 organisation_name text not null check(char_length(organisation_name) between 3 and 120),
 organisation_type text not null check(organisation_type in ('hotel','residence','company','university')),
 size_band text not null check(size_band in ('1-50','51-200','201-1000','1000+')),
 goal text not null check(char_length(goal) between 3 and 120),
 proposal text not null check(char_length(proposal) between 15 and 1500),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create index if not exists biz_pilot_queue_idx on public.business_pilot_requests(status,created_at desc);

alter table public.circle_series enable row level security;
alter table public.circle_series_members enable row level security;
alter table public.passport_stamps enable row level security;
alter table public.member_journeys enable row level security;
alter table public.place_recommendations enable row level security;
alter table public.saved_recommendations enable row level security;
alter table public.homebase_progress enable row level security;
alter table public.host_event_templates enable row level security;
alter table public.business_pilot_requests enable row level security;

create policy "circle_series_visibility" on public.circle_series for select to authenticated
 using (status='published' or owner_id=(select auth.uid()) or public.is_operator());
create policy "circle_series_draft_create" on public.circle_series for insert to authenticated
 with check (owner_id=(select auth.uid()) and status='draft' and exists
 (select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid()) and c.status='approved'));
create policy "circle_series_draft_edit" on public.circle_series for update to authenticated
 using(owner_id=(select auth.uid()) and status='draft') with check(owner_id=(select auth.uid()) and status='draft');
create policy "circle_members_visibility" on public.circle_series_members for select to authenticated
 using(user_id=(select auth.uid()) or public.is_operator() or exists
 (select 1 from public.circle_series s where s.id=series_id and s.owner_id=(select auth.uid())));
create policy "passport_private" on public.passport_stamps for select to authenticated
 using(user_id=(select auth.uid()) or public.is_operator());
create policy "journey_owner_read" on public.member_journeys for select to authenticated using(user_id=(select auth.uid()));
create policy "journey_owner_create" on public.member_journeys for insert to authenticated with check(user_id=(select auth.uid()));
create policy "journey_owner_edit" on public.member_journeys for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "journey_owner_delete" on public.member_journeys for delete to authenticated using(user_id=(select auth.uid()));
create policy "lens_public_or_owner" on public.place_recommendations for select to authenticated
 using(status='approved' or author_id=(select auth.uid()) or public.is_operator());
create policy "lens_submit_pending" on public.place_recommendations for insert to authenticated
 with check(author_id=(select auth.uid()) and status='pending');
create policy "saved_lens_private" on public.saved_recommendations for select to authenticated using(user_id=(select auth.uid()));
create policy "saved_lens_add" on public.saved_recommendations for insert to authenticated
 with check(user_id=(select auth.uid()) and exists(select 1 from public.place_recommendations r where r.id=recommendation_id and r.status='approved'));
create policy "saved_lens_delete" on public.saved_recommendations for delete to authenticated using(user_id=(select auth.uid()));
create policy "homebase_private" on public.homebase_progress for select to authenticated using(user_id=(select auth.uid()));
create policy "homebase_add" on public.homebase_progress for insert to authenticated with check(user_id=(select auth.uid()));
create policy "homebase_remove" on public.homebase_progress for delete to authenticated using(user_id=(select auth.uid()));
create policy "hostos_read_owner" on public.host_event_templates for select to authenticated
 using(owner_id=(select auth.uid()) or public.is_operator());
create policy "hostos_create_owner" on public.host_event_templates for insert to authenticated
 with check(owner_id=(select auth.uid()) and exists
 (select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid()) and c.status='approved'));
create policy "hostos_edit_owner" on public.host_event_templates for update to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "hostos_delete_owner" on public.host_event_templates for delete to authenticated using(owner_id=(select auth.uid()));
create policy "biz_request_private" on public.business_pilot_requests for select to authenticated
 using(requested_by=(select auth.uid()) or public.is_operator());
create policy "biz_request_create" on public.business_pilot_requests for insert to authenticated
 with check(requested_by=(select auth.uid()) and status='pending');

-- Strict client grants: never permit direct approval, self-awarding Passport stamps,
-- changing hosts, or modifying another member's own progress.
revoke all on public.circle_series,public.circle_series_members,public.passport_stamps,
 public.member_journeys,public.place_recommendations,public.saved_recommendations,
 public.homebase_progress,public.host_event_templates,public.business_pilot_requests
 from anon,authenticated;
grant select on public.circle_series,public.circle_series_members,public.passport_stamps,
 public.member_journeys,public.place_recommendations,public.saved_recommendations,
 public.homebase_progress,public.host_event_templates,public.business_pilot_requests to authenticated;
grant insert(community_id,owner_id,title,description,area,cadence,capacity) on public.circle_series to authenticated;
grant update(title,description,area,cadence,capacity) on public.circle_series to authenticated;
grant insert(user_id,title,destination,begins_on,duration_days,plan) on public.member_journeys to authenticated;
grant update(title,destination,begins_on,duration_days,plan,updated_at) on public.member_journeys to authenticated;
grant delete on public.member_journeys to authenticated;
grant insert(author_id,title,area,category,tip) on public.place_recommendations to authenticated;
grant insert(user_id,recommendation_id) on public.saved_recommendations to authenticated;
grant delete on public.saved_recommendations to authenticated;
grant insert(user_id,task_key) on public.homebase_progress to authenticated;
grant delete on public.homebase_progress to authenticated;
grant insert(owner_id,community_id,name,category,venue,area,description,capacity) on public.host_event_templates to authenticated;
grant update(name,category,venue,area,description,capacity) on public.host_event_templates to authenticated;
grant delete on public.host_event_templates to authenticated;
grant insert(requested_by,organisation_name,organisation_type,size_band,goal,proposal) on public.business_pilot_requests to authenticated;

-- Atomic circle enrollment: the client has no direct INSERT/UPDATE privilege to membership.
create or replace function public.join_circle_series(p_series_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_series public.circle_series%rowtype; v_uid uuid:=(select auth.uid()); v_count integer;
begin
 if v_uid is null then raise exception 'Please sign in'; end if;
 select * into v_series from public.circle_series where id=p_series_id and status='published' for update;
 if not found then raise exception 'Circle not available'; end if;
 select count(*) into v_count from public.circle_series_members where series_id=p_series_id and status='joined';
 if exists(select 1 from public.circle_series_members where series_id=p_series_id and user_id=v_uid and status='joined') then return 'joined'; end if;
 if v_count>=v_series.capacity then raise exception 'Circle is full'; end if;
 insert into public.circle_series_members(series_id,user_id,status) values(p_series_id,v_uid,'joined')
 on conflict(series_id,user_id) do update set status='joined',created_at=now();
 insert into public.audit_events(actor_id,action,subject_id) values(v_uid,'join_circle_series',p_series_id);
 return 'joined';
end;$$;
revoke all on function public.join_circle_series(uuid) from public,anon;
grant execute on function public.join_circle_series(uuid) to authenticated;

create or replace function public.leave_circle_series(p_series_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is null then raise exception 'Please sign in'; end if;
 update public.circle_series_members set status='left'
 where series_id=p_series_id and user_id=(select auth.uid()) and status='joined';
 insert into public.audit_events(actor_id,action,subject_id) values((select auth.uid()),'leave_circle_series',p_series_id);
end;$$;
revoke all on function public.leave_circle_series(uuid) from public,anon;
grant execute on function public.leave_circle_series(uuid) to authenticated;

-- Approval requires an operator account provisioned out-of-band, as in migration 001.
create or replace function public.operator_review_lens(p_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_operator() then raise exception 'Not authorised'; end if;
 update public.place_recommendations set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now()
 where id=p_id and status='pending';
 if not found then raise exception 'Pending recommendation not found'; end if;
 insert into public.audit_events(actor_id,action,subject_id,metadata)
 values((select auth.uid()),'review_lens',p_id,jsonb_build_object('approved',p_approve));
end;$$;
revoke all on function public.operator_review_lens(uuid,boolean) from public,anon;
grant execute on function public.operator_review_lens(uuid,boolean) to authenticated;

create or replace function public.operator_review_business_pilot(p_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_operator() then raise exception 'Not authorised'; end if;
 update public.business_pilot_requests set status=case when p_approve then 'approved' else 'rejected' end
 where id=p_id and status='pending';
 if not found then raise exception 'Pending request not found'; end if;
 insert into public.audit_events(actor_id,action,subject_id,metadata)
 values((select auth.uid()),'review_business_pilot',p_id,jsonb_build_object('approved',p_approve));
end;$$;
revoke all on function public.operator_review_business_pilot(uuid,boolean) from public,anon;
grant execute on function public.operator_review_business_pilot(uuid,boolean) to authenticated;

create or replace function public.operator_publish_circle(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_operator() then raise exception 'Not authorised'; end if;
 update public.circle_series set status='published' where id=p_id and status='draft';
 if not found then raise exception 'Pending series not found'; end if;
 insert into public.audit_events(actor_id,action,subject_id) values((select auth.uid()),'publish_circle_series',p_id);
end;$$;
revoke all on function public.operator_publish_circle(uuid) from public,anon;
grant execute on function public.operator_publish_circle(uuid) to authenticated;

-- These are scaffolding tables/RPCs, not a public release claim.
-- QA before activation: verify RLS for anonymous/member/host/operator,
-- malicious inputs, concurrency/capacity, rate limits, moderation, and deletion/retention.
