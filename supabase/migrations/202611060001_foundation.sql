-- AUNO LIVE ALPHA · SECURITY-FIRST STARTING SCHEMA
-- Designed for a NEW Supabase project. Run in Supabase SQL Editor after review.
-- Real payment, ID verification, luggage custody, payouts and messaging are NOT enabled here.
-- All user-facing actions must be protected server-side, never through demo persona selection.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'AUNO member' check (char_length(display_name) between 2 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  mode text not null default 'resident' check (mode in ('resident','visitor')),
  interests text[] not null default '{}',
  discoverable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membership in this table MUST be granted manually by a trusted operator / service role.
-- There are no client-write policies for this table.
create table if not exists public.operator_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now()
);

create or replace function public.is_operator()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.operator_accounts where user_id = (select auth.uid()));
$$;
revoke all on function public.is_operator() from public, anon;
grant execute on function public.is_operator() to authenticated;

create or replace function public.create_member_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id, display_name)
 values (new.id, case when char_length(trim(coalesce(new.raw_user_meta_data->>'full_name',''))) >= 2
    then left(trim(new.raw_user_meta_data->>'full_name'),80) else 'AUNO member' end)
 on conflict (id) do nothing;
 return new;
end;
$$;
drop trigger if exists auno_on_auth_user_created on auth.users;
create trigger auno_on_auth_user_created after insert on auth.users
for each row execute function public.create_member_profile();

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 4 and 100),
  description text not null check (char_length(description) between 20 and 1200),
  category text not null check (char_length(category) between 2 and 40),
  area text not null check (char_length(area) between 2 and 100),
  visibility text not null default 'open' check (visibility in ('open','approval')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now()
);
create index if not exists auno_communities_status_idx on public.communities(status,created_at desc);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending','joined','declined','left')),
  joined_at timestamptz not null default now(),
  primary key (community_id,user_id)
);
create index if not exists auno_members_user_idx on public.community_members(user_id);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  community_id uuid references public.communities(id),
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 20 and 3000),
  category text not null check (char_length(category) between 2 and 50),
  area text not null check (char_length(area) between 2 and 100),
  venue text not null check (char_length(venue) between 2 and 200),
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer not null check (capacity between 2 and 500),
  price_aed_cents integer not null default 0 check (price_aed_cents >= 0),
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_at timestamptz not null default now(),
  constraint auno_event_time check (end_at > start_at)
);
create index if not exists auno_events_public_idx on public.events(status,start_at);

create table if not exists public.event_bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  user_id uuid not null references public.profiles(id),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create unique index if not exists auno_bookings_one_active on public.event_bookings(event_id,user_id) where status='confirmed';
create index if not exists auno_bookings_by_user on public.event_bookings(user_id,created_at desc);

-- Draft storage inventory only. Booking/custody actions deliberately disabled until
-- legal classification, partner vetting, liability and insurance are verified.
create table if not exists public.storage_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  address text not null,
  capacity integer not null check (capacity >= 0),
  status text not null default 'pending' check (status in ('pending','approved','paused')),
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  target_kind text not null check (target_kind in ('event','community','member')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 10 and 1000),
  status text not null default 'open' check (status in ('open','investigating','resolved')),
  created_at timestamptz not null default now()
);
create index if not exists auno_reports_status_idx on public.moderation_reports(status,created_at);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  subject_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.operator_accounts enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.events enable row level security;
alter table public.event_bookings enable row level security;
alter table public.storage_locations enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles_visible_to_self_or_opted_in" on public.profiles for select to authenticated
 using (id=(select auth.uid()) or discoverable or public.is_operator());
-- This UPDATE policy permits changing existing profile fields, but requires separately scoped
-- column-level GRANTs below to avoid unintended modification of identity/control fields.
create policy "profiles_update_self" on public.profiles for update to authenticated
 using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy "communities_visible_after_approval" on public.communities for select to authenticated
 using (status='approved' or owner_id=(select auth.uid()) or public.is_operator());
create policy "community_create_pending" on public.communities for insert to authenticated
 with check (owner_id=(select auth.uid()) and status='pending');
create policy "community_edit_unreviewed" on public.communities for update to authenticated
 using ((owner_id=(select auth.uid()) and status='pending') or public.is_operator())
 with check ((owner_id=(select auth.uid()) and status='pending') or public.is_operator());
create policy "members_visible_by_member_or_owner" on public.community_members for select to authenticated
 using (user_id=(select auth.uid()) or public.is_operator() or exists (
  select 1 from public.communities c where c.id=community_id and c.owner_id=(select auth.uid())));
create policy "members_leave_self" on public.community_members for delete to authenticated using (user_id=(select auth.uid()));
create policy "events_visible_after_publication" on public.events for select to authenticated
 using (status='published' or owner_id=(select auth.uid()) or public.is_operator());
create policy "events_submit_draft" on public.events for insert to authenticated
 with check (owner_id=(select auth.uid()) and status='draft');
create policy "events_edit_draft" on public.events for update to authenticated
 using ((owner_id=(select auth.uid()) and status='draft') or public.is_operator())
 with check ((owner_id=(select auth.uid()) and status='draft') or public.is_operator());
create policy "bookings_private" on public.event_bookings for select to authenticated
 using (user_id=(select auth.uid()) or public.is_operator() or exists (
  select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));
create policy "storage_read_approved_only" on public.storage_locations for select to authenticated
 using (status='approved' or public.is_operator());
create policy "moderation_read_private" on public.moderation_reports for select to authenticated
 using (reporter_id=(select auth.uid()) or public.is_operator());
create policy "moderation_report_self" on public.moderation_reports for insert to authenticated
 with check (reporter_id=(select auth.uid()) and status='open');
create policy "audit_read_operator_only" on public.audit_events for select to authenticated
 using (public.is_operator());

-- Limit public client column operations. Never give client write access to roles,
-- audit events, custody operations, verification results or financial ledgers.
revoke all on public.operator_accounts, public.audit_events from anon, authenticated;
revoke all on public.profiles, public.communities, public.community_members, public.events,
 public.event_bookings, public.storage_locations, public.moderation_reports from anon, authenticated;
grant select on public.profiles,public.communities,public.community_members,public.events,
 public.event_bookings,public.storage_locations,public.moderation_reports to authenticated;
grant update(display_name,bio,mode,interests,discoverable) on public.profiles to authenticated;
grant insert(owner_id,name,description,category,area,visibility,status) on public.communities to authenticated;
grant update(name,description,category,area,visibility) on public.communities to authenticated;
grant delete on public.community_members to authenticated;
grant insert(owner_id,community_id,title,description,category,area,venue,start_at,end_at,capacity,price_aed_cents,status) on public.events to authenticated;
grant update(title,description,category,area,venue,start_at,end_at,capacity,price_aed_cents) on public.events to authenticated;
grant insert(reporter_id,target_kind,target_id,reason) on public.moderation_reports to authenticated;

-- Strongly consistent capacity check: lock event row before counting reservations.
-- Free events only until payments/webhooks/refunds/settlement are fully implemented.
create or replace function public.reserve_free_event(p_event_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype; v_uid uuid := (select auth.uid()); v_id uuid; v_count integer;
begin
 if v_uid is null then raise exception 'Please sign in'; end if;
 select * into v_event from public.events where id=p_event_id and status='published' for update;
 if not found then raise exception 'Event is not available'; end if;
 if v_event.start_at <= now() then raise exception 'This event has already started'; end if;
 if v_event.price_aed_cents <> 0 then raise exception 'Paid bookings are not enabled yet'; end if;
 select id into v_id from public.event_bookings where event_id=p_event_id and user_id=v_uid and status='confirmed';
 if v_id is not null then return v_id; end if;
 select count(*) into v_count from public.event_bookings where event_id=p_event_id and status='confirmed';
 if v_count>=v_event.capacity then raise exception 'Event is full'; end if;
 insert into public.event_bookings(event_id,user_id,status) values(p_event_id,v_uid,'confirmed') returning id into v_id;
 insert into public.audit_events(actor_id,action,subject_id) values(v_uid,'reserve_free_event',v_id);
 return v_id;
end;
$$;
revoke all on function public.reserve_free_event(uuid) from public, anon;
grant execute on function public.reserve_free_event(uuid) to authenticated;

create or replace function public.cancel_my_event_booking(p_booking_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
 if v_uid is null then raise exception 'Please sign in'; end if;
 update public.event_bookings set status='cancelled',cancelled_at=now()
  where id=p_booking_id and user_id=v_uid and status='confirmed';
 if not found then raise exception 'Active reservation not found'; end if;
 insert into public.audit_events(actor_id,action,subject_id) values(v_uid,'cancel_free_event_booking',p_booking_id);
 return true;
end;
$$;
revoke all on function public.cancel_my_event_booking(uuid) from public, anon;
grant execute on function public.cancel_my_event_booking(uuid) to authenticated;

create or replace function public.join_community(p_community_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_c public.communities%rowtype; v_uid uuid := (select auth.uid()); v_status text;
begin
 if v_uid is null then raise exception 'Please sign in'; end if;
 select * into v_c from public.communities where id=p_community_id and status='approved';
 if not found then raise exception 'Community is not available'; end if;
 v_status := case when v_c.visibility='approval' then 'pending' else 'joined' end;
 insert into public.community_members(community_id,user_id,status) values(p_community_id,v_uid,v_status)
 on conflict (community_id,user_id) do update set status=excluded.status,joined_at=now();
 insert into public.audit_events(actor_id,action,subject_id,metadata)
 values(v_uid,'request_community_membership',p_community_id,jsonb_build_object('status',v_status));
 return v_status;
end;
$$;
revoke all on function public.join_community(uuid) from public, anon;
grant execute on function public.join_community(uuid) to authenticated;

-- Only trusted operators can approve membership applications and publish events.
create or replace function public.operator_review_community(p_community_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_operator() then raise exception 'Not authorised'; end if;
 update public.communities set status=case when p_approve then 'approved' else 'rejected' end
 where id=p_community_id and status='pending';
 if not found then raise exception 'Pending community not found'; end if;
 insert into public.audit_events(actor_id,action,subject_id,metadata)
 values((select auth.uid()),'review_community',p_community_id,jsonb_build_object('approved',p_approve));
end;
$$;
revoke all on function public.operator_review_community(uuid,boolean) from public, anon;
grant execute on function public.operator_review_community(uuid,boolean) to authenticated;

create or replace function public.operator_publish_event(p_event_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_operator() then raise exception 'Not authorised'; end if;
 update public.events set status='published' where id=p_event_id and status='draft' and start_at>now();
 if not found then raise exception 'Eligible draft not found'; end if;
 insert into public.audit_events(actor_id,action,subject_id)
 values((select auth.uid()),'publish_event',p_event_id);
end;
$$;
revoke all on function public.operator_publish_event(uuid) from public, anon;
grant execute on function public.operator_publish_event(uuid) to authenticated;

-- Run manually after your own email OTP account exists (never from browser):
-- insert into public.operator_accounts(user_id) values ('<YOUR-USER-UUID>');
-- Grant only after validating ownership and MFA operating procedure.
-- Before production: review policies & grants, complete security testing,
-- create backups, abuse prevention, reporting SLAs, and UAE privacy/legal checks.
