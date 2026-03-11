import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  LEVEL_CONFIG,
  SEASON_CONFIG,
  SUBJECT_LABELS,
  type Season,
  type Profile,
  type ProjectStudent,
  type StudentResponse,
  type Activity,
} from "@/lib/types";

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: teacherProfile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!teacherProfile || teacherProfile.role !== "teacher") redirect("/textbook");

  // 학생 프로젝트 매핑 + 프로필
  const { data: ps } = await supabase
    .from("project_students")
    .select("*, profile:profiles(*)")
    .eq("id", studentId)
    .single();
  if (!ps) notFound();

  const projectStudent = ps as ProjectStudent & { profile: Profile };

  // 해당 학생의 모든 제출된 응답 (활동 정보 포함)
  const { data: responses } = await supabase
    .from("student_responses")
    .select("*, activity:activities(title, lesson_date, season, subject, lesson_type, level_variants)")
    .eq("project_student_id", studentId)
    .in("status", ["submitted", "reviewed"])
    .order("submitted_at", { ascending: false });

  // 계절별 그룹
  const bySeason = (responses ?? []).reduce(
    (acc, r) => {
      const season = (r.activity as Activity)?.season ?? "spring";
      if (!acc[season]) acc[season] = [];
      acc[season].push(r);
      return acc;
    },
    {} as Record<string, (StudentResponse & { activity: Activity })[]>
  );

  const levelCode = projectStudent.level_code;
  const levelConf = levelCode ? LEVEL_CONFIG[levelCode] : null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/guide/students" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        학생 목록으로
      </Link>

      {/* 학생 헤더 */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-2xl font-bold">
          {projectStudent.profile?.name?.[0] ?? "?"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{projectStudent.profile?.name}</h1>
            {levelConf && (
              <Badge className={`${levelConf.bgColor} ${levelConf.color} border-transparent`}>
                {levelCode}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            제출 완료 {(responses ?? []).length}개 활동
          </p>
          {projectStudent.profile?.iep_goals?.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              IEP 목표: {(projectStudent.profile.iep_goals as { goal: string }[]).map((g) => g.goal).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* 계절별 포트폴리오 */}
      {(Object.keys(SEASON_CONFIG) as Season[]).map((season) => {
        const items = bySeason[season] ?? [];
        const conf = SEASON_CONFIG[season];
        return (
          <div key={season}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${conf.bgColor.replace("bg-", "bg-").replace("-50", "-400")}`} />
              <h2 className={`font-semibold ${conf.color}`}>
                {conf.label} ({conf.months})
              </h2>
              <Badge className={`text-xs ${conf.bgColor} ${conf.color} border-transparent`}>
                {items.length}개
              </Badge>
            </div>

            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((r: StudentResponse & { activity: Activity }) => {
                  const activity = r.activity as Activity;
                  const variant = levelCode
                    ? activity?.level_variants?.[levelCode]
                    : null;
                  return (
                    <Card key={r.id} className={`border ${conf.borderColor}`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{activity?.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {SUBJECT_LABELS[activity?.subject as keyof typeof SUBJECT_LABELS]}
                              </span>
                              {activity?.lesson_type === "sudamoyeo" && (
                                <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
                                  수다모여날
                                </Badge>
                              )}
                              <span className="text-xs text-gray-300">
                                {activity?.lesson_date
                                  ? new Date(activity.lesson_date).toLocaleDateString("ko-KR", {
                                      month: "numeric", day: "numeric",
                                    })
                                  : ""}
                              </span>
                            </div>
                          </div>
                          <Badge
                            className={
                              r.status === "reviewed"
                                ? "bg-blue-100 text-blue-700 border-blue-200 text-xs shrink-0"
                                : "bg-green-100 text-green-700 border-green-200 text-xs shrink-0"
                            }
                          >
                            {r.status === "reviewed" ? "검토됨" : "제출됨"}
                          </Badge>
                        </div>

                        {/* 응답 내용 */}
                        {r.response_data && (
                          <div className={`rounded-lg p-3 ${conf.bgColor} text-sm`}>
                            {(r.response_data as { text?: string }).text && (
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {(r.response_data as { text: string }).text}
                              </p>
                            )}
                            {(r.response_data as { sentence?: string }).sentence && (
                              <p className="text-gray-700">
                                {(r.response_data as { sentence: string }).sentence}
                              </p>
                            )}
                            {(r.response_data as { words?: string[] }).words?.length && (
                              <div className="flex gap-1 flex-wrap">
                                {((r.response_data as { words: string[] }).words ?? []).map((w, i) => (
                                  <Badge key={i} className="text-xs bg-white border-gray-200 text-gray-600">
                                    {w}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {variant && (
                              <p className="text-xs text-gray-400 mt-1 italic">
                                과제: {variant.prompt}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 교사 피드백 */}
                        {r.teacher_feedback && (
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-xs text-blue-500">💬 피드백</p>
                            <p className="text-xs text-blue-800">{r.teacher_feedback}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-300 pl-5 py-2 border-l-2 border-gray-100">
                이 계절의 활동이 없습니다
              </div>
            )}
          </div>
        );
      })}

      {(responses ?? []).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-gray-400">아직 제출된 활동이 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
