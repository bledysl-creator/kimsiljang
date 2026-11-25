# 🍷 김실장 · 콜키지 프리 맛집 (프로젝트명 OUR TABLE)

우리 둘을 위한 **콜키지 프리** 맛집 가이드예요. 서울과 경기(성남·분당·판교·수원 우선)에서 후보를 자동으로 찾고, 콜키지 정보를 근거와 함께 보여주고, 두 사람의 취향에 맞춰 추천해요. 개발 규칙은 [`CLAUDE.md`](CLAUDE.md)에 있어요.

- **프론트엔드**: React 19 + TypeScript + Tailwind CSS 4 + Vite. 홈 화면에 설치할 수 있어요(PWA).
- **디자인**: 버건디 사이드바, 아이보리 배경, 왼쪽 목록 40% + 오른쪽 카카오 지도 60%. 768px 미만에서는 하단 탭과 목록/지도 전환으로 바뀌어요.
- **메뉴 11개**: 홈, 맛집 탐색, 지도 탐색, AI 추천, 신규 발견, 위시리스트, 데이트 기록, 술장고, 랜덤 데이트, 통계·분석, 설정.
- **데이터**
  - `public/data/restaurants.json`: 실제 수집 데이터. 화면에 '실제 수집' 배지가 붙어요.
  - `src/data/sample.ts`: 가상 예시. 이름 끝에 '(예시)'가 붙고 '가상 예시' 배지가 붙어요. 설정에서 숨길 수 있어요.
- **저장**: Supabase 키가 있으면 로그인하고 커플끼리 공유해요. 없으면 이 브라우저(localStorage)에 저장해요.

## 콜키지 상태

| 상태 | 뜻 | 정해지는 방법 |
| --- | --- | --- |
| ✓ 무료 확인 (`verified_free`) | 무료 | 공식 안내, 전화, 방문으로 직접 확인 |
| ◐ 조건부 무료 (`conditional_free`) | 병 수나 요일 등 조건이 있는 무료 | 직접 확인 |
| ₩ 유료 (`paid`) | 콜키지 비용 있음 | 직접 확인 |
| ? 미확인 (`unknown`) | 아직 확인 전. 블로그 후기 신호는 따로 표시 | 자동 수집 기본값 |
| ! 정보 상충 (`disputed`) | 무료와 유료 후기가 둘 다 뚜렷함. 무료 필터에서 빠져요 | 자동 수집 |

블로그 후기만으로는 '확인됨'이 될 수 없어요. 가게 상세의 **직접 확인했어요**에 기록하거나 `public/data/manual.json`에 넣어야 확인 상태가 돼요. 확인한 지 30일이 지나면 재확인을 권해요.

## 추천 점수

가중치는 콜키지 35, 음식 25, 분위기 15, 예산 15, 위치 10이에요. 두 사람의 점수를 평균해요. 정보가 없는 항목은 0점으로 치지 않고 계산에서 빼요. 그 대신 **정보 충족률**을 같이 보여주고, 충족률이 50% 미만이면 적합도 숫자를 숨겨요. 지금은 규칙 기반이고 외부 AI는 호출하지 않아요.

## 자동 수집 (`scripts/collect.ts`)

GitHub Actions가 매일 오전 7시(KST)에 실행하도록 예약돼 있어요. 실행 시각은 GitHub 사정에 따라 늦어질 수 있어요. 공식 API만 쓰고 크롤링이나 이미지 수집은 하지 않아요.

1. **네이버 블로그 검색**: `지역 + 콜키지 프리 / 콜키지 무료 / 와인 반입 / 위스키 반입 / BYOB`로 글을 모아요.
2. **카카오 장소 검색**: 지역별 이자카야, 횟집, 와인바, 고깃집, 오마카세, 비스트로를 모아 가게 풀을 만들어요. 네이버 지역 검색 결과도 함께 써요.
3. 블로그 글에 가게 이름이 나오면 후보로 올려요. 체인점이나 흔한 이름은 동네 이름까지 맞아야 해요.
4. 후보마다 블로그 후기를 분석해서 후기 신호(무료, 조건부, 유료, 상충), 병 수, 반입 주종, 요금 언급, 잔·얼음, 분위기 태그를 뽑아요. 두 개 이상의 글에서 나온 것만 써요.
5. 결과는 `public/data/restaurants.json`에 쓰고 `lastRun`과 `lastSuccessAt`도 같이 기록해요. 실패하면 **이전 데이터는 그대로 두고** 실패만 기록해요.

API 호출은 재시도 3회, 지수 백오프, 15초 타임아웃을 지켜요. 4xx 오류가 나면 그 실행에서 해당 API를 꺼요.

## 필요한 키

| 위치 | 이름 | 용도 |
| --- | --- | --- |
| GitHub Secrets | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | NAVER API HUB 블로그·지역 검색 (서버 전용) |
| GitHub Secrets | `KAKAO_REST_KEY` | 카카오 로컬 장소 검색 (서버 전용) |
| GitHub Secrets + Vercel | `KAKAO_JS_KEY`, Vercel에서는 `VITE_KAKAO_JS_KEY` | 지도. 카카오 콘솔에서 허용 도메인을 꼭 제한하세요 |
| GitHub Secrets + Vercel | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, Vercel에서는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | 로그인, 커플 공유 |
| GitHub Secrets | `SUPABASE_SERVICE_ROLE_KEY` | 수집 결과를 Supabase에도 저장 (선택, 서버 전용) |

비밀키와 service role 키에는 절대 `VITE_`를 붙이지 마세요. 붙이면 브라우저 번들에 들어가요. `.env`와 `.env.local`은 커밋하지 않아요.

## Supabase

`supabase/migrations/0001_init.sql`을 SQL Editor에서 실행하거나 `supabase db push`로 적용하세요. CLAUDE.md 6절 모델(profiles, couples, couple_members, restaurants, corkage_evidence, source_links, wishes, visits, ratings, cellar, collection_runs)과 RLS가 만들어져요.

- 커플 데이터는 같은 커플 구성원만 읽고 쓸 수 있어요. 한 커플은 최대 2명이에요.
- `profiles`에서 고칠 수 있는 열은 닉네임과 취향뿐이에요. `couple_id`를 직접 바꿔 다른 커플에 들어갈 수 없어요.
- `supabase/tests/rls_check.sql`은 실제 계정 세 개로 RLS를 점검하는 수동 스크립트예요. **아직 실행하지 않았어요.**

## 배포

배포와 GitHub 업로드는 사용자 승인 후에만 해요.

- **GitHub Pages**: Settings → Pages → Source를 'GitHub Actions'로 두면 돼요. `main`에 반영되면 배포돼요. 주소는 https://bledysl-creator.github.io/kimsiljang/ 이에요.
- **Vercel** (선택): 저장소를 Import하고 Framework는 'Vite'로 고른 뒤, 위 `VITE_` 환경변수를 넣고 Deploy하세요.

## 로컬 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev        # http://localhost:5173
npm run lint       # oxlint
npm test           # vitest (후기 분석, 추천 점수, 필터, 예전 데이터 변환)
npm run build      # 타입 검사 + 빌드
npm run collect    # 수집 (키 필요)
```

## 한계와 확인할 것

- **메뉴 사진과 리뷰**: 네이버 방문자 리뷰, 카카오맵 리뷰, 평점, 메뉴 사진은 공개 API로 가져올 수 있다고 보지 않아요. 사진은 직접 등록했거나 허가받은 것만 보여줄 수 있어요. 사진 업로드 기능은 아직 준비 중이에요.
- **데이터 저장 범위**: 네이버와 카카오 검색 결과를 저장하고 캐시하고 재배포해도 되는 범위는 아직 확인하지 않았어요. 그래서 블로그는 제목, 링크, 날짜만 저장해요. 공개 서비스로 바꾸기 전에 약관을 확인해야 해요.
- **영업시간과 가격**: API에서 확인할 수 없어서 '확인 필요'로 보여줘요. 2인 가격은 직접 입력한 경우에만 보여줘요.
- **분위기**: 블로그 후기에서 뽑은 추정치예요.
- **예전 데이터**: 예전 형식의 `restaurants.json`도 앱이 새 형식으로 바꿔서 읽어요(`src/lib/normalize.ts`). 이때 자동 판정의 '무료'는 '미확인 + 후기 무료'로 바뀌어요.
