-- AUNO live-member operations. Run after 001 and 002, in that order.
-- No mock persons, venue inventory, payments or custody are created.
-- All elevated operations use audited database functions, not client-controlled roles.

create table if not exists public.member_connections (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.profiles(id) on delete cascade,
 receiver_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined','blocked')),
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 constraint no_self_connection check(requester_id <> receiver_id)
);
create unique index if not exists unique_member_pair on public.member_connections(
 least(requester_id,receiver_id), greatest(requester_id,receiver_id));
create index if not exists connections_by_receiver on public.member_connections(receiver_id,status);
alter table public.member_connections enable row level security;
create policy member_connections_private on public.member_connections for select to authenticated
 using(requester_id=(select auth.uid()) or receiver_id=(select auth.uid()) or public.is_operator());
revoke all on public.member_connections from anon,authenticated;
grant select on public.member_connections to authenticated;

create or replace function public.request_member_connection(p_receiver uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=(select auth.uid()); v_id uuid;
begin
 if v_uid is null then raise exception 'Sign in first'; end if;
 if p_receiver=v_uid then raise exception 'Cannot connect with yourself'; end if;
 if not exists(select 1 from public.profiles where id=p_receiver and discoverable=true)
 then raise exception 'Member is not currently open to introductions'; end if;
 if exists(select 1 from public.member_connections where
  (requester_id=v_uid and receiver_id=p_receiver) or (requester_id=p_receiver and receiver_id=v_uid))
 then raise exception 'Connection already requested or exists'; end if;
 insert into public.member_connections(requester_id,receiver_id)
 values(v_uid,p_receiver) returning id into v_id;
 insert into public.audit_events(actor_id,action,subject_id) values(v_uid,'connection_requested',v_id);
 return v_id;
end;$$;
revoke all on function public.request_member_connection(uuid) from public,anon;
grant execute on function public.request_member_connection(uuid) to authenticated;

create or replace function public.respond_member_connection(p_connection uuid,p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=(select auth.uid());
begin
 if v_uid is null then raise exception 'Sign in first'; end if;
 update public.member_connections
 set status=case when p_accept then 'accepted' else 'declined' end,responded_at=now()
 where id=p_connection and receiver_id=v_uid and status='pending';
 if not found then raise exception 'Pending invitation not found'; end if;
 insert into public.audit_events(actor_id,action,subject_id,metadata)
 values(v_uid,'connection_responded',p_connection,jsonb_build_object('accepted',p_accept));
end;$$;
revoke all on function public.respond_member_connection(uuid,boolean) from public,anon;
grant execute on function public.respond_member_connection(uuid,boolean) to authenticated;

create or replace function public.withdraw_member_connection(p_connection uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=(select auth.uid());
begin
 if v_uid is null then raise exception 'Sign in first'; end if;
 delete from public.member_connections where id=p_connection and
  ((requester_id=v_uid and status='pending') or ((requester_id=v_uid or receiver_id=v_uid) and status in ('accepted','declined')));
 if not found then raise exception 'Connection cannot be removed'; end if;
 insert into public.audit_events(actor_id,action,subject_id) values(v_uid,'connection_removed',p_connection);
end;$$;
revoke all on function public.withdraw_member_connection(uuid) from public,anon;
grant execute on function public.withdraw_member_connection(uuid) to authenticated;

-- User-authored Homebase list; not fictitious completion data.
create table if not exists public.homebase_tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 3 and 120),
 completed boolean not null default false,
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
create index if not exists homebase_tasks_user_idx on public.homebase_tasks(user_id,created_at);
alter table public.homebase_tasks enable row level security;
create policy homebase_tasks_select_self on public.homebase_tasks for select to authenticated using(user_id=(select auth.uid()));
create policy homebase_tasks_insert_self on public.homebase_tasks for insert to authenticated with check(user_id=(select auth.uid()));
create policy homebase_tasks_update_self on public.homebase_tasks for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy homebase_tasks_delete_self on public.homebase_tasks for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.homebase_tasks from public,anon,authenticated;
grant select,delete on public.homebase_tasks to authenticated;
grant insert(user_id,title) on public.homebase_tasks to authenticated;
grant update(title,completed,completed_at) on public.homebase_tasks to authenticated;

-- Only trained operators can record attendance after a physical check-in.
create table if not exists public.event_checkins (
 booking_id uuid primary key references public.event_bookings(id) on delete cascade,
 operator_id uuid not null references public.operator_accounts(user_id),
 checked_in_at timestamptz not null default now()
);
alter table public.event_checkins enable row level security;
create policy checkins_visible_self_host_operator on public.event_checkins for select to authenticated using(
 public.is_operator() or exists (select 1 from public.event_bookings b
 join public.events e on e.id=b.event_id where b.id=booking_id and
 (b.user_id=(select auth.uid()) or e.owner_id=(select auth.uid()))));
revoke all on public.event_checkins from public,anon,authenticated;
grant select on public.event_checkins to authenticated;
create or replace function public.operator_record_checkin(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_booking public.event_bookings%rowtype; v_event public.events%rowtype;
begin
 if not public.is_operator() then raise exception 'Operator access required'; end if;
 select * into v_booking from public.event_bookings where id=p_booking_id and status='confirmed' for update;
 if not found then raise exception 'Confirmed booking not found'; end if;
 select * into v_event from public.events where id=v_booking.event_id and status='published';
 if not found then raise exception 'Published event not found'; end if;
 if now()<v_event.start_at-interval '3 hours' or now()>v_event.end_at+interval '48 hours'
 then raise exception 'Outside approved attendance window'; end if;
 insert into public.event_checkins(booking_id,operator_id)
 values(p_booking_id,(select auth.uid())) on conflict(booking_id) do nothing;
 insert into public.passport_stamps(user_id,stamp_key,source_type,source_id)
 values(v_booking.user_id,'attended_event','event_checkin',v_event.id) on conflict do nothing;
 insert into public.audit_events(actor_id,action,subject_id)
 values((select auth.uid()),'event_checkin',p_booking_id);
end;$$;
revoke all on function public.operator_record_checkin(uuid) from public,anon;
grant execute on function public.operator_record_checkin(uuid) to authenticated;

-- User requests for privacy rights: manual operator fulfillment and secure identity verification required.
create table if not exists public.privacy_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 request_type text not null check(request_type in ('data_export','account_deletion','privacy_question')),
 details text not null default '' check(char_length(details)<=1000),
 status text not null default 'submitted' check(status in ('submitted','processing','completed','declined')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.privacy_requests enable row level security;
create policy privacy_self_or_operator on public.privacy_requests for select to authenticated
 using(user_id=(select auth.uid()) or public.is_operator());
create policy privacy_request_create_self on public.privacy_requests for insert to authenticated
 with check(user_id=(select auth.uid()) and status='submitted');
revoke all on public.privacy_requests from public,anon,authenticated;
grant select on public.privacy_requests to authenticated;
grant insert(user_id,request_type,details) on public.privacy_requests to authenticated;

create or replace function public.operator_resolve_report(p_report_id uuid,p_resolution text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_operator() then raise exception 'Not authorised'; end if;
 if char_length(trim(coalesce(p_resolution,'')))<10 then raise exception 'Resolution note is required'; end if;
 update public.moderation_reports set status='resolved'
 where id=p_report_id and status in ('open','investigating');
 if not found then raise exception 'Open report not found'; end if;
 insert into public.audit_events(actor_id,action,subject_id,metadata)
 values((select auth.uid()),'resolve_report',p_report_id,jsonb_build_object('resolution_note',left(p_resolution,500)));
end;$$;
revoke all on function public.operator_resolve_report(uuid,text) from public,anon;
grant execute on function public.operator_resolve_report(uuid,text) to authenticated;

-- Limit published catalogue read to anonymous guests. Admin and private records remain protected.
create policy anonymous_published_communities on public.communities for select to anon using(status='approved');
create policy anonymous_published_events on public.events for select to anon using(status='published');
grant select(id,name,description,category,area,visibility,status) on public.communities to anon;
grant select(id,title,description,category,area,venue,start_at,end_at,capacity,price_aed_cents,status) on public.events to anon;

-- No service-role tokens, admin self-service elevation, money or sensitive ID media here.

-- One-way block list with reciprocal discovery and introduction enforcement.
create table if not exists public.member_blocks (
 blocker_id uuid not null references public.profiles(id) on delete cascade,
 blocked_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id),
 check(blocker_id<>blocked_id)
);
alter table public.member_blocks enable row level security;
create policy member_blocks_view_own on public.member_blocks for select to authenticated using(blocker_id=(select auth.uid()));
revoke all on public.member_blocks from public,anon,authenticated;
grant select on public.member_blocks to authenticated;

create or replace function public.may_discover_profile(p_target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select not exists(select 1 from public.member_blocks
  where (blocker_id=(select auth.uid()) and blocked_id=p_target)
     or (blocker_id=p_target and blocked_id=(select auth.uid())));
$$;
revoke all on function public.may_discover_profile(uuid) from public,anon;
grant execute on function public.may_discover_profile(uuid) to authenticated;

-- Replace the original visibility policy so blocking works at the database level, not only in UI.
drop policy if exists profiles_visible_to_self_or_opted_in on public.profiles;
create policy profiles_visible_to_self_or_opted_in on public.profiles for select to authenticated
 using(id=(select auth.uid()) or public.is_operator() or
       (discoverable and public.may_discover_profile(id)));

create or replace function public.block_member(p_target uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=(select auth.uid());
begin
 if v_uid is null then raise exception 'Sign in first'; end if;
 if v_uid=p_target then raise exception 'Cannot block yourself'; end if;
 if not exists(select 1 from public.profiles where id=p_target) then raise exception 'Member not found'; end if;
 insert into public.member_blocks(blocker_id,blocked_id) values(v_uid,p_target)
 on conflict do nothing;
 delete from public.member_connections where
  (requester_id=v_uid and receiver_id=p_target) or (requester_id=p_target and receiver_id=v_uid);
 insert into public.audit_events(actor_id,action,subject_id) values(v_uid,'member_blocked',p_target);
end;$$;
revoke all on function public.block_member(uuid) from public,anon;
grant execute on function public.block_member(uuid) to authenticated;

create or replace function public.unblock_member(p_target uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=(select auth.uid());
begin
 if v_uid is null then raise exception 'Sign in first'; end if;
 delete from public.member_blocks where blocker_id=v_uid and blocked_id=p_target;
 insert into public.audit_events(actor_id,action,subject_id) values(v_uid,'member_unblocked',p_target);
end;$$;
revoke all on function public.unblock_member(uuid) from public,anon;
grant execute on function public.unblock_member(uuid) to authenticated;

-- Override earlier introduction RPC to enforce reciprocal blocks.
create or replace function public.request_member_connection(p_receiver uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=(select auth.uid()); v_id uuid;
begin
 if v_uid is null then raise exception 'Sign in first'; end if;
 if p_receiver=v_uid then raise exception 'Cannot connect with yourself'; end if;
 if not exists(select 1 from public.profiles where id=p_receiver and discoverable=true)
  or not public.may_discover_profile(p_receiver)
 then raise exception 'Member is not currently open to introductions'; end if;
 if exists(select 1 from public.member_connections where
  (requester_id=v_uid and receiver_id=p_receiver) or (requester_id=p_receiver and receiver_id=v_uid))
 then raise exception 'Connection already requested or exists'; end if;
 insert into public.member_connections(requester_id,receiver_id)
 values(v_uid,p_receiver) returning id into v_id;
 insert into public.audit_events(actor_id,action,subject_id) values(v_uid,'connection_requested',v_id);
 return v_id;
end;$$;
revoke all on function public.request_member_connection(uuid) from public,anon;
grant execute on function public.request_member_connection(uuid) to authenticated;

-- Contact information for genuine, opt-in business enquiries only (private via existing RLS).
alter table public.business_pilot_requests add column if not exists contact_email text;
alter table public.business_pilot_requests
 add constraint business_contact_email_format check (contact_email is null or (char_length(contact_email) between 5 and 254 and contact_email like '%@%.%'));
grant insert(contact_email) on public.business_pilot_requests to authenticated;

-- Exact server-side operational aggregates; unlike client-side pagination, they
-- remain correct when reservations exceed a thousand records.
create or replace function public.operator_dashboard_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_operator() then raise exception 'Not authorised'; end if;
 return jsonb_build_object(
  'members',(select count(*) from public.profiles),
  'approved_communities',(select count(*) from public.communities where status='approved'),
  'published_events',(select count(*) from public.events where status='published'),
  'active_reservations',(select count(*) from public.event_bookings where status='confirmed'),
  'recorded_checkins',(select count(*) from public.event_checkins),
  'pending_communities',(select count(*) from public.communities where status='pending'),
  'open_reports',(select count(*) from public.moderation_reports where status in ('open','investigating')),
  'pending_places',(select count(*) from public.place_recommendations where status='pending'),
  'pending_circles',(select count(*) from public.circle_series where status='draft'),
  'pending_business',(select count(*) from public.business_pilot_requests where status='pending')
 );
end;$$;
revoke all on function public.operator_dashboard_overview() from public,anon;
grant execute on function public.operator_dashboard_overview() to authenticated;

create or replace function public.operator_monthly_bookings(p_months integer default 12)
returns table(month_date date,booking_count bigint,attendance_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_operator() then raise exception 'Not authorised'; end if;
 if p_months<1 or p_months>24 then raise exception 'Allowed range is 1 to 24 months'; end if;
 return query
 with buckets as (select generate_series(
  date_trunc('month',now())-((p_months-1)||' months')::interval,
  date_trunc('month',now()), interval '1 month')::date as mon),
 reservation_counts as (select date_trunc('month',b.created_at)::date as mon,count(*) as n
  from public.event_bookings b
  where b.created_at >= date_trunc('month',now())-((p_months-1)||' months')::interval
  group by 1),
 attendance_counts as (select date_trunc('month',c.checked_in_at)::date as mon,count(*) as n
  from public.event_checkins c
  where c.checked_in_at >= date_trunc('month',now())-((p_months-1)||' months')::interval
  group by 1)
 select buckets.mon,coalesce(reservation_counts.n,0)::bigint,
  coalesce(attendance_counts.n,0)::bigint
 from buckets left join reservation_counts using(mon) left join attendance_counts using(mon)
 order by buckets.mon;
end;$$;
revoke all on function public.operator_monthly_bookings(integer) from public,anon;
grant execute on function public.operator_monthly_bookings(integer) to authenticated;
