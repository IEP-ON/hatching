import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  SEASON_CONFIG,
  SUBJECT_LABELS,
  type Activity,
  type Season,
} from "@/lib/types";

export default async function ActivitiesListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "teacher") redirect("/textbook");

  const { data: projects } = await supabase
    .from("projects").select("id, name")
    .eq("teacher_id", user.id).eq("is_active", true).limit(1);
  const project = projects?.[0];

  const { data: activities } = project
    ? await supabase
        .from("activities")
        .select("*")
        .eq("project_id", project.id)
        .order("lesson_date", { ascending: false })
    : { data: [] };

  // 계절별 그룹
  const bySeason = ((activities as Activity[]) ?? []).reduce(
    (acc, a) => {
      const season = a.season ?? "spring";
      if (!acc[season]) acc[season] = [];
      acc[season].push(a);
      return acc;
    },
    {} as Record<Season, Activity[]>
  );

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">전체 활동</h1>
        <Link href="/guide/activities/new">
          <Button size="sm" className="gap-2">
            <Plus size={16} />
            새 활동
          </Button>
        </Link>
      </div>

      {!project ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-gray-400">프로젝트를 먼저 만들어주세요.</p>
            <Link href="/guide/projects/new">
              <Button variant="outline" size="sm" className="mt-3">프로젝트 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (activities as Activity[]).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-400 text-sm">아직 활동이 없습니다.</p>
            <Link href="/guide/activities/new">
              <Button variant="outline" size="sm" className="mt-3">첫 활동 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        (["spring", "summer", "autumn", "winter"] as Season[]).map((season) => {
          const items = bySeason[season] ?? [];
          if (items.length === 0) return null;
          const conf = SEASON_CONFIG[season];
          return (
            <div key={season}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className={`font-semibold ${conf.color}`}>{conf.label}</h2>
                <Badge className={`text-xs ${conf.bgColor} ${conf.color} border-transparent`}>
                  {items.length}개
                </Badge>
              </div>
              <div className="space-y-2">
                {items.map((activity) => (
                  <Link key={activity.id} href={`/guide/activities/${activity.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            {activity.lesson_type === "sudamoyeo" && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs shrink-0">
                                수다모여날
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400">
                              {SUBJECT_LABELS[activity.subject]}
                            </span>
                            <span className="text-xs text-gray-300">
                              {new Date(activity.lesson_date).toLocaleDateString("ko-KR", {
                                month: "numeric", day: "numeric",
                              })}
                              {activity.period && ` · ${activity.period}교시`}
                            </span>
                          </div>
                          <p className="font-medium truncate">{activity.title}</p>
                        </div>
                        <Badge
                          className={
                            activity.is_distributed
                              ? "bg-green-100 text-green-700 border-green-200 text-xs shrink-0"
                              : "bg-gray-100 text-gray-400 border-gray-200 text-xs shrink-0"
                          }
                        >
                          {activity.is_distributed ? "배포됨" : "미배포"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
