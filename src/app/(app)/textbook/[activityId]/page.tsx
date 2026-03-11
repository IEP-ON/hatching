import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { LEVEL_CONFIG, SEASON_CONFIG, SUBJECT_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ResponseForm from "./ResponseForm";

export default async function TextbookActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: activity } = await supabase
    .from("activities").select("*").eq("id", activityId).single();
  if (!activity) notFound();

  // 학생: 프로젝트 학생 매핑 가져오기
  let projectStudentId: string | null = null;
  let levelCode = profile.level_code;

  if (profile.role === "student") {
    const { data: ps } = await supabase
      .from("project_students")
      .select("id, level_code")
      .eq("student_id", user.id)
      .eq("project_id", activity.project_id)
      .single();
    projectStudentId = ps?.id ?? null;
    levelCode = ps?.level_code ?? levelCode;
  } else {
    // 교사는 미리보기 모드
    const { data: ps } = await supabase
      .from("project_students")
      .select("id, level_code")
      .eq("project_id", activity.project_id)
      .limit(1).single();
    projectStudentId = ps?.id ?? null;
  }

  // 기존 응답 조회
  const { data: existingResponse } = projectStudentId
    ? await supabase
        .from("student_responses")
        .select("*")
        .eq("activity_id", activityId)
        .eq("project_student_id", projectStudentId)
        .single()
    : { data: null };

  const variant = levelCode
    ? activity.level_variants?.[levelCode]
    : null;

  const currentSeason = activity.season ?? "spring";
  const seasonConf = SEASON_CONFIG[currentSeason as keyof typeof SEASON_CONFIG];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-xl mx-auto p-4 md:p-6 space-y-5">
        <Link
          href="/textbook"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          교과서로
        </Link>

        {/* 활동 헤더 */}
        <div className={`rounded-2xl p-5 ${seasonConf?.bgColor} border ${seasonConf?.borderColor}`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {activity.lesson_type === "sudamoyeo" && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                    수다모여날
                  </Badge>
                )}
                {seasonConf && (
                  <Badge className={`${seasonConf.bgColor} ${seasonConf.color} border-transparent text-xs`}>
                    {seasonConf.label}
                  </Badge>
                )}
                <span className="text-xs text-gray-400">
                  {SUBJECT_LABELS[activity.subject as keyof typeof SUBJECT_LABELS]}
                </span>
              </div>
              <h1 className="text-xl font-bold">{activity.title}</h1>
              {activity.description && (
                <p className="text-sm text-gray-600">{activity.description}</p>
              )}
            </div>
            <div className="text-3xl shrink-0">
              {currentSeason === "spring" ? "🌸"
                : currentSeason === "summer" ? "☀️"
                : currentSeason === "autumn" ? "🍂"
                : "❄️"}
            </div>
          </div>

          {levelCode && LEVEL_CONFIG[levelCode as keyof typeof LEVEL_CONFIG] && (
            <div className="mt-3">
              <Badge className={`${LEVEL_CONFIG[levelCode as keyof typeof LEVEL_CONFIG].bgColor} ${LEVEL_CONFIG[levelCode as keyof typeof LEVEL_CONFIG].color} border-transparent`}>
                {levelCode} 수준
              </Badge>
            </div>
          )}
        </div>

        {/* 수준별 과제 안내 */}
        {variant && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-1.5">오늘의 활동</p>
            <p className="text-base font-semibold">{variant.prompt}</p>
            {variant.sentence_template && (
              <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                문장 템플릿: <span className="text-gray-700">{variant.sentence_template}</span>
              </p>
            )}
          </div>
        )}

        {/* 응답 폼 */}
        {projectStudentId ? (
          <ResponseForm
            activityId={activityId}
            projectStudentId={projectStudentId}
            variantType={variant?.type ?? "free_write"}
            existingResponse={existingResponse}
            isTeacherPreview={profile.role === "teacher"}
          />
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            이 활동에 접근할 수 없습니다.
          </div>
        )}

        {/* 교사 피드백 */}
        {existingResponse?.teacher_feedback && (
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-xs font-medium text-blue-500 mb-1">선생님 피드백</p>
            <p className="text-sm text-blue-800">{existingResponse.teacher_feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}
