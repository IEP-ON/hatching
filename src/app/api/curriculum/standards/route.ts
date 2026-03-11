import { NextRequest, NextResponse } from "next/server";
import { createIeponClient } from "@/lib/supabase/iepon";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get("unit_id");

  try {
    const iepon = createIeponClient();
    let query = iepon
      .from("curriculum_standards")
      .select("id, unit_id, code, content, level")
      .order("code");

    if (unitId) query = query.eq("unit_id", unitId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[IEPON] standards 조회 오류:", err);
    return NextResponse.json(
      { error: "성취기준을 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
