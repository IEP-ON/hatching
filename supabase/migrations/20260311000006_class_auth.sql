-- =============================================
-- Migration 6: 학급코드 + PIN 인증 시스템
-- =============================================

-- profiles에 class_code 컬럼 추가 (소속 학급)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS class_code text;

-- projects에 class_code 컬럼 추가 (학급 식별코드, 고유값)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS class_code text UNIQUE;

-- 학급코드 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_class_code ON public.profiles (class_code);
CREATE INDEX IF NOT EXISTS idx_projects_class_code ON public.projects (class_code);
