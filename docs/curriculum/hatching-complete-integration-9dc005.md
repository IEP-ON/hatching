# 메추리 사계절 프로젝트 — 교육철학·커리큘럼·기술 통합 개발 계획

"봄의 알, 여름의 날개, 가을의 노래, 겨울의 온기" — 생명의 한살이를 국어·수학 통합 소재로 삼아, L0~L3-4 수준별 맞춤 학습을 지원하는 특수학급 PWA 웹앱 개발 계획 (교육철학 + DB·API 매핑 통합본)

---

## 목차

1. 프로젝트 개요
2. **교육철학과 커리큘럼 설계** ← 신규 확장
3. 기술 스택
4. 데이터베이스 스키마 (교육 → DB 매핑 포함)
5. 핵심 기능 (Phase별)
6. 학습 활동 3대 트랙 ← 신규
7. 마음편지 관찰일기 (GPT API) ← 신규
8. 화면 설계 (교과서/지도서)
9. IoT 연동
10. 개발 로드맵
11. 부록

---

## 1. 프로젝트 개요

### 배경
- **소재**: 메추리 & 메추리알 (부화 기간 약 17일)
- **대상**: 초등 특수학급 1~5학년 혼합 6명+ (추가 등록 가능)
- **기간**: 2026년 3월 ~ 2027년 2월 (1년, 사계절 구성)
- **주제명**: "봄의 알, 여름의 날개, 가을의 노래, 겨울의 온기"
- **주교과**: 국어, 수학 (2022 개정 교육과정 성취기준 연계)
- **교육과정 DB**: Supabase `IEPON_DATABASE` 연동
- **IoT 연동**: Raspberry Pi + 센서 → 부화기/사육장 데이터 자동 수집

### 출품 전략
| 구분 | 출품물 | 성격 |
|:---:|:---|:---|
| **메인** | 사계절 프로젝트 PWA 교과서/지도서 통합 웹앱 | 교육자료전 주출품 |
| **서브** | DIY 부화기 + DIY 사육장 (재활용품, Raspberry Pi IoT) | 교육자료전 보조출품 |

> 웹앱 자체가 **범용 플랫폼**으로서 타 특수학교/급에도 적용 가능해야 하며, 부화기·사육장은 이 플랫폼에 IoT 데이터를 공급하는 하드웨어 모듈 역할.

### 범용성/일반화 설계 원칙
- **소재 교체 가능**: 메추리 외 다른 생물(닭, 장수풍뎅이, 식물 등)로 확장 가능한 구조
- **교육과정 자동 매핑**: IEPON_DATABASE에서 학년·교과별 성취기준 자동 조회 → 어떤 학교든 적용
- **학생 수준 유연**: L0~L3-4 코드 기반 개별화 → 장애 유형·정도 무관하게 수준 설정
- **IoT 선택적**: 센서 없이도 수동 입력으로 동일 기능 사용 가능 (IoT는 선택 확장)
- **템플릿 기반**: 프로젝트 생성 시 "메추리 사계절 템플릿" 선택 → 향후 다른 템플릿 추가 가능

### 사계절 내러티브 구조
| 계절 | 시기 | 메추리 성장 | 프로젝트 테마 |
|:---:|:---:|:---|:---|
| **봄** | 3~5월 | 준비 → 입란 → 부화 → 첫 만남 | 생명의 시작, 만남과 설렘 |
| **여름** | 6~8월 | 성장 · 관찰 · 데이터 축적 | 함께 자라는 여름, 돌봄과 기록 |
| **가을** | 9~11월 | 분석 · 포트폴리오 · 대회 | 데이터로 읽는 성장 이야기 |
| **겨울** | 12~2월 | 이양 · 마무리 · 회고 | 작별과 감사, 다음 봄을 기다리며 |

### 대상 학생 (6명, 개별 수준 → 추가 등록 가능)

| 이름 | 학년 | 교육과정 수준 | 특성 | 수준 코드 |
|:---|:---:|:---|:---|:---:|
| **서재민** | 5 | 유치원 6~7세 도전 수준 | 말하기 가능, 읽기/쓰기 어려움, 따라쓰기 가능 | L0 |
| **박창율** | 1 | 1학년 교육과정 | - | L1 |
| **김효주** | 3 | 1~2학년 사이 | 자폐성장애 심함, 쉽게 따라할 수 있는 것에 강점 | L1-2 |
| **신지민** | 2 | 2학년 교육과정 | 자폐성장애 심함, 노래/하고 싶은 것에 동기 높음 | L2 |
| **조사영** | 3 | 2학년 교육과정 | - | L2 |
| **민규원** | 5 | 3~4학년 사이 | - | L3-4 |

> **수준 코드 설명**: L0(기초 감각/모방), L1(1학년), L1-2(1~2학년 경계), L2(2학년), L3-4(3~4학년). 개별화 지도의 기준으로 사용.

---

## 2. 교육철학과 커리큘럼 설계

### 2.1 왜 "생명의 한살이"인가

**핵심 교육 의도**:
- 특수교육대상학생에게 "알 → 부화 → 성장 → 산란 → 다시 알"의 순환은 **시작과 끝이 연결된 보편적 경험**
- L0부터 L3-4까지 모두 참여 가능한 감동적 소재
- 생명·환경이라는 통합 주제를 국어·수학으로 자연스럽게 가져오는 매개체

**교과 통합의 자연스러운 연결**:
- **수학**: 세기 → 분류 → 가르기·모으기 → 측정 → 규칙성 → 데이터 해석
- **국어**: 이름붙이기 → 관찰 표현 → 마음편지 일기 → 발표 → 보고서 작성
- **과학/실과 준비**: 부화기 만들기 (재활용 재료 분류, 따뜻함 탐색, 온도 측정)

### 2.2 수준별 교육 기대치

| 수준 | 학생 | 국어 목표 | 수학 목표 | 활동 예시 |
|:---:|:---|:---|:---|:---|
| **L0** | 서재민 | AAC·그림으로 관찰 표현<br>GPT 일기 카드 선택·완성 | 알 갯수 세기(~5)<br>색상별 분류<br>2개 가르기 | 그림 3개 중 터치<br>따라쓰기 칸 |
| **L1** | 박창율 | 낱말 쓰기<br>그림+낱말 일기 | 10 이하 가르기·모으기<br>기본 분류<br>단위 없는 저울 읽기 | 자유 그리기<br>낱말 쓰기 |
| **L1-2** | 김효주 | 문장 빈칸 채우기<br>따라쓰기 일기 | 분류하기(속성 2가지)<br>같음·다름<br>패턴 이어하기 | 따라 그리기<br>문장 틀 |
| **L2** | 신지민<br>조사영 | 1~2문장 관찰 일기<br>감정 표현 | 측정(g 단위)<br>규칙성 찾기<br>날짜·기간 셈 | 그리기<br>1~2문장 자유 쓰기 |
| **L3-4** | 민규원 | 한살이 관찰 보고서<br>발표 | 꺾은선그래프 해석<br>규칙 예측<br>일수 계산·비교 | 보고서 양식<br>데이터 해석 |

### 2.3 부화기 만들기 프로젝트 (통합 에피소드)

**시기**: 3월 2~3주차 (수다모여날 + 개별수업 연계)

**활동 흐름**:
1. **재활용 재료 가져오기 → 분류하기** (수학: 분류)
2. **어떤 재료가 따뜻한지 탐색·예측** (과학적 사고 준비)
3. **부화기 설계 및 제작** (실과 준비, 만들기)
4. **만든 부화기 소개 글쓰기** (국어 쓰기)
5. **온도 비교 측정** (수학: 측정, IoT 연동 가능)

**수준별 과제 (DB 매핑: `activities.level_variants` jsonb)**:
```json
{
  "L0":   { "type": "image_select",        "prompt": "따뜻한 재료를 골라요",              "items": ["솜", "신문지", "유리"] },
  "L1":   { "type": "sort_and_word",       "prompt": "재료를 종류별로 나누고 이름을 써요" },
  "L1-2": { "type": "trace_and_word",      "prompt": "재료를 따라 그리고 이름을 써요" },
  "L2":   { "type": "design_and_sentence", "prompt": "부화기를 그리고 재료와 이유를 써요" },
  "L3-4": { "type": "report",              "prompt": "설계 이유와 온도 측정 결과를 써요" }
}
```

---

## 3. 기술 스택

### 3.1 프론트엔드
- **Framework**: Next.js 15 (App Router, `src/` 구조)
- **UI**: TailwindCSS + shadcn/ui
- **차트**: Recharts (꺾은선그래프, 막대그래프)
- **이미지**: Next/Image + Supabase Storage
- **PWA**: next-pwa (오프라인 지원, 홈 화면 설치)
- **아이콘**: Lucide React
- **AI**: OpenAI gpt-4o-mini (마음편지 일기 초안 생성)

### 3.2 백엔드/데이터베이스
- **신규 Supabase 프로젝트** (hatching-webapp 전용)
  - PostgreSQL, Auth, Storage, RLS
- **기존 IEPON_DATABASE 연동** (project_id: `phttiextffbxbbnobrou`)
  - `textbook_units` → 국어/수학 교과서 단원 (1~6학년)
  - `curriculum_standards` → 성취기준
  - `educational_content` → 교육 내용
  - `evaluation_levels` → 평가 수준 (상/중/하)
  - `teaching_methods` → 교수법
  - 읽기 전용 연동 (API Route에서 조회)

### 3.3 배포
- **Hosting**: Vercel (무료 티어)
- **Domain**: (선택) Custom domain

### 3.4 환경변수
```env
# .env.local (서버 사이드 전용)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# IEPON_DATABASE 크로스 계정 접근
IEPON_DB_URL=https://phttiextffbxbbnobrou.supabase.co
IEPON_DB_ANON_KEY=eyJ...

# OpenAI (마음편지 GPT 생성)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

> **보안**: IEPON_DB, OpenAI 키는 절대 클라이언트 노출 금지. 서버 사이드 API Route에서만 사용.

---

## 4. 데이터베이스 스키마 (교육 → DB 매핑)

### 4.1 ERD 개요 (신규 Supabase 프로젝트)
```
auth.users
  └── profiles (교사/학생 프로필, 수준 코드)
        └── projects (사계절 프로젝트)
              ├── project_students (학생 ↔ 프로젝트, 동적 추가)
              ├── lesson_schedules (시간표: 요일·교시·학생·교과)
              ├── quails (메추리 개체)
              ├── observations (관찰 일지 + 마음편지)
              ├── measurements (측정 데이터)
              ├── activities (에피소드 기반 학습 활동)
              │     ├── student_responses (학생 제출/반응)
              │     └── lesson_distributions (교사→학생 배포)
              ├── portfolios (포트폴리오)
              └── iot_devices (Raspberry Pi 디바이스)
                    ├── iot_readings (센서 데이터 / 수동 입력 공용)
                    └── iot_images (타임랩스 사진)

[IEPON_DATABASE 읽기 전용 참조]
  └── textbook_units → curriculum_standards → educational_content / evaluation_levels
```

### 4.2 핵심 테이블 (교육 매핑 포함)

#### `profiles` — 학생 수준 코드 저장
| 컬럼 | 타입 | 설명 | 교육 매핑 |
|:---|:---|:---|:---|
| id | uuid (PK, FK → auth.users) | | |
| role | text | teacher / student / parent | |
| full_name | text | 이름 | |
| grade | int | 학년 (nullable) | |
| **level_code** | text | **L0, L1, L1-2, L2, L3-4** | **수준별 UI·활동 분기 기준** |
| characteristics | text | 특성 메모 (자폐, 동기 요인 등) | 개별화 지도 참고 |
| iep_goals | jsonb | IEP 목표 | |

> **교육 매핑**: `level_code`가 활동 UI(`level_variants`), GPT 프롬프트, 평가 기준을 자동 결정

#### `activities` — 학습 활동 (에피소드 단위)
| 컬럼 | 타입 | 설명 | 교육 매핑 |
|:---|:---|:---|:---|
| id | uuid (PK) | | |
| project_id | uuid (FK → projects) | | |
| lesson_date | date | 수업 날짜 | |
| lesson_type | text | sudamoyeo / individual | 수다모여날 vs 개별 수업 |
| period | int | 교시 (1~8) | |
| season | text | spring/summer/autumn/winter | 사계절 타임라인 |
| title | text | "알 속에는 무엇이 있을까?" | |
| description | text | 도입 맥락, 활동 설명 | |
| subject | text | korean / math / integrated | |
| **level_variants** | **jsonb** | **수준별 과제 버전** | **L0~L3-4 각각 다른 UI/과제** |
| iepon_standard_id | text | IEPON_DB 성취기준 ID | 교육과정 연계 |
| iepon_unit_id | text | IEPON_DB 단원 ID | 단원별 누적 추적 |
| media_urls | text[] | 활동 사진/자료 | |
| teacher_notes | text | 지도서용 메모 | 도입 전략, 지도 팁 |

**`level_variants` 구조 예시** (부화기 만들기):
```json
{
  "L0": {
    "type": "image_select",
    "prompt": "따뜻한 재료를 골라요",
    "items": ["솜", "신문지", "유리"],
    "aac_support": true
  },
  "L1": {
    "type": "sort_and_word",
    "prompt": "재료를 종류별로 나누고 이름을 써요",
    "word_count": 3
  },
  "L2": {
    "type": "design_and_sentence",
    "prompt": "부화기를 그리고 재료와 이유를 써요",
    "sentence_count": 2
  },
  "L3-4": {
    "type": "report",
    "prompt": "설계 이유와 온도 측정 결과를 써요",
    "sections": ["재료 선택", "예상 온도", "실제 측정 결과"]
  }
}
```

> **교육 매핑**: 동일 활동이지만 학생 수준에 따라 UI·난이도·평가 기준이 자동 분기

#### `observations` — 관찰 일지 + 마음편지 (GPT 통합)
| 컬럼 | 타입 | 설명 | 교육 매핑 |
|:---|:---|:---|:---|
| id | uuid (PK) | | |
| project_id | uuid (FK) | | |
| student_id | uuid (FK → project_students, nullable) | | |
| observation_date | date | | |
| season | text | spring/summer/autumn/winter | |
| subject | text | korean / math / integrated | |
| **diary_type** | **text** | **heart_letter / general** | **마음편지 vs 일반 관찰** |
| content | text | 관찰 내용 / 완성된 일기 | |
| **gpt_draft** | **text** | **GPT 생성 원본 초안 (보존용)** | **GPT 사용 여부 추적** |
| **gpt_used** | **boolean** | **GPT 사용 여부** | **수준별 GPT 의존도 분석** |
| template_type | text | 수준별 템플릿 이름 | |
| media_urls | text[] | 사진 (폴라로이드 스타일) | |
| iepon_standard_id | text | 연계 성취기준 | 포트폴리오 달성도 집계 |
| created_by | uuid (FK → profiles) | | |

> **교육 매핑**: `diary_type=heart_letter`는 생명체에게 편지 쓰듯 작성. `gpt_draft` 저장으로 학생의 자립도 추적 가능

#### `student_responses` — 학생 제출/반응
| 컬럼 | 타입 | 설명 | 교육 매핑 |
|:---|:---|:---|:---|
| id | uuid (PK) | | |
| activity_id | uuid (FK → activities) | | |
| project_student_id | uuid (FK → project_students) | | |
| response_data | jsonb | 텍스트, 선택지, 그림 URL 등 | 수준별로 다양 |
| media_urls | text[] | 학생이 올린 사진/그림 | |
| status | text | draft / submitted / reviewed | |
| teacher_feedback | text | 교사 피드백 | 개별화 피드백 |
| submitted_at | timestamptz | | |

**`response_data` 구조 예시** (수준별):
```json
// L0 (그림 선택)
{ "selected_image": "egg_yellow", "traced_word": "알" }

// L1 (낱말 쓰기)
{ "drawing_url": "https://...", "words": ["알", "병아리"] }

// L2 (문장 쓰기)
{ "drawing_url": "https://...", "text": "알 속에 병아리가 있어요." }

// L3-4 (보고서)
{ "sections": [
    { "title": "관찰 내용", "text": "..." },
    { "title": "느낀 점", "text": "..." }
  ],
  "graph_url": "https://..."
}
```

#### `measurements` — 측정 데이터 (수학 트랙 A 연동)
| 컬럼 | 타입 | 설명 | 교육 매핑 |
|:---|:---|:---|:---|
| id | uuid (PK) | | |
| project_id | uuid (FK) | | |
| quail_id | uuid (FK → quails, nullable) | | |
| measurement_date | date | | |
| type | text | weight / temperature / humidity | |
| value | numeric | | 수학 그래프·통계 활동 |
| unit | text | g, ℃, % | 측정 단위 학습 |
| created_by | uuid (FK → profiles) | | |

> **교육 매핑**: 메추리 몸무게 데이터 → L3-4 꺾은선그래프 / L2 표 만들기 / L0 무거운/가벼운 비교

### 4.3 IEPON_DATABASE 연동 (교육과정 자동 매핑)

**읽기 전용 테이블** (API Route `/api/curriculum/*`에서 조회):
- `textbook_units`: 학년·교과별 단원 (1~6학년 국어/수학)
- `curriculum_standards`: 성취기준 (예: "국어 1-2학년 듣기말하기 #3")
- `educational_content`: 교육 내용
- `evaluation_levels`: 평가 수준 (상/중/하)

**매핑 흐름**:
```
교사: 활동 작성 시 학년·교과 선택
  ↓
API: IEPON_DB에서 해당 단원·성취기준 목록 조회
  ↓
교사: 성취기준 선택 → activity.iepon_standard_id 저장
  ↓
포트폴리오: 학생별 성취기준 달성도 자동 집계
```

---

## 5. 핵심 기능 (Phase별)

### Phase 1: MVP — 봄의 알 (3~4월)
| 기능 | 설명 | 우선순위 | DB 매핑 |
|:---|:---|:---:|:---|
| **인증 시스템** | 교사/학생 로그인, 역할 기반 접근 제어 | 상 | `auth.users` + `profiles.role` |
| **학생 관리** | 6명 등록 + 추가 가능, 개별 수준(L0~L3-4) 설정 | 상 | `profiles.level_code` |
| **D-day 카운트다운** | 입란일 기준 D-17 → D-day → D+N (메추리 부화 17일) | 상 | `projects.incubation_date` |
| **관찰 일지 CRUD** | 날짜, 사진, 텍스트, 학생별/수준별 템플릿 | 상 | `observations` |
| **사계절 타임라인** | 봄→여름→가을→겨울 단계별 프로젝트 진행 뷰 | 상 | `projects.current_season` |
| **교육과정 연동** | IEPON_DATABASE에서 국어/수학 성취기준·단원 조회 | 상 | `/api/curriculum/*` |

### Phase 2: 데이터 관리 — 봄의 끝 (5월)
| 기능 | 설명 | 우선순위 | DB 매핑 |
|:---|:---|:---:|:---|
| **측정 데이터 입력** | 몸무게(g), 온도, 습도 등 | 상 | `measurements` |
| **성장 그래프** | 몸무게 꺾은선그래프 (Recharts) | 상 | `measurements` → 차트 |
| **데이터 통계** | 증가량 계산, 주간/월간 요약 | 중 | 집계 쿼리 |
| **부화기 대시보드** | 온/습도 모니터링 | 하 | `iot_readings` |

### Phase 3: 학습 콘텐츠 — 여름의 날개 (6~8월)
| 기능 | 설명 | 우선순위 | DB 매핑 |
|:---|:---|:---:|:---|
| **수준별 활동지** | L0(그림 매칭), L1~L2(낱말/1문장), L3-4(보고서) | 중 | `activities.level_variants` |
| **마음편지 관찰일기** | GPT 초안 생성 + 학생 완성 | 상 | `observations` (신규 컬럼) |
| **디지털 워크시트** | 달력, 그래프, 분류 활동 | 중 | `activities` |
| **성취기준 매핑** | DB에서 가져온 성취기준 ↔ 활동 연계 | 중 | `iepon_standard_id` |
| **AAC 지원** | 낱말 카드, 그림 기반 의사소통 | 중 | L0 UI 컴포넌트 |

### Phase 4: 포트폴리오 — 가을의 노래 (9~10월)
| 기능 | 설명 | 우선순위 | DB 매핑 |
|:---|:---|:---:|:---|
| **포트폴리오 뷰** | 학생별 누적 기록 타임라인 | 상 | `portfolios` |
| **성장 증거 자료** | Before/After (3월 vs 6월 vs 11월) | 상 | 사계절 데이터 비교 |
| **PDF Export** | 인쇄용 포트폴리오 생성 | 중 | PDF 라이브러리 |
| **대회 자료 추출** | 수업 설계안, 포트폴리오 자동 편집 | 중 | 템플릿 기반 |

### Phase 5: 마무리 — 겨울의 온기 (11~2월)
| 기능 | 설명 | 우선순위 | DB 매핑 |
|:---|:---|:---:|:---|
| **교내 전시** | QR 코드 기반 디지털 전시 | 하 | 공개 링크 생성 |
| **학부모 공유** | 읽기 전용 포트폴리오 링크 | 하 | RLS 정책 |
| **일반화 템플릿** | 타 학급 활용 가능한 템플릿 | 하 | 프로젝트 템플릿 |

---

## 6. 학습 활동 3대 트랙 (교육과정 구체화)

### 트랙 A — 수준별 수학 활동

| 순서 | 시기 | 소재 | 활동명 | L0 | L1~L1-2 | L2 | L3-4 | DB 매핑 |
|:---:|:---:|:---|:---|:---|:---|:---|:---|:---|
| **A1** | 3월(봄) | 알 세기·색상 분류 | 알이 몇 개일까? | 그림 터치 세기(~5) | 숫자쓰기+블록세기 | 직접 세기+표 | 표+이유 | `level_variants` |
| **A2** | 3~4월 | 가르기·모으기 | 알을 나눠봐요 | 2개 이하 조작 | 5 이하 가르기 | 10 이하 | 문제 만들기 | `level_variants` |
| **A3** | 5~6월 | 몸무게 측정 | 메추리가 자라요 | 무거운/가벼운 선택 | 저울 읽기(단위 없이) | g 단위 읽기 | 꺾은선그래프 | `measurements` |
| **A4** | 6~8월 | 털 색깔 패턴 | 메추리 무늬 찾기 | 반복 패턴 따라하기 | 패턴 이어그리기 | 패턴 규칙 설명 | 규칙 예측+기록 | `level_variants` |
| **A5** | 9~11월 | 한살이 순서 수 | 생명의 순서 | 순서 카드 놓기 | 1~5 순서 나열 | 날짜·기간 계산 | 일수 계산+비교 | `level_variants` |

**DB 저장 예시** (활동 A1 — 알이 몇 개일까?):
```sql
INSERT INTO activities (
  title, subject, season, level_variants, iepon_unit_id
) VALUES (
  '알이 몇 개일까?',
  'math',
  'spring',
  '{
    "L0": {"type": "image_count", "max": 5, "support": "voice"},
    "L1": {"type": "block_count", "max": 10},
    "L2": {"type": "table_fill", "columns": ["색깔", "갯수"]},
    "L3-4": {"type": "table_reason", "columns": ["색깔", "갯수", "이유"]}
  }'::jsonb,
  '1학년_수학_1단원'
);
```

### 트랙 B — 수준별 국어 활동

| 순서 | 활동명 | 시기 | L0 | L1~L1-2 | L2 | L3-4 | DB 매핑 |
|:---:|:---|:---:|:---|:---|:---|:---|:---|
| **B1** | 알 이름 붙이기 | 3월 | 그림카드 3개 중 선택 | 낱말 따라쓰기 | 이름+이유 1문장 | 이름+이유 2~3문장 | `level_variants` |
| **B2** | 마음편지 관찰일기 | 3~11월 | GPT 초안 → 터치 선택 | GPT 초안 → 낱말 완성 | GPT 초안 → 문장 수정 | 자유 작성+GPT 검토 | `observations` (신규) |
| **B3** | 부화기 만들기 설명 | 3월 | 재료 그림 고르기 | 재료 이름 쓰기 | 재료+이유 문장 | 설계도 글쓰기 | `level_variants` |
| **B4** | 성장 발표 | 5~11월 | 사진 보고 말하기 | 낱말 카드로 발표 | 1~2문장 발표 | 보고서 발표 | `student_responses` |

### 트랙 C — 부화기 만들기 프로젝트 (통합 에피소드)

**시기**: 3월 2~3주차 (수다모여날 2회 + 개별수업 연계)

**활동 순서**:
1. **재활용 재료 가져오기 → 분류하기** (수학: 분류)
2. **어떤 재료가 따뜻한지 탐색·예측** (과학적 사고 준비)
3. **부화기 설계 및 제작** (실과 준비, 만들기)
4. **만든 부화기 소개 글쓰기** (국어 쓰기)
5. **온도 비교 측정** (수학: 측정, IoT 연동 가능)

**DB 저장**: 5개 활동을 `activities` 테이블에 연속 등록, 각각 `level_variants` 포함

---

## 7. 마음편지 관찰일기 — GPT API 통합 시스템

### 7.1 개념
- **폴라로이드** 방식: 사진을 찍고 생명체에게 편지 쓰듯 관찰 일기를 남기는 활동
- **모든 수준**에서 GPT 초안 생성 옵션 제공, 수준별 출력 품질 분기
- **주기**: 주 1~2회 (수다모여날 이후 + 개별 수업 시)

### 7.2 수준별 GPT 생성 전략

| 수준 | 입력 | GPT 프롬프트 시스템 메시지 | GPT 출력 예시 | 학생 조작 | DB 저장 |
|:---:|:---|:---|:---|:---|:---|
| **L0** | 사진 + 날짜 | "유치원 6~7세 수준, 1~2문장, 쉬운 어휘" | "오늘 알이 깨졌어요. 반가워요!" | 그림카드 감정 선택 후 저장 | `gpt_draft` + `content` |
| **L1** | 사진 + 낱말 2~3개 | "1학년 수준, 빈칸 문장" | "오늘 ___ 를 봤어요. ___ 했어요." | 빈칸 터치 입력 | `gpt_draft` + `content` |
| **L1-2** | 사진 + 짧은 관찰 한 줄 | "1~2학년 수준, 2~3문장 초안" | "메추리가 자랐어요. 털이 많아요. 귀여워요." | 문장 수정·선택 | `gpt_draft` + `content` |
| **L2** | 사진 + 관찰 2~3문장 | "2학년 수준, 정리된 일기 4~5문장" | "오늘 메추리를 관찰했습니다. ..." | 직접 수정 | `gpt_draft` + `content` |
| **L3-4** | 사진 + 자유 관찰 | "3~4학년 수준, 문체·어휘 제안" | 오탈자 교정, 표현 개선 제안 | 자유 편집 | `gpt_draft` + `content` |

### 7.3 API 설계

**엔드포인트**: `POST /api/diary/generate`

**요청**:
```json
{
  "photo_url": "https://...",
  "student_level": "L0",
  "keywords": ["알", "깨짐"],
  "raw_text": "알이 깨졌어요" // L2 이상만 전송
}
```

**응답**:
```json
{
  "draft_text": "오늘 알이 깨졌어요. 반가워요!",
  "suggestions": ["감정 카드: 기쁨", "감정 카드: 놀람"],
  "level": "L0"
}
```

**GPT 프롬프트 템플릿** (서버 사이드 상수):
```typescript
const GPT_PROMPTS = {
  L0: `당신은 특수교육 보조 AI입니다. 유치원 6~7세 수준의 학생이 메추리 관찰 사진을 찍었습니다.
키워드: {keywords}
→ 1~2문장, 쉬운 어휘로 관찰 일기 초안을 작성해주세요.`,
  
  L1: `1학년 수준 학생의 메추리 관찰 일기를 도와주세요.
키워드: {keywords}
→ 빈칸이 있는 2~3문장 초안을 만들어주세요. 예: "오늘 ___를 봤어요."`,
  
  L2: `2학년 수준 학생의 관찰 내용을 정리해주세요.
입력: {raw_text}
→ 4~5문장으로 정리된 일기 초안을 작성해주세요.`,
  
  "L3-4": `3~4학년 수준 학생의 관찰 보고서를 검토해주세요.
입력: {raw_text}
→ 오탈자 교정, 더 나은 표현 제안, 문단 구성 조언을 해주세요.`
};
```

### 7.4 보안 및 PII 보호
- **학생 이름 미전송**: 프롬프트에 이름 포함 금지
- **수준 코드만 전달**: L0, L1, L2, L3-4
- **사진 분석**: GPT-4 Vision 사용 시 이미지 URL 직접 전송 (선택 사항)

### 7.5 DB 마이그레이션

**신규 마이그레이션**: `20260312000001_diary_gpt.sql`
```sql
ALTER TABLE observations
  ADD COLUMN diary_type text CHECK (diary_type IN ('heart_letter', 'general')),
  ADD COLUMN gpt_draft text,
  ADD COLUMN gpt_used boolean DEFAULT false;

CREATE INDEX idx_observations_diary_type ON observations(diary_type);
```

---

## 8. 화면 설계 (교과서/지도서)

### 8.1 학생용 교과서 `/textbook`

학생 태블릿/스마트폰에서 보는 화면. **교사가 "뿌린" 콘텐츠만** 학생 화면에 나타남.

**화면 구조**:
```
/textbook (학생용 교과서 메인)
├── 🏠 오늘의 페이지 (교사가 배포한 활동)
│   ├── 활동 카드 (큰 그림 + 제목)
│   ├── 수준별 과제 (level_variants 기반 UI 자동 분기)
│   └── 제출/완료 버튼 → student_responses 저장
├── 📖 나의 교과서 (지금까지 배운 활동 모음)
│   ├── 날짜순 타임라인
│   ├── 사계절별 탭 (봄/여름/가을/겨울)
│   └── 각 활동 → 내가 한 것 보기
├── 🐦 나의 메추리 (D+N일, 사진, 성장 그래프)
└── ⭐ 나의 기록장 (포트폴리오 미리보기)
```

**수준별 UI 자동 분기 예시** (3/11 수다모여날 — 알 속에는 무엇이 있을까?):
- **L0 (서재민)**: 그림 3개 중 터치 선택 + 따라쓰기 칸
- **L1 (박창율)**: 그림 그리기 캔버스 + 낱말 입력란
- **L2 (신지민, 조사영)**: 그림 + 1~2문장 텍스트 에디터
- **L3-4 (민규원)**: 그림 + 이름 + 이유 쓰기 (2~3문장)

> DB 매핑: `profiles.level_code` → `activities.level_variants[level_code]` → 해당 UI 컴포넌트 렌더링

### 8.2 교사용 지도서 `/guide`

교사 PC/태블릿에서 보는 수업 설계 + 관리 + 기록 화면.

**화면 구조**:
```
/guide (교사용 지도서 메인)
├── 📋 오늘의 수업 (시간표 기반 → 지금 이 교시에 누가 오는지)
│   ├── 현재 교시 학생 자동 표시 (lesson_schedules 조회)
│   ├── 활동 배포 (전체/수준별/개별/교시)
│   └── 학생별 실시간 진행 상태 (student_responses.status)
├── 📚 수업 설계 (활동 만들기)
│   ├── 새 활동 만들기
│   │   ├── 제목, 설명, 사진/미디어
│   │   ├── 교과 · 성취기준 연결 (IEPON_DB API 조회)
│   │   ├── 수준별 과제 버전 (L0~L3-4 각각 입력)
│   │   └── 사계절/주제 태그
│   └── 활동 라이브러리 (과거 활동 재사용)
├── 📊 수업 기록 / 관찰 일지
│   ├── 날짜별 수업 기록 (activities + student_responses)
│   ├── 학생별 누적 기록
│   └── 성취기준 달성도 추적 (iepon_standard_id 집계)
├── 📈 데이터 (측정, IoT, 그래프)
│   ├── 메추리 몸무게 꺾은선그래프 (measurements)
│   ├── IoT 온/습도 대시보드 (iot_readings)
│   └── 수동 입력 vs 자동 수집 비교
└── 🗂️ 포트폴리오 관리
    ├── 학생별 포트폴리오 미리보기
    ├── 사계절 타임라인
    └── PDF Export
```

### 8.3 콘텐츠 배포 시스템 (교사 → 학생 푸시)

교사가 만든 활동/과제/페이지를 학생 교과서에 "뿌리는" 시스템.

**배포 방식** (DB: `lesson_distributions`):
| 방식 | target_type | target_value | 사용 예시 |
|:---|:---:|:---|:---|
| **전체 배포** | `all` | null | 수다모여날 활동 (6명 전원) |
| **수준별 배포** | `level` | `L0` / `L1-2` / `L3-4` | 수준별 다른 과제 |
| **개별 배포** | `individual` | student_uuid | 개별 보충/심화 |
| **교시 기반 자동 배포** | `period` | `mon_1` | 시간표 학생에게 자동 |

**배포 흐름**:
```
교사: 활동 작성 (activities) → 수준별 level_variants 설정
        ↓
교사: [배포 대상 선택] → lesson_distributions INSERT
        ↓
학생 교과서: "오늘의 페이지"에 새 활동 카드 표시 (RLS 정책)
        ↓
학생: 활동 수행 → student_responses INSERT
        ↓
교사 지도서: 학생별 제출 확인 + teacher_feedback 입력
```

---

## 9. IoT 연동 (Raspberry Pi)

### 9.1 하드웨어 구성

#### 부화기 (DIY 재활용품)
| 센서/모듈 | 역할 | 데이터 | DB 테이블 |
|:---|:---|:---|:---|
| DHT22 | 온도·습도 측정 | temperature, humidity (5분 간격) | `iot_readings` |
| 서보모터 | 전란 (알 뒤집기) | 전란 횟수, 마지막 전란 시각 | `iot_readings` |
| Pi Camera | 타임랩스 촬영 | 사진 (30분~1시간 간격) | `iot_images` |
| LED 표시등 | 상태 표시 | 정상/경고/위험 | - |

#### 사육장 (DIY 재활용품)
| 센서/모듈 | 역할 | 데이터 | DB 테이블 |
|:---|:---|:---|:---|
| DHT22 | 온도·습도 측정 | temperature, humidity | `iot_readings` |
| 로드셀 (HX711) | 먹이통 무게 → 먹이 소비량 추적 | feed_weight (g) | `iot_readings` |
| 수위 센서 | 물통 수위 | water_level (%) | `iot_readings` |
| Pi Camera | 행동 관찰 촬영 | 사진/영상 | `iot_images` |

### 9.2 데이터 흐름
```
Raspberry Pi (Python)
  → 센서 읽기 (주기적)
  → POST /api/iot/data (API Key 인증)
  → iot_readings 테이블 저장 (source='auto')
  → 웹앱 대시보드에 실시간 반영
  → 이상치 감지 시 알림 (온도 범위 이탈 등)
```

### 9.3 API 엔드포인트
| 엔드포인트 | 기능 | DB 매핑 |
|:---|:---|:---|
| `POST /api/iot/data` | 센서 데이터 수신 (API Key 인증) | `iot_readings` |
| `POST /api/iot/image` | 카메라 이미지 업로드 | `iot_images` |
| `GET /api/iot/status` | 디바이스 상태 조회 | `iot_devices.status` |
| `GET /api/iot/readings` | 기간별 센서 데이터 조회 | `iot_readings` |

### 9.4 수동 입력 대체 (IoT 없이도 사용 가능)
> **범용성 핵심**: 센서가 없는 학교에서도 동일한 데이터 구조로 수동 입력 가능. `iot_readings.source='manual'`로 저장하면 IoT는 자동화 레이어일 뿐, 핵심 기능은 수동으로도 100% 동작.

---

## 10. 개발 로드맵 및 수업 일정

### 10.1 Phase별 개발 일정 (기술 구현)

**Phase 0: 기반 구축 (3월 2~3주)**
- [x] 프로젝트 요구사항 분석 · 플랜 수립
- [ ] Next.js 15 + Supabase 신규 프로젝트 초기화
- [ ] DB 스키마 생성 (profiles, projects, quails 등) + RLS
- [ ] IEPON_DATABASE 연동 API Route (`/api/curriculum/*`)
- [ ] 인증 (교사/학생 로그인) + 기본 레이아웃

**Phase 1: MVP — 봄의 알 (3월 4주~4월)**
- [ ] 프로젝트 생성 (메추리, 부화 17일, 사계절 설정)
- [ ] 학생 6명 등록 (개별 수준 L0~L3-4) + 추가 기능
- [ ] D-day 카운트다운 (D-17 → D-day → D+N)
- [ ] 메추리 개체 등록 (이름, 사진, 상태)
- [ ] 관찰 일지 CRUD (수준별 템플릿)
- [ ] 사진 업로드 (Storage)
- [ ] **부화기 만들기 에피소드 활동 DB seed + level_variants 예시**
- [ ] **`observations` 마이그레이션** (`diary_type`, `gpt_draft`, `gpt_used`)

**Phase 2: 데이터 관리 — 봄의 끝 (5월)**
- [ ] 측정 데이터 입력 (개체별 몸무게, 온/습도)
- [ ] 성장 꺾은선그래프 (Recharts)
- [ ] 증가량 계산, 통계 요약
- [ ] **MVP 배포** → 입란과 동시 실사용 시작

**Phase 3: 학습 콘텐츠 — 여름의 날개 (6~8월)**
- [ ] **마음편지 관찰일기 UI** — 폴라로이드 카드 스타일
- [ ] **`POST /api/diary/generate`** — gpt-4o-mini, 수준별 프롬프트
- [ ] AAC 연동: L0 그림 감정카드 선택 → 일기 반영
- [ ] 수준별 활동지 (L0 그림매칭 ~ L3-4 보고서)
- [ ] 디지털 워크시트 (달력, 그래프)
- [ ] 성취기준 매핑 (IEPON_DB 단원·성취기준 연계)
- [ ] 몸무게 측정 + 꺾은선그래프 (트랙 A3)
- [ ] 6월: 예선 자료 / 교육자료전 출품

**Phase 4: 포트폴리오 — 가을의 노래 (9~10월)**
- [ ] 사계절 포트폴리오 타임라인
- [ ] **마음편지 타임라인**: 포트폴리오 내 사진+일기 사계절 모음
- [ ] Before/After 성장 비교
- [ ] PDF Export
- [ ] 대회 자료 자동 편집

**Phase 5: 마무리 — 겨울의 온기 (11~2월)**
- [ ] 본선 대회 포트폴리오 완성
- [ ] 교내 전시 (QR 코드)
- [ ] 이양 기록, 작별 회고
- [ ] 일반화 템플릿 배포

### 10.2 수업 일정 (교육 커리큘럼)

| 날짜 | 수다모여날 주제 | 수학 트랙 A | 국어 트랙 B | DB 활동 등록 |
|:---:|:---|:---|:---|:---|
| **3/11** | 알 속엔 무엇이? *(확정)* | A1: 알 갯수 세기 | B1: 이름 붙이기 | `activities` INSERT |
| **3/18** | 부화기를 만들자 | 재료 분류하기 | B3: 재료 이름·설명 쓰기 | 트랙 C (5개 활동) |
| **3/25** | 입란 기념 — 알이 왔어요! | A1: 알 색깔·크기 분류 | B2: 첫 마음편지 | `observations` (heart_letter) |
| **4/8** | 기다림의 수학 (D-day 카운트) | 날짜 세기, 가르기 | B2: 기다림 일기 | |
| **4/22~25** | 부화! 첫 만남 | 병아리 세기, 색 분류 | B2: 부화 마음편지 | |
| **5월~** | 성장 측정 주기 | A3: 몸무게 꺾은선그래프 | B2: 주간 성장 일기 | `measurements` + `observations` |

---

## 11. 부록

### 11.1 API 엔드포인트 요약

| 카테고리 | 엔드포인트 | 기능 | DB 테이블 |
|:---|:---|:---|:---|
| **교육과정** | `GET /api/curriculum/units` | IEPON_DB 단원 조회 | IEPON_DATABASE |
|  | `GET /api/curriculum/standards` | 성취기준 조회 | IEPON_DATABASE |
| **활동** | `POST /api/activities` | 활동 생성 (level_variants 포함) | `activities` |
|  | `POST /api/activities/distribute` | 콘텐츠 배포 | `lesson_distributions` |
|  | `GET /api/activities/today` | 학생 오늘의 활동 조회 | RLS 정책 |
| **관찰일기** | `POST /api/diary/generate` | GPT 초안 생성 | - |
|  | `POST /api/observations` | 마음편지·일반 관찰 저장 | `observations` |
|  | `GET /api/observations?diary_type=heart_letter` | 마음편지 목록 | `observations` |
| **응답** | `POST /api/responses` | 학생 제출 | `student_responses` |
|  | `PATCH /api/responses/:id/feedback` | 교사 피드백 | `student_responses` |
| **IoT** | `POST /api/iot/data` | 센서 데이터 수신 | `iot_readings` |
|  | `POST /api/iot/image` | 타임랩스 이미지 업로드 | `iot_images` |

### 11.2 마이그레이션 목록

| 파일명 | 설명 | 주요 테이블 |
|:---|:---|:---|
| `20260311000001_core_tables.sql` | 핵심 테이블 | profiles, projects, project_students |
| `20260311000002_activity_tables.sql` | 활동 관련 | activities, student_responses, lesson_distributions |
| `20260311000003_content_tables.sql` | 콘텐츠 | observations, measurements, quails |
| `20260311000004_iot_tables.sql` | IoT | iot_devices, iot_readings, iot_images |
| `20260311000005_auth_trigger.sql` | 인증 트리거 | - |
| `20260311000006_class_auth.sql` | 클래스 인증 | - |
| **`20260312000001_diary_gpt.sql`** | **마음편지 GPT (신규)** | **observations 컬럼 추가** |

### 11.3 성공 지표

| 구분 | 목표 |
|:---|:---|
| **기술** | Lighthouse 80+, PWA 90+, WCAG AA |
| **교육** | 5월 MVP 배포, 6명 전원 포트폴리오 완성, 대회 활용 |
| **GPT 활용** | L0~L2 학생 마음편지 GPT 의존도 80% → 50% (학기말까지 자립도 향상) |
| **일반화** | 타 학급 템플릿 제공, 교육자료전 메인 출품 |
| **IoT** | 부화기/사육장 센서 데이터 24시간 자동 수집, 포트폴리오 반영 |

### 11.4 위험 관리

| 리스크 | 대응 | DB/API 대응 |
|:---|:---|:---|
| Supabase 무료 티어 제한 | 이미지 압축, 필요 시 Pro 전환 | Storage 정책 |
| 5월 MVP 마감 촉박 | MVP 범위 최소화, Phase별 점진 배포 | 마이그레이션 우선순위 |
| 학생 디지털 리터러시 부족 | 수준별 단순 UI, 교사 중재 강화 | `level_variants` 세밀화 |
| GPT API 비용 초과 | gpt-4o-mini 사용, 캐싱 전략 | 일일 호출 제한 |
| 메추리 부화 실패 | 시뮬레이션 데이터 백업, 다회 시도 가능 | 샘플 데이터 seed |
| 학급 Wi-Fi 불안정 | PWA 오프라인 모드 | IndexedDB 로컬 저장 |

### 11.5 예산

| 항목 | 비용 |
|:---|---:|
| Vercel Free + Supabase Free | 0원 |
| OpenAI API (gpt-4o-mini, 월 ~500회 호출) | ~5,000원/월 |
| Domain (선택) | ~15,000원/년 |
| Raspberry Pi 4/5 x2 | ~100,000~160,000원 |
| 센서 모듈 (DHT22, 로드셀, 서보 등) | ~30,000~50,000원 |
| Pi Camera x2 | ~30,000~50,000원 |

---

**작성일**: 2026.03.12  
**기준 플랜**: `hatching-pwa-webapp-plan-6544cf.md` (v5)  
**통합 보완**: 교육철학·커리큘럼·학습활동 3대 트랙·마음편지 GPT·DB 매핑 완전 통합  
**다음 구현 우선순위**:
1. `observations` 테이블 마이그레이션 (`diary_type`, `gpt_draft`, `gpt_used`)
2. `/api/diary/generate` Route 구현 (gpt-4o-mini)
3. 마음편지 UI 컴포넌트 (폴라로이드 스타일)
4. 부화기 만들기 에피소드 활동 DB seed (`level_variants` 예시)
