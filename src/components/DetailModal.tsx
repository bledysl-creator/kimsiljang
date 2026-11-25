import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarHeart, ExternalLink, Phone, ShieldCheck, X } from 'lucide-react';
import { useStore } from '@/store/AppStore';
import { scoreRestaurant } from '@/lib/score';
import { kakaoMapUrl, money, naverMapUrl } from '@/lib/constants';
import { CorkageBadge, DataBadge, FoodArt, HeartButton, PrimaryButton } from './ui';

export function DetailModal() {
  const { selectedId, openDetail, restaurants, prefs, wishes } = useStore();
  const nav = useNavigate();
  const r = restaurants.find((x) => x.id === selectedId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openDetail(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openDetail]);

  if (!r) return null;
  const s = scoreRestaurant(r, prefs, wishes.has(r.id));
  const plain = r.name.replace(' (예시)', '');
  const c = r.corkage;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => openDetail(null)} role="dialog" aria-modal="true" aria-label={r.name}>
      <div onClick={(e) => e.stopPropagation()} className="pb-safe max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-card shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="relative">
          {r.images.length > 1 ? (
            <div className="scrollbar-none flex snap-x gap-1 overflow-x-auto">
              {r.images.map((img, i) => (
                <a key={i} href={img.sourceUrl ?? undefined} target="_blank" rel="noreferrer" className="relative shrink-0 snap-start">
                  <img src={img.thumb} alt={`${r.name} 사진 ${i + 1}`} referrerPolicy="no-referrer" className="h-56 w-72 object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] text-white">출처 {img.sourceName}</span>
                </a>
              ))}
            </div>
          ) : (
            <FoodArt r={r} className="h-56 w-full" rounded="rounded-none" />
          )}
          <button onClick={() => openDetail(null)} aria-label="닫기" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/50 text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                {r.region} · {r.area} · {r.food} <DataBadge r={r} />
              </p>
              <h2 className="mt-1 text-2xl font-extrabold">{r.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <CorkageBadge status={c.status} />
                <span className="text-sm font-bold text-brand">적합도 {s.score}%</span>
              </div>
            </div>
            <HeartButton id={r.id} />
          </div>

          {r.isSample && (
            <p className="rounded-xl border border-dashed border-muted/50 bg-card2 p-3 text-sm text-muted">
              이 가게는 화면 확인용 <b>가상 데이터</b>예요. 가격·조건·점수 모두 예시예요.
            </p>
          )}

          <section className="rounded-2xl bg-card2 p-4">
            <h3 className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={18} className="text-brand" /> 콜키지 검증
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <Info k="상태" v={{ free: '무료', conditional: '조건부 무료', paid: '유료', unknown: '미확인' }[c.status]} />
              <Info k="무료 병 수" v={c.bottleLimit ? `${c.bottleLimit}병까지` : '확인 필요'} />
              <Info k="근거" v={`무료 ${c.freeMentions} · 유료 ${c.paidMentions}`} />
              <Info k="신뢰도" v={c.verifiedBy === 'none' ? '—' : `${c.confidence}%`} />
            </dl>
            {c.conditions.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {c.conditions.map((x) => (
                  <li key={x} className="rounded-md bg-card px-2 py-1 text-xs">
                    {x}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">
              {c.verifiedBy === 'auto' && `블로그 글 자동 분석 · ${c.verifiedAt} 기준. 방문 전 전화로 한 번 더 확인하세요.`}
              {c.verifiedBy === 'manual' && `직접 확인 · ${c.verifiedAt}`}
              {c.verifiedBy === 'none' && '아직 검증 전이에요.'}
            </p>
          </section>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Info k="2인 가격" v={r.priceFor2 != null ? money(r.priceFor2) : '정보 없음'} />
            <Info k="추천 주종" v={r.drinks.join(', ') || '정보 없음'} />
            <Info k="대표 메뉴" v={r.menus.join(', ') || '사진·후기 참고'} />
            <Info k="분위기" v={r.tags.join(', ') || '정보 없음'} />
            {r.address && <Info k="주소" v={r.address} wide />}
          </dl>

          {s.reasons.length > 0 && (
            <p className="text-sm">
              <b className="text-brand">추천 이유</b> · {s.reasons.join(' · ')}
            </p>
          )}

          {r.evidence.length > 0 && (
            <section>
              <h3 className="font-bold">블로그 근거</h3>
              <ul className="mt-2 divide-y divide-line">
                {r.evidence.map((e) => (
                  <li key={e.url} className="py-2.5">
                    <a href={e.url} target="_blank" rel="noreferrer" className="font-semibold hover:text-brand">
                      {e.title}
                    </a>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{e.snippet}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {e.date} · {{ free: '무료 언급', paid: '유료 언급', conditional: '조건 언급', mention: '콜키지 언급' }[e.signal]}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <a href={r.naverUrl ?? naverMapUrl(plain, r.area)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-xl bg-[#03c75a] px-3 py-2.5 text-sm font-bold text-white">
              네이버 지도 <ExternalLink size={14} />
            </a>
            <a href={r.kakaoUrl ?? kakaoMapUrl(plain, r.area)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-xl bg-[#fee500] px-3 py-2.5 text-sm font-bold text-[#191919]">
              카카오맵 <ExternalLink size={14} />
            </a>
            {r.phone ? (
              <a href={`tel:${r.phone}`} className="flex items-center justify-center gap-1 rounded-xl border border-line px-3 py-2.5 text-sm font-bold">
                <Phone size={14} /> 전화로 확인
              </a>
            ) : (
              <span className="hidden sm:block" />
            )}
            <PrimaryButton
              className="flex items-center justify-center gap-1 text-sm"
              onClick={() => {
                openDetail(null);
                nav(`/visits?rid=${encodeURIComponent(r.id)}`);
              }}
            >
              <CalendarHeart size={15} /> 방문 기록
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
