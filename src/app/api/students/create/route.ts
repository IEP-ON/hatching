import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  // 교사 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, level_code, project_id } = await req.json() as {
    name: string;
    email: string;
    level_code: string;
    project_id: string;
  };

  if (!name || !email || !level_code || !project_id) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  // 서비스 롤 클라이언트로 학생 계정 생성 (교사 세션 영향 없음)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const tempPassword = `hatching_${Math.random().toString(36).slice(2, 10)}`;
  const { data: signUpData, error: signUpErr } = await serviceClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, role: "student" },
  });
  if (signUpErr) return NextResponse.json({ error: signUpErr.message }, { status: 400 });

  const studentUserId = signUpData.user.id;

  // 프로필 생성
  const { error: profileErr } = await serviceClient.from("profiles").upsert({
    id: studentUserId,
    role: "student",
    name,
    level_code,
  });
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 400 });

  // 프로젝트 매핑
  const { data: ps, error: mapErr } = await serviceClient
    .from("project_students")
    .insert({ project_id, student_id: studentUserId, level_code })
    .select("*, profile:profiles(*)")
    .single();
  if (mapErr) return NextResponse.json({ error: mapErr.message }, { status: 400 });

  return NextResponse.json({ student: ps, tempPassword });
}
