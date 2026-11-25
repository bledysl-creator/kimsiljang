# 🍷 OUR TABLE · by 김실장

우리 둘만의 **콜키지 프리** 맛집 아카이브. 서울·성남·분당·판교·수원의 콜키지 프리 가게를 자동으로 찾고, 블로그 근거로 무료 여부와 반입 조건을 검증하고, 메뉴 사진과 함께 취향에 맞게 추천해요.

- **프론트엔드**: React 19 + TypeScript + Tailwind CSS 4 + Vite (PWA, 홈 화면 설치)
- **메뉴 11개**: 홈 · 맛집 탐색 · 지도 탐색 · AI 추천 · 신규 발견 · 위시리스트 · 데이트 기록 · 술장고 · 랜덤 데이트 · 통계·분석 · 설정
- **테마**: 웜 아이보리 + 딥 버건디(기본), 다크 차콜 + 코랄핑크 + 라벤더(설정에서 전환)
- **데이터**: `public/data/restaurants.json`(실제 수집) / `src/data/sample.ts`(가상 예시, 화면에 '가상' 배지)
- **저장**: Supabase 키가 있으면 로그인 + 커플 공유, 없으면 이 브라우저(localStorage)

## 자동 수집 · 콜키지 검증 (`scripts/collect.ts`)

매일 오전 6시 GitHub Actions 가 실행해요. 공식 API만 쓰고 크롤링은 하지 않아요.

1. 네이버 블로그 검색: `지역 + 콜키지 프리/무료` 글 수집
2. 카카오 장소 검색: 지역별 이자카야·횟집·와인바·고깃집·오마카세·비스트로 가게 풀
3. 블로그 글에 가게 이름이 나오면 후보로 올림 (+ 네이버 지역 검색 `지역 + 콜키지`)
4. 후보마다 `가게명 콜키지` 블로그 글을 분석 → 무료 / 조건부(병 수, 평일 등) / 유료 / 확인 필요, 신뢰도, 잔·얼음 조건, 분위기 태그, 주종
5. 메뉴 사진: 카카오(다음) 이미지 검색 → 없으면 네이버 이미지 검색 썸네일 (출처 링크 표시)

직접 확인한 가게는 `public/data/manual.json` 에 넣으면 자동 결과보다 우선해요.

## 필요한 키

| 위치 | 이름 | 용도 |
| --- | --- | --- |
| GitHub Secrets | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | NAVER API HUB (블로그·지역·이미지 검색) |
| GitHub Secrets | `KAKAO_REST_KEY` | 카카오 장소·이미지 검색 |
| GitHub Secrets + Vercel | `KAKAO_JS_KEY` → Vercel 에서는 `VITE_KAKAO_JS_KEY` | 지도 |
| GitHub Secrets + Vercel | `SUPABASE_URL`, `SUPABASE_ANON_KEY` → Vercel 에서는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | 로그인·커플 공유 |
| GitHub Secrets | `SUPABASE_SERVICE_ROLE_KEY` | 수집 결과를 Supabase 에도 저장 (선택) |

Supabase 는 `supabase/schema.sql` 을 SQL Editor 에서 실행하면 테이블과 권한이 만들어져요.

## 배포

- **Vercel**: GitHub 저장소를 Import → Framework 'Vite' → 위 `VITE_` 환경변수 3개 입력 → Deploy. 수집 봇이 main 에 커밋하면 자동 재배포돼요.
- **GitHub Pages**: Settings → Pages → Source 'GitHub Actions'. https://bledysl-creator.github.io/kimsiljang/

## 로컬 실행

```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run collect      # 수집 (키 필요)
```
