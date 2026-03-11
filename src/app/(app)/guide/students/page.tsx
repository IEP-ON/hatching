"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import { LEVEL_CONFIG, type LevelCode, type ProjectStudent, type Profile } from "@/lib/types";

const LEVEL_CODES = Object.keys(LEVEL_CONFIG) as LevelCode[];

// 실제 학생 6명 초기값
const PRESET_STUDENTS = [
  { name: "박창율", level_code: "L1" as LevelCode },
  { name: "신지민", level_code: "L2" as LevelCode },
  { name: "김효주", level_code: "L1-2" as LevelCode },
  { name: "조사영", level_code: "L2" as LevelCode },
  { name: "서재민", level_code: "L0" as LevelCode },
  { name: "민규원", level_code: "L3-4" as LevelCode },
];

export default function StudentsPage() {
  const supabase = createClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [students, setStudents] = useState<(ProjectStudent & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState<LevelCode>("L1");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: proj } = await supabase
        .from("projects")
        .select("id")
        .eq("teacher_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!proj) { setLoading(false); return; }
      setProjectId(proj.id);

      const { data: ps } = await supabase
        .from("project_students")
        .select("*, profile:profiles(*)")
        .eq("project_id", proj.id)
        .order("joined_at");

      setStudents((ps as (ProjectStudent & { profile: Profile })[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function addStudent() {
    if (!projectId || !newName.trim() || !newEmail.trim()) {
      toast.error("이름, 이메일을 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      // 1. Supabase Auth에 학생 계정 생성 (관리자 inviteUserByEmail 또는 signUp)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: newEmail,
        password: `hatching_${Date.now()}`, // 임시 비밀번호 — 이메일로 재설정 유도
        options: { data: { name: newName, role: "student" } },
      });
      if (signUpErr) throw signUpErr;
      const studentUserId = signUpData.user?.id;
      if (!studentUserId) throw new Error("학생 계정 생성 실패");

      // 2. 프로필 생성
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: studentUserId,
        role: "student",
        name: newName,
        level_code: newLevel,
      });
      if (profileErr) throw profileErr;

      // 3. 프로젝트 매핑
      const { error: mapErr } = await supabase.from("project_students").insert({
        project_id: projectId,
        student_id: studentUserId,
        level_code: newLevel,
      });
      if (mapErr) throw mapErr;

      toast.success(`${newName} 학생이 등록되었습니다.`);
      setNewName(""); setNewEmail(""); setNewLevel("L1");

      // 목록 새로고침
      const { data: ps } = await supabase
        .from("project_students")
        .select("*, profile:profiles(*)")
        .eq("project_id", projectId)
        .order("joined_at");
      setStudents((ps as (ProjectStudent & { profile: Profile })[]) ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function removeStudent(psId: string, name: string) {
    if (!confirm(`${name} 학생을 프로젝트에서 제거하시겠습니까?`)) return;
    const { error } = await supabase.from("project_students").delete().eq("id", psId);
    if (error) { toast.error(error.message); return; }
    setStudents((prev) => prev.filter((s) => s.id !== psId));
    toast.success(`${name} 학생이 제거되었습니다.`);
  }

  async function updateLevel(psId: string, level: LevelCode) {
    const { error } = await supabase
      .from("project_students")
      .update({ level_code: level })
      .eq("id", psId);
    if (error) { toast.error(error.message); return; }
    setStudents((prev) =>
      prev.map((s) => (s.id === psId ? { ...s, level_code: level } : s))
    );
    toast.success("수준이 변경되었습니다.");
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-400">불러오는 중...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">학생 관리</h1>

      {/* 프리셋 안내 */}
      {students.length === 0 && (
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 font-medium mb-1">💡 학생 프리셋</p>
            <p className="text-xs text-blue-600 mb-3">
              아래 6명의 학생 데이터가 준비되어 있습니다. 각 학생의 이메일 계정을 만들어 등록하세요.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_STUDENTS.map((s) => {
                const conf = LEVEL_CONFIG[s.level_code];
                return (
                  <div key={s.name} className="flex items-center gap-1">
                    <span className="text-sm font-medium">{s.name}</span>
                    <Badge className={`${conf.bgColor} ${conf.color} border-transparent text-xs`}>
                      {s.level_code}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 학생 목록 */}
      <div className="space-y-3">
        {students.map((ps) => {
          const levelConf = ps.level_code ? LEVEL_CONFIG[ps.level_code] : null;
          return (
            <Card key={ps.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-lg font-bold">
                  {ps.profile?.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{ps.profile?.name}</p>
                  <p className="text-xs text-gray-400">{ps.profile?.grade}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={ps.level_code ?? ""}
                    onChange={(e) => updateLevel(ps.id, e.target.value as LevelCode)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                  >
                    {LEVEL_CODES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  {levelConf && (
                    <Badge className={`${levelConf.bgColor} ${levelConf.color} border-transparent text-xs`}>
                      {ps.level_code}
                    </Badge>
                  )}
                  <Link
                    href={`/guide/portfolio/${ps.id}`}
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                    title="포트폴리오 보기"
                  >
                    <BookOpen size={16} />
                  </Link>
                  <button
                    onClick={() => removeStudent(ps.id, ps.profile?.name ?? "학생")}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 학생 추가 */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus size={18} className="text-pink-500" />학생 추가</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">이름</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="박창율"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">이메일</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="student@school.kr"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">수준</Label>
            <div className="flex gap-2 flex-wrap">
              {LEVEL_CODES.map((l) => {
                const conf = LEVEL_CONFIG[l];
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setNewLevel(l)}
                    className={`px-3 py-1 rounded-full text-sm border-2 font-medium transition-colors ${
                      newLevel === l
                        ? `${conf.bgColor} ${conf.color} border-current`
                        : "border-gray-200 text-gray-400"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={addStudent} disabled={saving} className="w-full">
            {saving ? "추가 중..." : "학생 추가"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
