-- CUET Lost and Found Box MVP: initial PostgreSQL schema.
-- Apply through the Supabase CLI or SQL editor as a tracked migration.
create extension if not exists pgcrypto;

create type public.post_type as enum ('LOST', 'FOUND');
create type public.post_status as enum ('ACTIVE', 'CLAIM_PENDING', 'RESOLVED', 'ARCHIVED');
create type public.claim_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (length(trim(email)) > 0),
  full_name text, avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  post_type public.post_type not null,
  category text not null check (category in ('Electronics','Wallet','Keys','ID Card','Documents','Bag','Books','Clothing','Accessories','Money','Other')),
  description text not null check (length(trim(description)) > 0),
  location text not null check (length(trim(location)) > 0),
  event_time timestamptz not null,
  image_url text,
  status public.post_status not null default 'ACTIVE',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  found_post_id uuid not null references public.posts(id) on delete restrict,
  claimant_id uuid not null references public.profiles(id) on delete restrict,
  related_lost_post_id uuid not null references public.posts(id) on delete restrict,
  message text,
  status public.claim_status not null default 'PENDING',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint claims_different_posts check (found_post_id <> related_lost_post_id)
);

create table public.resolutions (
  id uuid primary key default gen_random_uuid(),
  lost_post_id uuid not null references public.posts(id) on delete restrict unique,
  found_post_id uuid not null references public.posts(id) on delete restrict unique,
  claim_id uuid not null references public.claims(id) on delete restrict unique,
  resolved_at timestamptz not null default timezone('utc', now()),
  constraint resolutions_different_posts check (lost_post_id <> found_post_id)
);

create index posts_public_feed_idx on public.posts (status, created_at desc);
create index posts_owner_created_idx on public.posts (user_id, created_at desc);
create index posts_type_status_event_idx on public.posts (post_type, status, event_time desc);
create index posts_category_idx on public.posts (category);
create index claims_found_post_idx on public.claims (found_post_id, status, created_at desc);
create index claims_claimant_idx on public.claims (claimant_id, status, created_at desc);
create index claims_related_lost_post_idx on public.claims (related_lost_post_id);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = timezone('utc', now()); return new; end; $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger claims_set_updated_at before update on public.claims for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do update set email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Enforce FOUND/LOST relationships and ownership beyond ordinary foreign keys.
create or replace function public.validate_claim_relationship() returns trigger language plpgsql set search_path = public as $$
declare found_owner uuid; found_type public.post_type; lost_owner uuid; lost_type public.post_type;
begin
  select user_id, post_type into found_owner, found_type from public.posts where id = new.found_post_id;
  select user_id, post_type into lost_owner, lost_type from public.posts where id = new.related_lost_post_id;
  if found_type is distinct from 'FOUND' then raise exception 'found_post_id must reference a FOUND post'; end if;
  if lost_type is distinct from 'LOST' then raise exception 'related_lost_post_id must reference a LOST post'; end if;
  if found_owner = new.claimant_id then raise exception 'a user cannot claim their own found post'; end if;
  if lost_owner is distinct from new.claimant_id then raise exception 'related lost post must belong to claimant'; end if;
  return new;
end; $$;
create trigger claims_validate_relationship before insert or update of found_post_id, claimant_id, related_lost_post_id on public.claims for each row execute function public.validate_claim_relationship();

create or replace function public.prevent_claimed_post_deletion() returns trigger language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.claims where found_post_id = old.id or related_lost_post_id = old.id) then
    raise exception 'posts with claims cannot be deleted';
  end if;
  return old;
end; $$;
create trigger posts_prevent_claimed_deletion before delete on public.posts for each row execute function public.prevent_claimed_post_deletion();

-- Approval must resolve the matching pair, and resolutions only represent that pair.
create or replace function public.validate_resolution() returns trigger language plpgsql set search_path = public as $$
declare claim_lost uuid; claim_found uuid; claim_state public.claim_status; lost_state public.post_status; found_state public.post_status;
begin
  select related_lost_post_id, found_post_id, status into claim_lost, claim_found, claim_state from public.claims where id = new.claim_id;
  select status into lost_state from public.posts where id = new.lost_post_id;
  select status into found_state from public.posts where id = new.found_post_id;
  if claim_state is distinct from 'APPROVED' or claim_lost is distinct from new.lost_post_id or claim_found is distinct from new.found_post_id then
    raise exception 'resolution must match an approved claim';
  end if;
  if lost_state is distinct from 'RESOLVED' or found_state is distinct from 'RESOLVED' then
    raise exception 'both posts must be resolved';
  end if;
  return new;
end; $$;
create trigger resolutions_validate before insert or update on public.resolutions for each row execute function public.validate_resolution();

create or replace function public.approved_claim_requires_resolution() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'APPROVED' and not exists (select 1 from public.resolutions r where r.claim_id = new.id and r.lost_post_id = new.related_lost_post_id and r.found_post_id = new.found_post_id) then
    raise exception 'an approved claim requires a matching resolution';
  end if;
  return null;
end; $$;
create constraint trigger claims_approved_requires_resolution after insert or update of status on public.claims deferrable initially deferred for each row execute function public.approved_claim_requires_resolution();

create or replace function public.resolved_post_requires_resolution() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'RESOLVED' and not exists (select 1 from public.resolutions r where r.lost_post_id = new.id or r.found_post_id = new.id) then
    raise exception 'a resolved post requires a resolution record';
  end if;
  return null;
end; $$;
create constraint trigger posts_resolved_requires_resolution after insert or update of status on public.posts deferrable initially deferred for each row execute function public.resolved_post_requires_resolution();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.claims enable row level security;
alter table public.resolutions enable row level security;

create policy "active posts public" on public.posts for select using (status = 'ACTIVE' or auth.uid() = user_id);
create policy "users create own posts" on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own posts" on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own posts" on public.posts for delete to authenticated using (auth.uid() = user_id);
create policy "users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "claimants and finders read claims" on public.claims for select to authenticated using (auth.uid() = claimant_id or exists (select 1 from public.posts p where p.id = found_post_id and p.user_id = auth.uid()));
create policy "users create own claims" on public.claims for insert to authenticated with check (auth.uid() = claimant_id);
create policy "participants read resolutions" on public.resolutions for select to authenticated using (exists (select 1 from public.posts p where p.id in (lost_post_id, found_post_id) and p.user_id = auth.uid()));

-- Client roles cannot modify lifecycle state or claim state; FastAPI will do so server-side.
revoke all on public.profiles, public.posts, public.claims, public.resolutions from anon, authenticated;
grant select (id, email, full_name, avatar_url, created_at, updated_at) on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant select on public.posts to anon, authenticated;
grant insert (user_id, post_type, category, description, location, event_time, image_url) on public.posts to authenticated;
grant update (post_type, category, description, location, event_time, image_url) on public.posts to authenticated;
grant delete on public.posts to authenticated;
grant select on public.claims to authenticated;
grant insert (found_post_id, claimant_id, related_lost_post_id, message) on public.claims to authenticated;
grant select on public.resolutions to authenticated;
