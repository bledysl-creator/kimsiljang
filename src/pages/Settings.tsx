import { useState } from 'react';
import { CheckCircle2, CircleDashed, ExternalLink, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { Card, GhostButton, PrimaryButton, inputCls } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { supabase, isSupabaseReady } from '@/lib/supabase';
import { PrefsEditor } from './Recommend';

const ACTIONS_URL = 'https://github.com/bledysl-creator/kimsiljang/actions';

function Collection() {
  const { lastRun, lastSuccessAt, realCount, reload } = useStore();
  return (
    <Card className="space-y-2 text-sm">
      <h2 className="font-bold">자동 수집 상태</h2>
      <p>
        마지막 성공: <b>{lastSuccessAt ?? '없음'}</b> · 실제 {realCount}곳
      </p>
      <p>
        마지막 실행:{' '}
        {lastRun ? (
          <>
            <b className={lastRun.status === 'failed' ? 'text-st-disputed' : ''}>{{ success: '성공', failed: '실패', skipped: '건너뜀' }[lastRun.status]}</b> ({lastRun.finishedAt.replace('T', ' ').slice(0, 16)}, {lastRun.count}곳)
            {lastRun.error && <span className="block text-xs text-muted">오류: {lastRun.error}</span>}
          </>
        ) : (
          '기록 없음 (새 형식 수집 전)'
        )}
      </p>
      <p className="text-xs text-muted">매일 오전 7시(KST) 예약 실행이에요. GitHub 사정에 따라 늦어질 수 있어요. 실패하면 이전 데이터를 그대로 둬요.</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <a href={ACTIONS_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-line px-4 font-medium hover:border-brand/50">
          수동 갱신 (GitHub Actions) <ExternalLink size={13} aria-hidden />
        </a>
        <GhostButton onClick={reload}>데이터 다시 불러오기</GhostButton>
      </div>
    </Card>
  );
}

export default function Settings() {
  const s = useStore();
  return (
    <div className="space-y-4">
      <PageHeader title="설정" subtitle="두 사람의 취향, 계정, 자동 수집 상태와 데이터 출처를 관리해요." />
      <section aria-labelledby="pref" className="space-y-3">
        <h2 id="pref" className="text-lg font-bold">
          두 사람의 취향
        </h2>
        <PrefsEditor />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Account />
        <Card className="space-y-3">
          <h2 className="font-bold">화면 데이터</h2>
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
            <span>
              가상 예시 데이터 함께 보기
              <span className="block text-xs text-muted">실제 수집 데이터가 0곳이면 항상 보여요. 예시는 '가상 예시' 표시가 붙어요.</span>
            </span>
            <input type="checkbox" className="size-5 accent-brand" checked={s.showSamples} onChange={(e) => s.setShowSamples(e.target.checked)} />
          </label>
        </Card>
        <Collection />
        <Connections />
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
  const { realCount } = useStore();
  const rows: [string, boolean, string][] = [
    ['카카오 지도', !!import.meta.env.VITE_KAKAO_JS_KEY, 'VITE_KAKAO_JS_KEY'],
    ['Supabase', isSupabaseReady, 'VITE_SUPABASE_URL / ANON_KEY'],
    ['네이버 블로그 검색 (콜키지 후기)', realCount > 0, 'GitHub Secrets'],
    ['카카오 로컬 (주소·좌표·장소 링크)', realCount > 0, 'GitHub Secrets'],
  ];
  return (
    <Card className="space-y-2">
      <h2 className="font-bold">데이터 출처와 연결</h2>
      {rows.map(([k, ok, d]) => (
        <p key={k} className="flex items-center gap-2 text-sm">
          {ok ? <CheckCircle2 size={16} className="text-st-free" aria-label="연결됨" /> : <CircleDashed size={16} className="text-muted" aria-label="미연결" />}
          <span className="flex-1">{k}</span>
          <span className="text-xs text-muted">{d}</span>
        </p>
      ))}
      <p className="pt-1 text-xs text-muted">메뉴 사진과 리뷰 원문은 가져오지 않아요(공개 API로 허용 범위가 확인되지 않음). 블로그는 제목·링크·날짜만 저장해요.</p>
      <p className="text-xs text-muted">비밀 키는 이 화면에 입력하지 않아요. GitHub Secrets / Vercel 환경변수에서 관리해요.</p>
    </Card>
  );
}
