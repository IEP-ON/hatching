import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { profileId, pin } = await req.json() as { profileId: string; pin: string };

  if (!profileId || !pin) {
    return NextResponse.json({ error: "profileId와 pin이 필요합니다." }, { status: 400 });
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN은 4~6자리 숫자입니다." }, { status: 400 });
  }

  // PIN 검증만 수행 — 실제 signIn은 클라이언트 createBrowserClient가 담당
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const email = `${profileId}@class.local`;

  // service role로 해당 유저 존재 확인 (PIN은 실제 signIn으로 검증)
  const { data: userList } = await serviceClient.auth.admin.listUsers();
  const userExists = userList?.users.some((u) => u.email === email);
  if (!userExists) {
    return NextResponse.json({ error: "이름 또는 PIN이 올바르지 않습니다." }, { status: 401 });
  }

  // 클라이언트가 직접 signInWithPassword 호출하도록 email 반환
  return NextResponse.json({ email });
}
