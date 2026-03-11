import { NextResponse } from "next/server";
import { createIeponClient } from "@/lib/supabase/iepon";

export const runtime = "nodejs";

export async function GET() {
  try {
    const iepon = createIeponClient();
    const { data, error } = await iepon
      .from("subjects")
      .select("id, name, code")
      .order("code");

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[IEPON] subjects 조회 오류:", err);
    return NextResponse.json(
      { error: "교과 목록을 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
