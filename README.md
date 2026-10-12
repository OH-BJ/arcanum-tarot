# 🔮 ARCANUM — 3D 타로 리딩

어두운 신비의 공간에서 카드가 살아 움직이는 **시네마틱 3D 타로 웹앱**입니다.
촛불이 켜지는 인트로, 수정구슬에 질문 담기, 78장 회오리 셔플, 카드 고르기, 공개 연출, AI 종합 해석까지 하나의 3D 공간에서 이어집니다.

**▶ 바로 해 보기: https://arcanum-tarot.vercel.app**

> 재미와 자기성찰을 위한 프로젝트입니다. 의료·법률·재정 결정을 대신하지 않습니다.

---

## ✨ 주요 기능

| 단계 | 연출 |
|---|---|
| **입장** | "운명의 문 열기" → 촛불이 하나씩 켜지며 공간이 드러나고, 마법진이 빛나며 회전 |
| **질문** | 질문을 적고 배열을 고르면 글자가 빛 입자처럼 날아가 수정구슬로 빨려 들어감 |
| **셔플** | 78장이 공중에서 회오리치며 섞인 뒤 한 덱으로 모임 |
| **고르기** | PC: 손에 쥔 부채 같은 아치에서 클릭 / 휴대폰: 큼직한 카드 줄을 스와이프해 선택 |
| **배치** | 고른 카드가 곡선을 그리며 테이블 위 자리(빛나는 테두리 + 이름표)로 날아감 |
| **공개** | 카드가 카메라 앞으로 떠올라 뒤집히며 금빛 디졸브 + 입자 폭발 + 후광 |
| **메이저 아르카나** | 화면 암전 → 충격파 + 큰 입자 폭발 + 카메라 흔들림 + 카드 이름 타이틀 |
| **해석** | 자리 의미 + 카드 해석 + 규칙 기반 "전체 흐름" 요약 + **AI 종합 해석**(Gemini, 스트리밍) |

- **스프레드 4종**: 원 카드 · 쓰리 카드(과거·현재·미래) · 연애(5장) · 켈틱 크로스(10장)
- **78장 한국어 데이터**: 카드마다 키워드 4개와 정방향·역방향 해석
- **카드 도감** (`/cards`): 분류·검색, 홀로그램 카드 그리드, 드래그로 돌려 보는 3D 카드 상세
- **사운드**: Web Audio로 직접 합성(음원 파일 없음) — 배경 드론, 촛불, 셔플, 뒤집기, 공개 종소리 등
- **화질 선택**: 오른쪽 위 [기본 | 가벼운]. 그래픽 가속이 꺼진 환경은 자동으로 가장 가벼운 모드로 실행
- **휴대폰 대응**: 세로 화면 전용 카메라·카드 배치, 접을 수 있는 해석 패널

## 🛠 기술 스택

- **Next.js 16** (App Router) · **TypeScript** · **Tailwind CSS 4**
- **three.js** + **React Three Fiber** + **drei** · **@react-three/postprocessing** (Bloom 등)
- 직접 작성한 **GLSL 셰이더**: 홀로그램 포일 + 디졸브 공개, 수정구슬 성운, 후광 광선
- **GSAP**(R3F 렌더 루프로 구동) · **Zustand**(리딩 흐름 상태)
- **Gemini API** (`gemini-2.5-flash`, 무료 사용량) — 서버 라우트에서만 키 사용
- 배포: **Vercel**

## 🚀 로컬에서 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

AI 종합 해석을 쓰려면 프로젝트 루트에 `.env.local`을 만들고 Gemini 키를 넣습니다.
키는 [Google AI Studio](https://aistudio.google.com) → **Get API key**에서 무료로 발급받을 수 있습니다.

```
GEMINI_API_KEY=발급받은_키
```

키가 없거나 무료 사용량을 넘으면 AI 해석 대신 안내 문구가 나오고, 규칙 기반 "전체 흐름" 요약은 그대로 동작합니다.

### 그 밖의 명령

| 명령 | 설명 |
|---|---|
| `npm run build` | 프로덕션 빌드 (카드 상세 78쪽 정적 생성) |
| `npm run lint` | ESLint |
| `npm run cards:images` | Wikimedia Commons에서 카드 이미지 78장을 받아 webp로 변환 |
| `npm run cards:build` | `data/parts/*.json`을 합쳐 `data/cards.ko.json` 생성 + 검증 |

## 📁 폴더 구조

```
data/
  parts/            카드 데이터 원본 (메이저·수트별) + Waite 원문 참고 자료
  cards.ko.json     78장 데이터 (빌드 결과 — parts를 수정한 뒤 cards:build)
  spreads.json      스프레드 4종 정의
public/cards/       카드 이미지 (1909 라이더–웨이트–스미스, webp)
scripts/            이미지 받기 · 카드 데이터 병합/검증
src/
  app/              페이지(/, /cards, /cards/[id]) + /api/interpret (AI 해석)
  components/       화면 위 2D UI (패널, 스프레드 선택, 휴대폰 카드 고르기 등)
  scene/            3D 씬 — 덱·카드·수정구슬·테이블·촛불·효과·셰이더·카메라
  store/            리딩 흐름 상태 (Zustand)
  lib/              카드·스프레드 데이터, 해석 문장, 사운드 합성, Gemini 호출
```

더 자세한 설계와 개발 기록, 이 프로젝트에서 겪은 기술적 함정은 [`PLAN.md`](./PLAN.md)에 정리되어 있습니다.

## 🙏 출처

- **카드 그림**: Pamela Colman Smith가 그린 1909년 라이더–웨이트–스미스 덱 초판 스캔 — 퍼블릭 도메인.
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies))에서 받아 변환했습니다.
- **카드 의미 참고**: A. E. Waite, *The Pictorial Key to the Tarot* (1911, 퍼블릭 도메인) — [ekelen/tarot-api](https://github.com/ekelen/tarot-api)의 데이터.
  한국어 해석 문장은 이를 참고해 새로 작성했습니다.
- 카드 뒷면, 마법진, 수정구슬, 사운드는 모두 코드로 직접 생성했습니다.
