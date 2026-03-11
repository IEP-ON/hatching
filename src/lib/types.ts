// =============================================
// 도메인 타입 정의
// =============================================

export type UserRole = "teacher" | "student";
export type LevelCode = "L0" | "L1" | "L1-2" | "L2" | "L3-4";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Subject = "korean" | "math" | "integrated";
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri";
export type LessonType = "sudamoyeo" | "individual";

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  grade?: string;
  level_code?: LevelCode;
  characteristics?: string;
  iep_goals: IepGoal[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface IepGoal {
  subject: Subject;
  goal: string;
  standard_id?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  species: string;
  school_year?: string;
  teacher_id: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectStudent {
  id: string;
  project_id: string;
  student_id: string;
  level_code?: LevelCode;
  joined_at: string;
  // 조인 시 포함
  profile?: Profile;
}

export interface LessonSchedule {
  id: string;
  project_id: string;
  day_of_week: DayOfWeek;
  period: number;
  project_student_id: string;
  subject: Subject;
  lesson_type: LessonType;
}

// 수준별 과제 버전
export interface LevelVariant {
  type:
    | "image_select"
    | "draw_and_word"
    | "draw_and_sentence"
    | "sentence_fill"
    | "report"
    | "free_write";
  prompt: string;
  tracing?: boolean;
  options?: string[]; // image_select용
  sentence_template?: string; // sentence_fill용
}

export interface Activity {
  id: string;
  project_id: string;
  lesson_date: string;
  lesson_type: LessonType;
  period?: number;
  season?: Season;
  title: string;
  description?: string;
  subject: Subject;
  level_variants: Partial<Record<LevelCode, LevelVariant>>;
  iepon_standard_id?: string;
  iepon_unit_id?: string;
  media_urls: string[];
  teacher_notes?: string;
  is_distributed: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonDistribution {
  id: string;
  activity_id: string;
  project_id: string;
  target_type: "all" | "level" | "individual" | "period";
  target_value?: string;
  distributed_at: string;
  distributed_by: string;
}

export interface StudentResponse {
  id: string;
  activity_id: string;
  project_student_id: string;
  response_data: ResponseData;
  media_urls: string[];
  status: "draft" | "submitted" | "reviewed";
  teacher_feedback?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ResponseData {
  text?: string;
  selected_option?: string;
  drawing_url?: string;
  sentence?: string;
  words?: string[];
}

export interface Quail {
  id: string;
  project_id: string;
  name: string;
  nickname?: string;
  egg_number?: number;
  status: "egg" | "hatching" | "chick" | "adult" | "deceased";
  hatch_date?: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Measurement {
  id: string;
  project_id: string;
  quail_id?: string;
  measurement_date: string;
  type: "weight" | "temperature" | "humidity" | "length";
  value: number;
  unit: string;
  note?: string;
  created_by?: string;
  created_at: string;
}

export interface Observation {
  id: string;
  project_id: string;
  quail_id?: string;
  project_student_id?: string;
  observed_date: string;
  season?: Season;
  content?: string;
  media_urls: string[];
  iepon_standard_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  project_id: string;
  project_student_id: string;
  season?: Season | "full";
  summary?: string;
  achievements: Achievement[];
  export_url?: string;
  generated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  standard_id: string;
  standard_label: string;
  level: "achieved" | "partial" | "not_yet";
  evidence?: string;
}

// IoT
export interface IotDevice {
  id: string;
  project_id: string;
  device_type: "incubator" | "cage";
  name: string;
  api_key: string;
  status: "online" | "offline" | "error";
  last_seen_at?: string;
  config: IotDeviceConfig;
  created_at: string;
  updated_at: string;
}

export interface IotDeviceConfig {
  temp_min?: number;
  temp_max?: number;
  humidity_min?: number;
  humidity_max?: number;
  feed_weight_min?: number;
  water_level_min?: number;
}

export type ReadingType =
  | "temperature"
  | "humidity"
  | "weight"
  | "feed_weight"
  | "water_level"
  | "egg_turn_count";

export interface IotReading {
  id: string;
  device_id?: string;
  project_id: string;
  reading_type: ReadingType;
  value: number;
  unit: string;
  source: "auto" | "manual";
  recorded_at: string;
  created_at: string;
}

// IEPON_DATABASE 타입
export interface IeponSubject {
  id: string;
  name: string;
  code: string;
}

export interface IeponUnit {
  id: string;
  subject_id: string;
  grade: number;
  semester: number;
  unit_number: number;
  title: string;
  description?: string;
}

export interface IeponStandard {
  id: string;
  unit_id: string;
  code: string;
  content: string;
  level?: string;
}

// UI 유틸 타입
export type SeasonConfig = {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  months: string;
};

export const SEASON_CONFIG: Record<Season, SeasonConfig> = {
  spring: {
    label: "봄",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    months: "3~5월",
  },
  summer: {
    label: "여름",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    months: "6~8월",
  },
  autumn: {
    label: "가을",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    months: "9~11월",
  },
  winter: {
    label: "겨울",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    months: "12~2월",
  },
};

export const LEVEL_CONFIG: Record<
  LevelCode,
  { label: string; color: string; bgColor: string; students: string[] }
> = {
  L0: {
    label: "L0",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    students: ["서재민"],
  },
  L1: {
    label: "L1",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    students: ["박창율"],
  },
  "L1-2": {
    label: "L1-2",
    color: "text-cyan-700",
    bgColor: "bg-cyan-100",
    students: ["김효주"],
  },
  L2: {
    label: "L2",
    color: "text-green-700",
    bgColor: "bg-green-100",
    students: ["신지민", "조사영"],
  },
  "L3-4": {
    label: "L3-4",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    students: ["민규원"],
  },
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "월",
  tue: "화",
  wed: "수(수다모여날)",
  thu: "목",
  fri: "금",
};

export const SUBJECT_LABELS: Record<Subject, string> = {
  korean: "국어",
  math: "수학",
  integrated: "통합",
};
