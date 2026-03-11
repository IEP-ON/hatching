-- =============================================
-- Migration 2: 활동 관련 테이블 (activities, responses, distributions)
-- =============================================

-- 학습 활동 (에피소드 단위)
CREATE TABLE public.activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  lesson_date date NOT NULL,
  lesson_type text NOT NULL CHECK (lesson_type IN ('sudamoyeo', 'individual')),
  period integer CHECK (period BETWEEN 1 AND 8),
  season text CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  title text NOT NULL,
  description text,
  subject text NOT NULL CHECK (subject IN ('korean', 'math', 'integrated')),
  -- 수준별 과제 버전: { "L0": { "type": "image_select", "prompt": "..." }, ... }
  level_variants jsonb DEFAULT '{}'::jsonb,
  -- IEPON_DATABASE 연동 (ref만 저장)
  iepon_standard_id text,
  iepon_unit_id text,
  media_urls text[] DEFAULT '{}',
  teacher_notes text,
  is_distributed boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 본인 프로젝트 활동 전체 관리"
  ON public.activities FOR ALL
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

CREATE POLICY "학생은 배포된 활동 읽기"
  ON public.activities FOR SELECT
  USING (
    is_distributed = true
    AND EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.project_id = activities.project_id AND ps.student_id = auth.uid()
    )
  );

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 콘텐츠 배포 기록
CREATE TABLE public.lesson_distributions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  -- target_type: all / level / individual / period
  target_type text NOT NULL CHECK (target_type IN ('all', 'level', 'individual', 'period')),
  -- target_value: null(전체), 'L0', student_uuid, 'mon_1' 등
  target_value text,
  distributed_at timestamptz DEFAULT now(),
  distributed_by uuid REFERENCES public.profiles(id) NOT NULL
);

ALTER TABLE public.lesson_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 본인 프로젝트 배포 관리"
  ON public.lesson_distributions FOR ALL
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

-- 학생 응답/제출
CREATE TABLE public.student_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  project_student_id uuid REFERENCES public.project_students(id) ON DELETE CASCADE NOT NULL,
  -- response_data: 텍스트, 선택지, 그림 URL 등 수준별로 다양
  response_data jsonb DEFAULT '{}'::jsonb,
  media_urls text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  teacher_feedback text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (activity_id, project_student_id)
);

ALTER TABLE public.student_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "학생은 본인 응답 관리"
  ON public.student_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.id = project_student_id AND ps.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.id = project_student_id AND ps.student_id = auth.uid()
    )
  );

CREATE POLICY "교사는 본인 프로젝트 응답 전체 읽기/수정"
  ON public.student_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = activity_id AND p.teacher_id = auth.uid()
    )
  );

CREATE TRIGGER student_responses_updated_at
  BEFORE UPDATE ON public.student_responses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
