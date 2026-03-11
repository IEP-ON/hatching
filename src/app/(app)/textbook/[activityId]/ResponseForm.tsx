"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Send, CheckCircle } from "lucide-react";
import type { LevelVariant } from "@/lib/types";

interface ResponseFormProps {
  activityId: string;
  projectStudentId: string;
  variantType: LevelVariant["type"];
  existingResponse: {
    id: string;
    status: string;
    response_data: Record<string, unknown>;
  } | null;
  isTeacherPreview: boolean;
}

export default function ResponseForm({
  activityId,
  projectStudentId,
  variantType,
  existingResponse,
  isTeacherPreview,
}: ResponseFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const isSubmitted = existingResponse?.status === "submitted" || existingResponse?.status === "reviewed";

  // 기존 응답 데이터에서 초기값 추출
  const [text, setText] = useState<string>(
    (existingResponse?.response_data?.text as string) ?? ""
  );
  const [sentence, setSentence] = useState<string>(
    (existingResponse?.response_data?.sentence as string) ?? ""
  );
  const [words, setWords] = useState<string>(
    ((existingResponse?.response_data?.words as string[]) ?? []).join(", ")
  );
  const [selectedOption, setSelectedOption] = useState<string>(
    (existingResponse?.response_data?.selected_option as string) ?? ""
  );

  async function handleSave(submit: boolean) {
    if (isTeacherPreview) {
      toast.info("교사 미리보기 모드입니다. 실제 제출은 학생 계정에서 가능합니다.");
      return;
    }
    setSaving(true);
    try {
      const responseData: Record<string, unknown> = {};
      if (text) responseData.text = text;
      if (sentence) responseData.sentence = sentence;
      if (words) responseData.words = words.split(",").map((w) => w.trim()).filter(Boolean);
      if (selectedOption) responseData.selected_option = selectedOption;

      const payload = {
        activity_id: activityId,
        project_student_id: projectStudentId,
        response_data: responseData,
        status: submit ? "submitted" : "draft",
        ...(submit ? { submitted_at: new Date().toISOString() } : {}),
      };

      const { error } = await supabase
        .from("student_responses")
        .upsert(payload, { onConflict: "activity_id,project_student_id" });

      if (error) throw error;
      toast.success(submit ? "제출했습니다! 🎉" : "임시저장했습니다.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-5 text-center space-y-2">
        <CheckCircle size={32} className="mx-auto text-green-500" />
        <p className="font-medium text-green-700">제출 완료!</p>
        <p className="text-sm text-green-600">선생님이 확인 중이에요.</p>
        {!isTeacherPreview && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-green-300 text-green-700"
            onClick={() => handleSave(false)}
          >
            수정하기
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
      <p className="text-sm font-medium text-gray-600">나의 답</p>

      {/* 그림 선택형 */}
      {variantType === "image_select" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">아래 보기 중 하나를 선택하세요</p>
          <div className="grid grid-cols-2 gap-3">
            {["보기 1", "보기 2", "보기 3", "보기 4"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className={`aspect-square rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedOption === opt
                    ? "border-pink-400 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 낱말 쓰기 */}
      {(variantType === "draw_and_word") && (
        <div className="space-y-2">
          <label className="text-xs text-gray-400">낱말을 써주세요 (쉼표로 구분)</label>
          <Input
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="예: 알, 새, 닭"
            className="text-base"
          />
        </div>
      )}

      {/* 문장 완성 */}
      {variantType === "sentence_fill" && (
        <div className="space-y-2">
          <label className="text-xs text-gray-400">문장을 완성해주세요</label>
          <Input
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="문장을 입력하세요"
            className="text-base"
          />
        </div>
      )}

      {/* 문장/보고서 쓰기 */}
      {(variantType === "draw_and_sentence" || variantType === "free_write" || variantType === "report") && (
        <div className="space-y-2">
          <label className="text-xs text-gray-400">
            {variantType === "report" ? "보고서를 작성해주세요" : "문장을 써주세요"}
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              variantType === "report"
                ? "관찰한 내용을 정리해서 써주세요"
                : "생각이나 느낌을 써주세요"
            }
            rows={variantType === "report" ? 6 : 4}
            className="text-base resize-none"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          임시저장
        </Button>
        <Button
          className="flex-1 gap-2 bg-pink-500 hover:bg-pink-600"
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          <Send size={16} />
          {saving ? "제출 중..." : "제출하기"}
        </Button>
      </div>

      {isTeacherPreview && (
        <p className="text-xs text-center text-gray-300">교사 미리보기 모드</p>
      )}
    </div>
  );
}
