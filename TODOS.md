# TODOS

방탈출 취향 기반 개인 맞춤 추천 플랫폼 — Stage별 할 일 목록

---

## Stage 1: 프로필 기반 추천 (MVP)

목표: 퀴즈 완료 후 `/result` 페이지에서 즉시 맞춤 방 추천 제공

- [x] `src/data/rooms.json` — 서울 주요 지역 30개 방 데이터 수동 큐레이션
- [x] `src/lib/recommend.ts` — rule-based 매칭 알고리즘 (fear_level ±1, genre 겹침, fallback 완화, rating_avg 정렬)
- [x] `ResultCard.tsx` — "추천 방 3개" 섹션 UI
- [x] i18n — `rec_title` / `rec_subtitle` / `rec_location` 키 추가 (ko + en)
- [ ] 추천 카드 클릭 이벤트 실제 로깅 — 현재 `console.log` 플레이스홀더, 추후 analytics로 교체
- [ ] 방 데이터 추가 큐레이션 — 현재 30개, 지역/장르 커버리지 보강

---

## Stage 2: 방 탐색 & 테마 추천

목표: 퀴즈 없이도 방을 탐색하고, 테마별로 빠르게 추천받을 수 있는 페이지

- [ ] `/rooms` 라우트 추가 — App.tsx에 react-router Routes 적용
- [ ] `RoomBrowse` 페이지 컴포넌트 — 방 카드 그리드 + 필터 (지역, 장르, 인원, 공포도)
- [ ] `useRooms` 훅 — PostgREST fetch, 필터 파라미터 → query string 변환
- [ ] 테마 칩 UI — 페이지 상단에 "혼방 추천 / 6인+ / 공포 입문 / 인테리어 맛집 / 데이트 코스" 클릭 시 필터 자동 적용
- [ ] 테마 정의 A — rule-based (구조적 필드 기반, 자동)
  - 혼방 추천: min_players <= 2
  - 6인+ 추천: max_players >= 6
  - 공포 입문: fear_level <= 2
  - 공포 고수: fear_level >= 4
  - 인테리어 맛집: interior_score >= 4.5
  - 데이트 코스: interior_score >= 4.0, genres includes Emotional
- [ ] 테마 정의 B — 리뷰 기반 태그 (후기에서 추출 → tags 컬럼에 저장)
  - 후기 수집: 네이버/카카오 방탈출 후기에서 키워드 추출 (수동 or AI 보조)
  - 태그 예시: `공간넓음`, `6인편함`, `주차가능`, `화장실깨끗`, `초심자추천`, `재방문의향`
  - 어드민 tags 필드에 입력 → DB 저장
  - 브라우즈 페이지에서 tags 기반 필터/검색 지원
- [ ] ResultCard에서 "방 전체 보기" 링크 → `/rooms`
- [ ] 메인 랜딩에 "방 둘러보기" 진입점 추가

---

## Stage 3: 방 기록 기능

목표: 유저가 해본 방을 기록하고 데이터를 축적

- [ ] "내가 해본 방" 로그 UI — 방 이름, 날짜, 클리어 여부, 별점(1-5), 메모 입력
- [ ] `localStorage` 저장 — 기기 내 방 기록 퍼시스턴스
- [ ] 기록된 방 목록 뷰 — 내가 해온 방 히스토리 페이지
- [ ] "내 기록 카드" 공유 기능 — 기존 result 카드 포맷 활용, 기록 요약 포함
- [ ] Supabase anonymous auth 도입 — 기기 교체 시 데이터 유실 방지 (localStorage만으론 한계)
- [ ] 익명 계정 → 소셜 로그인 업그레이드 경로 설계

---

## Stage 3: 개인화 추천 고도화

목표: 별점 기록 기반으로 추천 정확도 향상 (기록 1,000개 이상 누적 시 시작)

- [ ] 백엔드 이관 — rooms DB + 유저 기록을 Supabase로 전환
- [ ] Content-based filtering — 별점 기록 기반 취향 벡터 계산
- [ ] Collaborative filtering — 유사 프로필 유저의 인기 방 추천
- [ ] 태그 커버리지 확보 — 방 1개당 8개 이상 태그 있어야 content-based 의미 있음
- [ ] 추천 클릭률 측정 대시보드 — Stage 1 목표: 30%+

---

## 미래 비전 (현재 스코프 밖)

- [ ] 유저 간 취향 비교 기능
- [ ] 팀원 매칭 — 같은 취향의 방탈출 파티 구성
- [ ] 전국 지역 확장 — 현재 서울만, 이후 부산/대구 등

---

## 어드민 페이지 (feat/admin-page)

목표: `/admin` 라우트에서 방 데이터 CRUD 관리 (react-admin + ra-data-postgrest)

- [ ] **P0** PostgREST write 권한 확인 — `\dp rooms`로 INSERT/UPDATE/DELETE 권한 점검, 없으면 `GRANT INSERT, UPDATE, DELETE ON rooms TO <role>` 실행 (블로커: 권한 없으면 수정/생성/삭제 전부 403)
- [ ] **P0** `npm install react-admin ra-data-postgrest react-router-dom --legacy-peer-deps` 설치 후 빌드 확인
- [ ] **P0** Vercel 환경변수 설정 — `VITE_API_URL`, `VITE_ADMIN_PASSWORD` (배포 전 필수)
- [ ] `src/admin/` 컴포넌트 구현 (AdminApp, RoomList, RoomEdit, RoomCreate, authProvider)
- [ ] `main.tsx` BrowserRouter + Routes/Route 추가 (lazy load AdminApp)
- [ ] `vercel.json` SPA rewrites 추가 (`{ "source": "/(.*)", "destination": "/index.html" }`)
- [ ] **P1** BrowserRouter URL 직접 로드 검증 — 배포 후 `/`, `/admin`, 임의 경로 새로고침 시 App/AdminApp 정상 렌더 확인

---

## 배포 & 인프라

- [ ] Vercel 배포 자동화 확인
- [ ] 추천 클릭 analytics 연동 (e.g. Mixpanel, PostHog, 또는 커스텀 Supabase 이벤트)
- [ ] OG 이미지 / 메타태그 — 카드 공유 시 SNS 미리보기 최적화
