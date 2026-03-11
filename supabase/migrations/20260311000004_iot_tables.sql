-- =============================================
-- Migration 4: IoT 테이블 (devices, readings, images)
-- =============================================

-- IoT 디바이스 (Raspberry Pi)
CREATE TABLE public.iot_devices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('incubator', 'cage')),
  name text NOT NULL,
  api_key text NOT NULL DEFAULT gen_random_uuid()::text,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen_at timestamptz,
  -- 알림 임계값 설정 예시: { "temp_min": 37.0, "temp_max": 38.0, "humidity_min": 50, "humidity_max": 70 }
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 디바이스 전체 관리"
  ON public.iot_devices FOR ALL
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

CREATE POLICY "학생은 디바이스 읽기"
  ON public.iot_devices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.project_id = iot_devices.project_id AND ps.student_id = auth.uid()
    )
  );

CREATE TRIGGER iot_devices_updated_at
  BEFORE UPDATE ON public.iot_devices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 센서 데이터 (자동/수동 공용)
CREATE TABLE public.iot_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid REFERENCES public.iot_devices(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  reading_type text NOT NULL CHECK (
    reading_type IN ('temperature', 'humidity', 'weight', 'feed_weight', 'water_level', 'egg_turn_count')
  ),
  value numeric NOT NULL,
  unit text NOT NULL,
  -- auto: 센서 자동 수집, manual: 교사 수동 입력
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('auto', 'manual')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.iot_readings ENABLE ROW LEVEL SECURITY;

-- IoT 장치는 API key로 직접 insert (service role 사용)
CREATE POLICY "교사는 IoT 데이터 전체 관리"
  ON public.iot_readings FOR ALL
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

CREATE POLICY "학생은 IoT 데이터 읽기"
  ON public.iot_readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.project_id = iot_readings.project_id AND ps.student_id = auth.uid()
    )
  );

-- 타임랩스/관찰 이미지
CREATE TABLE public.iot_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid REFERENCES public.iot_devices(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.iot_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "교사는 IoT 이미지 전체 관리"
  ON public.iot_images FOR ALL
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

CREATE POLICY "학생은 IoT 이미지 읽기"
  ON public.iot_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_students ps
      WHERE ps.project_id = iot_images.project_id AND ps.student_id = auth.uid()
    )
  );

-- 인덱스 (성능 최적화)
CREATE INDEX idx_iot_readings_project_type ON public.iot_readings (project_id, reading_type, recorded_at DESC);
CREATE INDEX idx_iot_readings_device ON public.iot_readings (device_id, recorded_at DESC);
CREATE INDEX idx_activities_project_date ON public.activities (project_id, lesson_date DESC);
CREATE INDEX idx_student_responses_activity ON public.student_responses (activity_id);
CREATE INDEX idx_observations_project_date ON public.observations (project_id, observed_date DESC);
