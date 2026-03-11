import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LEVEL_CONFIG,
  SEASON_CONFIG,
  SUBJECT_LABELS,
  type Activity,
  type LevelCode,
  type ProjectStudent,
  type Profile,
} from "@/lib/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DistributePanel from "./DistributePanel";
import ResponseReview from "./ResponseReview";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "teacher") redirect("/textbook");

  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .single();

  if (!activity) notFound();

  // 프로젝트 학생 목록
  const { data: projectStudents } = await supabase
    .from("project_students")
    .select("*, profile:profiles(name, level_code)")
    .eq("project_id", activity.project_id);

  // 배포 이력
  const { data: distributions } = await supabase
    .from("lesson_distributions")
    .select("*")
    .eq("activity_id", id)
    .order("distributed_at", { ascending: false });

  // 학생 응답 현황 (level_code 포함)
  const { data: responses } = await supabase
    .from("student_responses")
    .select("*, project_student:project_students(level_code, profile:profiles(name))")
    .eq("activity_id", id)
    .order("submitted_at", { ascending: false });

  const a = activity as Activity;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <Link href="/guide" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        지도서로
      </Link>

      {/* 활동 헤더 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {a.lesson_type === "sudamoyeo" && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">수다모여날</Badge>
                )}
                {a.season && SEASON_CONFIG[a.season] && (
                  <Badge className={`${SEASON_CONFIG[a.season].bgColor} ${SEASON_CONFIG[a.season].color} border-transparent`}>
                    {SEASON_CONFIG[a.season].label}
                  </Badge>
                )}
                <span className="text-xs text-gray-400">{SUBJECT_LABELS[a.subject]}</span>
              </div>
              <CardTitle className="text-xl">{a.title}</CardTitle>
              <p className="text-sm text-gray-500">
                {new Date(a.lesson_date).toLocaleDateString("ko-KR", {
                  year: "numeric", month: "long", day: "numeric", weekday: "short",
                })}
                {a.period && ` · ${a.period}교시`}
              </p>
            </div>
            <Badge
              className={a.is_distributed
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
              }
            >
              {a.is_distributed ? "배포됨" : "미배포"}
            </Badge>
          </div>
        </CardHeader>
        {(a.description || a.teacher_notes) && (
          <CardContent className="pt-0 space-y-3">
            {a.description && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">활동 설명</p>
                <p className="text-sm text-gray-700">{a.description}</p>
              </div>
            )}
            {a.teacher_notes && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-600 mb-1">📝 교사 메모</p>
                <p className="text-sm text-yellow-800">{a.teacher_notes}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* 수준별 과제 버전 */}
      {Object.keys(a.level_variants ?? {}).length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-gray-700">수준별 과제 버전</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.entries(a.level_variants ?? {}) as [LevelCode, { type: string; prompt: string }][]).map(
              ([level, variant]) => {
                const conf = LEVEL_CONFIG[level];
                return (
                  <Card key={level} className={`border ${conf.bgColor}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${conf.bgColor} ${conf.color} border-transparent`}>{level}</Badge>
                        <span className="text-xs text-gray-500">{conf.students.join(", ")}</span>
                      </div>
                      <p className="text-xs text-gray-400">{variant.type}</p>
                      <p className="text-sm font-medium">{variant.prompt}</p>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* 배포 패널 (클라이언트 컴포넌트) */}
      <DistributePanel
        activity={a}
        projectStudents={(projectStudents as (ProjectStudent & { profile: Profile })[]) ?? []}
        distributions={distributions ?? []}
        teacherId={user.id}
      />

      {/* 학생 응답 검토 (클라이언트 컴포넌트) */}
      {responses && responses.length > 0 && (
        <ResponseReview
          responses={responses as Parameters<typeof ResponseReview>[0]["responses"]}
          activity={a}
        />
      )}
    </div>
  );
}
