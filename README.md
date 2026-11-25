# 🍷 김실장

김실장이 추천하는 서울·경기(성남, 수원) **콜키지 프리** 술집 지도예요.

- 지도(카카오맵), 지역/업종 필터, 즐겨찾기, 홈 화면 설치(PWA)
- 매일 아침 6시 GitHub Actions 가 네이버 블로그 후기를 모으고 사이트를 다시 배포해요
- 리뷰·메뉴 사진은 네이버 지도/카카오맵으로 바로 연결해요 (공식 API만 사용, 크롤링 없음)

주소: https://bledysl-creator.github.io/kimsiljang/

## 가게 추가하기

`public/data/places.json` 의 `places` 에 항목을 추가하면 돼요. 좌표(`lat`, `lng`), 주소, 전화, 카카오맵 링크는 비워 두면 다음 자동 수집 때 카카오 API 로 채워져요.

```json
{
  "id": "seohyeon-example",
  "name": "가게 이름",
  "category": "회",
  "region": "성남",
  "district": "분당구 서현동",
  "corkage": { "type": "free", "note": "병 수 제한 없음", "checkedAt": "2026-11-25" },
  "tags": ["주차"],
  "memo": ""
}
```

- `category`: 회 · 이자카야 · 와인바 · 고기 · 기타
- `region`: 서울 · 성남 · 수원 · 기타 경기
- `corkage.type`: `free`(완전 무료) · `conditional`(조건부) · `paid`(유료) · `unknown`(확인 필요)

새 후보는 `public/data/candidates.json` 에 매일 쌓여요. 읽어보고 맞는 곳만 `places.json` 으로 옮기세요.

## 처음 한 번 설정

0. 네이버 키는 네이버 클라우드 플랫폼 콘솔 → NAVER API HUB → Application 에서 발급 (Client ID / Client Secret)
1. **Settings → Secrets and variables → Actions** 에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `KAKAO_REST_KEY`, `KAKAO_JS_KEY` 추가
2. **Settings → Pages → Source** 를 **GitHub Actions** 로 변경
3. **Actions → 수집하고 배포하기 → Run workflow** 로 첫 실행

## 로컬에서 실행

```bash
cp .env.example .env.local   # 키 입력
npm install
npm run dev                  # http://localhost:5173/kimsiljang/
npm run collect              # 수집 스크립트 (환경변수 필요)
```
