import { NextRequest, NextResponse } from "next/server";
import { createIeponClient } from "@/lib/supabase/iepon";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subject_id");
  const grade = searchParams.get("grade");

  try {
    const iepon = createIeponClient();
    let query = iepon
      .from("textbook_units")
      .select("id, subject_id, grade, semester, unit_number, title, description")
      .order("grade")
      .order("semester")
      .order("unit_number");

    if (subjectId) query = query.eq("subject_id", subjectId);
    if (grade) query = query.eq("grade", parseInt(grade));

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[IEPON] units 조회 오류:", err);
    return NextResponse.json(
      { error: "단원 목록을 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
