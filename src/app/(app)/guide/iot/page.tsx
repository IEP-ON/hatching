"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Wifi, WifiOff, Copy } from "lucide-react";
import type { IotDevice, IotReading } from "@/lib/types";

const DEVICE_TYPE_CONFIG = {
  incubator: { label: "인큐베이터", emoji: "🥚", color: "text-orange-600", bg: "bg-orange-50" },
  cage: { label: "케이지", emoji: "🐦", color: "text-green-600", bg: "bg-green-50" },
} as const;

export default function IotPage() {
  const supabase = createClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [latestReadings, setLatestReadings] = useState<Record<string, IotReading[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    device_type: "incubator" as "incubator" | "cage",
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

      const { data: d } = await supabase
        .from("iot_devices").select("*")
        .eq("project_id", proj.id)
        .order("created_at");
      const deviceList = (d as IotDevice[]) ?? [];
      setDevices(deviceList);

      // 각 디바이스별 최신 측정값
      if (deviceList.length > 0) {
        const readings: Record<string, IotReading[]> = {};
        await Promise.all(
          deviceList.map(async (device) => {
            const { data: r } = await supabase
              .from("iot_readings")
              .select("*")
              .eq("device_id", device.id)
              .order("recorded_at", { ascending: false })
              .limit(5);
            readings[device.id] = (r as IotReading[]) ?? [];
          })
        );
        setLatestReadings(readings);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function addDevice() {
    if (!projectId || !form.name.trim()) {
      toast.error("디바이스 이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("iot_devices")
        .insert({ project_id: projectId, ...form, status: "offline" })
        .select("*").single();
      if (error) throw error;
      setDevices((prev) => [...prev, data as IotDevice]);
      setForm({ name: "", device_type: "incubator" });
      toast.success("디바이스 등록됨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  }

  function copyApiKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("API 키 복사됨");
  }

  if (loading) return <div className="p-6 text-center text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">IoT 디바이스</h1>
        <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">
          Raspberry Pi 연동
        </Badge>
      </div>

      {/* 연동 가이드 */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700 font-medium mb-1">📡 연동 방법</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Raspberry Pi에서 아래 API 키를 사용하여 센서 데이터를 전송하세요.
            각 디바이스의 API 키는 고유하며, Supabase Edge Function을 통해 인증됩니다.
          </p>
          <code className="block mt-2 text-xs bg-white rounded p-2 text-blue-800 font-mono">
            POST https://byshefxoakvdmpwmkqjd.supabase.co/functions/v1/iot-data
          </code>
        </CardContent>
      </Card>

      {/* 디바이스 목록 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {devices.map((device) => {
          const typeConf = DEVICE_TYPE_CONFIG[device.device_type];
          const isOnline = device.status === "online";
          const readings = latestReadings[device.id] ?? [];
          const latestTemp = readings.find((r) => r.reading_type === "temperature");
          const latestHumid = readings.find((r) => r.reading_type === "humidity");

          return (
            <Card key={device.id} className={`${typeConf.bg} border-0`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{typeConf.emoji}</span>
                    {device.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOnline ? (
                      <Wifi size={16} className="text-green-500" />
                    ) : (
                      <WifiOff size={16} className="text-gray-400" />
                    )}
                    <Badge
                      className={isOnline
                        ? "bg-green-100 text-green-700 border-0 text-xs"
                        : "bg-gray-100 text-gray-400 border-0 text-xs"
                      }
                    >
                      {isOnline ? "온라인" : "오프라인"}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 최신 센서값 */}
                {(latestTemp || latestHumid) && (
                  <div className="grid grid-cols-2 gap-2">
                    {latestTemp && (
                      <div className="bg-white/70 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">온도</p>
                        <p className="font-bold text-red-500">{latestTemp.value}°C</p>
                      </div>
                    )}
                    {latestHumid && (
                      <div className="bg-white/70 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">습도</p>
                        <p className="font-bold text-blue-500">{latestHumid.value}%</p>
                      </div>
                    )}
                  </div>
                )}

                {/* API 키 */}
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-gray-400 mb-1">API 키</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gray-600 flex-1 truncate">
                      {device.api_key}
                    </code>
                    <button
                      onClick={() => copyApiKey(device.api_key)}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {device.last_seen_at && (
                  <p className="text-xs text-gray-400">
                    마지막 연결: {new Date(device.last_seen_at).toLocaleString("ko-KR", {
                      month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {devices.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-gray-400 text-sm">등록된 IoT 디바이스가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 디바이스 추가 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus size={18} className="text-pink-500" />
            디바이스 등록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">디바이스 유형</Label>
            <div className="flex gap-3">
              {(Object.entries(DEVICE_TYPE_CONFIG) as [string, typeof DEVICE_TYPE_CONFIG["incubator"]][]).map(([type, conf]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, device_type: type as "incubator" | "cage" }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    form.device_type === type
                      ? `${conf.bg} border-current ${conf.color}`
                      : "border-gray-200 text-gray-400"
                  }`}
                >
                  <span>{conf.emoji}</span> {conf.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">디바이스 이름</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 인큐베이터 1호"
            />
          </div>
          <Button onClick={addDevice} disabled={saving} className="w-full">
            {saving ? "등록 중..." : "디바이스 등록"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
