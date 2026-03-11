"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  LEVEL_CONFIG,
  SEASON_CONFIG,
  SUBJECT_LABELS,
  type LevelCode,
  type LevelVariant,
} from "@/lib/types";

const LEVEL_CODES = Object.keys(LEVEL_CONFIG) as LevelCode[];

const VARIANT_TYPES: { value: LevelVariant["type"]; label: string }[] = [
  { value: "image_select", label: "그림 선택" },
  { value: "draw_and_word", label: "그림 그리고 낱말 쓰기" },
  { value: "draw_and_sentence", label: "그림 그리고 문장 쓰기" },
  { value: "sentence_fill", label: "문장 완성하기" },
  { value: "free_write", label: "자유 글쓰기" },
  { value: "report", label: "보고서 작성" },
];

export default function NewActivityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [form, setForm] = useState({
    lesson_date: new Date().toISOString().split("T")[0],
    lesson_type: "sudamoyeo" as "sudamoyeo" | "individual",
    period: 1,
    season: "spring" as "spring" | "summer" | "autumn" | "winter",
    title: "",
    description: "",
    subject: "integrated" as "korean" | "math" | "integrated",
    teacher_notes: "",
  });

  const [levelVariants, setLevelVariants] = useState<
    Partial<Record<LevelCode, LevelVariant>>
  >({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("projects")
        .select("id")
        .eq("teacher_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) setProjectId(data.id);
        });
    });
  }, [supabase]);

  function toggleLevel(level: LevelCode) {
    setLevelVariants((prev) => {
      if (level in prev) {
        const next = { ...prev };
        delete next[level];
        return next;
      }
      return {
        ...prev,
        [level]: { type: "draw_and_word", prompt: "" } as LevelVariant,
      };
    });
  }

  function updateVariant(level: LevelCode, field: keyof LevelVariant, value: string) {
    setLevelVariants((prev) => ({
      ...prev,
      [level]: { ...prev[level]!, [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      toast.error("프로젝트가 없습니다. 먼저 프로젝트를 만들어주세요.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("활동 제목을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("activities").insert({
        project_id: projectId,
        ...form,
        level_variants: levelVariants,
        created_by: user?.id,
        is_distributed: false,
      }).select("id").single();

      if (error) throw error;
      toast.success("활동이 만들어졌습니다!");
      router.push(`/guide/activities/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <Link href="/guide/activities" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        활동 목록으로
      </Link>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 기본 정보 */}
        <Card>
          <CardHeader><CardTitle>활동 기본 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>수업 날짜</Label>
                <Input
                  type="date"
                  value={form.lesson_date}
                  onChange={(e) => setForm({ ...form, lesson_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>교시</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>수업 유형</Label>
              <div className="flex gap-2">
                {(["sudamoyeo", "individual"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, lesson_type: t })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.lesson_type === t
                        ? "bg-pink-100 border-pink-300 text-pink-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {t === "sudamoyeo" ? "수다모여날" : "개별수업"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>교과</Label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(SUBJECT_LABELS) as [string, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm({ ...form, subject: k as typeof form.subject })}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        form.subject === k
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>계절</Label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(SEASON_CONFIG) as [string, { label: string; bgColor: string; color: string }][]).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm({ ...form, season: k as typeof form.season })}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        form.season === k
                          ? `${v.bgColor} ${v.color} border-current`
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>활동 제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 알 속에는 무엇이 있을까?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>활동 설명 (선택)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="활동의 맥락이나 전개 방식을 입력하세요"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>교사 메모 (선택)</Label>
              <Textarea
                value={form.teacher_notes}
                onChange={(e) => setForm({ ...form, teacher_notes: e.target.value })}
                placeholder="수업 중 관찰 사항, 주의점 등"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* 수준별 과제 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              수준별 과제 버전
              <span className="text-xs font-normal text-gray-400">활성화할 수준을 선택하세요</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {LEVEL_CODES.map((level) => {
                const conf = LEVEL_CONFIG[level];
                const active = level in levelVariants;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                      active
                        ? `${conf.bgColor} ${conf.color} border-current`
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {level}
                    {conf.students.length > 0 && (
                      <span className="ml-1 text-xs opacity-70">({conf.students.join(", ")})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {Object.entries(levelVariants).map(([level, variant]) => {
              const conf = LEVEL_CONFIG[level as LevelCode];
              return (
                <div key={level} className={`rounded-lg p-4 ${conf.bgColor} border border-current/10 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <Badge className={`${conf.bgColor} ${conf.color} border-transparent`}>{level}</Badge>
                    <button type="button" onClick={() => toggleLevel(level as LevelCode)}>
                      <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">과제 유형</Label>
                    <div className="flex gap-2 flex-wrap">
                      {VARIANT_TYPES.map((vt) => (
                        <button
                          key={vt.value}
                          type="button"
                          onClick={() => updateVariant(level as LevelCode, "type", vt.value)}
                          className={`px-2 py-1 rounded text-xs border transition-colors ${
                            variant.type === vt.value
                              ? "bg-white border-gray-400 font-medium"
                              : "border-gray-200 text-gray-500 hover:bg-white/50"
                          }`}
                        >
                          {vt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">과제 안내 문구</Label>
                    <Input
                      value={variant.prompt}
                      onChange={(e) => updateVariant(level as LevelCode, "prompt", e.target.value)}
                      placeholder={`${level} 학생에게 보여줄 지시문`}
                      className="bg-white/70"
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(levelVariants).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                수준을 선택하면 해당 수준에 맞는 과제를 설정할 수 있습니다.
              </p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "저장 중..." : "활동 저장하기"}
        </Button>
      </form>
    </div>
  );
}
