"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Delete } from "lucide-react";

interface Member {
  profileId: string;
  name: string;
  role: "teacher" | "student";
  levelCode?: string;
}

type Step = "class" | "name" | "pin";

function LoginForm() {
  const [step, setStep] = useState<Step>("class");
  const [classCode, setClassCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Step 1 → 2: 학급 코드로 멤버 목록 조회
  async function handleClassCode() {
    if (!classCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/class-users?classCode=${encodeURIComponent(classCode.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "학급 코드를 확인해주세요.");
      setProjectName(json.projectName);
      setMembers(json.members);
      setStep("name");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2 → 3: 이름 선택
  function handleSelectMember(member: Member) {
    setSelected(member);
    setPin("");
    setError(null);
    setStep("pin");
  }

  // 숫자 키패드 입력
  function handlePinKey(val: string) {
    if (pin.length < 6) setPin((p) => p + val);
  }
  function handlePinDelete() {
    setPin((p) => p.slice(0, -1));
  }

  // Step 3: PIN으로 로그인
  async function handlePinLogin() {
    if (!selected || pin.length < 4) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/class-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: selected.profileId, pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "PIN이 올바르지 않습니다.");

      // 세션 설정
      await supabase.auth.setSession({
        access_token: json.session.access_token,
        refresh_token: json.session.refresh_token,
      });

      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0"];

  const teachers = members.filter((m) => m.role === "teacher");
  const students = members.filter((m) => m.role === "student");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-sm space-y-4">

        {/* 헤더 */}
        <div className="text-center space-y-1 mb-6">
          <div className="text-5xl">🥚</div>
          <h1 className="text-2xl font-bold">사계절 메추리 프로젝트</h1>
          {projectName && <p className="text-sm text-pink-500 font-medium">{projectName}</p>}
        </div>

        {/* Step 1: 학급 코드 */}
        {step === "class" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-500 text-sm">학급 코드를 입력하세요</p>
            </div>
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleClassCode()}
              placeholder="예: 사계절2026"
              className="w-full text-center text-2xl font-bold tracking-widest border-2 border-gray-200 rounded-2xl px-4 py-4 focus:outline-none focus:border-pink-400 bg-white"
              autoFocus
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              onClick={handleClassCode}
              disabled={loading || !classCode.trim()}
              className="w-full py-4 rounded-2xl bg-pink-500 text-white text-lg font-bold disabled:opacity-40 active:scale-95 transition-transform"
            >
              {loading ? "확인 중..." : "입장하기"}
            </button>
          </div>
        )}

        {/* Step 2: 이름 선택 */}
        {step === "name" && (
          <div className="space-y-4">
            <button
              onClick={() => { setStep("class"); setError(null); }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft size={14} /> 학급 코드 변경
            </button>

            {teachers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">선생님</p>
                {teachers.map((m) => (
                  <button
                    key={m.profileId}
                    onClick={() => handleSelectMember(m)}
                    className="w-full py-4 px-5 rounded-2xl bg-blue-50 border-2 border-blue-100 text-blue-800 text-xl font-bold text-left active:scale-95 transition-transform hover:border-blue-300"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            {students.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">학생</p>
                <div className="grid grid-cols-2 gap-2">
                  {students.map((m) => (
                    <button
                      key={m.profileId}
                      onClick={() => handleSelectMember(m)}
                      className="py-5 px-3 rounded-2xl bg-white border-2 border-gray-100 text-gray-800 text-lg font-bold text-center active:scale-95 transition-transform hover:border-pink-300 hover:bg-pink-50"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: PIN 입력 */}
        {step === "pin" && selected && (
          <div className="space-y-5">
            <button
              onClick={() => { setStep("name"); setError(null); setPin(""); }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft size={14} /> 이름 다시 선택
            </button>

            <div className="text-center space-y-1">
              <p className="text-xl font-bold">{selected.name}</p>
              <p className="text-sm text-gray-400">PIN 번호를 입력하세요</p>
            </div>

            {/* PIN 표시 */}
            <div className="flex justify-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl transition-all ${
                    i < pin.length
                      ? "bg-pink-500 border-pink-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {i < pin.length ? "●" : ""}
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            {/* 숫자 키패드 */}
            <div className="grid grid-cols-3 gap-3">
              {PIN_KEYS.map((key, i) => (
                key === "" ? (
                  <div key={i} />
                ) : (
                  <button
                    key={i}
                    onClick={() => handlePinKey(key)}
                    disabled={loading}
                    className="h-16 rounded-2xl bg-white border-2 border-gray-100 text-2xl font-bold text-gray-800 active:scale-95 active:bg-gray-50 transition-transform shadow-sm"
                  >
                    {key}
                  </button>
                )
              ))}
              <button
                onClick={handlePinDelete}
                disabled={loading || pin.length === 0}
                className="h-16 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center active:scale-95 transition-transform shadow-sm disabled:opacity-30"
              >
                <Delete size={22} className="text-gray-500" />
              </button>
            </div>

            <button
              onClick={handlePinLogin}
              disabled={loading || pin.length < 4}
              className="w-full py-4 rounded-2xl bg-pink-500 text-white text-lg font-bold disabled:opacity-40 active:scale-95 transition-transform"
            >
              {loading ? "로그인 중..." : "입장"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
