"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Egg } from "lucide-react";
import type { Quail } from "@/lib/types";

const STATUS_CONFIG = {
  egg: { label: "알", emoji: "🥚", color: "bg-yellow-100 text-yellow-700" },
  hatching: { label: "부화 중", emoji: "🐣", color: "bg-orange-100 text-orange-700" },
  chick: { label: "병아리", emoji: "🐥", color: "bg-green-100 text-green-700" },
  adult: { label: "성조", emoji: "🐦", color: "bg-blue-100 text-blue-700" },
  deceased: { label: "사망", emoji: "💀", color: "bg-gray-100 text-gray-500" },
} as const;

export default function QuailsPage() {
  const supabase = createClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [quails, setQuails] = useState<Quail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    egg_number: 1,
    status: "egg" as Quail["status"],
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: proj } = await supabase
        .from("projects").select("id")
        .eq("teacher_id", user.id).eq("is_active", true)
        .limit(1).single();
      if (!proj) { setLoading(false); return; }
      setProjectId(proj.id);
      const { data } = await supabase
        .from("quails").select("*")
        .eq("project_id", proj.id)
        .order("egg_number");
      setQuails((data as Quail[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function addQuail() {
    if (!projectId || !form.name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("quails")
        .insert({ project_id: projectId, ...form })
        .select("*").single();
      if (error) throw error;
      setQuails((prev) => [...prev, data as Quail]);
      setForm({ name: "", nickname: "", egg_number: (form.egg_number ?? 0) + 1, status: "egg" });
      toast.success(`${form.name} 추가됨`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: Quail["status"]) {
    const { error } = await supabase.from("quails").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setQuails((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    toast.success("상태 변경됨");
  }

  async function setHatchDate(id: string) {
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("quails").update({ hatch_date: today, status: "chick" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setQuails((prev) =>
      prev.map((q) => (q.id === id ? { ...q, hatch_date: today, status: "chick" } : q))
    );
    toast.success("부화일 기록됨 🐥");
  }

  if (loading) return <div className="p-6 text-center text-gray-400">불러오는 중...</div>;

  const statusGroups = (Object.keys(STATUS_CONFIG) as Quail["status"][]).map((s) => ({
    status: s,
    items: quails.filter((q) => q.status === s),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">메추리 관리</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Egg size={16} />
          총 {quails.length}개체
        </div>
      </div>

      {/* 개체 목록 (상태별) */}
      {statusGroups.length > 0 ? (
        statusGroups.map(({ status, items }) => {
          const conf = STATUS_CONFIG[status];
          return (
            <div key={status}>
              <h2 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <span>{conf.emoji}</span> {conf.label} ({items.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((q) => (
                  <Card key={q.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{q.name}</p>
                          {q.nickname && <p className="text-xs text-gray-400">"{q.nickname}"</p>}
                          {q.egg_number && (
                            <p className="text-xs text-gray-400">알 #{q.egg_number}</p>
                          )}
                        </div>
                        <Badge className={`text-xs ${conf.color} border-transparent`}>
                          {conf.emoji}
                        </Badge>
                      </div>
                      {q.hatch_date && (
                        <p className="text-xs text-gray-400">
                          부화: {new Date(q.hatch_date).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                      {q.notes && <p className="text-xs text-gray-500 line-clamp-2">{q.notes}</p>}
                      <div className="flex gap-1 flex-wrap pt-1">
                        {status === "egg" && (
                          <button
                            onClick={() => updateStatus(q.id, "hatching")}
                            className="text-xs px-2 py-0.5 rounded border border-orange-200 text-orange-600 hover:bg-orange-50"
                          >
                            부화 시작
                          </button>
                        )}
                        {status === "hatching" && (
                          <button
                            onClick={() => setHatchDate(q.id)}
                            className="text-xs px-2 py-0.5 rounded border border-green-200 text-green-600 hover:bg-green-50"
                          >
                            부화 완료 🐥
                          </button>
                        )}
                        {status === "chick" && (
                          <button
                            onClick={() => updateStatus(q.id, "adult")}
                            className="text-xs px-2 py-0.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            성조 등록
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="text-5xl mb-3">🥚</div>
            <p className="text-gray-400">아직 메추리가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 개체 추가 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus size={18} className="text-pink-500" />
            개체 추가
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">이름</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="메추리1" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">별명 (선택)</Label>
              <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="꼬물이" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">알 번호</Label>
            <Input
              type="number"
              min={1}
              value={form.egg_number}
              onChange={(e) => setForm({ ...form, egg_number: parseInt(e.target.value) || 1 })}
            />
          </div>
          <Button onClick={addQuail} disabled={saving} className="w-full">
            {saving ? "추가 중..." : "개체 추가"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
