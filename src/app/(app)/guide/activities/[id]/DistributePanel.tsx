"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Send, Users, BarChart2, User } from "lucide-react";
import {
  LEVEL_CONFIG,
  type Activity,
  type LevelCode,
  type LessonDistribution,
  type ProjectStudent,
  type Profile,
} from "@/lib/types";

interface DistributePanelProps {
  activity: Activity;
  projectStudents: (ProjectStudent & { profile: Profile })[];
  distributions: LessonDistribution[];
  teacherId: string;
}

export default function DistributePanel({
  activity,
  projectStudents,
  distributions,
  teacherId,
}: DistributePanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function distribute(
    targetType: LessonDistribution["target_type"],
    targetValue?: string
  ) {
    setLoading(true);
    try {
      // 배포 기록 저장
      const { error: distErr } = await supabase.from("lesson_distributions").insert({
        activity_id: activity.id,
        project_id: activity.project_id,
        target_type: targetType,
        target_value: targetValue ?? null,
        distributed_by: teacherId,
      });
      if (distErr) throw distErr;

      // 활동 is_distributed 플래그 업데이트
      const { error: actErr } = await supabase
        .from("activities")
        .update({ is_distributed: true })
        .eq("id", activity.id);
      if (actErr) throw actErr;

      // 대상 학생들에게 빈 student_response 레코드 생성 (draft)
      const targets = getTargetStudents(targetType, targetValue);
      if (targets.length > 0) {
        const rows = targets.map((ps) => ({
          activity_id: activity.id,
          project_student_id: ps.id,
          status: "draft",
        }));
        // upsert — 이미 존재하면 무시
        await supabase.from("student_responses").upsert(rows, {
          onConflict: "activity_id,project_student_id",
          ignoreDuplicates: true,
        });
      }

      const label =
        targetType === "all"
          ? "전체 학생"
          : targetType === "level"
          ? `${targetValue} 수준`
          : targetType === "individual"
          ? projectStudents.find((ps) => ps.id === targetValue)?.profile?.name
          : "이 교시 학생";

      toast.success(`${label}에게 배포했습니다!`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "배포 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function getTargetStudents(
    targetType: LessonDistribution["target_type"],
    targetValue?: string
  ): (ProjectStudent & { profile: Profile })[] {
    if (targetType === "all") return projectStudents;
    if (targetType === "level")
      return projectStudents.filter((ps) => ps.level_code === targetValue);
    if (targetType === "individual")
      return projectStudents.filter((ps) => ps.id === targetValue);
    return projectStudents;
  }

  const levelGroups = Array.from(
    new Set(projectStudents.map((ps) => ps.level_code).filter(Boolean))
  ) as LevelCode[];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send size={18} className="text-pink-500" />
          학생에게 배포
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 전체 배포 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-pink-50 border border-pink-100">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-pink-500" />
            <div>
              <p className="text-sm font-medium">전체 배포</p>
              <p className="text-xs text-gray-400">학급 전체 {projectStudents.length}명</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => distribute("all")}
            disabled={loading}
            className="bg-pink-500 hover:bg-pink-600"
          >
            배포
          </Button>
        </div>

        {/* 수준별 배포 */}
        {levelGroups.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
              <BarChart2 size={14} />
              수준별 배포
            </p>
            <div className="space-y-2">
              {levelGroups.map((level) => {
                const conf = LEVEL_CONFIG[level];
                const count = projectStudents.filter((ps) => ps.level_code === level).length;
                return (
                  <div
                    key={level}
                    className={`flex items-center justify-between p-3 rounded-lg ${conf.bgColor} border border-current/10`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={`${conf.bgColor} ${conf.color} border-transparent`}>
                        {level}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {conf.students.filter((s) =>
                          projectStudents.some((ps) => ps.profile?.name === s)
                        ).join(", ")}
                        <span className="text-xs text-gray-400 ml-1">({count}명)</span>
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => distribute("level", level)}
                      disabled={loading}
                    >
                      배포
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 개별 배포 */}
        {projectStudents.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
              <User size={14} />
              개별 배포
            </p>
            <div className="flex flex-wrap gap-2">
              {projectStudents.map((ps) => (
                <button
                  key={ps.id}
                  onClick={() => distribute("individual", ps.id)}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm disabled:opacity-50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">
                    {ps.profile?.name?.[0] ?? "?"}
                  </div>
                  {ps.profile?.name}
                  {ps.level_code && (
                    <Badge
                      className={`text-xs ${LEVEL_CONFIG[ps.level_code]?.bgColor} ${LEVEL_CONFIG[ps.level_code]?.color} border-transparent`}
                    >
                      {ps.level_code}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 배포 이력 */}
        {distributions.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-400 mb-2">배포 이력</p>
            <div className="space-y-1">
              {distributions.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {d.target_type === "all"
                      ? "전체"
                      : d.target_type === "level"
                      ? `${d.target_value} 수준`
                      : d.target_type === "individual"
                      ? projectStudents.find((ps) => ps.id === d.target_value)?.profile?.name
                      : d.target_value}
                  </span>
                  <span>{new Date(d.distributed_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
