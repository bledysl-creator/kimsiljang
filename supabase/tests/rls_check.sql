-- RLS 수동 점검 (Supabase SQL Editor 에서 실행). 실제 사용자 3명(A·B 커플, C 외부인) 가입 후
-- 아래 :a / :b / :c 를 각 사용자의 auth.users.id 로 바꿔서 실행하세요. 마지막에 rollback 으로 되돌려요.
begin;
-- A 로 커플 생성
select set_config('request.jwt.claims', json_build_object('sub', ':a', 'role', 'authenticated')::text, true);
set local role authenticated;
select public.create_couple();
insert into public.wishes (couple_id, restaurant_id) values (public.my_couple_id(), 'k1');
-- C(외부인)는 A 커플의 찜을 볼 수 없어야 해요 → 0
select set_config('request.jwt.claims', json_build_object('sub', ':c', 'role', 'authenticated')::text, true);
select count(*) as should_be_zero from public.wishes;
-- C 가 profiles.couple_id 를 직접 바꾸려 하면 권한 오류가 나야 해요
-- update public.profiles set couple_id = (select id from public.couples limit 1) where id = ':c';
rollback;
