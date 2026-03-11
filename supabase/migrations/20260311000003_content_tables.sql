-- =============================================
-- Migration 3: 콘텐츠 테이블 (quails, observations, measurements, portfolios)
-- =============================================

-- 메추리 개체
CREATE TABLE public.quails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  nickname text,
  egg_number integer,
  status text DEFAULT 'egg' CHECK (status IN ('egg', 'hatching', 'chick', 'adult', 'deceased')),
  hatch_date date,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.quails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 메추리 전체 관리"
  ON public.quails FOR ALL
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

CREATE POLICY "학생은 메추리 읽기"
  ON public.quails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.project_id = quails.project_id AND ps.student_id = auth.uid()
    )
  );

CREATE TRIGGER quails_updated_at
  BEFORE UPDATE ON public.quails
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 측정 데이터 (메추리 몸무게 등 — IoT 이전 수동 측정)
CREATE TABLE public.measurements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  quail_id uuid REFERENCES public.quails(id) ON DELETE SET NULL,
  measurement_date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('weight', 'temperature', 'humidity', 'length')),
  value numeric NOT NULL,
  unit text NOT NULL,
  note text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 측정 데이터 전체 관리"
  ON public.measurements FOR ALL
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

CREATE POLICY "학생은 측정 데이터 읽기"
  ON public.measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.project_id = measurements.project_id AND ps.student_id = auth.uid()
    )
  );

-- 관찰 일지
CREATE TABLE public.observations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  quail_id uuid REFERENCES public.quails(id) ON DELETE SET NULL,
  project_student_id uuid REFERENCES public.project_students(id) ON DELETE SET NULL,
  observed_date date NOT NULL DEFAULT CURRENT_DATE,
  season text CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  content text,
  media_urls text[] DEFAULT '{}',
  iepon_standard_id text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 관찰 일지 전체 관리"
  ON public.observations FOR ALL
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

CREATE POLICY "학생은 본인 관찰 일지 읽기"
  ON public.observations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.id = project_student_id AND ps.student_id = auth.uid()
    )
  );

CREATE TRIGGER observations_updated_at
  BEFORE UPDATE ON public.observations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 포트폴리오
CREATE TABLE public.portfolios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  project_student_id uuid REFERENCES public.project_students(id) ON DELETE CASCADE NOT NULL,
  season text CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'full')),
  summary text,
  achievements jsonb DEFAULT '[]'::jsonb,
  export_url text,
  generated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_student_id, season)
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 포트폴리오 전체 관리"
  ON public.portfolios FOR ALL
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

CREATE POLICY "학생은 본인 포트폴리오 읽기"
  ON public.portfolios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.id = project_student_id AND ps.student_id = auth.uid()
    )
  );

CREATE TRIGGER portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
