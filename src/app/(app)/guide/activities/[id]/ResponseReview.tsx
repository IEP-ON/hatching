"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, CheckCheck } from "lucide-react";
import { LEVEL_CONFIG, type LevelCode, type Activity } from "@/lib/types";

interface Response {
  id: string;
  status: string;
  response_data: {
    text?: string;
    sentence?: string;
    words?: string[];
    selected_option?: string;
  };
  teacher_feedback?: string | null;
  project_student_id: string;
  project_student?: {
    level_code?: string;
    profile?: { name?: string };
  };
}

interface ResponseReviewProps {
  responses: Response[];
  activity: Activity;
}

export default function ResponseReview({ responses, activity }: ResponseReviewProps) {
  const supabase = createClient();
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>(
    responses.reduce((acc, r) => ({ ...acc, [r.id]: r.teacher_feedback ?? "" }), {})
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function saveFeedback(responseId: string) {
    setSaving(responseId);
    try {
      const { error } = await supabase
        .from("student_responses")
        .update({
          teacher_feedback: feedbacks[responseId] || null,
          status: "reviewed",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", responseId);
      if (error) throw error;
      toast.success("피드백 저장됨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setSaving(null);
    }
  }

  const submitted = responses.filter((r) =>
    r.status === "submitted" || r.status === "reviewed"
  );

  if (submitted.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-700 flex items-center gap-2">
        <MessageSquare size={18} className="text-pink-500" />
        학생 응답 검토 ({submitted.filter((r) => r.status === "reviewed").length}/{submitted.length} 완료)
      </h2>

      {submitted.map((r) => {
        const levelCode = r.project_student?.level_code as LevelCode | undefined;
        const levelConf = levelCode ? LEVEL_CONFIG[levelCode] : null;
        const variant = levelCode
          ? activity.level_variants?.[levelCode]
          : null;

        return (
          <Card key={r.id} className={r.status === "reviewed" ? "border-blue-100" : "border-green-100"}>
            <CardContent className="p-4 space-y-3">
              {/* 학생 정보 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {r.project_student?.profile?.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{r.project_student?.profile?.name}</span>
                    {levelConf && (
                      <Badge className={`ml-2 text-xs ${levelConf.bgColor} ${levelConf.color} border-transparent`}>
                        {levelCode}
                      </Badge>
                    )}
                    {variant && (
                      <p className="text-xs text-gray-400 mt-0.5">{variant.prompt}</p>
                    )}
                  </div>
                </div>
                <Badge
                  className={
                    r.status === "reviewed"
                      ? "bg-blue-100 text-blue-700 border-blue-200 text-xs shrink-0"
                      : "bg-green-100 text-green-700 border-green-200 text-xs shrink-0"
                  }
                >
                  {r.status === "reviewed" ? (
                    <><CheckCheck size={12} className="inline mr-1" />검토됨</>
                  ) : "제출됨"}
                </Badge>
              </div>

              {/* 응답 내용 */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                {r.response_data?.text && (
                  <p className="text-gray-700 whitespace-pre-wrap">{r.response_data.text}</p>
                )}
                {r.response_data?.sentence && (
                  <p className="text-gray-700">{r.response_data.sentence}</p>
                )}
                {r.response_data?.selected_option && (
                  <p className="text-gray-700">선택: {r.response_data.selected_option}</p>
                )}
                {r.response_data?.words && r.response_data.words.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {r.response_data.words.map((w, i) => (
                      <Badge key={i} className="text-xs bg-white border-gray-200 text-gray-600">
                        {w}
                      </Badge>
                    ))}
                  </div>
                )}
                {!r.response_data?.text &&
                  !r.response_data?.sentence &&
                  !r.response_data?.selected_option &&
                  !r.response_data?.words?.length && (
                    <p className="text-gray-400 text-xs">응답 없음</p>
                  )}
              </div>

              {/* 피드백 입력 */}
              <div className="space-y-2">
                <Textarea
                  value={feedbacks[r.id] ?? ""}
                  onChange={(e) =>
                    setFeedbacks((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  placeholder="피드백을 남겨주세요 (선택 사항)"
                  rows={2}
                  className="text-sm resize-none"
                />
                <Button
                  size="sm"
                  variant={r.status === "reviewed" ? "outline" : "default"}
                  onClick={() => saveFeedback(r.id)}
                  disabled={saving === r.id}
                  className="w-full"
                >
                  {saving === r.id
                    ? "저장 중..."
                    : r.status === "reviewed"
                    ? "피드백 수정"
                    : "검토 완료"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
