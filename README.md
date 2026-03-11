# 🥚 사계절 메추리 프로젝트

특수교육 대상 학생들을 위한 계절별 메추리 생태 관찰 PWA 웹앱.  
Next.js 16 + Supabase + TailwindCSS + shadcn/ui

---

## 1. 로컬 개발 환경 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정 (env.example 참고)
cp env.example .env.local
# .env.local 파일을 열어 실제 키 입력

# 개발 서버 실행
npm run dev
```

---

## 2. Supabase DB 마이그레이션 (최초 1회)

```bash
# Supabase CLI 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref byshefxoakvdmpwmkqjd

# 마이그레이션 적용
supabase db push
```

---

## 3. Edge Function 배포 (IoT 데이터 수신)

```bash
# Raspberry Pi → Supabase 센서 데이터 전송용 함수 배포
supabase functions deploy iot-data --no-verify-jwt
```

### Raspberry Pi에서 데이터 전송 예시

```bash
curl -X POST \
  https://byshefxoakvdmpwmkqjd.supabase.co/functions/v1/iot-data \
  -H "Content-Type: application/json" \
  -H "x-api-key: <디바이스_API_키>" \
  -d '{
    "readings": [
      { "reading_type": "temperature", "value": 37.5, "unit": "°C" },
      { "reading_type": "humidity",    "value": 65.0, "unit": "%"  }
    ]
  }'
```

---

## 4. Vercel 배포

```bash
# Vercel CLI 설치 (최초 1회)
npm i -g vercel

# 배포
vercel --prod
```

**필수 환경변수 (Vercel 대시보드 → Settings → Environment Variables):**

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | hatching-webapp Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | hatching-webapp anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | hatching-webapp service_role key (서버 전용 — 학생 계정 생성) |
| `IEPON_SUPABASE_URL` | IEPON_DATABASE URL |
| `IEPON_SUPABASE_ANON_KEY` | IEPON_DATABASE anon key (서버 전용) |

---

## 5. 주요 라우트

| 경로 | 설명 | 역할 |
|------|------|------|
| `/dashboard` | 대시보드 | 교사 |
| `/guide` | 지도서 (활동 목록) | 교사 |
| `/guide/activities` | 전체 활동 목록 | 교사 |
| `/guide/activities/new` | 새 활동 만들기 | 교사 |
| `/guide/activities/[id]` | 활동 상세 + 배포 + 피드백 | 교사 |
| `/guide/students` | 학생 관리 | 교사 |
| `/guide/schedule` | 시간표 설정 | 교사 |
| `/guide/quails` | 메추리 개체 관리 | 교사 |
| `/guide/growth` | 성장 그래프 (Recharts) | 교사 |
| `/guide/observations` | 관찰 일지 | 교사 |
| `/guide/portfolio/[studentId]` | 학생 포트폴리오 | 교사 |
| `/guide/iot` | IoT 디바이스 관리 | 교사 |
| `/textbook` | 학생 교과서 | 교사/학생 |
| `/textbook/[activityId]` | 활동 응답 제출 | 교사/학생 |

---

## 6. 기술 스택

- **프레임워크**: Next.js 16 (App Router, Turbopack)
- **인증/DB**: Supabase (RLS 적용)
- **UI**: TailwindCSS v4 + shadcn/ui + Lucide Icons
- **차트**: Recharts
- **알림**: Sonner
