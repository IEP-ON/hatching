import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const supabase = await createClient();

  // 교사 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: teacherProfile } = await supabase
    .from("profiles").select("role, class_code").eq("id", user.id).single();
  if (!teacherProfile || teacherProfile.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, pin, level_code, project_id } = await req.json() as {
    name: string;
    pin: string;
    level_code: string;
    project_id: string;
  };

  if (!name || !pin || !level_code || !project_id) {
    return NextResponse.json({ error: "이름, PIN, 수준, 프로젝트가 필요합니다." }, { status: 400 });
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN은 4~6자리 숫자입니다." }, { status: 400 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 내부 이메일: {uuid}@class.local (사용자에게 노출 안 됨)
  const internalId = randomUUID();
  const internalEmail = `${internalId}@class.local`;

  const { data: signUpData, error: signUpErr } = await serviceClient.auth.admin.createUser({
    email: internalEmail,
    password: pin,
    email_confirm: true,
    user_metadata: { name, role: "student" },
  });
  if (signUpErr) return NextResponse.json({ error: signUpErr.message }, { status: 400 });

  const studentUserId = signUpData.user.id;

  // 프로필 생성 (class_code 포함)
  const { error: profileErr } = await serviceClient.from("profiles").upsert({
    id: studentUserId,
    role: "student",
    name,
    level_code,
    class_code: teacherProfile.class_code ?? null,
  });
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 400 });

  // 프로젝트 매핑
  const { data: ps, error: mapErr } = await serviceClient
    .from("project_students")
    .insert({ project_id, student_id: studentUserId, level_code })
    .select("*, profile:profiles(*)")
    .single();
  if (mapErr) return NextResponse.json({ error: mapErr.message }, { status: 400 });

  return NextResponse.json({ student: ps });
}
