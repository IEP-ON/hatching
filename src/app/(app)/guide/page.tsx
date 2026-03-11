import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Calendar, Users } from "lucide-react";
import { DAY_LABELS, SUBJECT_LABELS, type Activity, type LessonSchedule } from "@/lib/types";

const TODAY_DOW: Record<number, string> = {
  1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri",
};

export default async function GuidePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "teacher") redirect("/textbook");

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("teacher_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const project = projects?.[0];

  // 오늘 시간표
  const todayDow = TODAY_DOW[new Date().getDay()];
  const { data: todaySchedule } = project && todayDow
    ? await supabase
        .from("lesson_schedules")
        .select("*, project_student:project_students(*, profile:profiles(name, level_code))")
        .eq("project_id", project.id)
        .eq("day_of_week", todayDow)
        .order("period")
    : { data: [] };

  // 최근 활동 목록
  const { data: activities } = project
    ? await supabase
        .from("activities")
        .select("*")
        .eq("project_id", project.id)
        .order("lesson_date", { ascending: false })
        .limit(10)
    : { data: [] };

  const todayActivities = (activities as Activity[] | null)?.filter(
    (a) => a.lesson_date === new Date().toISOString().split("T")[0]
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">지도서</h1>
        <Link href="/guide/activities/new">
          <Button size="sm" className="gap-2">
            <Plus size={16} />
            새 활동
          </Button>
        </Link>
      </div>

      {!project && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-3">
            <div className="text-4xl">📚</div>
            <p className="text-gray-500">프로젝트를 먼저 만들어주세요.</p>
            <Link href="/guide/projects/new">
              <Button variant="outline" size="sm">프로젝트 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {project && (
        <>
          {/* 오늘의 수업 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={18} className="text-pink-500" />
                오늘의 수업
                {todayDow && (
                  <Badge variant="outline" className="text-xs">
                    {DAY_LABELS[todayDow as keyof typeof DAY_LABELS]}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!todayDow ? (
                <p className="text-sm text-gray-400 text-center py-4">오늘은 수업이 없습니다 (주말)</p>
              ) : todaySchedule && todaySchedule.length > 0 ? (
                <div className="space-y-2">
                  {Array.from(new Set((todaySchedule as LessonSchedule[]).map((s) => s.period))).map((period) => {
                    const periodSchedules = (todaySchedule as LessonSchedule[]).filter((s) => s.period === period);
                    const lessonType = periodSchedules[0]?.lesson_type;
                    return (
                      <div key={period} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-sm font-bold shrink-0">
                          {period}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {lessonType === "sudamoyeo" && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                                수다모여날
                              </Badge>
                            )}
                            {periodSchedules.map((s: LessonSchedule & { project_student?: { profile?: { name?: string; level_code?: string } } }) => (
                              <span key={s.id} className="text-sm text-gray-700">
                                {s.project_student?.profile?.name}
                                <span className="text-xs text-gray-400 ml-1">
                                  ({SUBJECT_LABELS[s.subject as keyof typeof SUBJECT_LABELS]})
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <Users size={32} className="mx-auto text-gray-300" />
                  <p className="text-sm text-gray-400">오늘 시간표가 없습니다.</p>
                  <Link href="/guide/schedule">
                    <Button variant="outline" size="sm">시간표 설정하기</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 오늘의 활동 */}
          {todayActivities && todayActivities.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 text-gray-700">오늘의 활동</h2>
              <div className="space-y-2">
                {todayActivities.map((activity) => (
                  <Link key={activity.id} href={`/guide/activities/${activity.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {activity.lesson_type === "sudamoyeo" ? "수다모여날" : "개별수업"} ·{" "}
                            {SUBJECT_LABELS[activity.subject]}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={activity.is_distributed
                            ? "text-green-700 bg-green-50 border-green-200"
                            : "text-gray-500 bg-gray-50"
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
          )}

          {/* 최근 활동 목록 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">전체 활동</h2>
              <Link href="/guide/activities" className="text-sm text-pink-600 hover:underline">
                모두 보기 →
              </Link>
            </div>
            {activities && activities.length > 0 ? (
              <div className="space-y-2">
                {(activities as Activity[]).slice(0, 5).map((activity) => (
                  <Link key={activity.id} href={`/guide/activities/${activity.id}`}>
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(activity.lesson_date).toLocaleDateString("ko-KR")} ·{" "}
                            {activity.lesson_type === "sudamoyeo" ? "수다모여날" : "개별수업"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-gray-400">
                  활동이 없습니다.{" "}
                  <Link href="/guide/activities/new" className="text-pink-600 hover:underline">
                    첫 활동 만들기 →
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
