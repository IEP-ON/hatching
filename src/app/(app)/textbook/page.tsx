import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LEVEL_CONFIG, SEASON_CONFIG, SUBJECT_LABELS, type Activity, type ProjectStudent, type Profile } from "@/lib/types";

export default async function TextbookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  // 학생인 경우: 소속 프로젝트에서 배포된 활동 조회
  // 교사인 경우: 전체 활동 미리보기
  const isTeacher = profile.role === "teacher";

  let projectId: string | null = null;
  let levelCode = profile.level_code;

  if (isTeacher) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("teacher_id", user.id)
      .eq("is_active", true)
      .limit(1);
    projectId = projects?.[0]?.id ?? null;
  } else {
    const { data: ps } = await supabase
      .from("project_students")
      .select("project_id, level_code")
      .eq("student_id", user.id)
      .limit(1);
    const mapping = ps?.[0] as (ProjectStudent & { project_id: string }) | undefined;
    projectId = mapping?.project_id ?? null;
    levelCode = mapping?.level_code ?? levelCode;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: todayActivities } = projectId
    ? await supabase
        .from("activities")
        .select("*")
        .eq("project_id", projectId)
        .eq("lesson_date", todayStr)
        .eq("is_distributed", true)
        .order("lesson_type")
    : { data: [] };

  const { data: allActivities } = projectId
    ? await supabase
        .from("activities")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_distributed", true)
        .order("lesson_date", { ascending: false })
        .limit(20)
    : { data: [] };

  const levelConf = levelCode ? LEVEL_CONFIG[levelCode as keyof typeof LEVEL_CONFIG] : null;
  const currentMonth = new Date().getMonth() + 1;
  const currentSeason =
    currentMonth >= 3 && currentMonth <= 5 ? "spring"
    : currentMonth >= 6 && currentMonth <= 8 ? "summer"
    : currentMonth >= 9 && currentMonth <= 11 ? "autumn"
    : "winter";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className={`rounded-2xl p-5 ${SEASON_CONFIG[currentSeason].bgColor} ${SEASON_CONFIG[currentSeason].borderColor} border`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">나의 교과서</p>
            <h1 className="text-xl font-bold mt-1">
              {isTeacher ? "교과서 미리보기" : `${profile.name}의 교과서`}
            </h1>
            <p className="text-sm mt-1 text-gray-600">
              {SEASON_CONFIG[currentSeason].label} · {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="text-4xl">{currentSeason === "spring" ? "🌸" : currentSeason === "summer" ? "☀️" : currentSeason === "autumn" ? "🍂" : "❄️"}</div>
        </div>
        {levelConf && (
          <Badge className={`mt-3 ${levelConf.bgColor} ${levelConf.color} border-transparent`}>
            {levelCode} 수준
          </Badge>
        )}
      </div>

      {/* 오늘의 페이지 */}
      <section>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          📅 오늘의 페이지
        </h2>
        {todayActivities && todayActivities.length > 0 ? (
          <div className="space-y-3">
            {(todayActivities as Activity[]).map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                levelCode={levelCode ?? undefined}
                isToday
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <div className="text-4xl mb-2">🥚</div>
              <p className="text-gray-400 text-sm">오늘의 활동이 아직 없어요.</p>
              <p className="text-gray-300 text-xs mt-1">선생님이 활동을 보내주실 거예요!</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 나의 교과서 (전체) */}
      <section>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          📖 나의 교과서
        </h2>
        {allActivities && allActivities.length > 0 ? (
          <div className="space-y-2">
            {(allActivities as Activity[]).map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                levelCode={levelCode ?? undefined}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-gray-400">
              아직 배운 것이 없어요. 곧 채워질 거예요! 🌱
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function ActivityCard({
  activity,
  levelCode,
  isToday = false,
}: {
  activity: Activity;
  levelCode?: string;
  isToday?: boolean;
}) {
  const variant = levelCode ? activity.level_variants?.[levelCode as keyof typeof activity.level_variants] : null;

  return (
    <Link href={`/textbook/${activity.id}`}>
    <Card className={`${isToday ? "border-pink-200 shadow-sm" : ""} hover:shadow-md transition-shadow cursor-pointer`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {activity.lesson_type === "sudamoyeo" && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">수다모여날</Badge>
              )}
              {activity.season && SEASON_CONFIG[activity.season] && (
                <Badge className={`${SEASON_CONFIG[activity.season].bgColor} ${SEASON_CONFIG[activity.season].color} border-transparent text-xs`}>
                  {SEASON_CONFIG[activity.season].label}
                </Badge>
              )}
              <span className="text-xs text-gray-400">
                {SUBJECT_LABELS[activity.subject]}
              </span>
            </div>
            <p className="font-semibold mt-1">{activity.title}</p>
            {variant && (
              <p className="text-sm text-gray-500 mt-0.5">{variant.prompt}</p>
            )}
          </div>
          <span className="text-xs text-gray-300 shrink-0">
            {new Date(activity.lesson_date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
          </span>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
