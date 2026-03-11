import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEVEL_CONFIG, SEASON_CONFIG, type Project, type ProjectStudent, type Profile } from "@/lib/types";
import Link from "next/link";

export default async function DashboardPage() {
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
    .order("created_at", { ascending: false });

  const activeProject = projects?.[0] as Project | undefined;

  const { data: projectStudents } = activeProject
    ? await supabase
        .from("project_students")
        .select("*, profile:profiles(*)")
        .eq("project_id", activeProject.id)
    : { data: [] };

  const { data: recentActivities } = activeProject
    ? await supabase
        .from("activities")
        .select("*")
        .eq("project_id", activeProject.id)
        .order("lesson_date", { ascending: false })
        .limit(5)
    : { data: [] };

  const currentMonth = new Date().getMonth() + 1;
  const currentSeason =
    currentMonth >= 3 && currentMonth <= 5 ? "spring"
    : currentMonth >= 6 && currentMonth <= 8 ? "summer"
    : currentMonth >= 9 && currentMonth <= 11 ? "autumn"
    : "winter";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>
        {currentSeason && (
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${SEASON_CONFIG[currentSeason].bgColor} ${SEASON_CONFIG[currentSeason].color}`}>
            {SEASON_CONFIG[currentSeason].label} 🌸
          </div>
        )}
      </div>

      {/* 프로젝트 없을 때 */}
      {!activeProject && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <div className="text-5xl">🥚</div>
            <p className="text-gray-500">아직 프로젝트가 없습니다.</p>
            <Link href="/guide/projects/new" className="text-pink-600 font-medium hover:underline text-sm">
              첫 번째 프로젝트 만들기 →
            </Link>
          </CardContent>
        </Card>
      )}

      {activeProject && (
        <>
          {/* 프로젝트 요약 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-500">현재 프로젝트</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{activeProject.name}</p>
              <p className="text-sm text-gray-500">{activeProject.species} · {activeProject.school_year}</p>
            </CardContent>
          </Card>

          {/* 학생 현황 */}
          <div>
            <h2 className="font-semibold mb-3 text-gray-700">학생 현황 ({projectStudents?.length ?? 0}명)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(projectStudents as (ProjectStudent & { profile: Profile })[])?.map((ps) => {
                const levelConf = ps.level_code ? LEVEL_CONFIG[ps.level_code] : null;
                return (
                  <Link key={ps.id} href={`/guide/portfolio/${ps.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-lg font-bold text-pink-600">
                        {ps.profile?.name?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{ps.profile?.name}</p>
                        {levelConf && (
                          <Badge variant="outline" className={`text-xs ${levelConf.color} ${levelConf.bgColor} border-transparent`}>
                            {ps.level_code}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 최근 활동 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">최근 활동</h2>
              <Link href="/guide" className="text-sm text-pink-600 hover:underline">지도서 →</Link>
            </div>
            {recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <Link key={activity.id} href={`/guide/activities/${activity.id}`}>
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(activity.lesson_date).toLocaleDateString("ko-KR")} ·{" "}
                          {activity.lesson_type === "sudamoyeo" ? "수다모여날" : "개별수업"}
                        </p>
                      </div>
                      {activity.is_distributed && (
                        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 text-xs">배포됨</Badge>
                      )}
                    </CardContent>
                  </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-gray-400 text-sm">
                  아직 활동이 없습니다.{" "}
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
