-- 김실장 (OUR TABLE) · Supabase 초기 스키마 — CLAUDE.md 6절 데이터 모델
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run (또는 supabase db push)
--
-- 공용 데이터 : restaurants, source_links, collection_runs  (누구나 읽기, 쓰기는 service_role 만)
-- 커플 데이터 : couples, couple_members, profiles, wishes, visits, ratings, cellar, corkage_evidence
--              → RLS 로 같은 커플 구성원(최대 2명)만 읽고 쓸 수 있어요.

create extension if not exists pgcrypto;

-- ============ 공용: 가게 ============
create table if not exists public.restaurants (
  id text primary key,                          -- 'k' + 카카오 장소 id
  name text not null,
  address text,
  region text not null check (region in ('서울','성남','수원','기타 경기')),
  area text,
  food text,
  category text,
  lat double precision,
  lng double precision,
  phone text,
  source_ids jsonb not null default '{}'::jsonb, -- {"kakao": "123"}
  price_min integer check (price_min >= 0),
  price_max integer check (price_max >= price_min),
  corkage jsonb not null default '{}'::jsonb,    -- 자동 후기 분석 결과(상태 unknown/disputed + reviewSignal)
  evidence jsonb not null default '[]'::jsonb,   -- 블로그 제목·링크·날짜만 (본문 미저장)
  sources jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  menus text[] not null default '{}',
  first_seen date,
  updated_at timestamptz not null default now()
);
create index if not exists restaurants_region_idx on public.restaurants (region);

create table if not exists public.source_links (
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  provider text not null check (provider in ('kakao','naver','official','manual')),
  url text not null check (url ~ '^https?://'),
  checked_at timestamptz not null default now(),
  primary key (restaurant_id, provider, url)
);

create table if not exists public.collection_runs (
  id bigint generated always as identity primary key,
  status text not null check (status in ('success','failed','skipped')),
  started_at timestamptz not null,
  finished_at timestamptz,
  error text,
  count integer not null default 0
);

alter table public.restaurants enable row level security;
alter table public.source_links enable row level security;
alter table public.collection_runs enable row level security;
create policy "public read restaurants" on public.restaurants for select using (true);
create policy "public read source_links" on public.source_links for select using (true);
create policy "public read collection_runs" on public.collection_runs for select using (true);
-- insert/update/delete 정책이 없으므로 anon·authenticated 는 쓸 수 없어요 (service_role 은 RLS 우회).

-- ============ 커플 ============
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  couple_id uuid references public.couples (id) on delete set null,
  nickname text check (char_length(nickname) <= 20),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade, -- 한 사람은 한 커플만
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- 가입하면 프로필 자동 생성
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_couple_id() returns uuid
language sql stable security definer set search_path = public as $$
  select couple_id from public.couple_members where user_id = auth.uid()
$$;

-- 새 커플 만들기 → 초대 코드 반환
create or replace function public.create_couple() returns text
language plpgsql security definer set search_path = public as $$
declare c public.couples;
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then raise exception '이미 커플에 연결돼 있어요'; end if;
  insert into public.profiles (id) values (auth.uid()) on conflict do nothing;
  insert into public.couples default values returning * into c;
  insert into public.couple_members (couple_id, user_id) values (c.id, auth.uid());
  update public.profiles set couple_id = c.id where id = auth.uid();
  return c.invite_code;
end $$;

-- 초대 코드로 참여 (한 커플은 최대 2명)
create or replace function public.join_couple(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; members int;
begin
  if auth.uid() is null then raise exception '로그인이 필요해요'; end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then raise exception '이미 커플에 연결돼 있어요'; end if;
  select id into cid from public.couples where invite_code = upper(trim(code)) for update;
  if cid is null then raise exception '초대 코드를 찾을 수 없어요'; end if;
  select count(*) into members from public.couple_members where couple_id = cid;
  if members >= 2 then raise exception '이미 두 사람이 연결된 코드예요'; end if;
  insert into public.profiles (id) values (auth.uid()) on conflict do nothing;
  insert into public.couple_members (couple_id, user_id) values (cid, auth.uid());
  update public.profiles set couple_id = cid where id = auth.uid();
  return cid;
end $$;

revoke all on function public.create_couple() from public, anon;
revoke all on function public.join_couple(text) from public, anon;
grant execute on function public.create_couple() to authenticated;
grant execute on function public.join_couple(text) to authenticated;

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.profiles enable row level security;
create policy "see my couple" on public.couples for select using (id = public.my_couple_id());
create policy "see my couple members" on public.couple_members for select using (couple_id = public.my_couple_id());
create policy "see couple profiles" on public.profiles for select using (id = auth.uid() or couple_id = public.my_couple_id());
create policy "edit my profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- couple_id 를 직접 바꿔 다른 커플에 끼어드는 것을 막아요: 수정 가능한 열은 닉네임·취향뿐
revoke update on public.profiles from anon, authenticated;
grant update (nickname, preferences) on public.profiles to authenticated;

-- ============ 커플 개인 데이터 ============
create table if not exists public.wishes (
  couple_id uuid not null references public.couples (id) on delete cascade,
  restaurant_id text not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, restaurant_id)
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  restaurant_id text not null,
  restaurant_name text,
  date date not null,
  total_cost integer not null default 0 check (total_cost >= 0),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists visits_couple_idx on public.visits (couple_id, date desc);

create table if not exists public.ratings (
  visit_id uuid not null references public.visits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  food smallint check (food between 0 and 5),
  mood smallint check (mood between 0 and 5),
  value smallint check (value between 0 and 5),
  revisit text check (revisit in ('yes','maybe','no')),
  primary key (visit_id, user_id)
);

create table if not exists public.cellar (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  name text not null check (char_length(name) <= 80),
  drink_type text not null,
  note text,
  created_at timestamptz not null default now()
);

-- 우리가 직접 확인한 콜키지 정보 (공식 안내·전화·방문)
create table if not exists public.corkage_evidence (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  restaurant_id text not null,
  status text not null check (status in ('verified_free','conditional_free','paid')),
  drink_types text[] not null default '{}',
  free_bottles smallint check (free_bottles >= 0),
  extra_fee text,
  conditions text[] not null default '{}',
  source_url text check (source_url is null or source_url ~ '^https?://'),
  verified_at date not null,
  verification_method text not null check (verification_method in ('official','phone','visit')),
  created_at timestamptz not null default now()
);
create index if not exists corkage_evidence_idx on public.corkage_evidence (couple_id, restaurant_id, verified_at desc);

alter table public.wishes enable row level security;
alter table public.visits enable row level security;
alter table public.ratings enable row level security;
alter table public.cellar enable row level security;
alter table public.corkage_evidence enable row level security;

create policy "couple wishes" on public.wishes for all
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "couple visits" on public.visits for all
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "couple cellar" on public.cellar for all
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "couple corkage evidence" on public.corkage_evidence for all
  using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
-- 평가: 우리 커플 방문 기록에 대해, 우리 커플 구성원의 평가만
create policy "couple ratings" on public.ratings for all
  using (exists (select 1 from public.visits v where v.id = visit_id and v.couple_id = public.my_couple_id()))
  with check (
    exists (select 1 from public.visits v where v.id = visit_id and v.couple_id = public.my_couple_id())
    and exists (select 1 from public.couple_members m where m.user_id = ratings.user_id and m.couple_id = public.my_couple_id())
  );
