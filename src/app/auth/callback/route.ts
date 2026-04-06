import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // next 파라미터는 /로 시작하는 상대 경로만 허용 (open redirect 방지)
  const rawNext = searchParams.get("next") ?? "/products";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/products";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
