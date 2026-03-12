-- =============================================
-- Migration 1: 핵심 테이블 (profiles, projects, students, schedules)
-- =============================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 프로필 (교사/학생)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('teacher', 'student')),
  name text NOT NULL,
  grade text,
  level_code text CHECK (level_code IN ('L0', 'L1', 'L1-2', 'L2', 'L3-4')),
  characteristics text,
  iep_goals jsonb DEFAULT '[]'::jsonb,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 프로필 읽기/수정"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "교사는 모든 프로필 읽기"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 프로젝트 (사계절 학급 프로젝트)
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  species text DEFAULT '메추리',
  school_year text,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 본인 프로젝트 전체 관리"
  ON public.projects FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 프로젝트 학생 매핑
CREATE TABLE public.project_students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  level_code text CHECK (level_code IN ('L0', 'L1', 'L1-2', 'L2', 'L3-4')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (project_id, student_id)
);

ALTER TABLE public.project_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 본인 프로젝트 학생 관리"
  ON public.project_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.teacher_id = auth.uid()
    )
  );

CREATE POLICY "학생은 본인 매핑 읽기"
  ON public.project_students FOR SELECT
  USING (student_id = auth.uid());

-- projects 테이블에 학생 정책 추가 (project_students 테이블 생성 후)
CREATE POLICY "학생은 소속 프로젝트 읽기"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.project_id = id AND ps.student_id = auth.uid()
    )
  );

-- 시간표
CREATE TABLE public.lesson_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri')),
  period integer NOT NULL CHECK (period BETWEEN 1 AND 8),
  project_student_id uuid REFERENCES public.project_students(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL CHECK (subject IN ('korean', 'math', 'integrated')),
  lesson_type text NOT NULL CHECK (lesson_type IN ('sudamoyeo', 'individual')),
  UNIQUE (project_id, day_of_week, period, project_student_id)
);

ALTER TABLE public.lesson_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 시간표 전체 관리"
  ON public.lesson_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.teacher_id = auth.uid()
    )
  );

CREATE POLICY "학생은 본인 시간표 읽기"
  ON public.lesson_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.id = project_student_id AND ps.student_id = auth.uid()
    )
  );
