import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { profileId, pin } = await req.json() as { profileId: string; pin: string };

  if (!profileId || !pin) {
    return NextResponse.json({ error: "profileId와 pin이 필요합니다." }, { status: 400 });
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN은 4~6자리 숫자입니다." }, { status: 400 });
  }

  // 내부 이메일 형식: {profileId}@class.local
  const email = `${profileId}@class.local`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pin });

  if (error) {
    return NextResponse.json({ error: "이름 또는 PIN이 올바르지 않습니다." }, { status: 401 });
  }

  return NextResponse.json({ session: data.session });
}
