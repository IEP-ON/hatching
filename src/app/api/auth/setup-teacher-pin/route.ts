import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pin } = await req.json() as { pin: string };
  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN은 4~6자리 숫자입니다." }, { status: 400 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 교사 계정을 {profile_id}@class.local + PIN으로 업데이트
  const internalEmail = `${user.id}@class.local`;
  const { error } = await serviceClient.auth.admin.updateUserById(user.id, {
    email: internalEmail,
    password: pin,
    email_confirm: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
