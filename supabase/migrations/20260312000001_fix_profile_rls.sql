-- =============================================
-- RLS 정책 무한 재귀 수정
-- =============================================

-- 기존 재귀 정책 제거
DROP POLICY IF EXISTS "교사는 모든 프로필 읽기" ON public.profiles;

-- Security Definer 함수로 교사 여부 확인
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

-- 교사 정책을 Security Definer 함수 사용하도록 재생성
CREATE POLICY "교사는 모든 프로필 읽기"
  ON public.profiles FOR SELECT
  USING (is_teacher());
