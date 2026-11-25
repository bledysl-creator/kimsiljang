// 자동 수집 + 콜키지 검증 (매일 GitHub Actions 에서 실행)
//
//  1) 블로그 발견   : 네이버 블로그 검색으로 '지역 + 콜키지 프리' 글을 모아요.
//  2) 가게 풀 만들기 : 카카오 장소 검색으로 지역별 이자카야·횟집·와인바 등을 모아요.
//                     네이버 지역 검색 '지역 + 콜키지' 결과도 카카오로 찾아 넣어요.
//  3) 매칭          : 블로그 글에 가게 이름이 나오면 후보로 올려요.
//  4) 검증          : 후보마다 '가게명 콜키지' 블로그 글을 읽고 무료/조건부/유료, 병 수, 조건을 뽑아요.
//
// CLAUDE.md 4절 원칙
//  - 공식 API 만 사용해요. 웹페이지 크롤링·이미지 수집은 하지 않아요 (메뉴 사진은 직접 등록한 것만).
//  - 블로그 후기는 '후기 신호(reviewSignal)'일 뿐이에요. 자동 수집 결과의 상태는 unknown, 후기가 상충하면 disputed.
//    '무료 확인(verified_free/conditional_free)'은 manual.json 이나 앱의 '직접 확인했어요' 기록으로만 정해져요.
//  - 블로그는 제목·링크·날짜만 저장해요 (본문 요약 미저장).
//  - 실패하면 이전 데이터를 그대로 두고 lastRun 에 실패를 기록해요.
// 필요 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET (NAVER API HUB), KAKAO_REST_KEY
// 선택: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 있으면 restaurants 테이블에도 올려요.

import { readFile, writeFile } from 'node:fs/promises';
import type { CollectionRun, CorkageInfo, Drink, Evidence, Food, Region, Restaurant, RestaurantDataset } from '../src/types';
import { normalizeRestaurant, reviewSignalOf } from '../src/lib/normalize';

const root = new URL('../', import.meta.url);
const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, KAKAO_REST_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const MAX_VERIFY = Number(process.env.MAX_VERIFY ?? 200);
const REVERIFY_DAYS = 5;

// ---- 우선 수집 지역 (서울, 성남, 분당, 판교, 수원) ----
const AREAS: { name: string; group: string }[] = [
  ...['강남역', '신사동', '성수동', '을지로', '합정', '연남동', '잠실', '여의도', '이태원', '종로'].map((name) => ({ name, group: '서울' })),
  ...['성남 모란', '성남 신흥동', '위례'].map((name) => ({ name, group: '성남' })),
  ...['서현역', '정자동', '수내역', '미금역', '야탑역'].map((name) => ({ name, group: '분당' })),
  ...['판교역', '서판교', '백현동'].map((name) => ({ name, group: '판교' })),
  ...['수원 인계동', '행궁동', '광교', '영통', '수원역'].map((name) => ({ name, group: '수원' })),
];
const PLACE_KEYWORDS = ['이자카야', '횟집', '와인바', '고깃집', '오마카세', '비스트로'];
/** 블로그 발견 키워드 (CLAUDE.md 7절) */
export const BLOG_KEYWORDS = ['콜키지 프리', '콜키지 무료', '와인 반입', '위스키 반입', 'BYOB'];

// ---------------------------------------------------------------------------
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const daysSince = (d?: string | null) => (d ? (Date.parse(today()) - Date.parse(d)) / 864e5 : Infinity);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const strip = (s = '') =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
const squash = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const fmtDate = (d = '') => (d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d);

const calls = { naver: 0, kakao: 0 };
const disabled = new Set<string>();

async function getJson(api: string, url: string, headers: Record<string, string>) {
  if (disabled.has(api)) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    } catch (e) {
      console.warn(`  ⚠️ ${api} 연결 실패, 다시 시도 (${(e as Error).message})`);
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (api.startsWith('naver')) calls.naver++;
    else calls.kakao++;
    await sleep(120);
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    const body = await res.text();
    console.warn(`  ⚠️ ${api} ${res.status}: ${body.slice(0, 200)} → 이번 실행에서 ${api} 를 끌게요`);
    disabled.add(api);
    return null;
  }
  return null;
}

// ---- API ----
const NAVER = 'https://naverapihub.apigw.ntruss.com/search/v1';
const naverHeaders = () => ({ 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID!, 'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET! });
const kakaoHeaders = () => ({ Authorization: `KakaoAK ${KAKAO_REST_KEY}` });

interface Post {
  title: string;
  link: string;
  description: string;
  date: string;
  text: string;
}

async function naverBlog(query: string, display = 30, sort: 'sim' | 'date' = 'sim'): Promise<Post[]> {
  const d = await getJson('naver-blog', `${NAVER}/blog?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`, naverHeaders());
  return (d?.items ?? []).map((i: Record<string, string>) => {
    const title = strip(i.title);
    const description = strip(i.description);
    return { title, description, link: i.link, date: fmtDate(i.postdate), text: `${title} ${description}` };
  });
}

async function naverLocal(query: string): Promise<{ title: string; category: string; address: string }[]> {
  const d = await getJson('naver-local', `${NAVER}/local?query=${encodeURIComponent(query)}&display=5&sort=comment`, naverHeaders());
  return (d?.items ?? []).map((i: Record<string, string>) => ({ title: strip(i.title), category: i.category, address: i.roadAddress || i.address }));
}

interface KPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
}

async function kakaoPlaces(query: string, page = 1): Promise<KPlace[]> {
  const d = await getJson('kakao-local', `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=15&page=${page}`, kakaoHeaders());
  return (d?.documents ?? []).filter((p: KPlace) => ['FD6', 'CE7', ''].includes(p.category_group_code));
}

// ---- 분류 ----
function regionOf(addr: string): Region {
  if (addr.startsWith('서울')) return '서울';
  if (addr.includes('성남시')) return '성남';
  if (addr.includes('수원시')) return '수원';
  return '기타 경기';
}

function areaOf(addr: string, fallback: string) {
  // '경기 성남시 분당구 정자동 123' → '분당구 정자동' / '서울 성동구 성수동2가' → '성동구 성수동2가'
  const parts = addr.split(/\s+/);
  const gu = parts.find((p) => /구$/.test(p));
  const dong = parts.find((p) => /(동|가|읍|면)\d*$/.test(p) && !/구$/.test(p));
  return [gu, dong].filter(Boolean).join(' ') || fallback;
}

export function foodOf(cat: string): Food {
  if (/회|횟집|해산물|해물|조개|생선|대게|방어/.test(cat)) return '회·해산물';
  if (/일식|이자카야|일본|초밥|오마카세|꼬치|오뎅|라멘/.test(cat)) return '일식·이자카야';
  if (/양식|이탈리|프랑스|스테이크|와인|비스트로|파스타|다이닝|스페인/.test(cat)) return '양식';
  if (/중식|중국/.test(cat)) return '중식';
  if (/고기|육류|삼겹|갈비|소고기|한우|양꼬치|곱창|돼지/.test(cat)) return '고기';
  if (/한식|국밥|찌개|전|막걸리/.test(cat)) return '한식';
  return '기타';
}

/** '경기 성남시 분당구 정자동 123' → '정자' (블로그 글에서 지점 구분용) */
function areaToken(addr: string) {
  const dong = addr.split(/\s+/).find((p) => /(동|가)\d*$/.test(p) && !/구$/.test(p)) ?? '';
  return dong.replace(/\d*가$/, '').replace(/\d*동$/, '').replace(/\d+$/, '');
}

/** '작은어촌 정자점' → '작은어촌' */
function coreName(name: string) {
  const n = name.replace(/\(.*?\)/g, '').trim();
  const parts = n.split(/\s+/);
  if (parts.length > 1 && /(점|호점|본점|직영점)$/.test(parts[parts.length - 1])) parts.pop();
  return parts.join(' ');
}

// ---- 콜키지 판정 ----
const RE_FREE = /콜키지\s*(프리|free|무료|0원|없|안\s*받)|무료\s*콜키지|콜키지(가|는|도|비|비용|료)?\s*(무료|프리|없)/i;
const RE_PAID = /콜키지\s*(비용|비|료|차지)?\s*[:은는이가]?\s*(병당\s*)?\d[\d,]*\s*(원|만\s*원)|콜키지\s*(유료|있음|받)|병당\s*\d[\d,]*\s*(원|만)/;
const RE_COND = /(\d|한|두|세)\s*병\s*(까지|만)?\s*(무료|프리)|평일\s*(만|에만)\s*(무료|프리|가능)|1인\s*1병/;

function bottleLimit(text: string): number | null {
  const m = text.match(/(\d|한|두|세)\s*병\s*(까지|만)?\s*(무료|프리)/);
  if (!m) return null;
  return { 한: 1, 두: 2, 세: 3 }[m[1]] ?? Number(m[1]);
}

function mode(xs: number[]) {
  const c = new Map<number, number>();
  xs.forEach((x) => c.set(x, (c.get(x) ?? 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** 여러 글에서 2번 이상 나온 조건만 남겨요 (한 글의 우연한 언급 제외) */
function conditionsOf(texts: string[]): string[] {
  const rules: [string, RegExp][] = [
    ['평일만', /평일\s*(만|에만)/],
    ['잔 제공', /잔\s*(제공|챙겨|무료|준비)|와인\s*잔\s*(을|도)?\s*(주|제공|내어)/],
    ['얼음 제공', /얼음\s*(제공|무료|주)/],
    ['와인만 가능', /와인\s*만\s*(가능|무료|프리)/],
    ['주말 불가', /주말\s*(은|에는)?\s*(불가|안\s*됨|유료)/],
    ['예약 시 문의', /예약\s*(시|할\s*때)\s*(문의|말씀|미리)/],
  ];
  const out: string[] = [];
  for (const [label, re] of rules) if (texts.filter((t) => re.test(t)).length >= 2) out.push(label);
  return out.slice(0, 5);
}

/** 2개 이상 글에서 나온 요금 언급 → '후기상 병당 2만원 언급' */
function extraFeeOf(texts: string[]): string | null {
  const fees = texts.map((t) => t.match(/콜키지\s*(비용|비|료|차지)?\s*[:은는이가]?\s*(병당\s*)?(\d[\d,]*)\s*(원|만\s*원)/)).filter(Boolean) as RegExpMatchArray[];
  return fees.length >= 2 ? `후기상 ${fees[0][2] ? '병당 ' : ''}${fees[0][3]}${fees[0][4].replace(/\s/g, '')} 언급` : null;
}

const TAG_RULES: [string, RegExp][] = [
  ['데이트', /데이트|커플|기념일/],
  ['분위기', /분위기\s*(좋|최고|맛집)|감성/],
  ['조용한', /조용/],
  ['룸', /룸|프라이빗|개별\s*공간/],
  ['주차', /주차\s*(가능|편|무료|공간|넓)|발렛/],
  ['단체', /단체|회식|모임/],
  ['늦게까지', /새벽|24시|늦게까지|심야/],
  ['뷰', /뷰|야경|루프탑|테라스/],
];
const DRINK_RULES: [Drink, RegExp][] = [
  ['와인', /와인/],
  ['사케', /사케|니혼슈/],
  ['위스키', /위스키|하이볼/],
  ['소주·전통주', /소주|막걸리|전통주|약주/],
  ['맥주', /맥주|크래프트\s*비어/],
];

export function judge(posts: Post[]): { corkage: CorkageInfo; evidence: Evidence[]; tags: string[] } {
  let free = 0;
  let paid = 0;
  let cond = 0;
  const evidence: Evidence[] = [];
  for (const p of posts) {
    const isFree = RE_FREE.test(p.text) || (/콜키지/.test(p.text) && RE_COND.test(p.text) && !/유료|비용|병당\s*\d/.test(p.text));
    const isPaid = !isFree && RE_PAID.test(p.text);
    const isCond = isFree && RE_COND.test(p.text);
    if (isFree) free++;
    if (isPaid) paid++;
    if (isCond) cond++;
    // 블로그 본문 요약(snippet)은 저장하지 않아요. 제목·링크·날짜만.
    evidence.push({ title: p.title, url: p.link, date: p.date, source: 'naver-blog', signal: isCond ? 'conditional' : isFree ? 'free' : isPaid ? 'paid' : 'mention' });
  }
  const texts = posts.map((p) => p.text);
  const limits = texts.map(bottleLimit).filter((x): x is number => x != null);
  const limit = limits.length >= 2 ? mode(limits) : null;
  // 조건 언급이 무료 언급의 1/3 이상이거나 병 수 제한이 2개 글 이상에서 나오면 '조건부' 신호
  const signal = reviewSignalOf(free, paid, cond * 3 >= free || limit != null);
  const glass = texts.filter((t) => /잔\s*(제공|챙겨|무료|준비)|와인\s*잔\s*(을|도)?\s*(주|제공|내어)/.test(t)).length >= 2;
  const ice = texts.filter((t) => /얼음\s*(제공|무료|주)/.test(t)).length >= 2;
  return {
    corkage: {
      // 후기만으로는 '확인 완료'가 될 수 없어요. 상충하면 disputed.
      status: signal === 'mixed' ? 'disputed' : 'unknown',
      reviewSignal: signal,
      freeBottles: limit,
      drinkTypes: DRINK_RULES.filter(([, re]) => texts.filter((t) => re.test(t)).length >= 2).map(([d]) => d),
      extraFee: extraFeeOf(texts),
      glassIce: glass || ice ? `후기상 ${[glass && '잔', ice && '얼음'].filter(Boolean).join('·')} 제공 언급` : null,
      minOrder: null,
      conditions: conditionsOf(texts),
      freeMentions: free,
      paidMentions: paid,
      verifiedAt: null,
      verificationMethod: 'review',
      reviewCheckedAt: today(),
    },
    evidence: evidence.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    tags: TAG_RULES.filter(([, re]) => texts.filter((t) => re.test(t)).length >= 2).map(([t]) => t),
  };
}

// 술 이름·일반 단어와 겹치는 가게 이름은 동네 이름까지 확인해요
const GENERIC = /^(청하|참이슬|처음처럼|나나|우리|오늘|하루|봄|여름|가을|겨울|바다|고기|술집|와인|사케|위스키|맛집|본가|원조)$/;

// ---- 상태 파일 ----
interface PoolItem {
  place: KPlace;
  area: string;
  hits: number;
  localHint: boolean;
  firstSeen: string;
  verifiedAt?: string;
  result?: ReturnType<typeof judge>;
}
interface State {
  version?: number;
  pool: Record<string, PoolItem>;
}
const STATE_VERSION = 4; // 판정 규칙이 바뀌면 올려서 전부 다시 검증해요
interface ManualPlace {
  name: string;
  area: string;
  /** 직접 확인한 콜키지 정보. status 는 verified_free / conditional_free / paid (예전 free/conditional 도 읽어요) */
  corkage?: Partial<CorkageInfo> & { status?: string; bottleLimit?: number | null };
  priceFor2?: number;
  menus?: string[];
  drinks?: Drink[];
  tags?: string[];
  kakaoId?: string;
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(new URL(path, root), 'utf8')) as T;
  } catch {
    return fallback;
  }
}
const writeJson = (path: string, v: unknown) => writeFile(new URL(path, root), JSON.stringify(v, null, 2) + '\n');

// ---------------------------------------------------------------------------
const SOURCE = '네이버 블로그·지역 검색(NAVER API HUB), 카카오 로컬 API 자동 수집 · 블로그는 제목/링크/날짜만';
const startedAt = new Date().toISOString();

/** 직접 확인한 정보(manual.json)를 확인 상태로 반영 */
export function manualCorkage(auto: CorkageInfo, m: { corkage?: ManualPlace['corkage'] }): CorkageInfo {
  const c = m.corkage ?? {};
  const map: Record<string, CorkageInfo['status']> = { free: 'verified_free', conditional: 'conditional_free', verified_free: 'verified_free', conditional_free: 'conditional_free', paid: 'paid' };
  const status = map[String(c.status)] ?? 'unknown';
  return {
    ...auto,
    status,
    freeBottles: c.freeBottles ?? c.bottleLimit ?? auto.freeBottles,
    extraFee: c.extraFee ?? auto.extraFee,
    glassIce: c.glassIce ?? auto.glassIce,
    minOrder: c.minOrder ?? auto.minOrder,
    conditions: c.conditions ?? auto.conditions,
    verifiedAt: c.verifiedAt ?? today(),
    verificationMethod: c.verificationMethod && c.verificationMethod !== 'review' && c.verificationMethod !== 'none' ? c.verificationMethod : 'phone',
  };
}

/** 실패 시: 이전 데이터는 그대로, lastRun 만 실패로 기록 */
async function recordFailure(error: string) {
  const prev = await readJson<Partial<RestaurantDataset>>('public/data/restaurants.json', {});
  const lastRun: CollectionRun = { status: 'failed', startedAt, finishedAt: new Date().toISOString(), count: prev.restaurants?.length ?? 0, error: error.slice(0, 200) };
  await writeJson('public/data/restaurants.json', {
    updatedAt: prev.updatedAt ?? null,
    source: prev.source ?? SOURCE,
    lastRun,
    lastSuccessAt: prev.lastSuccessAt ?? prev.updatedAt ?? null,
    restaurants: (prev.restaurants ?? []).map(normalizeRestaurant),
  });
}

async function main() {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || !KAKAO_REST_KEY) {
    console.log('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET / KAKAO_REST_KEY 가 없어서 수집을 건너뛰어요.');
    return;
  }
  const state = await readJson<State>('data/state.json', { pool: {} });
  if (state.version !== STATE_VERSION) {
    for (const it of Object.values(state.pool) as (PoolItem & { images?: unknown; imagesAt?: unknown })[]) {
      delete it.verifiedAt;
      delete it.images;
      delete it.imagesAt;
    }
    state.version = STATE_VERSION;
  }
  // 예전 형식으로 판정된 결과는 버리고 다시 검증해요 (MAX_VERIFY 때문에 한 번에 다 못 돌았을 수 있어요)
  for (const it of Object.values(state.pool)) {
    if (it.result && !('reviewSignal' in it.result.corkage)) {
      delete it.result;
      delete it.verifiedAt;
    }
  }
  const manual = (await readJson<{ places: ManualPlace[] }>('public/data/manual.json', { places: [] })).places;

  // 1) 블로그 발견
  console.log('1) 블로그에서 콜키지 프리 글 모으기');
  const posts: Post[] = [];
  for (const a of AREAS) {
    for (const kw of BLOG_KEYWORDS) {
      posts.push(...(await naverBlog(`${a.name} ${kw}`, kw.startsWith('콜키지') ? 100 : 50)).filter((p) => /콜키지|반입|BYOB/i.test(p.text)));
    }
  }
  if (posts.length === 0) throw new Error('블로그 검색 결과가 0건이에요 (API 오류 또는 권한 문제)');
  const postText = posts.map((p) => squash(p.text));
  console.log(`  콜키지 언급 글 ${posts.length}개`);

  // 2) 가게 풀
  console.log('2) 카카오 장소 검색으로 가게 풀 만들기');
  const add = (p: KPlace, area: string, hint = false) => {
    const cur = state.pool[p.id];
    if (cur) {
      cur.place = p;
      cur.localHint ||= hint;
    } else state.pool[p.id] = { place: p, area, hits: 0, localHint: hint, firstSeen: today() };
  };
  for (const a of AREAS) {
    for (const kw of PLACE_KEYWORDS) for (const p of await kakaoPlaces(`${a.name} ${kw}`)) add(p, a.name);
    for (const l of await naverLocal(`${a.name} 콜키지`)) {
      const [p] = await kakaoPlaces(`${coreName(l.title)} ${a.name}`);
      if (p) add(p, a.name, true);
    }
  }
  for (const m of manual) {
    const [p] = await kakaoPlaces(`${m.name} ${m.area}`);
    if (p) {
      add(p, m.area, true);
      m.kakaoId = p.id;
    } else console.warn(`  ⚠️ 직접 입력한 '${m.name}' 을 카카오에서 못 찾았어요`);
  }
  console.log(`  가게 풀 ${Object.keys(state.pool).length}곳`);

  // 3) 매칭
  for (const item of Object.values(state.pool)) {
    const key = squash(coreName(item.place.place_name));
    item.hits = key.length >= 2 ? postText.filter((t) => t.includes(key)).length : 0;
  }

  // 4) 검증
  console.log('3) 후보 검증');
  const manualIds = new Set(manual.map((m) => m.kakaoId).filter(Boolean));
  const queue = Object.entries(state.pool)
    .filter(([id, it]) => (it.hits > 0 || it.localHint || manualIds.has(id)) && daysSince(it.verifiedAt) >= REVERIFY_DAYS)
    .sort(([ia, a], [ib, b]) => Number(manualIds.has(ib)) - Number(manualIds.has(ia)) || b.hits - a.hits)
    .slice(0, MAX_VERIFY);
  // 같은 이름의 지점이 여러 곳이면(체인), 블로그 글에 동네 이름까지 있어야 그 지점 근거로 인정해요.
  const nameCount = new Map<string, number>();
  for (const it of Object.values(state.pool)) {
    const k = squash(coreName(it.place.place_name));
    nameCount.set(k, (nameCount.get(k) ?? 0) + 1);
  }
  for (const [, it] of queue) {
    const name = coreName(it.place.place_name);
    const key = squash(name);
    const town = areaToken(it.place.address_name);
    const strict = key.length <= 2 || (nameCount.get(key) ?? 0) > 1 || GENERIC.test(name);
    const found = (await naverBlog(`${name} ${town} 콜키지`, 40)).filter((p) => {
      const t = squash(p.text);
      return t.includes(key) && /콜키지/.test(p.text) && (!strict || (town.length >= 2 && t.includes(town)));
    });
    it.result = judge(found);
    it.verifiedAt = today();
  }
  console.log(`  검증 ${queue.length}곳`);

  // 5) 결과 만들기
  const manualByKakao = new Map(manual.filter((m) => m.kakaoId).map((m) => [m.kakaoId!, m]));
  const keep = Object.entries(state.pool).filter(([id, it]) => {
    if (manualByKakao.has(id)) return true;
    const r = it.result;
    if (!r) return false;
    const sig = r.corkage.reviewSignal;
    if (sig === 'free' || sig === 'conditional' || sig === 'mixed') return r.corkage.freeMentions >= 2;
    return r.corkage.status === 'unknown' && r.evidence.length >= 3;
  });

  const restaurants: Restaurant[] = keep.map(([id, it]) => {
    const p = it.place;
    const m = manualByKakao.get(id);
    const r = it.result ?? judge([]);
    const addr = p.road_address_name || p.address_name;
    const corkage: CorkageInfo = m?.corkage?.status ? manualCorkage(r.corkage, m) : r.corkage;
    const sources = [{ provider: 'kakao' as const, label: '카카오맵 장소', url: p.place_url }].filter((x) => /^https?:\/\//.test(x.url));
    return {
      id: `k${id}`,
      name: p.place_name,
      region: regionOf(p.address_name),
      area: areaOf(p.address_name, it.area),
      food: foodOf(`${p.category_name} ${p.place_name}`),
      category: p.category_name.replace(/^음식점 > /, ''),
      priceFor2: m?.priceFor2 ?? null,
      address: addr,
      lat: Number(p.y),
      lng: Number(p.x),
      phone: p.phone,
      sources,
      corkage: m?.drinks?.length ? { ...corkage, drinkTypes: m.drinks } : corkage,
      evidence: r.evidence,
      photos: [],
      firstSeen: it.firstSeen,
      isSample: false,
      tags: [...new Set([...(m?.tags ?? []), ...r.tags])],
      menus: m?.menus ?? [],
    };
  });

  const finishedAt = new Date().toISOString();
  const dataset: RestaurantDataset = {
    updatedAt: today(),
    source: SOURCE,
    lastRun: { status: 'success', startedAt, finishedAt, count: restaurants.length, error: null },
    lastSuccessAt: today(),
    restaurants: restaurants.sort((a, b) => b.corkage.freeMentions - a.corkage.freeMentions),
  };
  await writeJson('public/data/restaurants.json', dataset);
  await writeJson('data/state.json', state);

  const by = (s: string) => restaurants.filter((r) => r.corkage.status === s).length;
  console.log(`✅ 완료: ${restaurants.length}곳 (확인 전 ${by('unknown')}, 상충 ${by('disputed')}, 직접 확인 무료 ${by('verified_free') + by('conditional_free')}, 유료 ${by('paid')})`);
  console.log(`   API 호출 네이버 ${calls.naver}회 · 카카오 ${calls.kakao}회${disabled.size ? ` · 꺼진 API: ${[...disabled].join(', ')}` : ''}`);

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) await pushToSupabase(restaurants);
}

// 공용 가게 정보만 올려요 (supabase/migrations/0001_init.sql 의 restaurants 테이블).
// 블로그 근거는 링크·제목·날짜만이고, 저장 허용 범위는 README '한계' 절 참고.
async function pushToSupabase(list: Restaurant[]) {
  const rows = list.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    region: r.region,
    area: r.area,
    food: r.food,
    category: r.category,
    lat: r.lat,
    lng: r.lng,
    phone: r.phone,
    source_ids: { kakao: r.id.replace(/^k/, '') },
    price_min: r.priceFor2,
    price_max: r.priceFor2,
    corkage: r.corkage,
    evidence: r.evidence,
    sources: r.sources,
    tags: r.tags,
    menus: r.menus,
    first_seen: r.firstSeen,
    updated_at: new Date().toISOString(),
  }));
  const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  console.log(res.ok ? `   Supabase 에 ${rows.length}곳 올림` : `   ⚠️ Supabase 업로드 실패 ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

if (process.argv[1]?.endsWith('collect.ts'))
  main().catch(async (e) => {
    console.error(e);
    await recordFailure(String((e as Error)?.message ?? e)).catch(() => {});
    process.exit(1);
  });
