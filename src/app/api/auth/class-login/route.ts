import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { profileId, pin } = await req.json() as { profileId: string; pin: string };

    if (!profileId || !pin) {
      return NextResponse.json({ error: "profileId와 pin이 필요합니다." }, { status: 400 });
    }
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN은 4~6자리 숫자입니다." }, { status: 400 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const email = `${profileId}@class.local`;

    const { data: userList } = await serviceClient.auth.admin.listUsers();
    const userExists = userList?.users.some((u) => u.email === email);
    if (!userExists) {
      console.error(`[class-login] 유저 없음: ${email}`);
      return NextResponse.json({ error: "이름 또는 PIN이 올바르지 않습니다." }, { status: 401 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("[class-login] 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
