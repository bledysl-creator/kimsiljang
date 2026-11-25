import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarHeart, ExternalLink, MapPin, Phone, ShieldCheck, X } from 'lucide-react';
import { useStore } from '@/store/AppStore';
import { scoreRestaurant } from '@/lib/score';
import { CORKAGE_META, money } from '@/lib/constants';
import type { MyVerification } from '@/types';
import { ClosureBadge, CorkageBadge, DataBadge, FitBadge, GhostButton, HeartButton, PhotoBox, PrimaryButton, ReviewBadge, inputCls } from './ui';
import { checkedText } from './RestaurantCard';

const NEED = <span className="text-muted">확인 필요</span>;
const RECHECK_DAYS = 30;
const todayKST = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

function daysSince(d: string | null) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-line py-2 text-sm last:border-0">
      <dt className="w-24 shrink-0 text-muted">{k}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

export function DetailModal() {
  const { selectedId, openDetail, restaurants, prefs, verifications, saveVerification } = useStore();
  const nav = useNavigate();
  const r = restaurants.find((x) => x.id === selectedId);
  const back = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    back.current = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openDetail(null);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      back.current?.focus?.();
      setVerifying(false);
    };
  }, [selectedId, openDetail]);

  if (!r) return null;
  const s = scoreRestaurant(r, prefs);
  const c = r.corkage;
  const age = daysSince(c.verifiedAt);
  const mine = verifications[r.id];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6" onClick={() => openDetail(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onClick={(e) => e.stopPropagation()}
        className="pb-safe max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-card shadow-2xl sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card/95 px-5 py-2 backdrop-blur">
          <DataBadge r={r} />
          <button ref={closeBtn} onClick={() => openDetail(null)} aria-label="상세 닫기" className="grid size-11 place-items-center rounded-full hover:bg-card2">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex gap-4">
            <PhotoBox r={r} className="size-[110px] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">
                {r.region} · {r.area} · {r.food}
              </p>
              <h2 id="detail-title" className="mt-0.5 text-2xl font-extrabold">
                {r.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <CorkageBadge status={c.status} />
                <ReviewBadge signal={c.reviewSignal} count={c.freeMentions} />
                <ClosureBadge r={r} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <HeartButton id={r.id} />
              <FitBadge score={s.score} coverage={s.coverage} />
            </div>
          </div>


          {/* 콜키지 */}
          <section aria-labelledby="ck">
            <h3 id="ck" className="mb-1 flex items-center gap-1.5 font-bold">
              <ShieldCheck size={18} className="text-brand" aria-hidden /> 콜키지 정보
            </h3>
            <dl>
              <Row k="상태">
                <b className={CORKAGE_META[c.status].color}>
                  {CORKAGE_META[c.status].icon} {CORKAGE_META[c.status].label}
                </b>
                {c.status === 'unknown' && c.reviewSignal !== 'none' && <span className="block text-xs text-muted">블로그 후기 기준 신호만 있어요. 직접 문의 전에는 '확인됨'으로 보지 않아요.</span>}
                {c.status === 'disputed' && <span className="block text-xs text-muted">무료·유료 정보가 서로 달라서 무료 필터에서 빠져요.</span>}
              </Row>
              <Row k="반입 주종">{c.drinkTypes.length ? c.drinkTypes.join(', ') : NEED}</Row>
              <Row k="무료 병 수">{c.freeBottles != null ? `${c.freeBottles}병` : NEED}</Row>
              <Row k="추가 요금">{c.extraFee ?? NEED}</Row>
              <Row k="잔·얼음">{c.glassIce ?? NEED}</Row>
              <Row k="최소 주문">{c.minOrder ?? NEED}</Row>
              {c.conditions.length > 0 && <Row k="조건">{c.conditions.join(' · ')}</Row>}
              <Row k="확인">
                {checkedText(r)}
                {age != null && age > RECHECK_DAYS && <span className="ml-1 text-xs font-semibold text-st-cond">· {age}일 지나 재확인 권장</span>}
              </Row>
            </dl>
          </section>

          {/* 기본 정보 */}
          <section aria-labelledby="info">
            <h3 id="info" className="mb-1 font-bold">
              가게 정보
            </h3>
            <dl>
              <Row k="주소">{r.address || NEED}</Row>
              <Row k="전화">
                {r.phone ? (
                  <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-brand underline">
                    <Phone size={14} aria-hidden /> {r.phone}
                  </a>
                ) : (
                  NEED
                )}
              </Row>
              <Row k="영업 여부">
                {r.closure.status === 'ok' && <span>카카오 장소 검색에 있어요 ({r.closure.checkedAt} 확인)</span>}
                {r.closure.status === 'suspected' && (
                  <span className="font-semibold text-st-disputed">
                    ⚠ 폐업 의심 ({r.closure.checkedAt})
                    <span className="block text-xs font-normal text-muted">{r.closure.signals.join(' · ')}. 확정이 아니니 가기 전에 전화로 확인해 주세요.</span>
                  </span>
                )}
                {r.closure.status === 'unknown' && NEED}
              </Row>
              <Row k="영업시간">{NEED}</Row>
              <Row k="2인 예상">{r.priceFor2 != null ? `약 ${money(r.priceFor2)}` : NEED}</Row>
              <Row k="분위기">{r.tags.length ? `${r.tags.join(', ')} (후기 기반 추정)` : NEED}</Row>
              <Row k="메뉴">{r.menus.length ? r.menus.join(', ') : NEED}</Row>
              <Row k="사진">{r.photos.length ? `${r.photos.length}장 (직접 등록)` : <span className="text-muted">등록된 사진 없음 · 직접 등록한 사진만 보여줘요</span>}</Row>
            </dl>
          </section>

          {(s.reasons.length > 0 || s.caveats.length > 0) && (
            <section className="rounded-xl bg-brand-soft/50 p-3 text-sm">
              <p className="font-bold text-brand">추천 근거 (정보 충족률 {Math.round(s.coverage * 100)}%)</p>
              {s.reasons.length > 0 && <p className="mt-1">{s.reasons.join(' · ')}</p>}
              {s.caveats.length > 0 && <p className="mt-1 text-muted">{s.caveats.join(' · ')}</p>}
            </section>
          )}

          {/* 출처 */}
          <section aria-labelledby="src">
            <h3 id="src" className="mb-2 font-bold">
              원본 링크
            </h3>
            {r.sources.length === 0 && r.evidence.length === 0 ? (
              <p className="text-sm text-muted">연결된 원본 링크가 없어요.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {r.sources.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-brand underline">
                      <MapPin size={14} aria-hidden /> {l.label} <ExternalLink size={12} aria-hidden />
                    </a>
                  </li>
                ))}
                {r.evidence.slice(0, 6).map((e) => (
                  <li key={e.url} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 rounded bg-card2 px-1.5 text-[11px] text-muted">{{ free: '무료 언급', paid: '유료 언급', conditional: '조건부', mention: '언급' }[e.signal]}</span>
                    <a href={e.url} target="_blank" rel="noreferrer" className="line-clamp-2 underline decoration-line hover:text-brand">
                      {e.title} <span className="text-xs text-muted">({e.date})</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 직접 확인 */}
          {!r.isSample && (
            <section className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold">직접 확인했어요</p>
                  <p className="text-xs text-muted">{mine ? `${mine.verifiedAt} ${{ phone: '전화', visit: '방문', official: '공식 안내' }[mine.method]}로 기록함` : '전화·방문으로 확인하면 상태가 \'확인 완료\'로 바뀌어요.'}</p>
                </div>
                <GhostButton onClick={() => setVerifying((v) => !v)}>{verifying ? '닫기' : mine ? '고치기' : '기록하기'}</GhostButton>
              </div>
              {verifying && (
                <VerifyForm
                  initial={mine}
                  onSave={(v) => {
                    saveVerification(r.id, v);
                    setVerifying(false);
                  }}
                />
              )}
            </section>
          )}

          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton
              onClick={() => {
                openDetail(null);
                nav(`/visits?new=${encodeURIComponent(r.id)}`);
              }}
              className="flex items-center justify-center gap-1.5"
            >
              <CalendarHeart size={17} aria-hidden /> 방문 기록하기
            </PrimaryButton>
            <GhostButton
              onClick={() => {
                openDetail(null);
                nav('/map');
              }}
              className="flex items-center justify-center gap-1.5"
            >
              <MapPin size={17} aria-hidden /> 지도에서 보기
            </GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyForm({ initial, onSave }: { initial?: MyVerification; onSave(v: MyVerification | null): void }) {
  const [v, setV] = useState<MyVerification>(() => initial ?? { status: 'verified_free', freeBottles: null, extraFee: null, note: '', method: 'phone', verifiedAt: todayKST() });
  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...v, verifiedAt: todayKST() });
      }}
    >
      <label className="text-sm">
        결과
        <select className={inputCls} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as MyVerification['status'] })}>
          <option value="verified_free">무료</option>
          <option value="conditional_free">조건부 무료</option>
          <option value="paid">유료</option>
        </select>
      </label>
      <label className="text-sm">
        확인 방법
        <select className={inputCls} value={v.method} onChange={(e) => setV({ ...v, method: e.target.value as MyVerification['method'] })}>
          <option value="phone">전화 문의</option>
          <option value="visit">방문</option>
          <option value="official">공식 안내</option>
        </select>
      </label>
      <label className="text-sm">
        무료 병 수
        <input type="number" min={0} className={inputCls} value={v.freeBottles ?? ''} onChange={(e) => setV({ ...v, freeBottles: e.target.value ? Number(e.target.value) : null })} />
      </label>
      <label className="text-sm">
        추가 요금
        <input className={inputCls} placeholder="예: 초과 시 병당 1만원" value={v.extraFee ?? ''} onChange={(e) => setV({ ...v, extraFee: e.target.value || null })} />
      </label>
      <label className="text-sm sm:col-span-2">
        메모
        <input className={inputCls} placeholder="예: 와인잔 제공, 주말 불가" value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <PrimaryButton type="submit">저장</PrimaryButton>
        {initial && (
          <GhostButton type="button" onClick={() => onSave(null)}>
            기록 지우기
          </GhostButton>
        )}
      </div>
    </form>
  );
}
