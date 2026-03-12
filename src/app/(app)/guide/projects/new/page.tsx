"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "2026년 사계절 메추리 프로젝트",
    description: "",
    species: "메추리",
    school_year: "2026",
    class_code: "",
  });
  const [teacherPin, setTeacherPin] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.class_code.trim()) {
      toast.error("학급 코드를 입력해주세요.");
      return;
    }
    if (teacherPin && !/^\d{4,6}$/.test(teacherPin)) {
      toast.error("PIN은 4~6자리 숫자입니다.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const { error } = await supabase.from("projects").insert({
        name: form.name,
        description: form.description,
        species: form.species,
        school_year: form.school_year,
        class_code: form.class_code.trim(),
        teacher_id: user.id,
        is_active: true,
      });
      if (error) throw error;

      // 교사 프로필에 class_code 저장
      await supabase.from("profiles").update({ class_code: form.class_code.trim() }).eq("id", user.id);

      // PIN이 입력된 경우 교사 계정 이메일을 class.local 형식으로 변경
      if (teacherPin) {
        await fetch("/api/auth/setup-teacher-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: teacherPin }),
        });
      }

      toast.success("프로젝트가 만들어졌습니다!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        대시보드로
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>새 프로젝트 만들기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">프로젝트 이름</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="한 줄 설명"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_code">학급 코드 <span className="text-pink-500">*</span></Label>
              <Input
                id="class_code"
                value={form.class_code}
                onChange={(e) => setForm({ ...form, class_code: e.target.value })}
                placeholder="예: 사계절2026"
                required
              />
              <p className="text-xs text-gray-400">학생들이 로그인 시 입력하는 코드입니다.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_pin">선생님 PIN (4~6자리 숫자)</Label>
              <Input
                id="teacher_pin"
                type="number"
                value={teacherPin}
                onChange={(e) => setTeacherPin(e.target.value)}
                placeholder="1234"
                maxLength={6}
              />
              <p className="text-xs text-gray-400">선생님이 로그인할 때 사용합니다. 지금 설정하거나 나중에 변경 가능.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="species">관찰 생물</Label>
                <Input
                  id="species"
                  value={form.species}
                  onChange={(e) => setForm({ ...form, species: e.target.value })}
                  placeholder="메추리"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school_year">학년도</Label>
                <Input
                  id="school_year"
                  value={form.school_year}
                  onChange={(e) => setForm({ ...form, school_year: e.target.value })}
                  placeholder="2026"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "만드는 중..." : "프로젝트 만들기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
