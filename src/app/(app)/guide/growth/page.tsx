"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { IotReading, Quail } from "@/lib/types";

type ReadingType = "weight" | "temperature" | "humidity";

const READING_CONFIG: Record<
  ReadingType,
  { label: string; unit: string; color: string; min?: number; max?: number }
> = {
  weight: { label: "무게", unit: "g", color: "#f97316" },
  temperature: { label: "온도", unit: "°C", color: "#ef4444", min: 36, max: 39 },
  humidity: { label: "습도", unit: "%", color: "#3b82f6", min: 50, max: 70 },
};

export default function GrowthPage() {
  const supabase = createClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [quails, setQuails] = useState<Quail[]>([]);
  const [readings, setReadings] = useState<IotReading[]>([]);
  const [selectedType, setSelectedType] = useState<ReadingType>("weight");
  const [selectedQuailId, setSelectedQuailId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manualForm, setManualForm] = useState({
    reading_type: "weight" as ReadingType,
    value: "",
    unit: "g",
    quail_id: "",
    recorded_at: new Date().toISOString().split("T")[0],
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

      const [{ data: q }, { data: r }] = await Promise.all([
        supabase.from("quails").select("*").eq("project_id", proj.id).order("egg_number"),
        supabase.from("iot_readings")
          .select("*")
          .eq("project_id", proj.id)
          .order("recorded_at"),
      ]);
      setQuails((q as Quail[]) ?? []);
      setReadings((r as IotReading[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function addManualReading() {
    if (!projectId || !manualForm.value) {
      toast.error("값을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("iot_readings").insert({
        project_id: projectId,
        reading_type: manualForm.reading_type,
        value: parseFloat(manualForm.value),
        unit: READING_CONFIG[manualForm.reading_type].unit,
        source: "manual",
        recorded_at: new Date(manualForm.recorded_at).toISOString(),
        ...(manualForm.quail_id ? {} : {}),
      }).select("*").single();
      if (error) throw error;
      setReadings((prev) => [...prev, data as IotReading].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      ));
      setManualForm((f) => ({ ...f, value: "" }));
      toast.success("측정값 기록됨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  }

  // 그래프 데이터 가공
  const chartData = readings
    .filter((r) => r.reading_type === selectedType)
    .map((r) => ({
      date: new Date(r.recorded_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
      value: r.value,
      source: r.source,
    }));

  const latestByType = (Object.keys(READING_CONFIG) as ReadingType[]).map((type) => {
    const latest = [...readings].reverse().find((r) => r.reading_type === type);
    return { type, latest };
  });

  const conf = READING_CONFIG[selectedType];

  if (loading) return <div className="p-6 text-center text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">성장 기록</h1>

      {/* 최신 수치 요약 */}
      <div className="grid grid-cols-3 gap-3">
        {latestByType.map(({ type, latest }) => {
          const c = READING_CONFIG[type];
          return (
            <Card
              key={type}
              className={`cursor-pointer transition-shadow hover:shadow-md ${selectedType === type ? "ring-2 ring-pink-300" : ""}`}
              onClick={() => setSelectedType(type)}
            >
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400">{c.label}</p>
                {latest ? (
                  <>
                    <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>
                      {latest.value}
                    </p>
                    <p className="text-xs text-gray-300">{c.unit}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(latest.recorded_at).toLocaleDateString("ko-KR", {
                        month: "numeric", day: "numeric",
                      })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-300 mt-2">데이터 없음</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 그래프 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {conf.label} 변화
            <Badge className="text-xs bg-gray-100 text-gray-600 border-0">{conf.unit}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={
                    conf.min !== undefined && conf.max !== undefined
                      ? [conf.min - 2, conf.max + 2]
                      : ["auto", "auto"]
                  }
                />
                <Tooltip
                  formatter={(val) => [`${val ?? 0} ${conf.unit}`, conf.label]}
                  labelStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={conf.color}
                  strokeWidth={2}
                  dot={{ fill: conf.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {conf.min !== undefined && (
                  <Line
                    type="monotone"
                    dataKey={() => conf.min}
                    stroke="#d1d5db"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    dot={false}
                    name="최소"
                  />
                )}
                {conf.max !== undefined && (
                  <Line
                    type="monotone"
                    dataKey={() => conf.max}
                    stroke="#d1d5db"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    dot={false}
                    name="최대"
                  />
                )}
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
              데이터가 2개 이상 있어야 그래프가 표시됩니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 수동 측정 입력 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">측정값 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(READING_CONFIG) as [ReadingType, typeof READING_CONFIG[ReadingType]][]).map(([t, c]) => (
              <button
                key={t}
                type="button"
                onClick={() => setManualForm((f) => ({ ...f, reading_type: t, unit: c.unit }))}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  manualForm.reading_type === t
                    ? "text-white border-transparent"
                    : "border-gray-200 text-gray-500"
                }`}
                style={manualForm.reading_type === t ? { backgroundColor: c.color } : {}}
              >
                {c.label} ({c.unit})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">측정값 ({READING_CONFIG[manualForm.reading_type].unit})</Label>
              <Input
                type="number"
                step="0.1"
                value={manualForm.value}
                onChange={(e) => setManualForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">측정 날짜</Label>
              <Input
                type="date"
                value={manualForm.recorded_at}
                onChange={(e) => setManualForm((f) => ({ ...f, recorded_at: e.target.value }))}
              />
            </div>
          </div>

          {quails.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">개체 (선택)</Label>
              <div className="flex gap-2 flex-wrap">
                {quails.filter((q) => q.status !== "egg").map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() =>
                      setManualForm((f) => ({
                        ...f,
                        quail_id: f.quail_id === q.id ? "" : q.id,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      manualForm.quail_id === q.id
                        ? "bg-pink-100 border-pink-300 text-pink-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {q.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={addManualReading} disabled={saving} className="w-full">
            {saving ? "저장 중..." : "기록 저장"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
