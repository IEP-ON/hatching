import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "x-api-key 헤더가 필요합니다." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // API 키로 디바이스 조회
    const { data: device, error: deviceError } = await supabase
      .from("iot_devices")
      .select("id, project_id")
      .eq("api_key", apiKey)
      .single();

    if (deviceError || !device) {
      return new Response(JSON.stringify({ error: "유효하지 않은 API 키입니다." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      readings: Array<{
        reading_type: string;
        value: number;
        unit: string;
        recorded_at?: string;
      }>;
    };

    if (!body.readings || !Array.isArray(body.readings) || body.readings.length === 0) {
      return new Response(JSON.stringify({ error: "readings 배열이 필요합니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = body.readings.map((r) => ({
      device_id: device.id,
      project_id: device.project_id,
      reading_type: r.reading_type,
      value: r.value,
      unit: r.unit,
      source: "auto",
      recorded_at: r.recorded_at ?? new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from("iot_readings").insert(rows);
    if (insertError) throw insertError;

    // 디바이스 online 상태 + last_seen_at 업데이트
    await supabase
      .from("iot_devices")
      .update({ status: "online", last_seen_at: new Date().toISOString() })
      .eq("id", device.id);

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
