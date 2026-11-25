import { useState } from 'react';
import { CheckCircle2, CircleDashed, LogOut, Moon, Settings as Gear, Sun } from 'lucide-react';
import { PageHero } from '@/components/Layout';
import { Card, Chip, GhostButton, PrimaryButton, inputCls } from '@/components/ui';
import { Field } from './Visits';
import { useStore } from '@/store/AppStore';
import { supabase, isSupabaseReady } from '@/lib/supabase';
import { DRINKS, FOODS, REGIONS } from '@/lib/constants';
import type { Preferences } from '@/types';

export default function Settings() {
  const s = useStore();
  const [p, setP] = useState<Preferences>(s.prefs);
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="space-y-5">
      <PageHero title="설정" icon={<Gear className="text-brand" />} subtitle="취향, 화면, 계정과 데이터 연결 상태를 관리해요." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-bold">우리 둘의 취향</h2>
          <div className="flex flex-wrap gap-2">
            {FOODS.map((f) => (
              <Chip key={f} active={p.foods.includes(f)} onClick={() => setP({ ...p, foods: toggle(p.foods, f) })}>
                {f}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {DRINKS.map((d) => (
              <Chip key={d} active={p.drinks.includes(d)} onClick={() => setP({ ...p, drinks: toggle(p.drinks, d) })}>
                {d}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <Chip key={r} active={p.regions.includes(r)} onClick={() => setP({ ...p, regions: toggle(p.regions, r) })}>
                {r}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="2인 예산(원)">
              <input type="number" min={0} step={10000} className={inputCls} value={p.budget} onChange={(e) => setP({ ...p, budget: Number(e.target.value) })} />
            </Field>
            <Field label="분위기">
              <select className={inputCls} value={p.mood} onChange={(e) => setP({ ...p, mood: e.target.value as Preferences['mood'] })}>
                <option>조용한</option>
                <option>활기찬</option>
                <option>상관없음</option>
              </select>
            </Field>
          </div>
          <PrimaryButton onClick={() => s.savePrefs(p)}>취향 저장</PrimaryButton>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3">
            <h2 className="font-bold">화면</h2>
            <div className="flex gap-2">
              <Chip active={s.theme === 'light'} onClick={() => s.setTheme('light')} icon={<Sun size={14} />}>
                아이보리·버건디
              </Chip>
              <Chip active={s.theme === 'dark'} onClick={() => s.setTheme('dark')} icon={<Moon size={14} />}>
                다크 차콜
              </Chip>
            </div>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                가상 예시 데이터 함께 보기
                <span className="block text-xs text-muted">실제 수집 데이터가 0곳이면 항상 보여요.</span>
              </span>
              <input type="checkbox" className="size-5 accent-[var(--c-brand)]" checked={s.showSamples} onChange={(e) => s.setShowSamples(e.target.checked)} />
            </label>
          </Card>
          <Account />
          <Connections />
        </div>
      </div>
    </div>
  );
}

function Account() {
  const { session, coupleId, storage, syncError } = useStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [invite, setInvite] = useState<string | null>(null);

  if (!isSupabaseReady)
    return (
      <Card className="space-y-2">
        <h2 className="font-bold">계정 · 커플 연결</h2>
        <p className="text-sm text-muted">
          지금은 <b>로컬 모드</b>예요. 찜·기록·술장고가 이 브라우저에만 저장돼요. Supabase 키(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)를 넣으면 로그인하고 두 사람이 같은 기록을 볼 수 있어요.
        </p>
      </Card>
    );

  return (
    <Card className="space-y-3">
      <h2 className="font-bold">계정 · 커플 연결</h2>
      {!session ? (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split('#')[0] } });
            setMsg(error ? error.message : '메일함에서 로그인 링크를 눌러주세요.');
          }}
        >
          <input type="email" required className={inputCls} placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
          <PrimaryButton className="shrink-0">로그인 링크 받기</PrimaryButton>
        </form>
      ) : (
        <>
          <p className="text-sm">
            {session.user.email} · 저장 위치 <b>{storage === 'supabase' ? 'Supabase' : '이 브라우저'}</b>
          </p>
          {!coupleId && (
            <div className="space-y-2 rounded-xl bg-card2 p-3 text-sm">
              <p>커플을 연결하면 두 사람이 같은 찜·기록을 봐요.</p>
              <div className="flex flex-wrap gap-2">
                <GhostButton
                  onClick={async () => {
                    const { data, error } = await supabase!.rpc('create_couple');
                    if (error) setMsg(error.message);
                    else setInvite(String(data));
                  }}
                >
                  새 커플 만들기
                </GhostButton>
                <input className={`${inputCls} w-40`} placeholder="초대 코드" value={code} onChange={(e) => setCode(e.target.value)} />
                <GhostButton
                  onClick={async () => {
                    const { error } = await supabase!.rpc('join_couple', { code });
                    setMsg(error ? error.message : '연결됐어요. 새로고침해 주세요.');
                  }}
                >
                  코드로 참여
                </GhostButton>
              </div>
              {invite && (
                <p>
                  초대 코드 <b className="text-brand">{invite}</b> 를 상대에게 보내주세요. 새로고침하면 연결돼요.
                </p>
              )}
            </div>
          )}
          <GhostButton onClick={() => supabase!.auth.signOut()} className="flex items-center gap-1 text-sm">
            <LogOut size={15} /> 로그아웃
          </GhostButton>
        </>
      )}
      {msg && <p className="text-sm text-brand">{msg}</p>}
      {syncError && <p className="text-sm text-brand">동기화 오류: {syncError}</p>}
    </Card>
  );
}

function Connections() {
  const { realCount, dataUpdatedAt } = useStore();
  const rows: [string, boolean, string][] = [
    ['카카오 지도', !!import.meta.env.VITE_KAKAO_JS_KEY, 'VITE_KAKAO_JS_KEY'],
    ['Supabase', isSupabaseReady, 'VITE_SUPABASE_URL / ANON_KEY'],
    ['자동 수집 (네이버 블로그 · 카카오 장소)', realCount > 0, dataUpdatedAt ? `마지막 ${dataUpdatedAt}` : '아직 실행 전'],
  ];
  return (
    <Card className="space-y-2">
      <h2 className="font-bold">데이터 연결 상태</h2>
      {rows.map(([k, ok, d]) => (
        <p key={k} className="flex items-center gap-2 text-sm">
          {ok ? <CheckCircle2 size={16} className="text-ok" /> : <CircleDashed size={16} className="text-muted" />}
          <span className="flex-1">{k}</span>
          <span className="text-xs text-muted">{d}</span>
        </p>
      ))}
      <p className="pt-1 text-xs text-muted">비밀 키는 이 화면에 입력하지 않아요. GitHub Secrets / Vercel 환경변수에서 관리해요.</p>
    </Card>
  );
}
