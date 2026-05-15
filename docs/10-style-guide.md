# TodoListApp 프론트엔드 스타일 가이드

- 버전: 1.0.0
- 작성일: 2026-05-14
- 참조 이미지: Google Calendar (2026-05-14 스크린샷)
- 참조 문서:
  - `8-wireframe.md` — 화면 레이아웃
  - `2-prd.md` — 기능 요구사항

---

## 변경 이력

| 버전  | 변경일     | 변경 내용    | 변경자   |
| ----- | ---------- | ------------ | -------- |
| 1.0.0 | 2026-05-14 | 최초 작성    | aliceKim |

---

## 디자인 방향

Google Calendar의 **Material Design 3** 스타일을 참고한다.

- 여백 중심의 클린 레이아웃
- 파란색 계열 Primary 컬러
- 흰색 배경에 경계선으로 영역 구분
- 산세리프 폰트 — 가독성 우선

---

## 1. 색상 (Color)

### 1.1 Primary

| 토큰               | Hex       | 용도                                        |
| ------------------ | --------- | ------------------------------------------- |
| `--color-primary`  | `#1a73e8` | 주요 버튼, 현재 날짜 뱃지, 포커스 링, 링크  |
| `--color-primary-hover` | `#1765cc` | Primary 버튼 hover                    |
| `--color-primary-light` | `#e8f0fe` | 선택된 항목 배경, 체크박스 배경        |

### 1.2 Neutral (텍스트 · 배경 · 선)

| 토큰                     | Hex       | 용도                            |
| ------------------------ | --------- | ------------------------------- |
| `--color-text-primary`   | `#202124` | 본문 텍스트, 제목               |
| `--color-text-secondary` | `#70757a` | 보조 텍스트, 힌트, 라벨         |
| `--color-text-disabled`  | `#bdc1c6` | 비활성화 텍스트                 |
| `--color-surface`        | `#ffffff` | 카드 · 모달 배경                |
| `--color-background`     | `#f8f9fa` | 페이지 배경                     |
| `--color-border`         | `#dadce0` | 인풋 테두리, 구분선             |
| `--color-hover`          | `#f1f3f4` | 항목 hover 배경                 |

### 1.3 Semantic (상태 색상)

| 토큰                   | Hex       | 용도                             |
| ---------------------- | --------- | -------------------------------- |
| `--color-success`      | `#188038` | 성공 메시지, 완료 체크박스       |
| `--color-success-bg`   | `#e6f4ea` | 성공 메시지 배경                 |
| `--color-error`        | `#d93025` | 에러 메시지, 위험 버튼           |
| `--color-error-bg`     | `#fce8e6` | 에러 메시지 배경                 |
| `--color-warning`      | `#f29900` | 경고 메시지                      |
| `--color-warning-bg`   | `#fef7e0` | 경고 메시지 배경                 |
| `--color-info`         | `#1a73e8` | 정보 메시지                      |
| `--color-info-bg`      | `#e8f0fe` | 정보 메시지 배경                 |

### 1.4 카테고리 배지 색상

기본 5개 카테고리는 고정 색상을 사용한다.

| 카테고리  | 배지 색상 | 배지 텍스트 색 |
| --------- | --------- | -------------- |
| 업무      | `#e8f0fe` | `#1a73e8`      |
| 개인      | `#fce8e6` | `#d93025`      |
| 쇼핑      | `#fef7e0` | `#f29900`      |
| 건강      | `#e6f4ea` | `#188038`      |
| 학습      | `#f3e8fd` | `#9334e6`      |
| 사용자 정의 | `#f1f3f4` | `#3c4043`    |

---

## 2. 다크 모드 (Dark Mode)

다크 모드는 `body` 태그에 `data-theme="dark"` 속성이 추가될 때 활성화된다.

### 2.0 테마 동기화 정책
- 사용자의 테마 설정은 백엔드 `users.theme` 컬럼에 저장된다.
- 로그인 시 서버에서 테마 설정을 가져와 적용한다.
- 비로그인 사용자는 `localStorage` 또는 시스템 설정(`prefers-color-scheme`)을 따른다.

### 2.1 다크 모드 색상 팔레트

| 토큰                     | Light (기본) | Dark (전환 시) | 용도                            |
| ------------------------ | ----------- | ------------- | ------------------------------- |
| `--color-text-primary`   | `#202124`    | `#e8eaed`     | 본문 텍스트, 제목               |
| `--color-text-secondary` | `#70757a`    | `#9aa0a6`     | 보조 텍스트, 힌트, 라벨         |
| `--color-text-disabled`  | `#bdc1c6`    | `#5f6368`     | 비활성화 텍스트                 |
| `--color-surface`        | `#ffffff`    | `#2d2e31`     | 카드 · 모달 배경                |
| `--color-background`     | `#f8f9fa`    | `#202124`     | 페이지 배경                     |
| `--color-border`         | `#dadce0`    | `#3c4043`     | 인풋 테두리, 구분선             |
| `--color-hover`          | `#f1f3f4`    | `#35363a`     | 항목 hover 배경                 |

### 2.2 다크 모드 시맨틱 컬러 조정

| 토큰                   | Light       | Dark          | 용도                             |
| ---------------------- | ----------- | ------------- | -------------------------------- |
| `--color-primary-light` | `#e8f0fe`    | `#303134`     | 선택된 항목 배경                 |
| `--color-success-bg`   | `#e6f4ea`    | `#1a2620`     | 성공 메시지 배경                 |
| `--color-error-bg`     | `#fce8e6`    | `#302021`     | 에러 메시지 배경                 |
| `--color-warning-bg`   | `#fef7e0`    | `#302a1a`     | 경고 메시지 배경                 |
| `--color-info-bg`      | `#e8f0fe`    | `#1a2030`     | 정보 메시지 배경                 |

### 2.3 다크 모드 카테고리 배지

다크 모드에서는 가독성을 위해 배지 배경의 채도를 낮추고 텍스트 밝기를 조정한다.

| 카테고리  | 배지 배경 (Dark) | 배지 텍스트 (Dark) |
| --------- | --------------- | ---------------- |
| 업무      | `#1a2030`       | `#8ab4f8`        |
| 개인      | `#302021`       | `#f28b82`        |
| 쇼핑      | `#302a1a`       | `#fdd663`        |
| 건강      | `#1a2620`       | `#81c995`        |
| 학습      | `#261a30`       | `#d7aefb`        |
| 사용자 정의 | `#3c4043`       | `#bdc1c6`        |

---

## 2. 타이포그래피 (Typography)

### 2.1 폰트 패밀리

```css
font-family: 'Google Sans', 'Noto Sans KR', Roboto, -apple-system, sans-serif;
```

- Google Sans — 제목, 버튼 등 강조 요소
- Noto Sans KR — 한글 본문
- 시스템 폰트 — 폴백

### 2.2 스케일

| 토큰                  | 크기    | 굵기 | 줄간격 | 용도                       |
| --------------------- | ------- | ---- | ------ | -------------------------- |
| `--text-heading-lg`   | `22px`  | 400  | 1.4    | 페이지 제목 (로그인, 가입) |
| `--text-heading-md`   | `18px`  | 500  | 1.4    | 섹션 제목 (할일 목록)      |
| `--text-heading-sm`   | `16px`  | 500  | 1.4    | 카드 제목, 모달 제목        |
| `--text-body-md`      | `14px`  | 400  | 1.5    | 본문, 인풋 값              |
| `--text-body-sm`      | `12px`  | 400  | 1.5    | 힌트, 보조 텍스트           |
| `--text-label`        | `12px`  | 500  | 1.4    | 폼 라벨, 배지              |
| `--text-button`       | `14px`  | 500  | 1      | 버튼 텍스트                |

### 2.3 완료된 할일 텍스트

```css
/* 완료 상태 - strikethrough + 색상 감소 */
text-decoration: line-through;
color: var(--color-text-disabled);
```

---

## 3. 간격 (Spacing)

8px 기반 스케일을 사용한다.

| 토큰           | 값      | 용도                         |
| -------------- | ------- | ---------------------------- |
| `--space-1`    | `4px`   | 아이콘 · 텍스트 인접 간격   |
| `--space-2`    | `8px`   | 인풋 내부 패딩 (세로)        |
| `--space-3`    | `12px`  | 카드 내부 패딩 (세로)        |
| `--space-4`    | `16px`  | 섹션 간격, 카드 패딩         |
| `--space-5`    | `20px`  | 컴포넌트 간격                |
| `--space-6`    | `24px`  | 페이지 수평 패딩             |
| `--space-8`    | `32px`  | 섹션 제목 여백               |
| `--space-12`   | `48px`  | 페이지 수직 패딩             |

---

## 4. 테두리 · 그림자 (Border & Shadow)

### 4.1 Border Radius

| 토큰              | 값      | 용도                          |
| ----------------- | ------- | ----------------------------- |
| `--radius-sm`     | `4px`   | 인풋, 선택 드롭다운           |
| `--radius-md`     | `8px`   | 카드, 버튼                    |
| `--radius-lg`     | `12px`  | 모달, 패널                    |
| `--radius-full`   | `9999px`| 배지, 아바타, 오늘 날짜 뱃지  |

### 4.2 Shadow

| 토큰               | 값                                              | 용도              |
| ------------------ | ----------------------------------------------- | ----------------- |
| `--shadow-sm`      | `0 1px 2px rgba(60,64,67,0.10)`                 | 카드 기본         |
| `--shadow-md`      | `0 2px 6px rgba(60,64,67,0.15)`                 | 카드 hover        |
| `--shadow-lg`      | `0 8px 24px rgba(60,64,67,0.20)`                | 모달, 드롭다운    |

### 4.3 Border

```css
border: 1px solid var(--color-border);        /* 기본 */
border: 1px solid var(--color-primary);       /* 포커스 */
border: 1px solid var(--color-error);         /* 에러 상태 */
```

---

## 5. 컴포넌트 (Component)

### 5.1 Button

#### Primary 버튼 (주요 액션)

```
배경: --color-primary (#1a73e8)
텍스트: #ffffff
Hover 배경: --color-primary-hover (#1765cc)
Border radius: --radius-md (8px)
패딩: 10px 24px
텍스트: --text-button (14px, 500)
```

사용: 가입하기, 로그인, 등록, 저장, 추가

#### Secondary 버튼 (보조 액션)

```
배경: #ffffff
텍스트: --color-primary (#1a73e8)
테두리: 1px solid --color-border
Hover 배경: --color-primary-light (#e8f0fe)
Border radius: --radius-md (8px)
패딩: 10px 24px
```

사용: 취소, 필터 초기화, 필터 적용

#### Danger 버튼 (위험 액션)

```
배경: #ffffff
텍스트: --color-error (#d93025)
테두리: 1px solid --color-error
Hover 배경: --color-error-bg (#fce8e6)
```

사용: 회원 탈퇴

#### 비활성 버튼

```
배경: --color-hover (#f1f3f4)
텍스트: --color-text-disabled (#bdc1c6)
cursor: not-allowed
```

사용: 기본 카테고리 삭제 (BR-10)

#### 로딩 상태

```
배경: --color-primary-hover
텍스트: #ffffff
cursor: not-allowed
/* 텍스트 앞 스피너 아이콘 표시 */
```

### 5.2 Input / Textarea

```
높이: 40px (Input), auto (Textarea)
패딩: 8px 12px
테두리: 1px solid --color-border
Border radius: --radius-sm (4px)
폰트: --text-body-md (14px)
배경: #ffffff
```

**상태별 스타일:**

```
포커스: border-color: --color-primary, outline: 2px solid --color-primary-light
에러: border-color: --color-error
읽기전용: background: --color-background (#f8f9fa), cursor: default
```

**Placeholder:**

```
color: --color-text-disabled (#bdc1c6)
```

### 5.3 Checkbox

Google Calendar 체크박스 스타일을 따른다.

```
크기: 20px × 20px
테두리: 2px solid --color-border
Border radius: 4px

체크됨:
  배경: --color-success (#188038)
  체크 아이콘: #ffffff
  테두리: none

Hover (미체크):
  배경: --color-hover (#f1f3f4)
```

### 5.4 Select / Dropdown

```
높이: 40px
패딩: 8px 12px
테두리: 1px solid --color-border
Border radius: --radius-sm (4px)
폰트: --text-body-md (14px)
배경: #ffffff

포커스: border-color: --color-primary
드롭다운 목록 배경: #ffffff
드롭다운 목록 shadow: --shadow-lg
드롭다운 항목 hover: --color-hover (#f1f3f4)
```

### 5.5 Card (할일 카드)

```
배경: #ffffff
테두리: 1px solid --color-border
Border radius: --radius-md (8px)
패딩: 16px
Shadow: --shadow-sm

Hover:
  shadow: --shadow-md
  border-color: --color-primary-light
```

**완료된 할일 카드:**

```
배경: --color-background (#f8f9fa)
제목 텍스트: strikethrough + --color-text-disabled
opacity: 0.7
```

### 5.6 Badge (카테고리 배지)

```
패딩: 2px 8px
Border radius: --radius-full
폰트: --text-label (12px, 500)
배경/텍스트: 1.4절 카테고리 배지 색상 표 참고
```

**기본 카테고리 배지 추가 스타일:**

```
/* [기본] 표시 */
테두리: 1px solid 현재 배지 텍스트 색상 (투명도 0.3)
```

### 5.7 Modal / Dialog

```
배경: #ffffff
Border radius: --radius-lg (12px)
Shadow: --shadow-lg
최대 너비: 560px (Desktop), 100% (Mobile)
패딩: 24px

Overlay: rgba(0, 0, 0, 0.4)
```

**모달 헤더:**

```
폰트: --text-heading-sm (16px, 500)
닫기 버튼 (×): 우측 상단, 24px, --color-text-secondary
```

### 5.8 Message (알림 메시지)

인라인 메시지 스타일 — 폼 필드 아래 또는 영역 상단에 표시.

```
패딩: 8px 12px
Border radius: --radius-sm (4px)
폰트: --text-body-sm (12px)

에러:   배경 --color-error-bg,   텍스트 --color-error,   아이콘 ⚠
성공:   배경 --color-success-bg, 텍스트 --color-success, 아이콘 ✓
정보:   배경 --color-info-bg,    텍스트 --color-info,    아이콘 ℹ
경고:   배경 --color-warning-bg, 텍스트 --color-warning, 아이콘 ⚠
```

### 5.9 Navigation Header

```
높이: 64px (Desktop), 56px (Mobile)
배경: #ffffff
하단 테두리: 1px solid --color-border
패딩: 0 24px
Shadow: --shadow-sm

로고 영역:
  폰트: --text-heading-md (18px, 500)
  색상: --color-primary

Nav 링크:
  폰트: --text-body-md (14px, 400)
  색상: --color-text-secondary
  활성 색상: --color-primary

로그아웃 버튼:
  Secondary 버튼 스타일, 소형 (패딩 6px 16px)
```

**Mobile 햄버거 메뉴:**

```
아이콘: ☰ (24px)
드로어 배경: #ffffff
드로어 너비: 280px
드로어 shadow: --shadow-lg
```

### 5.10 Filter Panel

```
배경: --color-background (#f8f9fa)
테두리: 1px solid --color-border
Border radius: --radius-md (8px)
패딩: 16px
마진 하단: 16px
```

**Radio 버튼:**

```
크기: 16px
선택됨: fill --color-primary
미선택: border 2px solid --color-border
```

### 5.11 Empty State

할일이 없을 때 표시되는 빈 상태.

```
텍스트: "할일이 없습니다. 새 할일을 추가해보세요!"
색상: --color-text-secondary
폰트: --text-body-md
정렬: 가운데
패딩: 48px 0
```

---

## 6. 레이아웃 (Layout)

### 6.1 Breakpoint

| 이름      | 범위           | 레이아웃                    |
| --------- | -------------- | --------------------------- |
| Mobile    | ~ 768px        | 1열, 드로어 메뉴            |
| Tablet    | 769px ~ 1024px | 1열, 상단 메뉴              |
| Desktop   | 1025px ~       | 1열 (콘텐츠 최대 너비 제한) |

### 6.2 콘텐츠 최대 너비

```css
max-width: 960px;
margin: 0 auto;
padding: 0 var(--space-6); /* 24px */
```

### 6.3 페이지 구조

```
┌─────────────────────────────────────┐
│          Header (높이 64px)          │
├─────────────────────────────────────┤
│                                     │
│     Main Content (flex-grow: 1)     │
│     max-width: 960px                │
│     padding: 32px 24px             │
│                                     │
├─────────────────────────────────────┤
│          Footer (높이 48px)          │
└─────────────────────────────────────┘
```

### 6.4 인증 화면 (SCR-01, SCR-02)

```
배경: --color-background (#f8f9fa)
카드 최대 너비: 440px
카드 배경: #ffffff
카드 패딩: 40px 48px (Desktop), 24px (Mobile)
카드 shadow: --shadow-md
카드 border-radius: --radius-lg (12px)
수직 중앙 정렬
```

### 6.5 할일 목록 (SCR-03)

```
카드 사이 간격: --space-3 (12px)
필터 패널 → 카드 목록 간격: --space-5 (20px)
```

---

## 7. 애니메이션 (Animation)

복잡한 애니메이션은 사용하지 않는다.

| 상황                | 속성          | 값                       |
| ------------------- | ------------- | ------------------------ |
| 버튼 hover          | `background`  | `transition: 150ms ease` |
| 카드 hover          | `box-shadow`  | `transition: 150ms ease` |
| 체크박스 토글       | `background`  | `transition: 200ms ease` |
| 모달 열기/닫기      | `opacity`     | `transition: 200ms ease` |
| 메시지 표시/숨김    | `opacity`     | `transition: 200ms ease` |

---

## 8. 아이콘

별도 아이콘 라이브러리(Lucide React 또는 Material Icons) 중 하나를 사용한다. 크기는 `20px`을 기본으로 한다.

| 아이콘        | 의미          | 사용 위치                   |
| ------------- | ------------- | --------------------------- |
| `CheckSquare` | 완료 체크     | 할일 카드                   |
| `Square`      | 미완료 체크   | 할일 카드                   |
| `Plus`        | 추가          | 새 할일 버튼, 카테고리 추가 |
| `Pencil`      | 수정          | 할일 카드 수정              |
| `Trash2`      | 삭제          | 할일 카드 삭제              |
| `X`           | 닫기          | 모달 닫기                   |
| `Menu`        | 햄버거 메뉴   | Mobile 네비게이션           |
| `ChevronDown` | 드롭다운 화살 | Select 필드                 |
| `AlertCircle` | 경고          | 에러 메시지                 |
| `CheckCircle` | 성공          | 성공 메시지                 |
| `Info`        | 정보          | 안내 메시지                 |
| `Loader2`     | 로딩 스피너   | 버튼 로딩 상태              |

---

## 9. 폼 패턴 (Form Pattern)

### 9.1 필드 구조

```
[라벨] * (필수) 또는 (선택)
[인풋 / 셀렉트 / 텍스트에어리어]
[힌트 텍스트 또는 에러 메시지]
```

### 9.2 라벨

```
폰트: --text-label (12px, 500)
색상: --color-text-secondary
마진 하단: --space-1 (4px)
```

필수 필드: 라벨 뒤 ` *` — 색상 `--color-error`

### 9.3 힌트 텍스트

```
폰트: --text-body-sm (12px)
색상: --color-text-secondary
마진 상단: --space-1 (4px)
```

### 9.4 에러 메시지 (인라인)

```
폰트: --text-body-sm (12px)
색상: --color-error (#d93025)
마진 상단: --space-1 (4px)
/* 인풋 테두리도 --color-error로 변경 */
```

---

## 10. CSS 변수 전체 선언 예시

```css
:root {
  /* Primary */
  --color-primary: #1a73e8;
  --color-primary-hover: #1765cc;
  --color-primary-light: #e8f0fe;

  /* Neutral */
  --color-text-primary: #202124;
  --color-text-secondary: #70757a;
  --color-text-disabled: #bdc1c6;
  --color-surface: #ffffff;
  --color-background: #f8f9fa;
  --color-border: #dadce0;
  --color-hover: #f1f3f4;

  /* Semantic */
  --color-success: #188038;
  --color-success-bg: #e6f4ea;
  --color-error: #d93025;
  --color-error-bg: #fce8e6;
  --color-warning: #f29900;
  --color-warning-bg: #fef7e0;
  --color-info: #1a73e8;
  --color-info-bg: #e8f0fe;

  /* Typography */
  --text-heading-lg: 22px;
  --text-heading-md: 18px;
  --text-heading-sm: 16px;
  --text-body-md: 14px;
  --text-body-sm: 12px;
  --text-label: 12px;
  --text-button: 14px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(60, 64, 67, 0.10);
  --shadow-md: 0 2px 6px rgba(60, 64, 67, 0.15);
  --shadow-lg: 0 8px 24px rgba(60, 64, 67, 0.20);
}
```

---

## 11. 접근성 (Accessibility)

- 색상 대비: WCAG 2.1 AA 기준 이상 (4.5:1)
- 포커스 링: `outline: 2px solid --color-primary`, `outline-offset: 2px`
- 에러 상태는 색상만이 아닌 텍스트로도 표시
- 비활성 버튼: `aria-disabled="true"` + `cursor: not-allowed`
- 모달: `role="dialog"`, `aria-modal="true"`, ESC 키로 닫기
- 체크박스: `aria-label` 또는 연결된 `<label>` 필수
