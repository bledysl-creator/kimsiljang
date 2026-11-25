// 데이터 정규화 — 예전 수집 형식(v1)과 새 형식(CLAUDE.md 4절)을 모두 읽어 새 형식으로 맞춰요.
// 기존 실제 데이터를 지우지 않고 그대로 쓰기 위한 변환이에요 (CLAUDE.md 2.4-3).
import type { ClosureCheck, CorkageInfo, Drink, Evidence, Food, Region, Restaurant, ReviewSignal, SourceLink } from '@/types';

const FOOD_MAP: Record<string, Food> = {
  '양식·다이닝': '양식',
  '해산물·회': '회·해산물',
  '회·해산물': '회·해산물',
  '일식·이자카야': '일식·이자카야',
  양식: '양식',
  한식: '한식',
  중식: '중식',
  고기: '고기',
  기타: '기타',
};
const DRINKS: Drink[] = ['와인', '사케', '위스키', '소주·전통주', '맥주', '기타'];
const REGIONS: Region[] = ['서울', '성남', '수원', '기타 경기'];

/** 후기 글 수로 신호를 정해요. 무료와 유료 언급이 둘 다 뚜렷하면 mixed(상충) */
export function reviewSignalOf(free: number, paid: number, conditional = false): ReviewSignal {
  if (free >= 2 && paid >= 2 && paid * 2 >= free) return 'mixed';
  if (free >= 2) return conditional ? 'conditional' : 'free';
  if (paid >= 2) return 'paid';
  return 'none';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function corkageOf(c: Any = {}, drinks: Any): CorkageInfo {
  const free = Number(c.freeMentions ?? 0);
  const paid = Number(c.paidMentions ?? 0);
  const drinkTypes = (Array.isArray(c.drinkTypes) ? c.drinkTypes : Array.isArray(drinks) ? drinks : []).filter((d: Drink) => DRINKS.includes(d));
  const isNew = ['verified_free', 'conditional_free', 'paid', 'unknown', 'disputed'].includes(c.status);
  if (isNew) {
    return {
      status: c.status,
      reviewSignal: c.reviewSignal ?? reviewSignalOf(free, paid),
      freeBottles: c.freeBottles ?? null,
      drinkTypes,
      extraFee: c.extraFee ?? null,
      glassIce: c.glassIce ?? null,
      minOrder: c.minOrder ?? null,
      conditions: c.conditions ?? [],
      freeMentions: free,
      paidMentions: paid,
      verifiedAt: c.verifiedAt ?? null,
      verificationMethod: c.verificationMethod ?? 'none',
      reviewCheckedAt: c.reviewCheckedAt ?? null,
    };
  }
  // v1: status free/conditional/paid/unknown + verifiedBy auto|manual
  const manual = c.verifiedBy === 'manual';
  const signal = c.status === 'free' || c.status === 'conditional' ? reviewSignalOf(Math.max(free, 2), paid, c.status === 'conditional') : reviewSignalOf(free, paid);
  let status: CorkageInfo['status'] = 'unknown';
  if (manual) status = c.status === 'free' ? 'verified_free' : c.status === 'conditional' ? 'conditional_free' : c.status === 'paid' ? 'paid' : 'unknown';
  else if (signal === 'mixed') status = 'disputed';
  return {
    status,
    reviewSignal: signal,
    freeBottles: c.bottleLimit ?? null,
    drinkTypes,
    extraFee: null,
    glassIce: null,
    minOrder: null,
    conditions: c.conditions ?? [],
    freeMentions: free,
    paidMentions: paid,
    verifiedAt: manual ? (c.verifiedAt ?? null) : null,
    verificationMethod: manual ? 'phone' : 'review',
    reviewCheckedAt: manual ? null : (c.verifiedAt ?? null),
  };
}

function sourcesOf(r: Any): SourceLink[] {
  if (Array.isArray(r.sources)) return r.sources.filter((s: SourceLink) => typeof s?.url === 'string' && /^https?:\/\//.test(s.url));
  const out: SourceLink[] = [];
  if (r.kakaoUrl) out.push({ provider: 'kakao', label: '카카오맵 장소', url: String(r.kakaoUrl) });
  if (r.naverUrl) out.push({ provider: 'naver', label: '네이버 지역 검색 링크', url: r.naverUrl });
  return out;
}

const evidenceOf = (list: Any): Evidence[] =>
  (Array.isArray(list) ? list : []).map((e: Any) => ({ title: String(e.title ?? ''), url: String(e.url ?? ''), date: String(e.date ?? ''), source: e.source === 'manual' ? 'manual' : 'naver-blog', signal: e.signal ?? 'mention' }));

export function normalizeRestaurant(r: Any): Restaurant {
  return {
    id: String(r.id),
    name: String(r.name),
    region: REGIONS.includes(r.region) ? r.region : '기타 경기',
    area: String(r.area ?? ''),
    food: FOOD_MAP[r.food] ?? '기타',
    category: String(r.category ?? ''),
    priceFor2: typeof r.priceFor2 === 'number' ? r.priceFor2 : null,
    address: String(r.address ?? ''),
    lat: typeof r.lat === 'number' ? r.lat : null,
    lng: typeof r.lng === 'number' ? r.lng : null,
    phone: String(r.phone ?? ''),
    sources: sourcesOf(r),
    corkage: corkageOf(r.corkage, r.drinks),
    closure:
      r.closure && ['ok', 'suspected', 'unknown'].includes(r.closure.status)
        ? { status: r.closure.status, checkedAt: r.closure.checkedAt ?? null, signals: Array.isArray(r.closure.signals) ? r.closure.signals : [] }
        : { status: 'unknown', checkedAt: null, signals: [] },
    evidence: evidenceOf(r.evidence),
    // 예전 형식의 images(외부 핫링크)는 쓰지 않아요. 직접 등록한 photos 만.
    photos: Array.isArray(r.photos) ? r.photos : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    menus: Array.isArray(r.menus) ? r.menus : [],
    firstSeen: String(r.firstSeen ?? ''),
    isSample: false,
  };
}

/**
 * 폐업 교차 확인 판단 (수집 스크립트와 테스트가 같이 써요)
 * - kakaoFound / naverFound: true(찾음) · false(못 찾음) · null(API 오류로 확인 못 함)
 * - latestPost: 가장 최근 블로그 후기 날짜
 * 두 개 이상의 독립된 신호가 있을 때만 '폐업 의심'이에요. 확정은 하지 않아요.
 */
export function closureOf(input: { kakaoFound: boolean | null; naverFound: boolean | null; latestPost: string | null; today: string }): ClosureCheck {
  const { kakaoFound, naverFound, latestPost, today } = input;
  const signals: string[] = [];
  const staleDays = latestPost ? (Date.parse(today) - Date.parse(latestPost)) / 864e5 : null;
  const stale = staleDays != null && staleDays > 540;
  if (kakaoFound === false) signals.push('카카오 장소 검색에서 안 보임');
  if (naverFound === false) signals.push('네이버 지역 검색에서 안 보임');
  if (stale) signals.push('최근 1년 반 동안 블로그 후기 없음');
  if (kakaoFound === null && naverFound === null) return { status: 'unknown', checkedAt: today, signals: ['API 오류로 확인 못 함'] };
  if (kakaoFound === true) return { status: 'ok', checkedAt: today, signals };
  if (kakaoFound === false && (naverFound === false || stale)) return { status: 'suspected', checkedAt: today, signals };
  return { status: 'unknown', checkedAt: today, signals };
}
