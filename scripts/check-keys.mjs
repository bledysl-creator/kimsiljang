// API 키 연결 확인용. 키 값은 출력하지 않고 성공/실패만 보여줘요.
const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, KAKAO_REST_KEY, KAKAO_JS_KEY } = process.env;
let failed = false;
const ok = (m) => console.log(`✅ ${m}`);
const bad = (m) => {
  console.log(`❌ ${m}`);
  failed = true;
};

for (const [k, v] of Object.entries({ NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, KAKAO_REST_KEY, KAKAO_JS_KEY })) {
  v ? ok(`${k} 있음 (${v.length}자)`) : bad(`${k} 없음`);
}

if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
  const res = await fetch(
    `https://naverapihub.apigw.ntruss.com/search/v1/blog?query=${encodeURIComponent('서현 콜키지')}&display=1`,
    { headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID, 'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET } }
  );
  const body = await res.text();
  res.ok ? ok(`네이버 블로그 검색 성공 (총 ${JSON.parse(body).total}건)`) : bad(`네이버 블로그 검색 실패 ${res.status}: ${body.slice(0, 300)}`);
}

if (KAKAO_REST_KEY) {
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent('서현역')}&size=1`, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
  });
  const body = await res.text();
  res.ok
    ? ok(`카카오 장소 검색 성공 (${JSON.parse(body).documents[0]?.place_name})`)
    : bad(`카카오 장소 검색 실패 ${res.status}: ${body.slice(0, 300)}`);
}

if (KAKAO_JS_KEY) {
  // 지도 SDK 는 등록된 도메인에서만 동작해요. 여기서는 키가 유효한지만 봐요.
  const res = await fetch(`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`, {
    headers: { Referer: 'https://bledysl-creator.github.io/kimsiljang/' },
  });
  const body = await res.text();
  res.ok && !/error|invalid/i.test(body.slice(0, 200))
    ? ok('카카오 지도 JS 키 응답 정상')
    : bad(`카카오 지도 JS 키 확인 실패 ${res.status}: ${body.slice(0, 200)}`);
}

process.exit(failed ? 1 : 0);
