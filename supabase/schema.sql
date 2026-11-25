-- OUR TABLE · Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run 하면 돼요.
--
-- 구조
--   restaurants   : 자동 수집된 가게 (누구나 읽기, 쓰기는 수집 스크립트의 service_role 키만)
--   couples       : 커플(두 사람) 단위. invite_code 로 상대가 참여해요
--   profiles      : 로그인한 사용자 ↔ 커플 연결
--   wishlists / visits / cellar_items / preferences : 커플끼리만 보고 쓰는 데이터 (RLS)

create extension if not exists pgcrypto;

-- ---------- 가게 ----------
create table if not exists public.restaurants (
  id text primary key,                 -- 'k' + 카카오 장소 id
  name text not null,
  region text not null,                -- 서울 | 성남 | 수원 | 기타 경기
  area text,
  food text,
  category text,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  kakao_url text,
  corkage_status text not null default 'unknown' check (corkage_status in ('free','conditional','paid','unknown')),
  corkage jsonb not null default '{}'::jsonb,   -- 병 수, 조건, 근거 수, 신뢰도
  evidence jsonb not null default '[]'::jsonb,  -- 블로그 근거
  images jsonb not null default '[]'::jsonb,    -- 메뉴 사진 썸네일 + 출처
  tags text[] not null default '{}',
  drinks text[] not null default '{}',
  menus text[] not null default '{}',
  price_for_2 integer,
  first_seen date,
  updated_at timestamptz not null default now()
);
create index if not exists restaurants_region_idx on public.restaurants (region);
create index if not exists restaurants_status_idx on public.restaurants (corkage_status);

alter table public.restaurants enable row level security;
drop policy if exists "restaurants are public" on public.restaurants;
create policy "restaurants are public" on public.restaurants for select using (true);

-- ---------- 커플 / 프로필 ----------
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  couple_id uuid references public.couples (id) on delete set null,
  nickname text,
  created_at timestamptz not null default now()
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
  select couple_id from public.profiles where id = auth.uid()
$$;

-- 새 커플 만들기 → 초대 코드 반환
create or replace function public.create_couple() returns text
language plpgsql security definer set search_path = public as $$
declare c public.couples;
begin
  insert into public.profiles (id) values (auth.uid()) on conflict do nothing;
  insert into public.couples default values returning * into c;
  update public.profiles set couple_id = c.id where id = auth.uid();
  return c.invite_code;
end $$;

-- 초대 코드로 참여 (한 커플은 최대 2명)
create or replace function public.join_couple(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; members int;
begin
  select id into cid from public.couples where invite_code = upper(trim(code));
  if cid is null then raise exception '초대 코드를 찾을 수 없어요'; end if;
  select count(*) into members from public.profiles where couple_id = cid;
  if members >= 2 then raise exception '이미 두 사람이 연결된 코드예요'; end if;
  insert into public.profiles (id) values (auth.uid()) on conflict do nothing;
  update public.profiles set couple_id = cid where id = auth.uid();
  return cid;
end $$;

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
drop policy if exists "see my couple" on public.couples;
create policy "see my couple" on public.couples for select using (id = public.my_couple_id());
drop policy if exists "see couple profiles" on public.profiles;
create policy "see couple profiles" on public.profiles for select using (id = auth.uid() or couple_id = public.my_couple_id());
drop policy if exists "edit my profile" on public.profiles;
create policy "edit my profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- 커플 데이터 ----------
create table if not exists public.wishlists (
  couple_id uuid not null references public.couples (id) on delete cascade,
  restaurant_id text not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, restaurant_id)
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  restaurant_id text not null,
  restaurant_name text not null,
  visited_on date not null,
  cost integer not null default 0,
  my_rating smallint check (my_rating between 1 and 5),
  partner_rating smallint check (partner_rating between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.cellar_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  name text not null,
  type text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.preferences (
  couple_id uuid primary key references public.couples (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['wishlists','visits','cellar_items','preferences'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "couple only" on public.%I', t);
    execute format('create policy "couple only" on public.%I for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id())', t);
  end loop;
end $$;
