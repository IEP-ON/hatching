"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  DAY_LABELS,
  SUBJECT_LABELS,
  LEVEL_CONFIG,
  type DayOfWeek,
  type Subject,
  type LessonType,
  type ProjectStudent,
  type Profile,
} from "@/lib/types";

const DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

// 시간표 기반 초기값 (스크린샷에서 확인된 값)
const PRESET_SCHEDULES = [
  { day_of_week: "mon", period: 1, lesson_type: "individual", subject: "korean" },
  { day_of_week: "tue", period: 1, lesson_type: "individual", subject: "korean" },
  { day_of_week: "wed", period: 2, lesson_type: "sudamoyeo", subject: "integrated" },
  { day_of_week: "thu", period: 1, lesson_type: "individual", subject: "math" },
  { day_of_week: "fri", period: 1, lesson_type: "individual", subject: "math" },
];

interface ScheduleRow {
  id?: string;
  day_of_week: DayOfWeek;
  period: number;
  project_student_id: string;
  subject: Subject;
  lesson_type: LessonType;
  student_name?: string;
}

export default function SchedulePage() {
  const supabase = createClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [students, setStudents] = useState<(ProjectStudent & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState<{
    day_of_week: DayOfWeek;
    period: number;
    project_student_id: string;
    subject: Subject;
    lesson_type: LessonType;
  }>({
    day_of_week: "mon",
    period: 1,
    project_student_id: "",
    subject: "integrated",
    lesson_type: "individual",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: proj } = await supabase
        .from("projects").select("id")
        .eq("teacher_id", user.id).eq("is_active", true)
        .limit(1).single();
      if (!proj) { setLoading(false); return; }
      setProjectId(proj.id);

      const [{ data: ps }, { data: sc }] = await Promise.all([
        supabase.from("project_students")
          .select("*, profile:profiles(name, level_code)")
          .eq("project_id", proj.id),
        supabase.from("lesson_schedules")
          .select("*")
          .eq("project_id", proj.id)
          .order("day_of_week").order("period"),
      ]);

      setStudents((ps as (ProjectStudent & { profile: Profile })[]) ?? []);

      const rows: ScheduleRow[] = ((sc ?? []) as ScheduleRow[]).map((s) => ({
        ...s,
        student_name: (ps as (ProjectStudent & { profile: Profile })[])?.find(
          (p) => p.id === s.project_student_id
        )?.profile?.name,
      }));
      setSchedules(rows);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function addSchedule() {
    if (!projectId || !form.project_student_id) {
      toast.error("학생을 선택해주세요.");
      return;
    }
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from("lesson_schedules")
        .insert({ project_id: projectId, ...form })
        .select("*").single();
      if (error) throw error;

      const student = students.find((s) => s.id === form.project_student_id);
      setSchedules((prev) => [
        ...prev,
        { ...data, student_name: student?.profile?.name },
      ]);
      toast.success("시간표가 추가되었습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setAdding(false);
    }
  }

  async function removeSchedule(id: string) {
    const { error } = await supabase.from("lesson_schedules").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success("삭제되었습니다.");
  }

  if (loading) return <div className="p-6 text-center text-gray-400">불러오는 중...</div>;

  // 요일별 그룹
  const byDay = DAYS.reduce(
    (acc, day) => {
      acc[day] = schedules.filter((s) => s.day_of_week === day);
      return acc;
    },
    {} as Record<DayOfWeek, ScheduleRow[]>
  );

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">시간표 설정</h1>

      {/* 시간표 그리드 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {DAYS.map((day) => (
          <Card key={day} className={day === "wed" ? "border-yellow-200 bg-yellow-50/50" : ""}>
            <CardHeader className="pb-2 px-3">
              <CardTitle className="text-sm text-center">
                {DAY_LABELS[day].replace("(수다모여날)", "")}
                {day === "wed" && <span className="block text-xs text-yellow-600 font-normal">수다모여날</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-1.5">
              {byDay[day].length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-2">없음</p>
              ) : (
                Array.from(new Set(byDay[day].map((s) => s.period))).sort().map((period) => {
                  const periodRows = byDay[day].filter((s) => s.period === period);
                  return (
                    <div key={period} className="rounded bg-white border border-gray-100 p-2">
                      <p className="text-xs text-gray-400 mb-1">{period}교시</p>
                      {periodRows.map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-medium truncate">{row.student_name}</span>
                            <Badge className="text-[10px] px-1 py-0 bg-gray-100 text-gray-500 border-0">
                              {SUBJECT_LABELS[row.subject]}
                            </Badge>
                          </div>
                          <button
                            onClick={() => row.id && removeSchedule(row.id)}
                            className="text-gray-200 hover:text-red-400 shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 추가 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus size={18} className="text-pink-500" />
            시간표 추가
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">요일</p>
              <div className="flex flex-wrap gap-1">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        day_of_week: d,
                        lesson_type: d === "wed" ? "sudamoyeo" : "individual",
                      }));
                    }}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      form.day_of_week === d
                        ? d === "wed"
                          ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                          : "bg-pink-100 border-pink-300 text-pink-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {DAY_LABELS[d].replace("(수다모여날)", "")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">교시</p>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, period: p }))}
                    className={`w-8 h-8 text-xs rounded border transition-colors ${
                      form.period === p
                        ? "bg-pink-100 border-pink-300 text-pink-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">교과</p>
              <div className="flex gap-1 flex-wrap">
                {(Object.entries(SUBJECT_LABELS) as [Subject, string][]).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, subject: k }))}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      form.subject === k
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">학생</p>
            <div className="flex flex-wrap gap-2">
              {students.map((ps) => {
                const conf = ps.level_code ? LEVEL_CONFIG[ps.level_code] : null;
                return (
                  <button
                    key={ps.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, project_student_id: ps.id }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      form.project_student_id === ps.id
                        ? "bg-pink-100 border-pink-300 text-pink-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {ps.profile?.name}
                    {conf && (
                      <Badge className={`text-xs px-1.5 py-0 ${conf.bgColor} ${conf.color} border-transparent`}>
                        {ps.level_code}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={addSchedule} disabled={adding || !form.project_student_id} className="w-full">
            {adding ? "추가 중..." : "시간표 추가"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
