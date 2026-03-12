import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const classCode = searchParams.get("classCode")?.trim();
  if (!classCode) {
    return NextResponse.json({ error: "classCode 필요" }, { status: 400 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 학급 코드로 프로젝트 조회
  const { data: project, error: projErr } = await serviceClient
    .from("projects")
    .select("id, name, teacher_id")
    .eq("class_code", classCode)
    .eq("is_active", true)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: "존재하지 않는 학급 코드입니다." }, { status: 404 });
  }

  // 교사 프로필
  const { data: teacher } = await serviceClient
    .from("profiles")
    .select("id, name, role")
    .eq("id", project.teacher_id)
    .single();

  // 학생 목록 (project_students → profiles 조인)
  const { data: students } = await serviceClient
    .from("project_students")
    .select("id, level_code, profiles(id, name, role)")
    .eq("project_id", project.id)
    .order("joined_at");

  const members: { profileId: string; name: string; role: "teacher" | "student"; levelCode?: string }[] = [];

  if (teacher) {
    members.push({ profileId: teacher.id, name: teacher.name, role: "teacher" });
  }

  for (const s of students ?? []) {
    const raw = s as unknown as { id: string; level_code: string; profiles: { id: string; name: string } | null };
    if (raw.profiles) {
      members.push({ profileId: raw.profiles.id, name: raw.profiles.name, role: "student", levelCode: raw.level_code });
    }
  }

  return NextResponse.json({ projectName: project.name, members });
}
