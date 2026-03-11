"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Eye } from "lucide-react";
import { SEASON_CONFIG, type Season, type Observation, type Quail, type ProjectStudent, type Profile } from "@/lib/types";

export default function ObservationsPage() {
  const supabase = createClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [quails, setQuails] = useState<Quail[]>([]);
  const [students, setStudents] = useState<(ProjectStudent & { profile: Profile })[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const defaultSeason: Season =
    currentMonth >= 3 && currentMonth <= 5 ? "spring"
    : currentMonth >= 6 && currentMonth <= 8 ? "summer"
    : currentMonth >= 9 && currentMonth <= 11 ? "autumn"
    : "winter";

  const [form, setForm] = useState({
    quail_id: "",
    project_student_id: "",
    observed_date: new Date().toISOString().split("T")[0],
    season: defaultSeason,
    content: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: proj } = await supabase
        .from("projects").select("id")
        .eq("teacher_id", user.id).eq("is_active", true)
        .limit(1).single();
      if (!proj) { setLoading(false); return; }
      setProjectId(proj.id);

      const [{ data: q }, { data: ps }, { data: obs }] = await Promise.all([
        supabase.from("quails").select("*").eq("project_id", proj.id).order("egg_number"),
        supabase.from("project_students")
          .select("*, profile:profiles(name, level_code)")
          .eq("project_id", proj.id),
        supabase.from("observations")
          .select("*")
          .eq("project_id", proj.id)
          .order("observed_date", { ascending: false })
          .limit(30),
      ]);
      setQuails((q as Quail[]) ?? []);
      setStudents((ps as (ProjectStudent & { profile: Profile })[]) ?? []);
      setObservations((obs as Observation[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function addObservation() {
    if (!projectId || !form.content.trim()) {
      toast.error("관찰 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("observations").insert({
        project_id: projectId,
        quail_id: form.quail_id || null,
        project_student_id: form.project_student_id || null,
        observed_date: form.observed_date,
        season: form.season,
        content: form.content,
        created_by: userId,
      }).select("*").single();

      if (error) throw error;
      setObservations((prev) => [data as Observation, ...prev]);
      setForm((f) => ({ ...f, content: "" }));
      setShowForm(false);
      toast.success("관찰 일지 저장됨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  }

  // 날짜별 그룹
  const grouped = observations.reduce((acc, obs) => {
    const date = obs.observed_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(obs);
    return acc;
  }, {} as Record<string, Observation[]>);

  if (loading) return <div className="p-6 text-center text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Eye size={24} className="text-pink-500" />
          관찰 일지
        </h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus size={16} />
          기록 추가
        </Button>
      </div>

      {/* 입력 폼 */}
      {showForm && (
        <Card className="border-pink-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">새 관찰 기록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">날짜</Label>
                <Input
                  type="date"
                  value={form.observed_date}
                  onChange={(e) => setForm({ ...form, observed_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">계절</Label>
                <div className="flex gap-1 flex-wrap">
                  {(Object.keys(SEASON_CONFIG) as Season[]).map((s) => {
                    const conf = SEASON_CONFIG[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, season: s })}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          form.season === s
                            ? `${conf.bgColor} ${conf.color} border-current`
                            : "border-gray-200 text-gray-400"
                        }`}
                      >
                        {conf.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {quails.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">관찰 개체 (선택)</Label>
                <div className="flex gap-2 flex-wrap">
                  {quails.filter((q) => q.status !== "egg").map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, quail_id: f.quail_id === q.id ? "" : q.id }))}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        form.quail_id === q.id
                          ? "bg-orange-100 border-orange-300 text-orange-700"
                          : "border-gray-200 text-gray-500"
                      }`}
                    >
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {students.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">학생 (선택)</Label>
                <div className="flex gap-2 flex-wrap">
                  {students.map((ps) => (
                    <button
                      key={ps.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          project_student_id: f.project_student_id === ps.id ? "" : ps.id,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        form.project_student_id === ps.id
                          ? "bg-pink-100 border-pink-300 text-pink-700"
                          : "border-gray-200 text-gray-500"
                      }`}
                    >
                      {ps.profile?.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">관찰 내용</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="오늘 관찰한 내용을 기록해주세요..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button className="flex-1" onClick={addObservation} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 관찰 일지 목록 */}
      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([date, items]) => {
          const firstSeason = items[0]?.season;
          const seasonConf = firstSeason ? SEASON_CONFIG[firstSeason] : null;
          return (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-600">
                  {new Date(date + "T00:00:00").toLocaleDateString("ko-KR", {
                    month: "long", day: "numeric", weekday: "short",
                  })}
                </span>
                {seasonConf && (
                  <Badge className={`text-xs ${seasonConf.bgColor} ${seasonConf.color} border-transparent`}>
                    {seasonConf.label}
                  </Badge>
                )}
              </div>
              <div className="space-y-2 pl-3 border-l-2 border-pink-100">
                {items.map((obs) => {
                  const quail = obs.quail_id ? quails.find((q) => q.id === obs.quail_id) : null;
                  const student = obs.project_student_id
                    ? students.find((s) => s.id === obs.project_student_id)
                    : null;
                  return (
                    <Card key={obs.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        {(quail || student) && (
                          <div className="flex items-center gap-2 mb-2">
                            {quail && (
                              <Badge className="bg-orange-50 text-orange-600 border-orange-100 text-xs">
                                🐦 {quail.name}
                              </Badge>
                            )}
                            {student && (
                              <Badge className="bg-pink-50 text-pink-600 border-pink-100 text-xs">
                                👤 {student.profile?.name}
                              </Badge>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{obs.content}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-400 text-sm">아직 관찰 기록이 없습니다.</p>
            <p className="text-gray-300 text-xs mt-1">위의 "기록 추가" 버튼을 눌러 첫 관찰을 기록해보세요.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
