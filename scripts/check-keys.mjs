// API 키 연결 확인용. 키 값은 출력하지 않고 성공/실패만 보여줘요.
const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, KAKAO_REST_KEY, KAKAO_JS_KEY } = process.env;
let failed = false;

// 네트워크가 잠깐 끊겨도 3번까지 다시 시도해요
async function fetchRetry(url, opts, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fetch(url, { ...opts, signal: AbortSignal.timeout(15000) });
    } catch (e) {
      if (i >= tries) {
        // 키 문제가 아니라 GitHub 러너 ↔ API 서버 연결 문제라서 실패 대신 경고로 남겨요
        console.log(`⚠️  ${new URL(url).host} 에 연결하지 못했어요 (${e.cause?.code ?? e.message}). 키 확인은 다음 실행에서 다시 해요.`);
        return null;
      }
      console.log(`  (연결 재시도 ${i}/${tries - 1}: ${e.cause?.code ?? e.message})`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}
const ok = (m) => console.log(`✅ ${m}`);
const warn = (m) => console.log(`⚠️  ${m}`);
const bad = (m) => {
  console.log(`❌ ${m}`);
  failed = true;
};

// 카카오 키는 필수, 네이버 키는 선택 (없으면 블로그 후기 수집만 빠져요)
for (const [k, v] of Object.entries({ KAKAO_REST_KEY, KAKAO_JS_KEY })) {
  if (v) ok(`${k} 있음 (${v.length}자)`);
  else bad(`${k} 없음`);
}
for (const [k, v] of Object.entries({ NAVER_CLIENT_ID, NAVER_CLIENT_SECRET })) {
  if (v) ok(`${k} 있음 (${v.length}자)`);
  else warn(`${k} 없음 (선택: 블로그 후기 수집이 꺼져요)`);
}

if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) await (async () => {
  const res = await fetchRetry(
    `https://naverapihub.apigw.ntruss.com/search/v1/blog?query=${encodeURIComponent('서현 콜키지')}&display=1`,
    { headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID, 'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET } }
  );
  if (!res) return;
  const body = await res.text();
  if (res.ok) ok(`네이버 블로그 검색 성공 (총 ${JSON.parse(body).total}건)`);
  else bad(`네이버 블로그 검색 실패 ${res.status}: ${body.slice(0, 300)}`);
})();

if (KAKAO_REST_KEY) await (async () => {
  const res = await fetchRetry(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent('서현역')}&size=1`, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
  });
  if (!res) return;
  const body = await res.text();
  if (res.ok) ok(`카카오 장소 검색 성공 (${JSON.parse(body).documents[0]?.place_name})`);
  else bad(`카카오 장소 검색 실패 ${res.status}: ${body.slice(0, 300)}`);
})();

if (KAKAO_JS_KEY) await (async () => {
  // 지도 SDK 는 등록된 도메인에서만 동작해요. 여기서는 키가 유효한지만 봐요.
  const res = await fetchRetry(`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`, {
    headers: { Referer: 'https://bledysl-creator.github.io/kimsiljang/' },
  });
  if (!res) return;
  const body = await res.text();
  if (res.ok && !/error|invalid/i.test(body.slice(0, 200))) ok('카카오 지도 JS 키 응답 정상');
  else bad(`카카오 지도 JS 키 확인 실패 ${res.status}: ${body.slice(0, 200)}`);
})();

process.exit(failed ? 1 : 0);
