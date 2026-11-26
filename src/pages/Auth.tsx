// 로그인 · 회원가입 화면.
// Supabase Auth(이메일 + 비밀번호)를 써요. 키가 없으면 가짜로 로그인되는 척하지 않고 '준비 중'으로 안내해요.
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Info, Wine } from 'lucide-react';
import { PROJECT_NAME, SERVICE_NAME, TAGLINE } from '@/lib/constants';
import { isSupabaseReady, supabase } from '@/lib/supabase';
import { Field, PrimaryButton, cx, inputCls } from '@/components/ui';

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* 브랜드 패널 (모바일에선 위쪽 띠) */}
      <section className="flex flex-col justify-between bg-gradient-to-b from-side-from to-side-to px-6 py-6 text-side-fg md:px-10 md:py-10">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm text-side-muted hover:text-side-fg">
            <ArrowLeft size={18} aria-hidden /> 둘러보기로 돌아가기
          </Link>
          <BetaBadge />
        </div>
        <div className="my-8 md:my-0">
          <p className="flex items-center gap-2 text-3xl font-extrabold md:text-4xl">
            <Wine size={30} aria-hidden /> {SERVICE_NAME}
          </p>
          <p className="mt-2 text-sm text-side-muted md:text-base">
            {PROJECT_NAME} · {TAGLINE}
          </p>
          <p className="mt-6 hidden max-w-sm text-sm leading-relaxed text-side-muted md:block">두 사람이 같이 찜하고, 다녀온 곳을 기록하고, 좋아하는 술과 어울리는 콜키지 프리 식당을 찾아요.</p>
        </div>
        <p className="hidden text-xs text-side-muted md:block">만든이 JYK</p>
      </section>

      {/* 입력 폼 */}
      <section className="flex flex-col items-center justify-center bg-bg px-4 py-8 md:px-10">
        <div className="w-full max-w-[420px] rounded-[var(--radius-card)] border border-line bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="text-2xl font-extrabold text-fg">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <BetaNotice />
          {children}
        </div>
        <footer className="mt-6 text-center text-xs leading-relaxed text-muted">
          <p>베타 버전이에요. 기능과 데이터가 바뀔 수 있어요.</p>
          <p className="mt-0.5">
            {SERVICE_NAME} · 만든이: <b className="font-semibold text-fg">JYK</b>
          </p>
        </footer>
      </section>
    </div>
  );
}

export function BetaBadge({ className }: { className?: string }) {
  return <span className={cx('rounded-full border border-current px-2 py-0.5 text-[10px] font-bold tracking-wider', className)}>BETA</span>;
}

function BetaNotice() {
  return (
    <div className="mt-4 flex gap-2 rounded-xl bg-brand-soft/60 px-3 py-2.5 text-[13px] leading-relaxed text-fg">
      <Info size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden />
      <p>
        지금은 <b>베타 버전</b>이에요.
        {!isSupabaseReady && ' 계정 서버를 연결하는 중이라 아직 가입·로그인은 할 수 없어요. 로그인 없이도 맛집 탐색은 그대로 쓸 수 있어요.'}
      </p>
    </div>
  );
}

function PasswordInput({ value, onChange, autoComplete, id }: { value: string; onChange: (v: string) => void; autoComplete: string; id?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required
        minLength={8}
        autoComplete={autoComplete}
        className={cx(inputCls, 'pr-12')}
        placeholder="8자 이상"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-fg"
      >
        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}

const korError = (m: string) => {
  if (/invalid login credentials/i.test(m)) return '아이디(이메일) 또는 비밀번호가 맞지 않아요.';
  if (/email not confirmed/i.test(m)) return '가입 확인 메일의 링크를 먼저 눌러 주세요.';
  if (/already registered|already exists/i.test(m)) return '이미 가입된 이메일이에요. 로그인해 주세요.';
  if (/password/i.test(m)) return '비밀번호 조건을 확인해 주세요. (8자 이상)';
  if (/rate limit/i.test(m)) return '잠시 후에 다시 시도해 주세요.';
  return `문제가 생겼어요: ${m}`;
};

function Status({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? 'status' : 'alert'} className={cx('rounded-xl px-3 py-2 text-sm', msg.ok ? 'bg-st-free/10 text-st-free' : 'bg-st-disputed/10 text-st-disputed')}>
      {msg.text}
    </p>
  );
}

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pw,
    });
    setBusy(false);
    if (error) setMsg({ ok: false, text: korError(error.message) });
    else nav('/');
  };

  return (
    <AuthShell title="로그인" subtitle="아이디(이메일)와 비밀번호를 입력해 주세요.">
      <form className="mt-5 grid gap-4" onSubmit={submit}>
        <Field label="아이디 (이메일)">
          <input type="email" required autoComplete="username" className={inputCls} placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="비밀번호">
          <PasswordInput value={pw} onChange={setPw} autoComplete="current-password" />
        </Field>
        <Status msg={msg} />
        <PrimaryButton type="submit" disabled={!isSupabaseReady || busy} className="mt-1 w-full">
          {busy ? '확인 중…' : isSupabaseReady ? '로그인' : '로그인 준비 중'}
        </PrimaryButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        아직 계정이 없나요?{' '}
        <Link to="/signup" className="inline-flex min-h-11 items-center font-bold text-brand underline-offset-2 hover:underline">
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const mismatch = pw2.length > 0 && pw !== pw2;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || mismatch || !agree) return;
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pw,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: location.href.split('#')[0],
      },
    });
    setBusy(false);
    if (error) setMsg({ ok: false, text: korError(error.message) });
    else if (data.session) setMsg({ ok: true, text: '가입이 끝났어요. 바로 이용할 수 있어요.' });
    else
      setMsg({
        ok: true,
        text: '확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요.',
      });
  };

  return (
    <AuthShell title="회원가입" subtitle="두 사람이 각자 가입한 뒤, 설정에서 커플을 연결해요.">
      <form className="mt-5 grid gap-4" onSubmit={submit}>
        <Field label="이름 (앱에서 부를 이름)">
          <input required maxLength={20} autoComplete="name" className={inputCls} placeholder="예: 진" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="아이디 (이메일)">
          <input type="email" required autoComplete="username" className={inputCls} placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="비밀번호">
          <PasswordInput value={pw} onChange={setPw} autoComplete="new-password" />
        </Field>
        <Field label="비밀번호 확인">
          <PasswordInput value={pw2} onChange={setPw2} autoComplete="new-password" />
          {mismatch && <span className="text-xs font-normal text-st-disputed">비밀번호가 서로 달라요.</span>}
        </Field>
        <label className="flex min-h-11 items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]" />
          <span>베타 버전이라 기능과 데이터가 바뀔 수 있다는 점을 확인했어요. 찜·기록은 커플로 연결된 두 사람만 볼 수 있어요.</span>
        </label>
        <Status msg={msg} />
        <PrimaryButton type="submit" disabled={!isSupabaseReady || busy || mismatch || !agree} className="mt-1 w-full">
          {busy ? '가입 중…' : isSupabaseReady ? '가입하기' : '가입 준비 중'}
        </PrimaryButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="inline-flex min-h-11 items-center font-bold text-brand underline-offset-2 hover:underline">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}
