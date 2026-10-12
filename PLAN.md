# 🔮 타로점 웹앱 — 프로젝트 계획 (3D 시네마틱 버전)

> 컨셉: **"어두운 신비의 공간에서 카드가 살아 움직이는 체험"**
> 처음 보는 사람이 첫 화면부터 "와" 하게 만드는 것이 목표. 단순히 카드 의미를 보여주는 웹이 아니라, 하나의 **의식(ritual)을 치르는 연출형 경험**.

---

## 1. 리서치 요약 (Chrome으로 조사)

| 항목 | 내용 | 출처 |
|---|---|---|
| 덱 구성 | 78장 = **메이저 아르카나 22장**(0 바보 ~ 21 세계) + **마이너 아르카나 56장** | Wikipedia – Rider–Waite Tarot |
| 마이너 4수트 | **완드**(불·열정·행동), **컵**(물·감정·관계), **소드**(공기·생각·갈등), **펜타클**(흙·돈·현실). 수트마다 Ace~10 + 페이지·나이트·퀸·킹 14장 | Wikipedia |
| 표준 덱 | **라이더–웨이트–스미스(RWS)** 덱 (1909, A.E. Waite + Pamela Colman Smith). 대부분의 현대 해석의 기준 | Wikipedia |
| 저작권 | **1909년 원본 RWS 이미지는 퍼블릭 도메인** → 앱에 자유롭게 사용 가능 (U.S. Games 1971년판의 카드 뒷면·박스 디자인은 제외) | Wikipedia – Copyright status |
| 리딩 절차 | ① 질문 → ② 셔플 → ③ 카드 뽑기 → ④ 스프레드 위치 의미 + 카드 의미(정/역방향)로 해석 | Wikipedia – Tarot card reading |
| 정/역방향 | 카드마다 정방향(upright)과 역방향(reversed) 의미가 따로 있음 | Wikipedia |
| 카드 데이터 | `ekelen/tarot-api` — Waite의 *Pictorial Key to the Tarot*에서 추출한 78장 JSON. JSON만 가져다 써도 된다고 명시 | GitHub |
| 참고 | RWS 순서: 8 = 힘(Strength), 11 = 정의(Justice) | Wikipedia |

### 스프레드
- **원 카드** (1장): 오늘의 운세
- **쓰리 카드** (3장): 과거 – 현재 – 미래
- **켈틱 크로스** (10장): 현재 · 장애물 · 의식적 목표 · 무의식 · 과거 · 가까운 미래 · 자신 · 환경 · 희망과 두려움 · 최종 결과
- (선택) **연애 스프레드** (5장): 나 · 상대 · 관계 현재 · 장애물 · 앞으로

---

## 2. 연출 시나리오 (사용자 여정 = 6개의 씬)

모든 화면은 **하나의 3D 공간 안에서 카메라가 이동**하며 이어진다. 페이지가 바뀌는 느낌이 아니라 영화처럼 끊김 없이 흘러가는 것이 핵심.

| # | 씬 | 연출 | 기술 포인트 |
|---|---|---|---|
| 1 | **인트로** | 완전한 암흑 → 촛불이 하나씩 켜지며 공간이 드러남. 떠다니는 먼지/별 파티클, 바닥에 깔린 안개. 금빛 타이틀이 글자별로 빛나며 등장. 마우스를 움직이면 카메라가 살짝 따라가는 패럴랙스 | 포인트라이트 깜빡임, 파티클(Sparkles), Volumetric fog, 텍스트 리빌 |
| 2 | **질문** | 테이블 위 **수정구슬**. 질문을 입력하면 글자들이 빛 입자로 흩어져 구슬 속으로 빨려 들어가고, 구슬 내부가 소용돌이치며 빛남 | 커스텀 GLSL 셰이더(노이즈 소용돌이), Fresnel 림라이트 |
| 3 | **셔플** | 78장의 카드가 공중으로 떠올라 **회오리처럼 회전**하다가 하나의 덱으로 촤르륵 모임. 효과음 + 카메라 미세 흔들림 | GSAP 타임라인, 카드별 지연(stagger), 곡선 경로 |
| 4 | **선택** | 카드가 사용자 앞에 **아치형으로 펼쳐져 떠 있음**. 호버하면 카드가 떠오르며 테두리가 빛남. 클릭한 카드는 궤적을 그리며 날아가 스프레드 자리에 착지 | Raycasting 호버, 스프링 애니메이션, 잔상 트레일 |
| 5 | **공개 (하이라이트)** | 카메라가 카드 쪽으로 줌인 → 카드가 회전하며 뒤집힘. 뒤집히는 순간 빛 폭발. **메이저 아르카나는 특별 연출**: 화면이 잠깐 어두워졌다가 금빛 파티클 폭발 + 카드 이름이 크게 떠오름. 역방향은 붉은/보랏빛 기운 | Bloom 포스트프로세싱, Dissolve 셰이더, 파티클 버스트, 슬로모션 |
| 6 | **해석** | 카드 표면에 **홀로그램 포일** 반사(마우스 각도에 따라 무지개빛). 카드 클릭 시 확대 + 해석 텍스트가 타이핑되듯 등장. AI 종합 해석은 양피지 패널에 스트리밍 | Holo foil 셰이더, 글래스모피즘 UI 오버레이 |

### 비주얼 아이덴티티
- **색상**: 깊은 남색/보라 배경 (`#0a0618`, `#1a0f3a`) + **금색 포인트** (`#d4af37`) + 역방향용 진홍 (`#8b1e3f`)
- **폰트**: 영문 타이틀 `Cinzel` (고전 세리프) / 한글 `Gowun Batang` 또는 `Noto Serif KR`
- **카드 뒷면**: 금박 별자리 + 달 문양을 직접 디자인 (금속 질감 텍스처)
- **사운드**: 은은한 앰비언트 BGM, 카드 넘기는 소리, 공개 시 차임벨, 셔플 바람 소리 (음소거 토글 필수)
- **카드 물성**: 얇은 두께가 있는 둥근 모서리 3D 카드, 종이 질감 노멀맵, 금 테두리 메탈릭

---

## 3. 기술 스택

| 영역 | 선택 | 용도 |
|---|---|---|
| 프레임워크 | **Next.js (App Router) + TypeScript** | 앱 뼈대 + AI 해석 API 라우트 |
| 3D 엔진 | **three.js + React Three Fiber (`@react-three/fiber`)** | React 방식으로 3D 씬 작성 |
| 3D 헬퍼 | **`@react-three/drei`** | 카메라 컨트롤, Sparkles, Text3D, Environment, 텍스처 로딩 |
| 후처리 | **`@react-three/postprocessing`** | Bloom(빛 번짐), Vignette, Depth of Field, Noise, Chromatic Aberration |
| 애니메이션 | **GSAP** (타임라인 연출) + `@react-spring/three` (호버 등 물리감 있는 움직임) | 시네마틱 시퀀스 |
| 셰이더 | 직접 작성한 GLSL | 수정구슬, 홀로그램 포일, Dissolve 공개 효과 |
| 상태 관리 | **Zustand** | 씬 상태 머신 (intro → question → shuffle → pick → reveal → result) |
| UI 오버레이 | Tailwind CSS + Framer Motion | 3D 위에 뜨는 텍스트/버튼 |
| 사운드 | **Web Audio API 직접 합성** (`lib/sound.ts`) | 효과음/배경음 — 음원 파일 없음 (저작권·용량 부담 없음) |
| 개발 도구 | Leva (실시간 수치 조정 패널), r3f-perf (성능 모니터) | 연출 튜닝 |
| AI | Claude API (`@anthropic-ai/sdk`) | 종합 해석 스트리밍 |
| 배포 | Vercel | |

### 성능 / 접근성 대응 (중요)
- **품질 단계 자동 조절**: 고성능 PC = 풀 효과 / 모바일 = DPR 낮춤, DOF·포그 끔, 파티클 수 감소 (drei `PerformanceMonitor`)
- 카드 이미지는 **webp/KTX2 압축 + 필요할 때만 로딩** (뒷면만 먼저, 앞면은 공개 직전)
- `prefers-reduced-motion` 사용자에겐 간소화 연출
- **"연출 건너뛰기" 버튼** (재방문자용)
- WebGL 미지원 환경용 2D 폴백

---

## 4. 폴더 구조

```
taro/
├── PLAN.md
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── .env.local                     # ANTHROPIC_API_KEY (git 제외)
├── .gitignore
│
├── public/
│   ├── cards/                     # 카드 앞면 (퍼블릭 도메인 RWS, webp)
│   │   ├── major/                 # 00-fool.webp ~ 21-world.webp
│   │   ├── wands/  cups/  swords/  pentacles/
│   ├── textures/
│   │   ├── card-back.webp         # 직접 디자인한 카드 뒷면
│   │   ├── card-normal.webp       # 종이 질감 노멀맵
│   │   ├── gold-foil.webp         # 금박 테두리
│   │   ├── table-wood.webp        # 테이블 표면
│   │   └── env.hdr                # 환경광 (반사용)
│   ├── sounds/
│   │   ├── ambient.mp3  shuffle.mp3  flip.mp3  reveal-major.mp3  hover.mp3
│   └── fonts/
│       └── cinzel.json            # Text3D용 폰트
│
├── data/
│   ├── parts/                     # 원본: major·wands·cups·swords·pentacles.json + Waite 원문 참고(퍼블릭 도메인)
│   ├── cards.ko.json              # 78장 데이터 (빌드 결과물 — 직접 수정하지 말고 parts/ 수정 후 cards:build)
│   └── spreads.json               # 스프레드 정의 + 3D 배치 좌표
│
├── scripts/
│   ├── fetch-images.mts           # Commons의 1909 RWS 78장 → 600px webp (npm run cards:images)
│   └── build-cards.mts            # data/parts/*.json 병합 + 검증 → cards.ko.json (npm run cards:build)
│
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                       # 메인 체험 (3D 캔버스 하나에서 전체 진행)
    │   ├── cards/
    │   │   ├── page.tsx                   # 카드 도감 (3D 갤러리)
    │   │   └── [id]/page.tsx              # 카드 상세 (회전 가능한 3D 카드)
    │   ├── history/page.tsx               # 리딩 기록
    │   └── api/
    │       └── interpret/route.ts         # Claude AI 해석 (스트리밍)
    │
    ├── scene/                             # ⭐ 3D 관련 전부
    │   ├── Experience.tsx                 # <Canvas> 루트, 씬 전환 관리
    │   ├── CameraRig.tsx                  # 씬별 카메라 위치 이동 + 마우스 패럴랙스
    │   ├── Lighting.tsx                   # 촛불 포인트라이트(깜빡임), 림라이트
    │   ├── Environment/
    │   │   ├── Table.tsx                  # 테이블 + 천
    │   │   ├── Candles.tsx                # 촛불 + 불꽃 셰이더
    │   │   ├── Fog.tsx                    # 바닥 안개
    │   │   └── Starfield.tsx              # 떠다니는 별/먼지 파티클
    │   ├── objects/
    │   │   ├── Card3D.tsx                 # 두께 있는 3D 카드 (앞/뒤 재질, 뒤집기, 역방향)
    │   │   ├── CrystalBall.tsx            # 수정구슬
    │   │   └── TitleText.tsx              # 3D 타이틀
    │   ├── sequences/                     # 씬별 연출
    │   │   ├── IntroSequence.tsx
    │   │   ├── QuestionSequence.tsx
    │   │   ├── ShuffleSequence.tsx        # 회오리 셔플
    │   │   ├── PickSequence.tsx           # 아치형 펼침 + 선택
    │   │   ├── RevealSequence.tsx         # 뒤집기 + 메이저 특별 연출
    │   │   └── ResultSequence.tsx
    │   ├── effects/
    │   │   ├── PostFX.tsx                 # Bloom, Vignette, DOF 등
    │   │   └── ParticleBurst.tsx          # 공개 시 파티클 폭발
    │   └── shaders/                       # GLSL을 TS 문자열로 export (별도 로더 불필요)
    │       ├── cardFront.ts               # 홀로그램 포일 + 디졸브 공개 효과
    │       ├── rays.ts                    # 후광 광선
    │       ├── noise.ts                   # 공용 노이즈 함수
    │       └── crystal.ts / flame.ts      # (예정) 수정구슬, 촛불
    │
    ├── components/                        # 3D 위에 뜨는 2D UI
    │   ├── QuestionInput.tsx
    │   ├── SpreadSelector.tsx
    │   ├── CardMeaningPanel.tsx           # 해석 패널 (타이핑 효과)
    │   ├── AIReadingPanel.tsx             # AI 해석 스트리밍
    │   ├── SkipButton.tsx
    │   ├── SoundToggle.tsx
    │   └── Fallback2D.tsx                 # WebGL 미지원 시
    │
    ├── store/
    │   └── readingStore.ts                # Zustand: 씬 단계, 질문, 뽑은 카드, 설정
    │
    ├── lib/
    │   ├── deck.ts                        # 78장 로드, Fisher–Yates 셔플, 정/역 결정
    │   ├── spreads.ts                     # 스프레드 → 3D 좌표 계산
    │   ├── interpret.ts                   # 기본 해석 문장 조합
    │   ├── random.ts                      # crypto 난수 / 날짜 시드 난수
    │   ├── sound.ts                       # Howler 래퍼
    │   ├── quality.ts                     # 기기 성능별 품질 프리셋
    │   └── storage.ts                     # 리딩 기록 저장
    │
    ├── types/
    │   └── tarot.ts
    └── styles/
        └── globals.css
```

### 핵심 타입 (`src/types/tarot.ts`)
```ts
type Arcana = "major" | "minor";
type Suit = "wands" | "cups" | "swords" | "pentacles";

interface Card {
  id: string;            // "major-00", "cups-queen"
  nameKo: string;        // "바보"
  nameEn: string;        // "The Fool"
  arcana: Arcana;
  suit?: Suit;
  number: number;
  keywords: string[];
  upright: string;
  reversed: string;
  image: string;
}

interface SpreadPosition {
  index: number;
  label: string;         // "현재 상황"
  meaning: string;
  position: [number, number, number];  // 3D 좌표
  rotation?: [number, number, number]; // 켈틱 크로스 2번 카드는 90° 회전
}

type ScenePhase = "intro" | "question" | "shuffle" | "pick" | "reveal" | "result";

interface DrawnCard { card: Card; reversed: boolean; position: number; revealed: boolean; }
```

---

## 5. 개발 단계

**연출의 퀄리티를 먼저 확인하는 순서**로 진행한다 (데이터 작업보다 "와" 포인트를 먼저 검증).

| 단계 | 작업 | 완료 기준 |
|---|---|---|
| **0. 세팅** ✅ | Next.js + R3F + drei + postprocessing + GSAP + Zustand 설치, 폴더 생성 | 빈 3D 씬 렌더링 |
| **1. 비주얼 프로토타입** ✅ | 어두운 공간 + 촛불 조명 + 파티클 + Bloom, **3D 카드 1장 뒤집기 연출** 완성 | 이 장면만 봐도 멋있어야 함 |
| **2. 데이터** ✅ | 카드 78장 JSON(한국어), 스프레드 좌표, 이미지 수집·압축, 카드 뒷면 디자인 | `data/`, `public/` 완성 |
| **3. 셔플 & 선택** ✅ | 회오리 셔플, 아치형 펼침, 호버/클릭, 스프레드 자리로 비행 | 3장 리딩 동작 |
| **4. 공개 & 해석** ✅ | 줌인 뒤집기, 메이저 특별 연출, 홀로 포일, 해석 패널 | 1장/3장 리딩 완성 |
| **5. 인트로 & 질문** ✅ | 촛불 점등 인트로, 수정구슬 질문 연출, 사운드 | 처음부터 끝까지 이어지는 체험 |
| **6. 켈틱 크로스 + 도감** ✅ | 10장 배치, 3D 카드 갤러리 | MVP 완성 |
| **7. AI 해석** | `/api/interpret` + Claude 스트리밍 | 종합 해석 |
| **8. 최적화 & 배포** | 모바일 품질 조절, 연출 건너뛰기, 2D 폴백, Vercel 배포 | 모바일에서 60fps 근접 |

### 진행 기록
- **2026-10-12 — 0·1단계 완료**: 촛불 점등 인트로, 회전하는 마법진, 별/금빛 먼지 파티클, Bloom·비네트 후처리, 금박 카드 뒷면(코드로 생성), 1.5바퀴 회전 뒤집기 + 금빛 디졸브 공개 + 파티클 폭발 + 후광, 홀로그램 포일, 정/역방향, 해석 패널, 다시 뽑기. 현재 카드 데이터는 메이저 4장(0, I, XVII, XIX)만 있음.

- **2026-10-12 — 2단계 완료**: 78장 이미지(Wikimedia Commons "RWS1909" 1판 스캔, 퍼블릭 도메인 → 600px webp, 총 13MB), 78장 한국어 데이터(키워드 4개 + 정/역방향 해석, 원문은 Waite 해설을 참고해 새로 작성), 스프레드 4종(원 카드·쓰리 카드·연애·켈틱 크로스), 검증 스크립트. 카드 앞면은 **뽑힐 카드를 미리 정해 대기 중에 그 한 장만 미리 로드**하고, 공개 디졸브는 로딩 완료 후 시작. 인트로는 3D 씬 준비 완료 시점(첫 프레임)부터 시작하도록 변경(`src/scene/Director.tsx`).

- **2026-10-12 — 3단계 완료**: 전체 리딩 흐름 구현 — 인트로 → 스프레드 선택(4종) → 78장 회오리 셔플 → 부채꼴 아치에서 카드 고르기 → 테이블 위 자리로 비행(자리 테두리·이름표 표시) → 눌러서/모두 뒤집기 → 해석 패널(자리 의미 + 카드 해석 + 전체 목록) → 새로운 리딩(카드 회수). 덱 78장은 InstancedMesh 1개(+테두리 1개)로 그림. 3장·켈틱 크로스 10장 모두 브라우저에서 확인.
  - 구조: `Deck.tsx`(덱 78장, 단계별 목표 자세로 감쇠 이동) / `SpreadCard.tsx`(뽑힌 카드, 최대 10개 미리 마운트) / `SpreadSlots.tsx`(테이블 자리 표시) / `CameraRig.tsx`(단계별 샷) / `store/readingStore.ts`(흐름 상태)

- **2026-10-12 — 4단계 완료**: 카드를 한 장씩 누르면 카메라 앞으로 떠올라 그 자리에서 뒤집힘(줌인 뒤집기) → 배경 암전 + 후광 + 크게 보기 유지(마우스 따라 기울며 홀로그램 포일). 메이저 아르카나는 공개 직전 더 깊은 암전 → 금빛(역방향은 진홍) 충격파 2겹 + 큰 입자 폭발 + 카메라 흔들림 + 화면 위 카드 이름 타이틀. "모두 뒤집기"는 테이블 위에서 제자리 공개(특별 연출 생략). 빈 곳 클릭·Esc로 크게 보기 해제. 해석 패널에 ◀▶ 이동·크게 보기 전환, 전체 공개 시 규칙 기반 "전체 흐름" 요약(`lib/interpret.ts`, 한국어 조사 자동 처리).
  - 구조: `scene/focus.ts`(크게 보기 위치) / `effects/FocusEffects.tsx`(암전·후광·충격파) / `components/MajorTitle.tsx`

- **2026-10-12 — 5단계 완료**: 첫 화면에 "운명의 문 열기" 버튼(로딩 중엔 "별빛을 모으는 중…") — 이 클릭으로 오디오 잠금 해제 + 촛불 점등 인트로 시작. 테이블 뒤편에 수정구슬(프레넬 광택 + 안쪽 성운 셰이더) 추가. 질문 입력칸에 질문을 적고 배열을 고르면 글자 하나하나가 빛나며 구슬로 빨려 들어가고(DOM 글자가 매 프레임 구슬의 화면 좌표를 추적) 구슬이 소용돌이·섬광 후 셔플. 사운드는 Web Audio로 합성: 배경 드론, 촛불 점화, 질문 흡수, 셔플, 고르기·놓기, 뒤집기, 공개 종소리(역방향은 낮게), 메이저(깊은 울림+화음), 덱 호버 틱, 회수 — 오른쪽 위 소리 켜기/끄기(브라우저에 기억). 리딩 패널 상단에 질문 표시. Howler.js 의존성 제거.

- **2026-10-12 — 6단계 완료 (MVP)**: 켈틱 크로스 10장 줌인 공개까지 확인. 카드 도감 추가 — `/cards`(분류 탭·검색·마우스 따라 3D 기울기 + 홀로그램 광택 카드 그리드, 별빛 배경), `/cards/[id]`(드래그로 돌려 보는 3D 카드 + 금빛 디졸브 등장, 뒷면 보기·역방향 보기, 정/역방향 해석, 이전/다음 카드). 78개 상세 페이지 빌드 시 정적 생성. 메인 선택 화면 왼쪽 위에 도감 링크.
  - 구조: `components/gallery/*`, `scene/viewer/CardViewer.tsx`(조작 상태는 ref로 전달, 3D가 useFrame에서 읽음)

### 기술 메모 (이 프로젝트에서 확인된 함정)
- **R3F 캔버스 안에서는 `useEffect`/zustand 훅 구독에 의존하지 말 것.** 이 환경(React 19.3 + R3F 9.8 + Next 16)에서 캔버스 내부의 effect·구독이 제때 실행되지 않아 상태 변화가 반영되지 않았음. → 상태는 `useReading.getState()`로 이벤트/`useFrame` 시점에 읽고, 단계 변화는 `useFrame`에서 이전 값과 비교해 감지한다.
- **GSAP는 R3F 렌더 루프로 구동** (`src/scene/GsapSync.tsx`): `gsap.ticker`에서 `updateRoot`를 빼고 `useFrame`에서 직접 호출.
- 셰이더 uniform은 메모된 객체가 아니라 **재질 ref의 `material.uniforms`** 로 접근.
- `next/font/google`은 이 템플릿의 Turbopack CSS 규칙과 충돌해 빌드 에러 → 폰트는 `layout.tsx`의 `<link>`로 로드.
- 브라우저 자동화로 테스트할 때 탭이 `hidden` 상태면 rAF가 멈춰 애니메이션이 매우 느리게 보인다 — 앱 문제 아님.
- 배경 암전 막은 불투명도를 0.85 이상으로 해야 눈에 띈다 — 마법진·촛불이 HDR로 밝아 블룸·톤매핑을 거치면 반투명 검은 막이 거의 티가 안 남.
- 투명하게 사라지는 오버레이 안의 버튼에 `pointer-events-auto`가 있으면 부모가 `pointer-events-none`이어도 클릭을 가로챈다 → 숨길 때 버튼 자체의 포인터 이벤트도 꺼야 함 (입장 버튼이 질문 입력칸을 가렸던 버그).
- Next 16 + Cache Components: `dynamicParams` 사용 불가 → `generateStaticParams` + `notFound()`. 동적 라우트에서 `params`를 읽는 부분은 `<Suspense>` 안에 둬야 "instant navigation" 개발 오류가 안 남. 새 라우트를 만들면 `npx next typegen`으로 `PageProps` 타입 갱신.
- `src/scene/**`는 three.js 객체를 매 프레임 직접 수정하므로 ESLint `react-hooks/immutability`, `react-hooks/purity`를 끔 (`eslint.config.mjs`).

---

## 6. 주의사항
- **이미지**: 1909 원본 RWS 스캔만 사용 (현대 재채색판·다른 덱은 저작권 있음). 카드 뒷면은 직접 디자인.
- **해석 텍스트**: 다른 사이트의 해석 문장을 복사하지 않고, Waite 원문(퍼블릭 도메인)을 바탕으로 직접 한국어로 작성.
- **API 키**: Claude API 키는 서버(`route.ts`)에서만 사용.
- **면책 문구**: "재미와 자기성찰용이며 의료·법률·재정 결정을 대신하지 않습니다".
- **랜덤성**: `crypto.getRandomValues` 기반 Fisher–Yates 셔플.
- **연출 과잉 주의**: 첫 방문은 풀 연출, 두 번째부터는 짧게. 전체 리딩이 1분을 넘지 않도록.
