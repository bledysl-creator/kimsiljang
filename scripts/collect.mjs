// 매일 GitHub Actions 에서 실행되는 수집 스크립트 (공식 API만 사용, 크롤링 없음)
//  1) 카카오 로컬 API: 좌표/주소/전화/카카오맵 링크가 비어 있는 가게를 채워요.
//  2) 네이버 블로그 검색 API (NAVER API HUB): 가게별 최근 후기 5개를 reviews.json 에 저장해요.
//  3) 네이버 블로그 검색 API: '콜키지 프리 + 지역' 새 글을 candidates.json 에 모아요.
// 필요한 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, KAKAO_REST_KEY (없는 건 건너뜀)
import { readFile, writeFile } from 'node:fs/promises';

const DATA = new URL('../public/data/', import.meta.url);
const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, KAKAO_REST_KEY } = process.env;

// 새 후보를 찾을 검색 지역. 필요하면 자유롭게 추가하세요.
const DISCOVERY_AREAS = {
  성남: ['분당', '판교', '서현역', '정자동', '야탑', '미금', '수내', '성남 모란'],
  수원: ['수원 인계동', '행궁동', '광교', '수원역', '영통', '권선동'],
  서울: ['강남', '성수', '을지로', '합정', '망원', '연남동', '잠실', '여의도', '종로', '이태원'],
};
const DISCOVERY_KEYWORDS = ['콜키지 프리', '콜키지프리'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s = '') =>
  s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
const fmtDate = (d = '') => (d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d);
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // KST
const plainName = (p) => p.name.replace('[샘플] ', '');

async function readJson(name) {
  return JSON.parse(await readFile(new URL(name, DATA), 'utf8'));
}
async function writeJson(name, obj) {
  await writeFile(new URL(name, DATA), JSON.stringify(obj, null, 2) + '\n');
}

async function naverBlog(query, { display = 10, sort = 'sim' } = {}) {
  // 2026년 9월부터 네이버 검색 API 는 NAVER API HUB(네이버 클라우드)로 옮겨졌어요.
  const url = `https://naverapihub.apigw.ntruss.com/search/v1/blog?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;
  const res = await fetch(url, {
    headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID, 'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET },
  });
  await sleep(150);
  if (!res.ok) throw new Error(`네이버 검색 실패 ${res.status}: ${await res.text()}`);
  return (await res.json()).items.map((i) => ({
    title: strip(i.title),
    description: strip(i.description),
    link: i.link,
    blogger: i.bloggername,
    date: fmtDate(i.postdate),
  }));
}

async function kakaoKeyword(query) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } });
  await sleep(150);
  if (!res.ok) throw new Error(`카카오 검색 실패 ${res.status}: ${await res.text()}`);
  return (await res.json()).documents;
}

async function enrichWithKakao(data) {
  let changed = 0;
  for (const p of data.places) {
    if (p.sample) continue;
    if (p.lat && p.lng && p.kakaoPlaceUrl) continue;
    const docs = await kakaoKeyword(`${plainName(p)} ${p.district || p.region}`);
    const d = docs[0];
    if (!d) {
      console.warn(`  카카오에서 못 찾음: ${p.name}`);
      continue;
    }
    p.lat ||= Number(d.y);
    p.lng ||= Number(d.x);
    p.address ||= d.road_address_name || d.address_name;
    p.phone ||= d.phone;
    p.kakaoPlaceUrl ||= d.place_url;
    changed++;
    console.log(`  카카오 정보 채움: ${p.name} → ${d.place_name}`);
  }
  return changed;
}

async function collectReviews(data) {
  const byPlace = {};
  for (const p of data.places) {
    if (p.sample) continue;
    const items = await naverBlog(`${plainName(p)} ${p.region} 콜키지`, { display: 10 });
    byPlace[p.id] = items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }
  return { _comment: '자동 생성 파일이에요. 직접 고치지 마세요.', updatedAt: today(), byPlace };
}

async function discoverCandidates(prev) {
  const seen = new Map(prev.items.map((i) => [i.link, i]));
  let added = 0;
  for (const [region, areas] of Object.entries(DISCOVERY_AREAS)) {
    for (const area of areas) {
      for (const kw of DISCOVERY_KEYWORDS) {
        const items = await naverBlog(`${area} ${kw}`, { display: 20, sort: 'date' });
        for (const it of items) {
          if (seen.has(it.link)) continue;
          seen.set(it.link, { ...it, region, area, foundAt: today(), status: 'new' });
          added++;
        }
      }
    }
  }
  const items = [...seen.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 300);
  return { added, file: { ...prev, updatedAt: today(), items } };
}

async function main() {
  const places = await readJson('places.json');

  if (KAKAO_REST_KEY) {
    console.log('1) 카카오로 가게 정보 채우기');
    if (await enrichWithKakao(places)) await writeJson('places.json', places);
  } else console.log('KAKAO_REST_KEY 없음 → 1단계 건너뜀');

  if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
    console.log('2) 가게별 최근 블로그 후기');
    await writeJson('reviews.json', await collectReviews(places));
    console.log('3) 새 콜키지 프리 후보 찾기');
    const { added, file } = await discoverCandidates(await readJson('candidates.json'));
    await writeJson('candidates.json', file);
    console.log(`  새 후보 글 ${added}개`);
  } else console.log('NAVER 키 없음 → 2, 3단계 건너뜀');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
