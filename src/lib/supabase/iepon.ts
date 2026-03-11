import { createClient } from "@supabase/supabase-js";

/**
 * IEPON_DATABASE 읽기 전용 클라이언트 — 서버 사이드 전용
 * 클라이언트에서 직접 호출 금지 (키 노출 방지)
 */
export function createIeponClient() {
  const url = process.env.IEPON_DB_URL;
  const key = process.env.IEPON_DB_ANON_KEY;

  if (!url || !key) {
    throw new Error("IEPON_DATABASE 환경변수가 설정되지 않았습니다.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
